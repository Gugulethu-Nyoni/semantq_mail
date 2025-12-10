// @semantq/mail/lib/drivers/SMTPDriver.js
import nodemailer from 'nodemailer';
import { BaseDriver } from './BaseDriver.js';

export class SMTPDriver extends BaseDriver {
  constructor(config = {}) {
    super(config);
    
    // Check required config
    if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
      throw new Error('SMTP configuration requires smtp_host, smtp_user, and smtp_pass');
    }
    
    // Simple SMTP config - nodemailer handles defaults well
    this.transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: config.smtp_secure || false,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass
      }
    });
  }
  
  async send(email) {
    this.validateEmail(email);
    
    const mailOptions = {
      from: email.fromName ? `"${email.fromName}" <${email.from}>` : email.from,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: email.replyTo,
      attachments: email.attachments
    };
    
    try {
      const info = await this.transporter.sendMail(mailOptions);
      return this.formatSuccessResponse({
        messageId: info.messageId,
        data: info
      });
    } catch (error) {
      return this.formatErrorResponse(
        new Error(`SMTP send failed: ${error.message}`)
      );
    }
  }
}