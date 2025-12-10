//lib/templates/BaseTemplate.js
/**
 * Base class for all email templates
 */
export default class BaseTemplate {
  /**
   * Render template with data
   * @param {Object} data - Template data
   * @returns {Object} { html, text, subject }
   */
  render(data) {
    throw new Error('render() method must be implemented by template');
  }
  
  /**
   * Escape HTML special characters
   * @protected
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
  
  /**
   * Generate plain text from HTML (simple implementation)
   * @protected
   */
  htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>/gi, '\n\n')
      .replace(/<\/p>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}