const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

// Create reusable transporter
const createTransporter = () => {
  // For development without SMTP configured, use console logging
  if (config.nodeEnv === 'development' && !process.env.SMTP_USER) {
    // Create a test account transport that just logs to console
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
  }

  // Production or configured development SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send email verification
 */
exports.sendVerificationEmail = async (user, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"QualityPulse" <${process.env.SMTP_USER || 'noreply@qualitypulse.com'}>`,
      to: user.email,
      subject: 'Verify Your Email - QualityPulse',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to QualityPulse!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Thank you for signing up! Please verify your email address to activate your account.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QualityPulse. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    // In development without SMTP, log the email details
    if (config.nodeEnv === 'development' && !process.env.SMTP_USER) {
      logger.info('Verification email (development - not sent)', {
        to: user.email,
        subject: mailOptions.subject,
        verificationUrl: verificationUrl,
      });
    } else {
      logger.info('Verification email sent', {
        to: user.email,
        messageId: info.messageId,
      });
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
exports.sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"QualityPulse" <${process.env.SMTP_USER || 'noreply@qualitypulse.com'}>`,
      to: user.email,
      subject: 'Password Reset Request - QualityPulse',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QualityPulse. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    // In development without SMTP, log the email details
    if (config.nodeEnv === 'development' && !process.env.SMTP_USER) {
      logger.info('Password reset email (development - not sent)', {
        to: user.email,
        subject: mailOptions.subject,
        resetUrl: resetUrl,
      });
    } else {
      logger.info('Password reset email sent', {
        to: user.email,
        messageId: info.messageId,
      });
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send welcome email (after verification)
 */
exports.sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"QualityPulse" <${process.env.SMTP_USER || 'noreply@qualitypulse.com'}>`,
      to: user.email,
      subject: 'Welcome to QualityPulse!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .feature { margin: 15px 0; padding-left: 25px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to QualityPulse!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <p>Your email has been verified successfully! You now have full access to QualityPulse.</p>
              <p><strong>Here's what you can do:</strong></p>
              <div class="feature">✓ Upload and analyze call recordings</div>
              <div class="feature">✓ Set up custom compliance rules</div>
              <div class="feature">✓ Track performance metrics</div>
              <div class="feature">✓ Generate detailed reports</div>
              <p>Your ${user.subscription?.plan || 'trial'} plan is active with ${Math.ceil((new Date(user.subscription?.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} days remaining.</p>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} QualityPulse. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    // In development without SMTP, log the email details
    if (config.nodeEnv === 'development' && !process.env.SMTP_USER) {
      logger.info('Welcome email (development - not sent)', {
        to: user.email,
        subject: mailOptions.subject,
      });
    } else {
      logger.info('Welcome email sent', {
        to: user.email,
        messageId: info.messageId,
      });
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    throw error;
  }
};
