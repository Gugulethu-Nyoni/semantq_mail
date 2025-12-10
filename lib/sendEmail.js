// @semantq/mail/lib/sendEmail.js

import { MailService } from './MailService.js';

let mailServiceInstance = null;

/**
 * Get or create MailService instance
 */
async function getMailService() {
  if (!mailServiceInstance) {
    mailServiceInstance = new MailService();
    await mailServiceInstance.init();
  }
  return mailServiceInstance;
}

/**
 * Send a simple email (quick wrapper for common use cases)
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} subject - Email subject
 * @param {string} content - Email content (text or HTML)
 * @param {Object} [options] - Additional options
 * @param {string} [options.html] - HTML content (if content is text)
 * @param {string[]} [options.cc] - CC recipients
 * @param {string[]} [options.bcc] - BCC recipients
 * @param {Object[]} [options.attachments] - File attachments
 * @param {string} [options.replyTo] - Reply-to address
 * @param {string} [options.from] - From address override
 * @param {string} [options.fromName] - From name override
 * @returns {Promise} Send result
 */
export async function sendEmail(to, subject, content, options = {}) {
  const mail = await getMailService();
  
  // Determine if content is HTML or text
  const isHtml = content.includes('<') && content.includes('>') && content.length > 10;
  
  return mail.send({
    to,
    subject,
    text: isHtml ? '' : content,
    html: isHtml ? content : (options.html || `<p>${content}</p>`),
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
    replyTo: options.replyTo,
    from: options.from,
    fromName: options.fromName,
    metadata: options.metadata,
    themeColor: options.themeColor,
    recipient: options.recipient
  });
}

/**
 * Send email using a template
 * @param {string|string[]} to - Recipient email(s)
 * @param {string} template - Template identifier (e.g., 'welcome/welcome')
 * @param {Object} templateData - Data for template
 * @param {Object} [options] - Additional options
 * @returns {Promise} Send result
 */
export async function sendTemplateEmail(to, template, templateData = {}, options = {}) {
  const mail = await getMailService();
  
  return mail.send({
    to,
    template,
    templateData,
    subject: options.subject,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments,
    replyTo: options.replyTo,
    from: options.from,
    fromName: options.fromName,
    metadata: options.metadata,
    themeColor: options.themeColor,
    recipient: options.recipient
  });
}

/**
 * Create and initialize a MailService instance
 * @param {Object} [config] - Optional configuration
 * @returns {Promise<MailService>} Initialized MailService
 */
export async function createMailService(config = null) {
  const service = new MailService(config);
  await service.init();
  return service;
}

/**
 * Direct access to MailService class
 */
export { MailService };