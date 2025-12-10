// @semantq/mail/lib/drivers/BaseDriver.js - COMPLETE VERSION

export class BaseDriver {
  constructor(config = {}) {
    this.config = config;
  }
  
  async send(email) {
    throw new Error('send() method must be implemented');
  }
  
  validateEmail(email) {
    if (!email.to || email.to.length === 0) {
      throw new Error('At least one recipient is required');
    }
    
    if (!email.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!email.html && !email.text) {
      throw new Error('Email must have text or HTML content');
    }
    
    if (!email.from) {
      throw new Error('From address is required');
    }
    
    return true;
  }
  
  /**
   * Format success response
   */
  formatSuccessResponse(data = {}) {
    return {
      success: true,
      driver: this.constructor.name.replace('Driver', '').toLowerCase(),
      timestamp: new Date().toISOString(),
      ...data
    };
  }
  
  /**
   * Format error response
   */
  formatErrorResponse(error, data = {}) {
    return {
      success: false,
      driver: this.constructor.name.replace('Driver', '').toLowerCase(),
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      ...data
    };
  }
  
  /**
   * Convert HTML to plain text (basic implementation)
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