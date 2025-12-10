// @semantq/mail/lib/drivers/index.js - FIXED
export { BaseDriver } from './BaseDriver.js';
export { ResendDriver } from './ResendDriver.js';
export { SMTPDriver } from './SMTPDriver.js';
export { LogDriver } from './LogDriver.js';
// DO NOT export SendGridDriver

// Export driver loader function
export async function loadDriver(driverName, config = {}) {
  switch (driverName) {
    case 'resend':
      const { ResendDriver } = await import('./ResendDriver.js');
      return new ResendDriver(config);
    case 'smtp':
      const { SMTPDriver } = await import('./SMTPDriver.js');
      return new SMTPDriver(config);
    case 'sendgrid':
      // Try to load SendGrid, fall back to log if not available
      try {
        const { SendGridDriver } = await import('./SendGridDriver.js');
        return new SendGridDriver(config);
      } catch (error) {
        console.warn('SendGrid not available, using LogDriver');
        const { LogDriver } = await import('./LogDriver.js');
        return new LogDriver(config);
      }
    case 'log':
      const { LogDriver } = await import('./LogDriver.js');
      return new LogDriver(config);
    default:
      throw new Error(`Unknown driver: ${driverName}`);
  }
}