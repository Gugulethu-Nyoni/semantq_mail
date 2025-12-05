import { BaseDriver } from './BaseDriver.js';

export class SendGridDriver extends BaseDriver {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.sendgrid_api_key || process.env.SENDGRID_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('SendGrid API key is required. Set SENDGRID_API_KEY in environment or server.config.js');
    }
    
    // Note: SendGrid SDK would be imported here
    // For now, we'll leave this as a stub
  }
  
  async send(email) {
    this.validateEmail(email);
    
    // Stub implementation - would integrate with @sendgrid/mail
    console.log('📧 [SendGrid Driver Stub] Would send email:', {
      to: email.to,
      subject: email.subject,
      driver: 'sendgrid'
    });
    
    return {
      success: true,
      messageId: `sg-${Date.now()}`,
      driver: 'sendgrid',
      note: 'SendGrid driver not fully implemented'
    };
  }
}