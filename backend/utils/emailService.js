import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mashhoodrehman99@gmail.com',
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendResetEmail = async (email, resetLink) => {
  const mailOptions = {
    from: '"AMS Attendance System" <mashhoodrehman99@gmail.com>',
    to: email,
    subject: 'Password Reset Request - AMS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #F8FAFC;
            margin: 0;
            padding: 0;
            color: #1E293B;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #F8FAFC;
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #E2E8F0;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .footer {
            background-color: #F8FAFC;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748B;
            border-top: 1px solid #E2E8F0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0F172A;
            color: #FFFFFF !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin-top: 20px;
          }
          .accent {
            color: #0F172A;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; color: #0F172A;">Attendance Management System</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your AMS account. Click the button below to proceed:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p style="margin-top: 30px;">If you didn't request this, you can safely ignore this email. This link will expire in <span class="accent">1 hour</span>.</p>
            <p>Best Regards,<br>The AMS Team</p>
          </div>
          <div class="footer">
            &copy; 2026 Attendance Management System. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
