import { BaseDriver } from './BaseDriver.js';

export class LogDriver extends BaseDriver {
  constructor() {
    super();
  }
  
  async send(email) {
    this.validateEmail(email);
    
    console.log('📧 [LogDriver - Email would be sent]');
    console.log('From:', `${email.fromName} <${email.from}>`);
    console.log('To:', email.to.join(', '));
    if (email.cc.length > 0) console.log('CC:', email.cc.join(', '));
    if (email.bcc.length > 0) console.log('BCC:', email.bcc.join(', '));
    console.log('Subject:', email.subject);
    console.log('Text length:', email.text?.length || 0);
    console.log('HTML length:', email.html?.length || 0);
    console.log('Attachments:', email.attachments?.length || 0);
    
    if (email.html && process.env.NODE_ENV === 'development') {
      // Save HTML to file for preview in development
      const fs = await import('fs');
      const path = await import('path');
      const previewDir = path.join(process.cwd(), '.email-previews');
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }
      
      const previewFile = path.join(previewDir, `email-${Date.now()}.html`);
      fs.writeFileSync(previewFile, email.html);
      console.log(`📄 HTML preview saved to: ${previewFile}`);
    }
    
    return {
      success: true,
      messageId: `log-${Date.now()}`,
      driver: 'log',
      note: 'Email logged (not actually sent)'
    };
  }
}