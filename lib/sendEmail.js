import { MailService } from './MailService.js';

let mailServiceInstance = null;

/**
 * Get or create a MailService instance
 * @returns {MailService}
 */
function getMailService() {
  if (!mailServiceInstance) {
    mailServiceInstance = new MailService();
  }
  return mailServiceInstance;
}

/**
 * Simple email sending function
 * 
 * @example
 * // Send plain text email
 * await sendEmail('user@example.com', 'Welcome to our platform!');
 * 
 * @example
 * // Use built-in template
 * await sendEmail('user@example.com', 'welcome', {
 *   name: 'John Doe',
 *   confirmationUrl: 'https://...'
 * });
 * 
 * @param {string|string[]} to - Email address(es)
 * @param {string} messageOrTemplate - Plain text message or template name
 * @param {Object} [data] - Template data or additional options
 * @returns {Promise<Object>} Email send result
 */
export async function sendEmail(to, messageOrTemplate, data = {}) {
  const mail = getMailService();
  
  // Check if messageOrTemplate is a registered template
  const isTemplate = mail.templateExists(messageOrTemplate);
  
  if (isTemplate) {
    return mail.send({
      to,
      template: messageOrTemplate,
      templateData: data,
      subject: data.subject || messageOrTemplate.charAt(0).toUpperCase() + messageOrTemplate.slice(1)
    });
  } else {
    // Plain text message
    return mail.send({
      to,
      subject: data.subject || 'Message',
      text: messageOrTemplate,
      html: data.html || `<p>${messageOrTemplate}</p>`,
      ...data
    });
  }
}