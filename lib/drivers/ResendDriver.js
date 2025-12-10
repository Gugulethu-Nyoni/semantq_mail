// @semantq/mail/lib/drivers/ResendDriver.js
import { Resend } from 'resend';
import { BaseDriver } from './BaseDriver.js';

export class ResendDriver extends BaseDriver {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.resend_api_key;
    
    if (!this.apiKey) {
      throw new Error('Resend API key is required. Set resend_api_key in server.config.js');
    }
    
    this.resend = new Resend(this.apiKey);
  }
  
  async send(email) {
    // Validate email using BaseDriver validation
    this.validateEmail(email);
    
    try {
      const result = await this.resend.emails.send({
        from: email.fromName ? `${email.fromName} <${email.from}>` : email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        cc: email.cc,
        bcc: email.bcc,
        reply_to: email.replyTo,
        attachments: email.attachments
      });
      
      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }
      
      return this.formatSuccessResponse({
        messageId: result.data?.id,
        data: result.data
      });
      
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
}