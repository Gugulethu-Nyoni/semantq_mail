import BaseTemplate from './BaseTemplate.js';

export default class WelcomeTemplate extends BaseTemplate {
  render(data) {
    const name = this.escapeHtml(data.name || 'User');
    const brandName = this.escapeHtml(data.brand?.name || 'Our Service');
    const supportEmail = data.brand?.support_email || 'support@example.com';
    const year = data.year || new Date().getFullYear();
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #b56ef0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #b56ef0; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to ${brandName}!</h1>
  </div>
  <div class="content">
    <h2>Hi ${name},</h2>
    <p>We're excited to have you join ${brandName}. Your account has been successfully created and is ready to use.</p>
    
    ${data.confirmationUrl ? `
    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.confirmationUrl}" class="button">Confirm Your Email</a>
    </p>
    <p>Or copy and paste this link:<br>
      <a href="${data.confirmationUrl}">${data.confirmationUrl}</a>
    </p>
    ` : ''}
    
    ${data.nextSteps ? `
    <h3>Next Steps:</h3>
    <ul>
      ${data.nextSteps.map(step => `<li>${this.escapeHtml(step)}</li>`).join('')}
    </ul>
    ` : ''}
    
    <p>If you have any questions, our support team is here to help.</p>
  </div>
  <div class="footer">
    <p>© ${year} ${brandName}. All rights reserved.</p>
    <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
  </div>
</body>
</html>`;
    
    const text = `Welcome to ${brandName}!

Hi ${name},

We're excited to have you join ${brandName}. Your account has been successfully created and is ready to use.

${data.confirmationUrl ? `Confirm your email: ${data.confirmationUrl}` : ''}

${data.nextSteps ? `Next Steps:\n${data.nextSteps.map(step => `• ${step}`).join('\n')}` : ''}

If you have any questions, our support team is here to help.

© ${year} ${brandName}
Need help? Contact us at ${supportEmail}`;
    
    return {
      html,
      text,
      subject: `Welcome to ${brandName}!`
    };
  }
}