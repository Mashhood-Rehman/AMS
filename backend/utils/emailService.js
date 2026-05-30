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

export const sendLowAttendanceEmail = async (email, studentName, attendanceRate, monthName, courseName = '') => {
  const mailOptions = {
    from: '"AMS Attendance System" <mashhoodrehman99@gmail.com>',
    to: email,
    subject: `Low Attendance Warning - ${monthName} - AMS`,
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
            background-color: #FFF1F2;
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #FFE4E6;
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
          .warning-badge {
            display: inline-block;
            padding: 8px 16px;
            background-color: #E11D48;
            color: #FFFFFF !important;
            border-radius: 20px;
            font-weight: bold;
            font-size: 18px;
            margin: 15px 0;
          }
          .accent {
            color: #E11D48;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; color: #BE123C;">Low Attendance Notification</h2>
          </div>
          <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>This is an automated notification regarding your attendance record for the month of <strong>${monthName}</strong>${courseName ? ` in the course <strong>${courseName}</strong>` : ''}.</p>
            <p>According to our records, your current monthly attendance rate is:</p>
            <div style="text-align: center;">
              <span class="warning-badge">${attendanceRate}%</span>
            </div>
            <p>The minimum required attendance rate is <strong style="color: #0F172A;">80%</strong>. Your attendance is currently below the acceptable threshold.</p>
            <p>Please note that maintaining high attendance is crucial for your academic success and course compliance. We advise you to attend the remaining sessions and contact your course instructor if you have any valid reasons or extenuating circumstances for your absences.</p>
            <p>If you believe there is an error in our records, please get in touch with the admin team immediately.</p>
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
    console.error('Error sending low attendance email:', error);
    return { success: false, error };
  }
};

export const sendManualAttendanceEmail = async (email, studentName, summary, customMessage = '') => {
  const tableRows = summary.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; font-weight: 500;">${item.courseName} (${item.courseCode})</td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; color: #64748B;">${item.teacherName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: center;">${item.present} / ${item.expected}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: bold; color: ${item.rate < 80 ? '#E11D48' : '#10B981'};">
        ${item.rate}%
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: '"AMS Attendance System" <mashhoodrehman99@gmail.com>',
    to: email,
    subject: `Attendance Status Update & Report - AMS`,
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
            background-color: #F1F5F9;
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
          .table-container {
            margin-top: 25px;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            overflow: hidden;
          }
          .message-box {
            background-color: #FFFBEB;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0; color: #0F172A;">Attendance Status Report</h2>
          </div>
          <div class="content">
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Please find below your current academic attendance summary report compiled from the AMS database:</p>
            
            <div class="table-container">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                <thead>
                  <tr style="background-color: #F8FAFC;">
                    <th style="padding: 12px; border-bottom: 2px solid #E2E8F0;">Course</th>
                    <th style="padding: 12px; border-bottom: 2px solid #E2E8F0;">Teacher</th>
                    <th style="padding: 12px; border-bottom: 2px solid #E2E8F0; text-align: center;">Attended</th>
                    <th style="padding: 12px; border-bottom: 2px solid #E2E8F0; text-align: center;">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            ${customMessage ? `
            <div class="message-box">
              <strong>Instructor/Admin Note:</strong><br/>
              "${customMessage}"
            </div>
            ` : ''}

            <p style="margin-top: 25px;">Maintaining an attendance rate of at least <strong>80%</strong> is required. Please discuss any discrepancies or outstanding issues directly with your instructors.</p>
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
    console.error('Error sending manual attendance email:', error);
    return { success: false, error };
  }
};

