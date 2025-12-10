// @semantq/mail/lib/templates/simple.js - MINIMAL & ALIGNED
import { BaseLayout } from './BaseLayout.js';

/**
 * SimpleTemplate - Minimal fallback template
 * Uses BaseLayout's modern design - no overrides needed
 */
export class SimpleTemplate extends BaseLayout {
  /**
   * Simple render that converts text to HTML if needed
   */
  render(data) {
    const {
      html = '',
      text = '',
      subject = 'No subject',
      brand = {},
      themeColor = '#007bff',
      recipient = {}
    } = data;

    // Convert text to HTML if no HTML provided
    let content = html;
    if (!content && text) {
      content = `
        <div class="main-content">
          <p style="white-space: pre-wrap;">${this.escapeHtml(text)}</p>
        </div>
      `;
    }

    // Use BaseLayout's modern design
    return super.render({
      content,
      subject,
      brand,
      themeColor,
      recipient
    });
  }
}

export default SimpleTemplate;