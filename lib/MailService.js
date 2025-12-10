// @semantq/mail/lib/MailService.js
import { BaseLayout } from './templates/BaseLayout.js';
import { SimpleTemplate } from './templates/simple.js';
import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

export class MailService {
  constructor(config = null) {
    this.config = config || null;
    this.driver = null; // Don't create driver yet
    this.templateCache = new Map();
    this.baseLayout = new BaseLayout();
  }

  async init() {
    if (!this.config) {
      this.config = await this.loadConfig();
    }
    
    if (!this.driver) {
      this.driver = await this.createDriver();
    }
    
    return this;
  }

  /**
   * Load config from semantqQL/config_loader.js
   */
  async loadConfig() {
    try {
      // Path to config_loader.js relative to project root
      const configLoaderPath = path.join(
        process.cwd(),
        'semantqQL',
        'config_loader.js'
      );

      if (!fs.existsSync(configLoaderPath)) {
        console.warn('⚠️ config_loader.js not found, using default config');
        return this.getDefaultConfig();
      }

      // Dynamic import with cache busting
      const fileUrl = pathToFileURL(configLoaderPath).href;
      const timestamp = Date.now();
      const freshUrl = `${fileUrl}?t=${timestamp}`;
      
      const module = await import(freshUrl);
      const getConfig = module.default || module.getConfig;
      
      if (typeof getConfig !== 'function') {
        throw new Error('config_loader.js does not export getConfig function');
      }

      const config = await getConfig();
      console.log('✅ Loaded config from server.config.js');
      return config;

    } catch (error) {
      console.error('❌ Failed to load config:', error.message);
      console.warn('⚠️ Using default configuration');
      return this.getDefaultConfig();
    }
  }

  /**
   * Default config when nothing else works
   */
  getDefaultConfig() {
    return {
      email: {
        driver: 'log',
        email_from: 'noreply@example.com',
        email_from_name: 'System'
      },
      brand: {
        name: 'Our Service',
        support_email: 'support@example.com'
      }
    };
  }

  async createDriver() {
    if (!this.config || !this.config.email) {
      console.warn('⚠️ No email config found, using LogDriver');
      return this.loadDriver('log');
    }

    const driverName = this.config.email.driver || 'log';
    console.log(`🚗 Using email driver: ${driverName}`);

    // Check if driver has required config
    if (driverName === 'resend' && !this.config.email.resend_api_key) {
      console.warn('⚠️ No Resend API key provided. Falling back to LogDriver.');
      return this.loadDriver('log');
    }

    if (driverName === 'sendgrid' && !this.config.email.sendgrid_api_key) {
      console.warn('⚠️ No SendGrid API key provided. Falling back to LogDriver.');
      return this.loadDriver('log');
    }

    if (driverName === 'smtp' && (!this.config.email.smtp_host || !this.config.email.smtp_user)) {
      console.warn('⚠️ Incomplete SMTP config. Falling back to LogDriver.');
      return this.loadDriver('log');
    }

    // Load the specific driver
    try {
      return await this.loadDriver(driverName);
    } catch (error) {
      console.warn(`⚠️ Failed to load driver "${driverName}":`, error.message);
      console.warn('⚠️ Falling back to LogDriver');
      return this.loadDriver('log');
    }
  }

  /**
   * Dynamically load only the needed driver
   */
  async loadDriver(driverName) {
    const driverMap = {
      'resend': './drivers/ResendDriver.js',
      'smtp': './drivers/SMTPDriver.js',
      'sendgrid': './drivers/SendGridDriver.js',
      'log': './drivers/LogDriver.js'
    };

    const driverPath = driverMap[driverName];
    
    if (!driverPath) {
      throw new Error(`Unknown driver: ${driverName}`);
    }

    try {
      // Dynamic import - only loads the needed driver
      const module = await import(driverPath);
      
      // Get driver class name (ResendDriver, SMTPDriver, etc.)
      const driverClassName = driverName.charAt(0).toUpperCase() + driverName.slice(1) + 'Driver';
      const DriverClass = module[driverClassName] || module.default;
      
      if (!DriverClass) {
        throw new Error(`Driver class not found in ${driverPath}`);
      }

      return new DriverClass(this.config?.email || {});
      
    } catch (error) {
      // If SendGrid driver fails (missing @sendgrid/mail), fall back to LogDriver
      if (driverName === 'sendgrid') {
        console.warn('⚠️ SendGrid driver not available. Install @sendgrid/mail if needed.');
        return this.loadDriver('log');
      }
      throw error;
    }
  }

