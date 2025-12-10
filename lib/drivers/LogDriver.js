// @semantq/mail/lib/drivers/LogDriver.js
import { BaseDriver } from './BaseDriver.js';

export class LogDriver extends BaseDriver {
  async send(email) {
    this.validateEmail(email);
    
    console.log(`[LogDriver] Would send to ${email.to.join(', ')}: "${email.subject}"`);
    
    return {
      success: true,
      driver: 'log',
      messageId: `log-${Date.now()}`,
      note: 'Logged, not sent'
    };
  }
}