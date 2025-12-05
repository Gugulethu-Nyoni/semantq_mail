import nodemailer from 'nodemailer';
import { BaseDriver } from './BaseDriver.js';

export class SMTPDriver extends BaseDriver {
  constructor(config = {}) {
    super(config);
    this.smtpConfig = {
      host: config.smtp_host || process.env.SMTP_HOST || 'localhost',
      port: config.smtp_port || process.env.SMTP_PORT || 587,
      secure: config.smtp_secure || process.env.SMTP_SECURE === 'true',
      auth: {
        user: config.smtp_user || process.env.SMTP_USER,
        pass: config.smtp_pass || process.env.SMTP_PASS
      }
    };
    
    this.transporter = nodemailer.createTransport(this.smtpConfig);
  }
  
  async send(email) {
    this.validateEmail(email);
    
    try {
      const mailOptions = {
        from: `"${email.fromName}" <${email.from}>`,
        to: email.to.join(', '),
        cc: email.cc.length > 0 ? email.cc.join(', ') : undefined,
        bcc: email.bcc.length > 0 ? email.bcc.join(', ') : undefined,
        subject: email.subject,
        text: email.text,
        html: email.html,
        attachments: email.attachments,
        replyTo: email.replyTo
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        driver: 'smtp',
        data: info
      };
    } catch (error) {
      console.error('SMTP send error:', error);
      throw new Error(`Failed to send email via SMTP: ${error.message}`);
    }
  }
}