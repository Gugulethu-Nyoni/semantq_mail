// @semantq/mail/lib/drivers/LogDriver.js
import { BaseDriver } from './BaseDriver.js';

export class LogDriver extends BaseDriver {
  constructor(config = {}) {
    super(config);
    // debug defaults to true if not specified
    this.debug = config.debug !== false;
  }

  async send(emailData) {
    // Only log if debug is not false
    if (this.debug) {
      console.log(`[LogDriver] Would send to ${emailData.to}: "${emailData.subject}"`);
    }
    
    return {
      success: true,
      driver: this.name,
      message: 'Email logged (not sent)'
    };
  }
}