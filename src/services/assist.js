const transporter = require('../config/mailer');

// Helper function to format status for display
function formatStatus(status) {
  const statusMap = {
    'completed': 'Completed ✅',
    'part_payment': 'Partial Payment ⏳',
    'defaulted': 'Defaulted ❌',
    'awaiting_payment': 'Awaiting Payment 🔄'
  };
  return statusMap[status] || status;
}

async function sendOtpEmail(to, otp, purpose = 'register') {
  // (Leave as is - already styled)
  let subject, headline, introMessage, actionMessage;

  if (purpose === 'login') {
    subject = 'Login Verification – Your OTP Code Inside 🔐';
    headline = 'Secure Login Verification 🔑';
    introMessage = 'You recently requested to log into your student account. Use the OTP below to complete your login.';
    actionMessage = 'This OTP will expire in <b>5 minutes</b>. If this wasn’t you, please secure your account immediately by changing your password.';
  } else if (purpose === 'resend') {
    subject = 'Resend OTP – Complete Your Verification ✔️';
    headline = 'Here’s Your New OTP Code';
    introMessage = 'As requested, we\'ve sent you a new OTP. Use it below to complete your verification.';
    actionMessage = 'This OTP will expire in <b>5 minutes</b>. Please use it before it expires.';
  } else {
    subject = 'Complete Your Registration – Verify Your Email 📩';
    headline = 'Email Verification Required';
    introMessage = 'Thanks for signing up! Use the OTP below to verify your email address and activate your student account.';
    actionMessage = 'This OTP will expire in <b>5 minutes</b>. Please use it to complete your registration.';
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4CAF50; text-align: center;">${headline}</h2>
        <p>${introMessage}</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <span style="display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #4CAF50; background: #f9f9f9; padding: 10px 20px; border-radius: 6px; border: 1px solid #ccc;">
            ${otp}
          </span>
        </div>

        <p>${actionMessage}</p>
        
        <p>If you didn't request this, you can safely ignore this email.</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #777; text-align: center;">
          Need help? Contact our support team at <a href="mailto:support@digital_asset.com">support@digital_asset.com</a>.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('❌ Error sending OTP email:', err);
    return false;
  }
}

async function sendNewUserEmail(email, full_name) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Qodebyte Academy! 🎓",
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
        <div style="background: white; border-radius: 8px; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2D3748; margin-bottom: 10px; font-size: 28px;">Welcome to Qodebyte Academy! 🚀</h1>
            <div style="width: 100px; height: 3px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 20px auto;"></div>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4A5568;">Hi <strong>${full_name}</strong>,</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #4A5568;">Congratulations! Your student account has been successfully created at Qodebyte Academy. We're excited to have you join our learning community.</p>
          
          <div style="background: #F7FAFC; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #2D3748; margin-top: 0;">Your Account Details</h3>
            <p style="margin: 10px 0;"><span style="color: #718096;">📧 Email:</span> <strong>${email}</strong></p>
            <p style="margin: 10px 0;"><span style="color: #718096;">🔐 Password:</span> <em>Use the password you created during registration</em></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://qodebyte.com/login'}" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Access Your Dashboard →
            </a>
          </div>
          
          <p style="font-size: 14px; color: #718096; line-height: 1.6;">To get started, please login to your account using the email address above. If you have any questions or need assistance, our support team is here to help.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="font-size: 12px; color: #A0AEC0;">
              Happy Learning!<br>
              The Qodebyte Academy Team<br>
              <a href="mailto:support@qodebyte.com" style="color: #667eea;">support@qodebyte.com</a>
            </p>
          </div>
        </div>
      </div>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ sendNewUserEmail error:", err);
    return false;
  }
}

