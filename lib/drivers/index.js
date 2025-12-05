export { ResendDriver } from './ResendDriver.js';
export { SendGridDriver } from './SendGridDriver.js';
export { SMTPDriver } from './SMTPDriver.js';
export { LogDriver } from './LogDriver.js';

// Driver registry for easy access
export const drivers = {
  resend: ResendDriver,
  sendgrid: SendGridDriver,
  smtp: SMTPDriver,
  log: LogDriver
};