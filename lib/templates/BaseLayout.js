// @semantq/mail/lib/templates/BaseLayout.js - DEBUG LOGS REMOVED ONLY

/**
 * BaseLayout - Aligned with core payload structure
 * Content from: text, html, or body ONLY
 * templateData: Optional additional data for templates
 */
export class BaseLayout {
  /**
   * Render email with core payload structure
   */
  render({ 
    text, 
    html, 
    body, 
    subject, 
    brand, 
    recipient, 
    templateData = {},
    themeColor = '#007bff' 
  }) {
    const brandName = brand?.name || 'Our Service';
    const supportEmail = brand?.support_email || 'support@example.com';
    const year = new Date().getFullYear();
    
    // Recipient info
    const recipientEmail = recipient?.email || '';
    const recipientName = recipient?.name || recipientEmail.split('@')[0] || 'there';
    
    // Determine content from CORE fields only
    const emailContent = this.determineContent({ text, html, body });
    
    const htmlOutput = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(subject || 'Email from ' + brandName)}</title>
  <style>
    ${this.getStyles(templateData.themeColor || themeColor)}
  </style>
</head>
<body>
  <div class="email-content">
    <div class="greeting">
      <h2>Hi ${this.escapeHtml(recipientName)},</h2>
    </div>
    
    <div class="main-content">
      ${emailContent.html}
    </div>
    
    <div class="footer">
      <p class="support">Need help? Contact our support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
      
      <p class="disclaimer">
        This is an automated message. Please do not reply to this email.<br>
        If you didn't request this email, you can safely ignore it.
      </p>
      
      <p class="copyright">&copy; ${year} ${this.escapeHtml(brandName)}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    // Generate text version
    const textOutput = this.generateTextVersion(
      emailContent.text, 
      recipientName, 
      brandName, 
      subject
    );

    return {
      html: htmlOutput,
      text: textOutput,
      subject: subject || 'Email from ' + brandName
    };
  }

  /**
   * Determine content from CORE fields only
   */
  determineContent({ text, html, body }) {
    if (text) {
      return {
        html: `<p>${this.escapeHtml(text)}</p>`,
        text: text
      };
    }
    
    if (html) {
      return {
        html: html,
        text: this.htmlToText(html)
      };
    }
    
    if (body) {
      // Check if body contains HTML
      if (body.includes('<')) {
        return {
          html: body,
          text: this.htmlToText(body)
        };
      } else {
        return {
          html: `<p>${this.escapeHtml(body)}</p>`,
          text: body
        };
      }
    }
    
    // Default fallback
    return {
      html: '<p>Your message here.</p>',
      text: 'Your message here.'
    };
  }

  /**
   * Generate text version
   */
  generateTextVersion(content, recipientName, brandName, subject) {
    return `
${subject || 'Email from ' + brandName}

Hi ${recipientName},

${content}

---

Need help? Contact our support team.

This is an automated message. Please do not reply to this email.
If you didn't request this email, you can safely ignore it.

© ${new Date().getFullYear()} ${brandName}. All rights reserved.
    `.trim();
  }

  /**
   * Clean CSS styles without box/card appearance
   */
  getStyles(themeColor = '#007bff') {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333333;
        margin: 0;
        padding: 20px;
        background-color: #f8f9fa;
        max-width: 100%;
      }
      
      .brand-header {
        text-align: left;
        margin-bottom: 30px;
        padding: 0;
      }
      
      .brand-name {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 10px 0;
        color: ${themeColor};
      }
      
      .email-content {
        padding: 0;
        max-width: 600px;
        margin: 0 auto;
      }
      
      .greeting h2 {
        font-size: 20px;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 25px 0;
        line-height: 1.3;
      }
      
      .main-content {
        font-size: 16px;
        line-height: 1.6;
        color: #4a5568;
        margin-bottom: 30px;
      }
      
      .main-content p {
        margin: 0 0 20px 0;
      }
      
      .main-content strong {
        font-weight: 600;
        color: #2d3748;
      }
      
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: ${themeColor};
        color: white !important;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        margin: 15px 0;
        border: none;
        cursor: pointer;
      }
      
      .button:hover {
        background-color: ${this.darkenColor(themeColor, 10)};
        text-decoration: none;
      }
      
      .link {
        color: ${themeColor};
        text-decoration: none;
      }
      
      .link:hover {
        text-decoration: underline;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 25px;
        border-top: 1px solid #e2e8f0;
        font-size: 14px;
        color: #718096;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      }
      
      .support {
        margin: 0 0 15px 0;
      }
      
      .support a {
        color: ${themeColor};
        text-decoration: none;
      }
      
      .support a:hover {
        text-decoration: underline;
      }
      
      .disclaimer {
        font-size: 13px;
        color: #a0aec0;
        line-height: 1.5;
        margin: 15px 0;
      }
      
      .copyright {
        font-size: 13px;
        color: #a0aec0;
        margin: 15px 0 0 0;
      }
      
      @media (max-width: 640px) {
        body {
          padding: 20px 15px;
        }
        
        .brand-name {
          font-size: 22px;
        }
        
        .greeting h2 {
          font-size: 20px;
        }
        
        .button {
          display: block;
          padding: 14px 20px;
          margin: 20px 0;
        }
      }
    `;
  }

  /**
   * Darken a color for hover effects
   */
  darkenColor(color, percent) {
    if (color.startsWith('#')) {
      const num = parseInt(color.slice(1), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) - amt;
      const G = (num >> 8 & 0x00FF) - amt;
      const B = (num & 0x0000FF) - amt;
      
      return '#' + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
      ).toString(16).slice(1);
    }
    return color;
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    if (!html) return '';
    
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
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