import { Resend } from 'resend';
import { BaseDriver } from './BaseDriver.js';

export class ResendDriver extends BaseDriver {
  constructor(config = {}) {
    super(config);
    this.apiKey = config.resend_api_key || process.env.RESEND_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('Resend API key is required. Set RESEND_API_KEY in environment or server.config.js');
    }
    
    this.resend = new Resend(this.apiKey);
  }
  
  async send(email) {
    this.validateEmail(email);
    
    try {
      const result = await this.resend.emails.send({
        from: `${email.fromName} <${email.from}>`,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: email.attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.from(att.content, 'base64')
        })),
        reply_to: email.replyTo
      });
      
      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }
      
      return {
        success: true,
        messageId: result.data?.id,
        driver: 'resend',
        data: result.data
      };
    } catch (error) {
      console.error('Resend send error:', error);
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
  }
}