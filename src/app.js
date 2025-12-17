const dotenv = require('dotenv');

const express = require('express'); 

const sequelize = require('./config/db');

const cors = require('cors');

const helmet = require('helmet');

const routes = require('./routes');

const path = require('path');

const setupSwagger = require('../swagger');
const morgan = require('morgan');

dotenv.config();

const app = express();
const cron = require('node-cron');
const { Payment, User, Course, Progress, CourseLesson } = require('./models');
const { Op } = require('sequelize');
const paymentEvents = require('./events/paymentEvents');
const { sendNotification } = require('./controllers/notificationController');


app.use(helmet()); 
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));
setupSwagger(app);


app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('Welcome to the API For Qodebyte!');
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const PORT = process.env.PORT || 5002;

if (process.env.NODE_ENV === 'production') {
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connected');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Unable to connect to the database:', err);
    });
} else {

  sequelize.sync({ alter: true })
    .then(() => {
      console.log('✅ Database synced');
      return sequelize.authenticate();
    })
    .then(() => {
      console.log('✅ Database connected');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Unable to connect to the database:', err);
    });
}


cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();

 
    const overduePayments = await Payment.findAll({
      where: {
        status: { [Op.in]: ['awaiting_payment', 'part_payment'] },
        due_date: { [Op.lt]: now }
      },
      include: [
        { model: User, as: "student", attributes: ['email'] },
        { model: Course, as: "course", attributes: ['title'] }
      ]
    });

    await Promise.all(
      overduePayments.map(async (payment) => {
        await payment.update({ status: 'defaulted' });

          await sendNotification({
      student_id: payment.student_id,
      title: "Payment Defaulted ⚠️",
      message: `Your payment for "${payment.course.title}" has passed the due date and is now defaulted.`,
    });

        if (payment.student && payment.course) {
          paymentEvents.emit('payment:defaulted', {
            email: payment.student.email,
            courseTitle: payment.course.title
          });
        }

        console.log(`Payment ${payment.reference} marked as defaulted.`);
      })
    );

    
    const reminderEnd = new Date();
    reminderEnd.setDate(now.getDate() + 3);

    const upcomingPayments = await Payment.findAll({
      where: {
        status: { [Op.in]: ['awaiting_payment', 'part_payment'] },
        due_date: { [Op.gte]: now, [Op.lte]: reminderEnd }
      },
      include: [
        { model: User, as: "student", attributes: ['email'] },
        { model: Course, as: "course", attributes: ['title'] }
      ]
    });

    await Promise.all(
      upcomingPayments.map(async (payment) => {
        if (payment.student && payment.course) {

           await sendNotification({
        student_id: payment.student_id,
        title: "Payment Reminder ⏳",
        message: `Your payment for "${payment.course.title}" is due on ${payment.due_date.toDateString()}.`,
      });

         
          paymentEvents.emit('payment:reminder', {
            email: payment.student.email,
            courseTitle: payment.course.title,
            dueDate: payment.due_date
          });
        }

        console.log(
          `Reminder event emitted for payment ${payment.reference}, due on ${payment.due_date}`
        );
      })
    );

  } catch (err) {
    console.error('❌ Cron job error:', err);
  }
});

cron.schedule("*/10 * * * *", async () => {
  try {
    const startedLessons = await Progress.findAll({
      where: { status: "started" },
      include: [{ model: CourseLesson,   as: "lesson", attributes: ["duration"] }]
    });

    for (const prog of startedLessons) {
    
       if (!prog.lesson || !prog.lesson.duration) continue;
      const durationMinutes = parseInt(prog.lesson.duration);
      const allowedMs = durationMinutes * 60 * 1000;

      const timeStarted = new Date(prog.updatedAt).getTime();
      const now = Date.now();

      if (now - timeStarted > allowedMs) {
        prog.status = "over_stayed";
        await prog.save();

         await sendNotification({
          student_id: prog.student_id,
          title: "Lesson Time Exceeded ⏰",
          message: "You exceeded the allowed time for this lesson.",
        });
      }
    }

    console.log("Progress overstayed check completed");

  } catch (err) {
    console.error("Overstay check error:", err);
  }
});

