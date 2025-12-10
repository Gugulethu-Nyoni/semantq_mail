// @semantq/mail/lib/drivers/SendGridDriver.js
import sgMail from '@sendgrid/mail';
import { BaseDriver } from './BaseDriver.js';

export class SendGridDriver extends BaseDriver {
  constructor(config = {}) {
    super(config);
    
    if (!config.sendgrid_api_key) {
      throw new Error('SendGrid API key is required. Add sendgrid_api_key to email config in server.config.js');
    }
    
    this.apiKey = config.sendgrid_api_key;
    sgMail.setApiKey(this.apiKey);
  }
  
  async send(email) {
    this.validateEmail(email);
    
    try {
      const msg = {
        to: email.to,
        from: email.from,
        subject: email.subject,
        text: email.text,
        html: email.html
      };
      
      // Add from name if provided
      if (email.fromName) {
        msg.from = {
          email: email.from,
          name: email.fromName
        };
      }
      
      // Add optional fields
      if (email.cc && email.cc.length > 0) {
        msg.cc = email.cc;
      }
      
      if (email.bcc && email.bcc.length > 0) {
        msg.bcc = email.bcc;
      }
      
      if (email.replyTo) {
        msg.replyTo = email.replyTo;
      }
      
      if (email.attachments && email.attachments.length > 0) {
        msg.attachments = this.formatAttachments(email.attachments);
      }
      
      const [response] = await sgMail.send(msg);
      
      return this.formatSuccessResponse({
        messageId: response.headers['x-message-id'],
        data: response
      });
      
    } catch (error) {
      return this.formatErrorResponse(
        new Error(`SendGrid error: ${error.message}`)
      );
    }
  }
  
  /**
   * Format attachments for SendGrid
   */
  formatAttachments(attachments) {
    return attachments.map(attachment => {
      const formatted = {
        filename: attachment.filename || 'attachment'
      };
      
      // Handle content
      if (attachment.content) {
        if (typeof attachment.content === 'string') {
          if (this.isBase64(attachment.content)) {
            formatted.content = attachment.content;
          } else {
            formatted.content = Buffer.from(attachment.content).toString('base64');
          }
        } else if (Buffer.isBuffer(attachment.content)) {
          formatted.content = attachment.content.toString('base64');
        }
      }
      
      // Handle path
      if (attachment.path) {
        formatted.path = attachment.path;
      }
      
      // Handle content type
      if (attachment.contentType) {
        formatted.type = attachment.contentType;
      }
      
      return formatted;
    });
  }
  
  /**
   * Check if string is base64 encoded
   */
  isBase64(str) {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str;
    } catch (err) {
      return false;
    }
  }
}