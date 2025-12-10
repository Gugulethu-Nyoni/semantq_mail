// @semantq/mail/index.js - UPDATED
import { MailService } from './lib/MailService.js';
import { sendEmail } from './lib/sendEmail.js';
// Remove this: import { drivers } from './lib/drivers/index.js';

// Export main components
export { MailService, sendEmail };

// Export driver loader function if needed
export { loadDriver } from './lib/drivers/index.js';

// For backward compatibility, create a drivers object that loads dynamically
export const drivers = {
  async load(driverName, config = {}) {
    const { loadDriver } = await import('./lib/drivers/index.js');
    return loadDriver(driverName, config);
  }
};

// Default export
export default {
  MailService,
  sendEmail,
  drivers
};