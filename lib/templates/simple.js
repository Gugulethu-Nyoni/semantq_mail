import BaseTemplate from './BaseTemplate.js';

export default class SimpleTemplate extends BaseTemplate {
  render(data) {
    const message = this.escapeHtml(data.message || '');
    const brandName = this.escapeHtml(data.brand?.name || '');
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; padding: 20px; }
    .message { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="message">
    ${message.replace(/\n/g, '<br>')}
    
    ${brandName ? `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
      <p>© ${data.year || new Date().getFullYear()} ${brandName}</p>
    </div>
    ` : ''}
  </div>
</body>
</html>`;
    
    const text = `${data.message || ''}

${brandName ? `© ${data.year || new Date().getFullYear()} ${brandName}` : ''}`;
    
    return {
      html,
      text,
      subject: data.subject || 'Message'
    };
  }
}