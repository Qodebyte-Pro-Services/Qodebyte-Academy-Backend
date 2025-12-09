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
