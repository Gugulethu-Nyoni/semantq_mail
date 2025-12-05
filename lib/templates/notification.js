import BaseTemplate from './BaseTemplate.js';

export default class NotificationTemplate extends BaseTemplate {
  render(data) {
    const title = this.escapeHtml(data.title || 'Notification');
    const message = this.escapeHtml(data.message || 'You have a new notification');
    const brandName = this.escapeHtml(data.brand?.name || 'App');
    const year = data.year || new Date().getFullYear();
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .card-header { background: #6ec7ff; color: white; padding: 20px; }
    .card-body { padding: 30px; }
    .button { display: inline-block; padding: 10px 20px; background: #6ec7ff; color: white; text-decoration: none; border-radius: 4px; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-header">
      <h1 style="margin: 0;">${title}</h1>
    </div>
    <div class="card-body">
      <p>${message.replace(/\n/g, '<br>')}</p>
      
      ${data.actionUrl ? `
      <div style="text-align: center; margin: 25px 0;">
        <a href="${data.actionUrl}" class="button">${data.actionText || 'Take Action'}</a>
      </div>
      ` : ''}
      
      ${data.details ? `
      <div style="background: #f5f5f5; padding: 15px; border-radius: 4px; margin-top: 20px;">
        <h3 style="margin-top: 0;">Details:</h3>
        <p>${this.escapeHtml(data.details)}</p>
      </div>
      ` : ''}
    </div>
  </div>
  
  <div class="footer">
    <p>© ${year} ${brandName}</p>
    <p>This is an automated notification from ${brandName}.</p>
  </div>
</body>
</html>`;
    
    const text = `${title}

${message}

${data.actionUrl ? `Take action: ${data.actionUrl}` : ''}

${data.details ? `Details: ${data.details}` : ''}

© ${year} ${brandName}
This is an automated notification from ${brandName}.`;
    
    return {
      html,
      text,
      subject: title
    };
  }
}