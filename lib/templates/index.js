// @semantq/mail/lib/templates/index.js

// Import BaseLayout and SimpleTemplate
import { BaseLayout } from './BaseLayout.js';
import { SimpleTemplate } from './simple.js';

// Export BaseLayout for extension
export { BaseLayout };

// Export SimpleTemplate as default simple template
export { SimpleTemplate };

// Legacy exports for backward compatibility
export const simple = SimpleTemplate;

// Combined templates object (for backward compatibility)
export const templates = {
  simple: SimpleTemplate
};

// Default exports
export default {
  BaseLayout,
  SimpleTemplate,
  simple: SimpleTemplate,
  templates: {
    simple: SimpleTemplate
  }
};