async function sendPaymentInitEmail(to, course, amount, reference) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Payment Initiated – Pending Verification 🔄",
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; background: #f8fafc; padding: 40px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #4299E1; color: white; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; margin: 0 auto 20px; font-size: 28px;">
              💳
            </div>
            <h1 style="color: #2D3748; margin-bottom: 10px; font-size: 24px;">Payment Successfully Initiated</h1>
            <p style="color: #718096; font-size: 16px;">Your payment is being processed</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #4299E1, #667eea); border-radius: 8px; padding: 25px; color: white; margin-bottom: 30px;">
            <h2 style="color: white; margin-top: 0; text-align: center;">${course}</h2>
            <div style="display: flex; justify-content: space-between; margin-top: 20px;">
              <div style="text-align: center;">
                <div style="font-size: 12px; opacity: 0.9;">AMOUNT</div>
                <div style="font-size: 28px; font-weight: bold;">₦${amount.toLocaleString()}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 12px; opacity: 0.9;">STATUS</div>
                <div style="font-size: 20px; font-weight: bold;">⏳ Pending</div>
              </div>
            </div>
          </div>
          
          <div style="background: #F7FAFC; border-radius: 6px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #2D3748; margin-top: 0;">Payment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #718096; border-bottom: 1px solid #E2E8F0;">Reference Number:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2D3748; border-bottom: 1px solid #E2E8F0;">${reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096; border-bottom: 1px solid #E2E8F0;">Course:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2D3748; border-bottom: 1px solid #E2E8F0;">${course}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096;">Initiated:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2D3748;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #FEFCBF; border-left: 4px solid #D69E2E; padding: 16px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #744210; font-size: 14px;">
              <strong>⏰ Next Step:</strong> Your payment is being verified. You'll receive another email once verification is complete. This usually takes 5-15 minutes.
            </p>
          </div>
          
          <p style="color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
            Need help? Contact our support team at <a href="mailto:support@qodebyte.com" style="color: #4299E1;">support@qodebyte.com</a>
          </p>
        </div>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment initiation email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ sendPaymentInitEmail error:", error);
    return false;
  }
}

