const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create Ethereal fallback or use SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'ethereal_user_placeholder', // dynamically configured or fallback
    pass: 'ethereal_pass_placeholder',
  },
});

const sendLeadAssignmentEmail = async (agentEmail, agentName, leadName, leadDetails = '') => {
  try {
    const mailOptions = {
      from: `"Lead CRM System" <noreply@crm.com>`,
      to: agentEmail,
      subject: `New Lead Assigned: ${leadName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4F46E5;">New Lead Assigned</h2>
          <p>Hello <strong>${agentName}</strong>,</p>
          <p>You have been assigned a new lead in the system.</p>
          <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Lead Name:</strong> ${leadName}</p>
            <p><strong>Notes:</strong> ${leadDetails || 'None'}</p>
          </div>
          <p>Please log in to your CRM dashboard to view and update this lead.</p>
          <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9CA3AF;">This is an automated notification from the Lead Management System.</p>
        </div>
      `,
    };

    // If using the default dummy config, just console log it
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'example@gmail.com') {
      logger.info(`[Mail Notification Mock] Sending email to ${agentName} (${agentEmail}) for lead "${leadName}"`);
      return;
    }

    // Real transporter configuration if configured
    const realTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await realTransporter.sendMail(mailOptions);
    logger.info(`Email assignment notification sent successfully to ${agentEmail}`);
  } catch (error) {
    logger.error(`Error sending email assignment notification to ${agentEmail}: ${error.message}`);
  }
};

module.exports = {
  sendLeadAssignmentEmail,
};
