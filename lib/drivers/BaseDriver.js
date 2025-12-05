/**
 * Base driver interface that all drivers must implement
 */
export class BaseDriver {
  constructor(config = {}) {
    this.config = config;
  }
  
  /**
   * Send an email
   * @param {Object} email - Email object
   * @returns {Promise<Object>} Send result
   */
  async send(email) {
    throw new Error('send() method must be implemented by driver');
  }
  
  /**
   * Validate email object
   * @protected
   */
  validateEmail(email) {
    if (!email.to || email.to.length === 0) {
      throw new Error('At least one recipient is required');
    }
    
    if (!email.subject) {
      throw new Error('Email subject is required');
    }
    
    if (!email.text && !email.html) {
      throw new Error('Email must have either text or HTML content');
    }
    
    // Validate email formats (simple check)
    const allRecipients = [...email.to, ...email.cc, ...email.bcc];
    for (const recipient of allRecipients) {
      if (!this.isValidEmail(recipient)) {
        throw new Error(`Invalid email address: ${recipient}`);
      }
    }
  }
  
  /**
   * Simple email validation
   * @protected
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}