  /**
   * Send email with flexible options
   * @param {Object} payload
   * @param {string|string[]} payload.to - Recipient(s)
   * @param {string} payload.subject - Email subject
   * @param {string} [payload.text] - Plain text content
   * @param {string} [payload.html] - HTML content
   * @param {string} [payload.template] - Template identifier (e.g., 'welcome/welcome')
   * @param {Object} [payload.templateData] - Data for template
   * @param {string[]} [payload.cc] - CC recipients
   * @param {string[]} [payload.bcc] - BCC recipients
   * @param {Object[]} [payload.attachments] - File attachments
   * @param {string} [payload.replyTo] - Reply-to address
   * @param {string} [payload.from] - From address (overrides config)
   * @param {string} [payload.fromName] - From name (overrides config)
   * @param {Object} [payload.metadata] - Additional metadata
   * @param {string} [payload.themeColor] - Primary color for templates
   * @param {Object} [payload.recipient] - Recipient info for templates
   * @returns {Promise} Send result
   */
  async send(payload) {
    if (!this.driver) await this.init();

    // Validate required fields
    if (!payload.to) throw new Error('"to" field is required');
    if (!payload.subject) throw new Error('"subject" field is required');

    let html = payload.html || '';
    let text = payload.text || '';
    let subject = payload.subject;

    // If using template, render it first
    if (payload.template) {
      const templateResult = await this.renderTemplate(payload.template, {
        data: payload.templateData || {},
        recipient: payload.recipient || {},
        brand: this.config?.brand || {},
        themeColor: payload.themeColor || '#667eea'
      });
      
      html = templateResult.html;
      text = templateResult.text;
      subject = templateResult.subject || subject;
    }
    
    // Ensure we have both html and text
    if (html && !text) {
      text = this.htmlToText(html);
    } else if (text && !html) {
      html = `<pre style="font-family: sans-serif; line-height: 1.5; white-space: pre-wrap;">${this.escapeHtml(text)}</pre>`;
    }

    // Apply base layout to raw content (unless it's already from a template)
    if (!payload.template || payload.template === 'simple') {
      const layoutResult = this.baseLayout.render({
        content: html,
        subject,
        brand: this.config?.brand || {},
        themeColor: payload.themeColor || '#667eea',
        recipient: payload.recipient || {}
      });
      
      html = layoutResult.html;
      text = layoutResult.text || text;
    }

    // Prepare email for driver
    const emailForDriver = {
      from: payload.from || this.config.email?.email_from || 'noreply@example.com',
      fromName: payload.fromName || this.config.email?.email_from_name || 'System',
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      cc: Array.isArray(payload.cc) ? payload.cc : (payload.cc ? [payload.cc] : []),
      bcc: Array.isArray(payload.bcc) ? payload.bcc : (payload.bcc ? [payload.bcc] : []),
      subject,
      text,
      html,
      attachments: payload.attachments || [],
      replyTo: payload.replyTo || this.config.brand?.support_email || this.config.email?.email_from,
      metadata: payload.metadata || {}
    };

    console.log(`📧 Sending email via ${this.getDriverName()} to ${emailForDriver.to}`);
    return this.driver.send(emailForDriver);
  }

  static async create(config = null) {
    const service = new MailService(config);
    await service.init();
    return service;
  }

  /**
   * Render a template (CLI-generated content template)
   */
  async renderTemplate(templateName, data) {
    console.log(`🎨 Rendering template: ${templateName}`);
    
    const contentTemplate = await this.loadContentTemplate(templateName);
    if (!contentTemplate) {
      console.warn(`⚠️ Template "${templateName}" not found, using simple layout`);
      const simple = new SimpleTemplate();
      return simple.render({
        html: '',
        text: '',
        subject: data.subject || 'No subject',
        brand: data.brand || {},
        themeColor: data.themeColor || '#667eea',
        recipient: data.recipient || {}
      });
    }

    // Get content from template
    const contentHtml = typeof contentTemplate.html === 'function' 
      ? contentTemplate.html({
          data: data.data || {},
          brand: data.brand || {},
          recipient: data.recipient || {}
        })
      : '';

    const contentText = typeof contentTemplate.text === 'function'
      ? contentTemplate.text({
          data: data.data || {},
          brand: data.brand || {},
          recipient: data.recipient || {}
        })
      : this.htmlToText(contentHtml);

    const templateSubject = typeof contentTemplate.subject === 'function'
      ? contentTemplate.subject({
          data: data.data || {},
          brand: data.brand || {},
          recipient: data.recipient || {}
        })
      : data.subject || 'No subject';

    // Apply base layout to content
    return this.baseLayout.render({
      content: contentHtml,
      subject: templateSubject,
      brand: data.brand || {},
      themeColor: data.themeColor || '#667eea',
      recipient: data.recipient || {}
    });
  }

  /**
   * Load content template from project directory
   */
  async loadContentTemplate(templateName) {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    // Parse template name (format: 'folder/file' or just 'file')
    let folderName, fileName;
    if (templateName.includes('/')) {
      [folderName, fileName] = templateName.split('/');
    } else {
      folderName = fileName = templateName.toLowerCase();
    }

    // Build path to custom template
    const templatePath = path.join(
      process.cwd(),
      'semantqQL',
      'mail',
      'templates',
      folderName,
      `${fileName}.js`
    );

    console.log(`🔍 Looking for template at: ${templatePath}`);

    if (!fs.existsSync(templatePath)) {
      console.log(`❌ Template not found at: ${templatePath}`);
      return null;
    }

    try {
      const fileUrl = pathToFileURL(templatePath).href;
      const module = await import(fileUrl);
      
      const template = module.default || module;
      
      if (!template || typeof template !== 'object') {
        throw new Error('Template must export an object');
      }

      console.log(`✅ Loaded template: ${templateName}`);
      this.templateCache.set(templateName, template);
      return template;
      
    } catch (error) {
      console.error(`❌ Failed to load template "${templateName}":`, error);
      return null;
    }
  }

  /**
   * Set a custom base layout
   */
  setBaseLayout(layout) {
    this.baseLayout = layout;
    return this;
  }

  /**
   * Utility: Convert HTML to plain text
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
   * Utility: Escape HTML
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

 getDriverName() {
  // Return the actual driver instance name, not just config
  if (this.driver && this.driver.constructor && this.driver.constructor.name) {
    // Extract driver name from class name (e.g., "ResendDriver" -> "resend")
    return this.driver.constructor.name.replace('Driver', '').toLowerCase();
  }
  // Fallback to config
  return this.config?.email?.driver || 'log';
}

isRealDriver() {
  const driver = this.getDriverName();
  return driver !== 'log' && driver !== 'test';
}


}