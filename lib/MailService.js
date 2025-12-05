import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { drivers } from './drivers/index.js';
import { templates } from './templates/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class MailService {
  constructor(config = null) {
    this.config = config || this.loadConfig();
    this.driver = this.createDriver();
    this.loadedTemplates = new Map();
  }
  
  /**
   * Load configuration from server.config.js or environment variables
   * @private
   */
  loadConfig() {
    // Try to load from common SemantQ project locations
    const possiblePaths = [
      path.join(process.cwd(), 'config', 'server.config.js'),
      path.join(process.cwd(), 'semantqQL', 'config', 'server.config.js'),
      path.join(process.cwd(), '..', 'config', 'server.config.js'),
    ];
    
    for (const configPath of possiblePaths) {
      try {
        if (fs.existsSync(configPath)) {
          const config = require(configPath);
          return config.default || config;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    // Fallback to environment variables
    console.warn('⚠️ No server.config.js found, using environment variables');
    return {
      email: {
        driver: process.env.EMAIL_DRIVER || 'log',
        email_from: process.env.EMAIL_FROM || 'noreply@example.com',
        email_from_name: process.env.EMAIL_FROM_NAME || 'System',
        ...(process.env.RESEND_API_KEY && { resend_api_key: process.env.RESEND_API_KEY }),
        ...(process.env.SENDGRID_API_KEY && { sendgrid_api_key: process.env.SENDGRID_API_KEY })
      },
      brand: {
        name: process.env.BRAND_NAME || 'App',
        support_email: process.env.BRAND_SUPPORT_EMAIL || 'support@example.com'
      }
    };
  }
  
  /**
   * Create email driver based on configuration
   * @private
   */
  createDriver() {
    const driverName = this.config.email?.driver || 'log';
    
    if (!drivers[driverName]) {
      console.warn(`⚠️ Driver "${driverName}" not found, using LogDriver`);
      return new drivers.log();
    }
    
    return new drivers[driverName](this.config.email);
  }
  
  /**
   * Send email with full options
   * 
   * @example
   * await mail.send({
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   template: 'welcome',
   *   templateData: { name: 'John' }
   * });
   * 
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Email send result
   */
  async send(options) {
    // Validate required fields
    if (!options.to) {
      throw new Error('"to" field is required');
    }
    
    // Prepare email object with defaults
    const email = {
      from: options.from || this.config.email?.email_from || 'noreply@example.com',
      fromName: options.fromName || this.config.email?.email_from_name || 'System',
      to: Array.isArray(options.to) ? options.to : [options.to],
      cc: Array.isArray(options.cc) ? options.cc : (options.cc ? [options.cc] : []),
      bcc: Array.isArray(options.bcc) ? options.bcc : (options.bcc ? [options.bcc] : []),
      subject: options.subject || 'No subject',
      text: options.text || '',
      html: options.html || '',
      attachments: options.attachments || [],
      replyTo: options.replyTo || this.config.brand?.support_email,
      metadata: options.metadata || {}
    };
    
    // Handle template if specified
    if (options.template) {
      const template = await this.getTemplate(options.template);
      const rendered = template.render({
        ...options.templateData,
        brand: this.config.brand || { name: 'App', support_email: 'support@example.com' },
        year: new Date().getFullYear()
      });
      
      email.html = rendered.html || email.html;
      email.text = rendered.text || email.text || this.htmlToText(rendered.html);
      
      // Use template subject if not overridden
      if (rendered.subject && !options.subject) {
        email.subject = rendered.subject;
      }
    }
    
    // Send via driver
    return this.driver.send(email);
  }
  
  /**
   * Check if a template exists
   * @param {string} name - Template name
   * @returns {boolean}
   */
  templateExists(name) {
    // Check built-in templates
    if (templates[name]) return true;
    
    // Check if it's a file path to custom template
    const templatePath = path.join(process.cwd(), 'templates', `${name}.js`);
    return fs.existsSync(templatePath);
  }
  
  /**
   * Get template instance
   * @param {string} name - Template name
   * @returns {Promise<Object>} Template instance
   * @private
   */
  async getTemplate(name) {
    // Return cached template
    if (this.loadedTemplates.has(name)) {
      return this.loadedTemplates.get(name);
    }
    
    let template;
    
    // Try built-in templates first
    if (templates[name]) {
      const TemplateClass = templates[name];
      template = new TemplateClass();
    } else {
      // Try to load from project templates directory
      const templatePath = path.join(process.cwd(), 'templates', `${name}.js`);
      if (fs.existsSync(templatePath)) {
        const TemplateModule = await import(templatePath);
        const TemplateClass = TemplateModule.default || TemplateModule;
        template = new TemplateClass();
      } else {
        throw new Error(`Template "${name}" not found`);
      }
    }
    
    // Cache the template
    this.loadedTemplates.set(name, template);
    return template;
  }
  
  /**
   * Convert HTML to plain text (simple implementation)
   * @private
   */
  htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Get current configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Get current driver name
   * @returns {string}
   */
  getDriverName() {
    return this.config.email?.driver || 'log';
  }
}