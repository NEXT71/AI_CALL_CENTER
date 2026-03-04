const User = require('../models/User');
const logger = require('../config/logger');
const emailService = require('./emailService');
const config = require('../config/config');

/**
 * Send overage summary email to user
 * @param {string} userId - User ID
 */
exports.sendOverageSummary = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      logger.error('User not found for overage summary', { userId });
      return;
    }

    const usage = user.subscription.usage;
    const plan = user.subscription.plan;
    const planConfig = config.subscription.plans[plan];

    if (!usage || !planConfig) {
      logger.warn('Unable to send overage summary - missing usage or plan config', { 
        userId, 
        plan,
        hasUsage: !!usage 
      });
      return;
    }

    const subject = 'Usage Overage Notice - QualityPulse';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea580c; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .alert-box { background: #fed7aa; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; }
          .usage-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .usage-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .usage-table td:first-child { font-weight: bold; width: 40%; }
          .total { background: #fee2e2; font-weight: bold; font-size: 16px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Usage Overage Notice</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            
            <div class="alert-box">
              <strong>Your account has exceeded its monthly usage limit.</strong>
            </div>

            <p>Here's a summary of your usage for the current billing period:</p>

            <table class="usage-table">
              <tr>
                <td>Current Plan:</td>
                <td><strong>${plan.charAt(0).toUpperCase() + plan.slice(1)}</strong></td>
              </tr>
              <tr>
                <td>Minutes Included:</td>
                <td>${usage.minutesUsed || 0} / ${planConfig.minutesPerMonth}</td>
              </tr>
              <tr>
                <td>Overage Minutes:</td>
                <td><strong style="color: #dc2626;">${usage.overageMinutes || 0} minutes</strong></td>
              </tr>
              <tr>
                <td>Overage Rate:</td>
                <td>$${planConfig.overageRate} per minute</td>
              </tr>
              <tr class="total">
                <td>Total Overage Charges:</td>
                <td>$${(usage.overageCharges || 0).toFixed(2)}</td>
              </tr>
            </table>

            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Overage charges will be billed at the end of your billing period</li>
              <li>You can continue using the service, but additional charges may apply</li>
              <li>Consider upgrading to a higher plan to avoid overage fees</li>
            </ul>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/subscription" class="button">View Subscription Details</a>

            <p>If you have any questions about your usage or charges, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} QualityPulse. All rights reserved.</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/subscription" style="color: #2563eb;">Manage Subscription</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via emailService
    await emailService.sendEmail(user.email, subject, html);

    logger.info('Overage summary email sent', {
      userId,
      email: user.email,
      plan,
      overageMinutes: usage.overageMinutes,
      overageCharges: usage.overageCharges
    });

  } catch (error) {
    logger.error('Failed to send overage summary', { 
      userId, 
      error: error.message,
      stack: error.stack 
    });
    // Don't throw - this is a notification, not critical
  }
};

/**
 * Send warning when approaching usage limit (e.g., 80% and 90%)
 * @param {string} userId - User ID
 * @param {number} percentageUsed - Percentage of plan limit used
 */
exports.sendUsageWarning = async (userId, percentageUsed) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      logger.error('User not found for usage warning', { userId });
      return;
    }

    const usage = user.subscription.usage;
    const plan = user.subscription.plan;
    const planConfig = config.subscription.plans[plan];

    if (!usage || !planConfig) {
      return;
    }

    const subject = `You've Used ${percentageUsed}% of Your Monthly Minutes`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .progress-bar { width: 100%; height: 30px; background: #e5e7eb; border-radius: 5px; overflow: hidden; margin: 20px 0; }
          .progress-fill { height: 100%; background: ${percentageUsed >= 90 ? '#dc2626' : '#f59e0b'}; width: ${percentageUsed}%; transition: width 0.3s; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Usage Alert</h1>
          </div>
          <div class="content">
            <p>Hi ${user.name},</p>
            
            <div class="warning-box">
              <strong>Heads up!</strong> You're approaching your monthly usage limit.
            </div>

            <p>You've used <strong>${percentageUsed}%</strong> of your ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan's monthly minutes:</p>

            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>

            <p style="text-align: center; font-size: 18px; margin: 10px 0;">
              <strong>${usage.minutesUsed || 0} of ${planConfig.minutesPerMonth} minutes used</strong>
            </p>

            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Monitor your usage in the dashboard</li>
              <li>Upgrade to a higher plan for more minutes</li>
              <li>Note: Overage charges apply at $${planConfig.overageRate}/minute after limit</li>
            </ul>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} QualityPulse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail(user.email, subject, html);

    logger.info('Usage warning email sent', {
      userId,
      email: user.email,
      percentageUsed,
      minutesUsed: usage.minutesUsed
    });

  } catch (error) {
    logger.error('Failed to send usage warning', { 
      userId, 
      percentageUsed,
      error: error.message 
    });
  }
};

/**
 * Check if user should receive usage warning and send if appropriate
 * @param {string} userId - User ID
 */
exports.checkAndSendUsageWarnings = async (userId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || user.subscription.plan === 'free') {
      return;
    }

    const usage = user.subscription.usage;
    const planConfig = config.subscription.plans[user.subscription.plan];

    if (!usage || !planConfig) {
      return;
    }

    const percentageUsed = Math.round((usage.minutesUsed / planConfig.minutesPerMonth) * 100);
    
    // Send warnings at 80% and 90%
    if (percentageUsed >= 90 && !usage.warning90Sent) {
      await exports.sendUsageWarning(userId, 90);
      user.subscription.usage.warning90Sent = true;
      await user.save();
    } else if (percentageUsed >= 80 && !usage.warning80Sent) {
      await exports.sendUsageWarning(userId, 80);
      user.subscription.usage.warning80Sent = true;
      await user.save();
    }

  } catch (error) {
    logger.error('Failed to check and send usage warnings', { 
      userId, 
      error: error.message 
    });
  }
};
