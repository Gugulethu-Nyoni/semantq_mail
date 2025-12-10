// @semantq/mail/lib/index.js - UPDATED
export { MailService } from './MailService.js';
export { sendEmail } from './sendEmail.js';
export { loadDriver } from './drivers/index.js';

// No static drivers export - use loadDriver instead