async function sendPaymentVerificationEmail(to, course, status, modulesUnlocked) {
  try {
    const formattedStatus = formatStatus(status);
    const statusColor = status === 'completed' ? '#38A169' : status === 'part_payment' ? '#D69E2E' : '#4299E1';
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Payment ${status === 'completed' ? 'Verified Successfully!' : 'Status Updated'} ${status === 'completed' ? '✅' : '🔄'}`,
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; background: #f8fafc; padding: 40px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: ${statusColor}; color: white; width: 70px; height: 70px; line-height: 70px; border-radius: 50%; margin: 0 auto 20px; font-size: 32px;">
              ${status === 'completed' ? '🎉' : status === 'part_payment' ? '⏳' : '🔄'}
            </div>
            <h1 style="color: #2D3748; margin-bottom: 10px; font-size: 26px;">
              ${status === 'completed' ? 'Payment Verified Successfully!' : 'Payment Status Updated'}
            </h1>
            <p style="color: #718096; font-size: 16px;">
              ${status === 'completed' ? 'Your payment has been confirmed and verified' : 'Your payment status has been updated'}
            </p>
          </div>
          
          <div style="background: ${status === 'completed' ? '#C6F6D5' : status === 'part_payment' ? '#FEFCBF' : '#BEE3F8'}; border: 2px solid ${statusColor}; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <h2 style="color: ${status === 'completed' ? '#22543D' : status === 'part_payment' ? '#744210' : '#2C5282'}; margin-top: 0; margin-bottom: 15px;">
              ${course}
            </h2>
            <div style="display: inline-block; background: white; padding: 8px 24px; border-radius: 50px; font-size: 18px; font-weight: bold; color: ${statusColor}; border: 2px solid ${statusColor}40;">
              ${formattedStatus}
            </div>
          </div>
          
          ${modulesUnlocked ? `
          <div style="background: #F7FAFC; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #2D3748; margin-top: 0; display: flex; align-items: center; gap: 10px;">
              <span style="background: #4299E1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">🔓</span>
              Modules Unlocked
            </h3>
            <p style="color: #4A5568; font-size: 16px; line-height: 1.6;">${modulesUnlocked}</p>
            ${status === 'completed' ? `
            <div style="margin-top: 20px; padding: 12px; background: #E6FFFA; border-radius: 6px; border-left: 4px solid #38B2AC;">
              <p style="margin: 0; color: #234E52; font-size: 14px;">
                <strong>🎯 All Set!</strong> You now have full access to your course materials. Start learning!
              </p>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          ${status === 'part_payment' ? `
          <div style="background: #FEFCBF; border-left: 4px solid #D69E2E; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <div style="display: flex; align-items: start; gap: 12px;">
              <div style="color: #D69E2E; font-size: 20px;">ℹ️</div>
              <div>
                <h4 style="color: #744210; margin-top: 0; margin-bottom: 8px;">Partial Payment Status</h4>
                <p style="color: #744210; margin: 0; font-size: 14px; line-height: 1.5;">
                  Your payment has been partially received. To unlock all course modules, please complete the remaining payment balance.
                </p>
              </div>
            </div>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.APP_URL || 'https://qodebyte.com/dashboard'}" style="display: inline-block; background: linear-gradient(135deg, ${statusColor}, #667eea); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              ${status === 'completed' ? 'Start Learning Now →' : 'View Your Dashboard →'}
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
            <p style="color: #718096; font-size: 13px; line-height: 1.5; text-align: center;">
              If you have any questions about your payment or course access, please contact our support team at 
              <a href="mailto:support@qodebyte.com" style="color: #4299E1; text-decoration: none;">support@qodebyte.com</a>
            </p>
          </div>
        </div>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment verification email sent to ${to} with status: ${status}`);
    return true;
  } catch (error) {
    console.error("❌ sendPaymentVerificationEmail error:", error);
    return false;
  }
}

async function sendPaymentDefaultedEmail(to, course, status) {
  try {
    const formattedStatus = formatStatus(status);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Payment Default Alert – Action Required ⚠️",
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; background: #fff5f5; padding: 40px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 2px solid #FC8181;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #F56565; color: white; width: 70px; height: 70px; line-height: 70px; border-radius: 50%; margin: 0 auto 20px; font-size: 32px;">
              ⚠️
            </div>
            <h1 style="color: #C53030; margin-bottom: 10px; font-size: 26px;">Payment Default Alert</h1>
            <p style="color: #718096; font-size: 16px;">Your payment status requires immediate attention</p>
          </div>
          
          <div style="background: #FFF5F5; border: 2px solid #F56565; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <h2 style="color: #C53030; margin-top: 0; margin-bottom: 15px;">${course}</h2>
            <div style="display: inline-block; background: #F56565; color: white; padding: 10px 28px; border-radius: 50px; font-size: 18px; font-weight: bold;">
              ${formattedStatus}
            </div>
          </div>
          
          <div style="background: #FED7D7; border-left: 4px solid #F56565; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <div style="display: flex; align-items: start; gap: 12px;">
              <div style="color: #C53030; font-size: 20px;">🔔</div>
              <div>
                <h4 style="color: #742A2A; margin-top: 0; margin-bottom: 8px;">Important Notice</h4>
                <p style="color: #742A2A; margin: 0; font-size: 14px; line-height: 1.5;">
                  Your payment for "${course}" has been marked as defaulted. This may affect your course access and progression.
                </p>
              </div>
            </div>
          </div>
          
          <div style="background: #F7FAFC; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #2D3748; margin-top: 0; display: flex; align-items: center; gap: 10px;">
              <span style="background: #4299E1; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">📋</span>
              Recommended Actions
            </h3>
            <ol style="color: #4A5568; font-size: 15px; line-height: 1.8; padding-left: 20px;">
              <li><strong>Check your payment status</strong> in your dashboard</li>
              <li><strong>Complete any pending payments</strong> to restore access</li>
              <li><strong>Contact support</strong> if you believe this is an error</li>
              <li><strong>Set up payment reminders</strong> to avoid future defaults</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
              <a href="${process.env.APP_URL || 'https://qodebyte.com/payments'}" style="display: inline-block; background: #F56565; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);">
                Make Payment Now →
              </a>
              <a href="${process.env.APP_URL || 'https://qodebyte.com/support'}" style="display: inline-block; background: #4299E1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);">
                Contact Support
              </a>
            </div>
          </div>
          
          <div style="background: #EDF2F7; border-radius: 6px; padding: 16px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; color: #4A5568; font-size: 13px;">
              <strong>Note:</strong> To maintain uninterrupted access to your course materials, please resolve this matter promptly.
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
            <p style="color: #718096; font-size: 12px; line-height: 1.5; text-align: center;">
              Qodebyte Academy Support • <a href="mailto:support@qodebyte.com" style="color: #4299E1;">support@qodebyte.com</a> • 
              <a href="${process.env.APP_URL || 'https://qodebyte.com/help'}" style="color: #4299E1; text-decoration: none;">Help Center</a>
            </p>
          </div>
        </div>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment default email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ sendPaymentDefaultedEmail error:", error);
    return false;
  }
}

async function sendPaymentReminderEmail(to, course, dueDate) {
  try {
    const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysUntilDue <= 2;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `${isUrgent ? '⏰ URGENT: ' : ''}Payment Reminder – Due ${daysUntilDue} Day${daysUntilDue !== 1 ? 's' : ''} Away`,
      html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: auto; background: ${isUrgent ? '#fffaf0' : '#f8fafc'}; padding: 40px;">
        <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 2px solid ${isUrgent ? '#ED8936' : '#4299E1'};">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: ${isUrgent ? '#ED8936' : '#4299E1'}; color: white; width: 70px; height: 70px; line-height: 70px; border-radius: 50%; margin: 0 auto 20px; font-size: 32px;">
              ${isUrgent ? '⏰' : '📅'}
            </div>
            <h1 style="color: ${isUrgent ? '#9C4221' : '#2D3748'}; margin-bottom: 10px; font-size: 26px;">
              ${isUrgent ? 'Friendly Reminder' : 'Upcoming Payment Due'}
            </h1>
            <p style="color: #718096; font-size: 16px;">Your payment for "${course}" is approaching its due date</p>
          </div>
          
          <div style="background: ${isUrgent ? '#FEFCBF' : '#EBF8FF'}; border: 2px solid ${isUrgent ? '#ED8936' : '#4299E1'}; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center;">
            <div style="display: inline-block; background: white; padding: 10px 30px; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${isUrgent ? '#ED8936' : '#4299E1'}40;">
              <div style="font-size: 14px; color: #718096; margin-bottom: 5px;">DUE DATE</div>
              <div style="font-size: 24px; font-weight: bold; color: ${isUrgent ? '#C05621' : '#2B6CB0'};">
                ${dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            
            <div style="display: flex; justify-content: center; gap: 30px; margin-top: 20px; flex-wrap: wrap;">
              <div style="text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: ${isUrgent ? '#C05621' : '#2B6CB0'};">${daysUntilDue}</div>
                <div style="font-size: 12px; color: #718096; text-transform: uppercase;">Day${daysUntilDue !== 1 ? 's' : ''} Left</div>
              </div>
            </div>
            
            ${isUrgent ? `
            <div style="margin-top: 20px; padding: 12px; background: #F56565; color: white; border-radius: 6px; display: inline-block;">
              <strong>⚠️ URGENT:</strong> Payment due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}
            </div>
            ` : ''}
          </div>
          
          <div style="background: #F7FAFC; border-radius: 8px; padding: 25px; margin: 25px 0;">
            <h3 style="color: #2D3748; margin-top: 0; display: flex; align-items: center; gap: 10px;">
              <span style="background: ${isUrgent ? '#ED8936' : '#4299E1'}; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px;">📌</span>
              Course Details
            </h3>
            <p style="color: #4A5568; font-size: 16px; margin-bottom: 15px;"><strong>${course}</strong></p>
            <p style="color: #718096; font-size: 14px; line-height: 1.6;">
              Timely payment ensures uninterrupted access to all course materials, assignments, and instructor support.
            </p>
          </div>
          
          ${!isUrgent ? `
          <div style="background: #E6FFFA; border-left: 4px solid #38B2AC; padding: 16px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #234E52; font-size: 14px;">
              <strong>💡 Pro Tip:</strong> Setting up automatic payments can help you avoid missing due dates in the future.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://qodebyte.com/payments'}" style="display: inline-block; background: linear-gradient(135deg, ${isUrgent ? '#ED8936' : '#4299E1'}, #667eea); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
              ${isUrgent ? 'Pay Now to Avoid Default →' : 'Make Payment →'}
            </a>
          </div>
          
          <div style="background: #EDF2F7; border-radius: 6px; padding: 16px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; color: #4A5568; font-size: 13px;">
              <strong>Note:</strong> Making payment before the due date helps maintain your course progress and access.
              ${isUrgent ? '<br><strong>Defaulting may restrict access to course materials.</strong>' : ''}
            </p>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; text-align: center;">
            <p style="color: #718096; font-size: 12px; line-height: 1.5;">
              Need assistance with payment? Contact us at <a href="mailto:support@qodebyte.com" style="color: #4299E1;">support@qodebyte.com</a><br>
              <a href="${process.env.APP_URL || 'https://qodebyte.com/faq'}" style="color: #718096; text-decoration: none; font-size: 11px;">View Payment FAQs</a>
            </p>
          </div>
        </div>
      </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment reminder email sent to ${to} (${daysUntilDue} days until due)`);
    return true;
  } catch (error) {
    console.error("❌ sendPaymentReminderEmail error:", error);
    return false;
  }
}

module.exports = {
  sendOtpEmail,
  sendNewUserEmail,
  sendPaymentInitEmail,
  sendPaymentVerificationEmail,
  sendPaymentDefaultedEmail,
  sendPaymentReminderEmail
};