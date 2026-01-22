import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
    },
  });
};

// Generate 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
export const sendVerificationEmail = async (email, code, type = 'signup') => {
  try {
    const transporter = createTransporter();
    
    const subject = type === 'signup' 
      ? 'Verify Your Email - Huts & Farms' 
      : 'Password Reset Code - Huts & Farms';
    
    const message = type === 'signup'
      ? `Your verification code for Huts & Farms registration is: ${code}\n\nThis code will expire in 10 minutes.`
      : `Your password reset code for Huts & Farms is: ${code}\n\nThis code will expire in 10 minutes.`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">${subject}</h2>
          <p>Hello,</p>
          <p>${message}</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #6c757d; font-size: 14px;">
            If you didn't request this code, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
          <p style="color: #6c757d; font-size: 12px;">
            This is an automated email from Huts & Farms. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};