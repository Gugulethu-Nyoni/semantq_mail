// @semantq/mail/lib/templates/simple.js
import { BaseLayout } from './BaseLayout.js';

/**
 * SimpleTemplate - Default fallback template that extends BaseLayout
 * Used when no custom template is specified or when raw text/html is sent
 */
export class SimpleTemplate extends BaseLayout {
  /**
   * Render email with simple layout
   * @param {Object} data
   * @param {string} data.html - HTML content
   * @param {string} data.text - Plain text content  
   * @param {string} data.subject - Email subject
   * @param {Object} data.brand - Brand configuration
   * @param {string} data.themeColor - Primary color
   * @param {Object} data.recipient - Recipient info
   * @returns {Object} { html, text, subject }
   */
  render(data) {
    const {
      html = '',
      text = '',
      subject = 'No subject',
      brand = {},
      themeColor = '#667eea',
      recipient = {}
    } = data;

    // Determine content - use HTML if provided, otherwise create from text
    let content = html;
    if (!content && text) {
      content = `<div class="text-content">
        ${this.escapeHtml(text).replace(/\n/g, '<br>')}
      </div>`;
    }

    // Use BaseLayout to wrap the content
    return super.render({
      content,
      subject,
      brand,
      themeColor,
      recipient
    });
  }

  /**
   * Override BaseLayout styles for simpler appearance
   */
  getStyles(themeColor) {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
        background-color: #f9f9f9;
      }
      
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 8px;
        padding: 40px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .email-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .brand {
        color: ${themeColor};
        font-size: 24px;
        font-weight: bold;
        margin: 0 0 10px 0;
      }
      
      .subject {
        color: #6b7280;
        font-size: 16px;
        margin: 0;
      }
      
      .email-content {
        margin-bottom: 30px;
      }
      
      .greeting {
        margin-bottom: 20px;
        color: #4b5563;
        font-size: 18px;
      }
      
      .content-body {
        font-size: 16px;
        line-height: 1.6;
      }
      
      .text-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        white-space: pre-wrap;
      }
      
      .email-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 14px;
        color: #6b7280;
      }
      
      .support {
        margin: 10px 0;
      }
      
      .support a {
        color: ${themeColor};
        text-decoration: none;
      }
      
      .support a:hover {
        text-decoration: underline;
      }
      
      .disclaimer {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 10px;
      }
      
      @media (max-width: 640px) {
        body {
          padding: 10px;
        }
        
        .email-container {
          padding: 30px 20px;
        }
        
        .brand {
          font-size: 20px;
        }
        
        .subject {
          font-size: 14px;
        }
      }
    `;
  }

  /**
   * Override the entire render method for simpler structure
   * (Alternative approach - uncomment if needed)
   */
  /*
  render({ content, subject, brand, themeColor = '#667eea', recipient }) {
    const brandName = brand?.name || 'Our Service';
    const supportEmail = brand?.support_email;
    const year = new Date().getFullYear();
    
    // Recipient greeting
    const recipientName = recipient?.name;
    const greeting = recipientName ? `Hello ${this.escapeHtml(recipientName)},` : 'Hello,';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(subject)}</title>
  <style>
    ${this.getStyles(themeColor)}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      ${brandName ? `<div class="brand">${this.escapeHtml(brandName)}</div>` : ''}
      ${subject ? `<div class="subject">${this.escapeHtml(subject)}</div>` : ''}
    </div>
    
    <div class="email-content">
      <div class="greeting">${greeting}</div>
      <div class="content-body">
        ${content}
      </div>
    </div>
    
    <div class="email-footer">
      <p>&copy; ${year} ${this.escapeHtml(brandName)}. All rights reserved.</p>
      ${supportEmail ? `
        <p class="support">
          Need help? Contact <a href="mailto:${supportEmail}">${supportEmail}</a>
        </p>
      ` : ''}
      <p class="disclaimer">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>`;

    const text = this.htmlToText(content);

    return {
      html,
      text,
      subject
    };
  }
  */
}

// Also export as default for backward compatibility
export default SimpleTemplate;