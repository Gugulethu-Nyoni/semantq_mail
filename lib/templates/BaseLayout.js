// @semantq/mail/lib/templates/BaseLayout.js

/**
 * BaseLayout - Standard HTML email layout that all emails use
 * Provides consistent header, footer, and styling
 * Can be extended for custom layouts
 */
export class BaseLayout {
  /**
   * Render email with base layout
   * @param {Object} options
   * @param {string} options.content - Main content HTML
   * @param {string} options.subject - Email subject
   * @param {Object} options.brand - Brand configuration
   * @param {string} options.themeColor - Primary color (default: #667eea)
   * @param {Object} options.recipient - Recipient info
   * @returns {Object} { html, text, subject }
   */
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
      <h1 class="brand">${this.escapeHtml(brandName)}</h1>
      <p class="subject">${this.escapeHtml(subject)}</p>
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

    // Generate text version from HTML content
    const text = this.htmlToText(content);

    return {
      html,
      text,
      subject
    };
  }

  /**
   * Base CSS styles - can be overridden by extending classes
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
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      }
      
      .email-header {
        background: ${themeColor};
        color: white;
        padding: 40px 20px;
        text-align: center;
      }
      
      .brand {
        font-size: 32px;
        font-weight: 700;
        margin: 0 0 10px 0;
      }
      
      .subject {
        font-size: 18px;
        opacity: 0.9;
        margin: 0;
      }
      
      .email-content {
        padding: 40px;
      }
      
      .greeting {
        font-size: 18px;
        color: #4b5563;
        margin-bottom: 25px;
      }
      
      .content-body {
        font-size: 16px;
        line-height: 1.6;
      }
      
      .content-body p {
        margin: 0 0 15px 0;
      }
      
      .content-body a {
        color: ${themeColor};
        text-decoration: none;
      }
      
      .content-body a:hover {
        text-decoration: underline;
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
        
        .email-content {
          padding: 30px 20px;
        }
        
        .email-header {
          padding: 30px 15px;
        }
        
        .brand {
          font-size: 24px;
        }
        
        .subject {
          font-size: 16px;
        }
      }
    `;
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    if (!html) return '';
    
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}