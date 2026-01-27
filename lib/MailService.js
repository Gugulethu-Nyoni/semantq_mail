// @semantq/mail/lib/MailService.js - DEBUG VERSION
import { BaseLayout } from './templates/BaseLayout.js';
import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

export class MailService {
  constructor(config = null) {
    this.config = config || null;
    this.driver = null;
    this.templateCache = new Map();
    this.baseLayout = new BaseLayout();
    this.requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    console.log(`📧 [MailService ${this.requestId}] Constructor initialized`);
    this.sentRegistry = new Set();
  }

  async init() {
    console.log(`📧 [MailService ${this.requestId}] init() called`);
    if (!this.config) {
      console.log(`📧 [MailService ${this.requestId}] Loading config...`);
      this.config = await this.loadConfig();
      console.log(`📧 [MailService ${this.requestId}] Config loaded:`, {
        driver: this.config?.email?.driver,
        from: this.config?.email?.email_from,
        fromName: this.config?.email?.email_from_name
      });
    }
    
    if (!this.driver) {
      console.log(`📧 [MailService ${this.requestId}] Creating driver...`);
      this.driver = await this.createDriver();
      console.log(`📧 [MailService ${this.requestId}] Driver created: ${this.getDriverName()}`);
    }
    
    return this;
  }

  // Helper to check if we should log
  shouldLog() {
    return this.config?.email?.debug !== false;
  }

  async loadConfig() {
    console.log(`📧 [MailService ${this.requestId}] loadConfig() called`);
    try {
      const baseDir = process.cwd();
      console.log(`📧 [MailService ${this.requestId}] Current directory: ${baseDir}`);
      
      // Check if we're already in semantqQL directory
      const isInSemantqQL = baseDir.endsWith('semantqQL') || 
                           fs.existsSync(path.join(baseDir, 'config_loader.js'));
      console.log(`📧 [MailService ${this.requestId}] Is in semantqQL: ${isInSemantqQL}`);
      
      let configLoaderPath;
      
      if (isInSemantqQL) {
        configLoaderPath = path.join(baseDir, 'config_loader.js');
      } else {
        configLoaderPath = path.join(baseDir, 'semantqQL', 'config_loader.js');
      }
      
      console.log(`📧 [MailService ${this.requestId}] Config loader path: ${configLoaderPath}`);
      
      if (!fs.existsSync(configLoaderPath)) {
        console.log(`📧 [MailService ${this.requestId}] Config file not found, using default`);
        return this.getDefaultConfig();
      }

      const fileUrl = pathToFileURL(configLoaderPath).href;
      const timestamp = Date.now();
      const freshUrl = `${fileUrl}?t=${timestamp}`;
      
      console.log(`📧 [MailService ${this.requestId}] Importing config from: ${freshUrl}`);
      const module = await import(freshUrl);
      const getConfig = module.default || module.getConfig;
      
      if (typeof getConfig !== 'function') {
        throw new Error('config_loader.js does not export getConfig function');
      }

      const config = await getConfig();
      console.log(`📧 [MailService ${this.requestId}] Config loaded successfully`);
      return config;

    } catch (error) {
      console.log(`📧 [MailService ${this.requestId}] Error loading config: ${error.message}`);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    console.log(`📧 [MailService ${this.requestId}] Returning default config`);
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
    console.log(`📧 [MailService ${this.requestId}] createDriver() called`);
    if (!this.config || !this.config.email) {
      console.log(`📧 [MailService ${this.requestId}] No email config found, using LogDriver`);
      return this.loadDriver('log');
    }

    const driverName = this.config.email.driver || 'log';
    console.log(`📧 [MailService ${this.requestId}] Driver name from config: ${driverName}`);
    
    // Check if driver has required config
    if (driverName === 'resend' && !this.config.email.resend_api_key) {
      console.log(`📧 [MailService ${this.requestId}] No Resend API key provided. Falling back to LogDriver.`);
      return this.loadDriver('log');
    }

    if (driverName === 'sendgrid' && !this.config.email.sendgrid_api_key) {
      console.log(`📧 [MailService ${this.requestId}] No SendGrid API key provided. Falling back to LogDriver.`);
      return this.loadDriver('log');
    }

    if (driverName === 'smtp' && (!this.config.email.smtp_host || !this.config.email.smtp_user)) {
      console.log(`📧 [MailService ${this.requestId}] Incomplete SMTP config. Falling back to LogDriver.`);
      return this.loadDriver('log');
    }

    try {
      console.log(`📧 [MailService ${this.requestId}] Loading driver: ${driverName}`);
      return await this.loadDriver(driverName);
    } catch (error) {
      console.log(`📧 [MailService ${this.requestId}] Failed to load driver "${driverName}": ${error.message}`);
      console.log(`📧 [MailService ${this.requestId}] Falling back to LogDriver`);
      return this.loadDriver('log');
    }
  }

  async loadDriver(driverName) {
    console.log(`📧 [MailService ${this.requestId}] loadDriver(${driverName}) called`);
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
      console.log(`📧 [MailService ${this.requestId}] Importing driver from: ${driverPath}`);
      const module = await import(driverPath);
      const driverClassName = driverName.charAt(0).toUpperCase() + driverName.slice(1) + 'Driver';
      console.log(`📧 [MailService ${this.requestId}] Looking for driver class: ${driverClassName}`);
      const DriverClass = module[driverClassName] || module.default;
      
      if (!DriverClass) {
        throw new Error(`Driver class not found in ${driverPath}`);
      }

      console.log(`📧 [MailService ${this.requestId}] Creating driver instance with config`);
      return new DriverClass(this.config?.email || {});
      
    } catch (error) {
      if (driverName === 'sendgrid') {
        console.log(`📧 [MailService ${this.requestId}] SendGrid driver not available. Install @sendgrid/mail if needed.`);
        return this.loadDriver('log');
      }
      throw error;
    }
  }

  /**
   * Send email with new payload structure - DEBUG VERSION
   */
  /**
   * Send email with new payload structure - DEBUG VERSION WITH DUPLICATE GUARD
   */
  async send(payload) {
    const orderId = payload.order || 'NO_ORDER';
    const firstRecipient = Array.isArray(payload.recipients) ? payload.recipients[0] : payload.recipients;
    
    // Create a unique fingerprint: OrderID + Recipient + Subject (to differentiate Admin vs Customer)
    const fingerprint = `idx:${orderId}:${firstRecipient}:${payload.subject}`.toLowerCase();

    console.log(`\n📧 [MailService ${this.requestId}] ======= START send() =======`);
    
    // --- DUPLICATE GUARD BLOCK ---
    if (this.sentRegistry && this.sentRegistry.has(fingerprint)) {
      console.warn(`🛑 [MailService ${this.requestId}] DUPLICATE PREVENTED: Fingerprint ${fingerprint} already processed.`);
      return { 
        success: true, 
        duplicate: true, 
        message: 'Email already sent in this session for this order/recipient combo.' 
      };
    }

    // Register the fingerprint immediately (before async operations)
    if (this.sentRegistry) {
      this.sentRegistry.add(fingerprint);
      // Optional: Clear after 10 mins to prevent memory leak but keep protection for the "race window"
      setTimeout(() => this.sentRegistry.delete(fingerprint), 10 * 60 * 1000);
    }
    // -----------------------------

    console.log(`📧 [MailService ${this.requestId}] Received payload:`, JSON.stringify({
      order: payload.order,
      recipients: payload.recipients,
      subject: payload.subject,
      template: payload.template,
      hasRecipientObject: !!payload.recipient,
      hasHtml: !!payload.html,
      hasBody: !!payload.body,
      cc: payload.cc,
      bcc: payload.bcc,
      attachmentsCount: payload.attachments?.length || 0
    }, null, 2));
    
    if (!this.driver) {
      console.log(`📧 [MailService ${this.requestId}] Driver not initialized, calling init()`);
      await this.init();
    }

    // Validate required fields
    if (!payload.recipients) {
      console.error(`📧 [MailService ${this.requestId}] ERROR: "recipients" field is required`);
      throw new Error('"recipients" field is required');
    }
    if (!payload.subject && !payload.template) {
      console.error(`📧 [MailService ${this.requestId}] ERROR: Subject or Template is required`);
      throw new Error('Subject or Template is required');
    }

    console.log(`📧 [MailService ${this.requestId}] Step 1: Normalizing recipients`);
    const recipients = Array.isArray(payload.recipients) 
      ? payload.recipients 
      : [payload.recipients];
    console.log(`📧 [MailService ${this.requestId}] Normalized recipients:`, recipients);

    console.log(`📧 [MailService ${this.requestId}] Step 2: Determining recipient info`);
    let recipientInfo = { email: recipients[0] };
    console.log(`📧 [MailService ${this.requestId}] Initial recipientInfo:`, recipientInfo);
    
    if (payload.recipient) {
      console.log(`📧 [MailService ${this.requestId}] payload.recipient exists:`, payload.recipient);
      if (typeof payload.recipient === 'object') {
        recipientInfo = { 
          ...payload.recipient, 
          email: recipients[0] 
        };
        console.log(`📧 [MailService ${this.requestId}] Updated recipientInfo (email overwritten):`, recipientInfo);
      } else if (typeof payload.recipient === 'string') {
        recipientInfo.name = payload.recipient;
        console.log(`📧 [MailService ${this.requestId}] Updated recipientInfo (string name):`, recipientInfo);
      }
    }

    console.log(`📧 [MailService ${this.requestId}] Step 3: Getting template content`);
    let templateHtml = '';
    let templateText = '';
    let templateSubject = payload.subject;
    
    if (payload.template) {
      console.log(`📧 [MailService ${this.requestId}] Template specified: ${payload.template}`);
      const templateResult = await this.renderTemplate(payload.template, {
        data: payload.templateData || {},
        recipient: recipientInfo,
        brand: this.config?.brand || {}
      });
      
      templateHtml = templateResult.html;
      templateText = templateResult.text;
      templateSubject = templateResult.subject || payload.subject;
      console.log(`📧 [MailService ${this.requestId}] Template loaded:`, {
        hasHtml: !!templateHtml,
        hasText: !!templateText,
        subject: templateSubject
      });
    }

    console.log(`📧 [MailService ${this.requestId}] Step 4: Applying content priority`);
    let html = payload.html || payload.body || templateHtml;
    let text = payload.text || (payload.body && !payload.body.includes('<') ? payload.body : '') || templateText;
    let finalSubject = payload.subject || templateSubject;
    
    console.log(`📧 [MailService ${this.requestId}] Content selection:`, {
      payloadHtml: !!payload.html,
      payloadBody: !!payload.body,
      templateHtml: !!templateHtml,
      selectedHtml: !!html,
      selectedText: !!text,
      finalSubject: finalSubject
    });

    if (text && !html) {
      console.log(`📧 [MailService ${this.requestId}] Converting text to HTML`);
      html = `<p>${this.escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
    }

    if (!html && !text) {
      console.log(`📧 [MailService ${this.requestId}] No content provided, using default`);
      html = '<p>No content provided.</p>';
      text = 'No content provided.';
    }

    console.log(`📧 [MailService ${this.requestId}] Step 5: Applying base layout`);
    const layoutResult = this.baseLayout.render({
      text: text,
      html: html,
      subject: finalSubject,
      brand: this.config?.brand || {},
      recipient: recipientInfo,
      templateData: payload.templateData || {}
    });

    console.log(`📧 [MailService ${this.requestId}] Step 6: Preparing for driver`);
    const emailForDriver = {
      from: payload.from || this.config.email?.email_from || 'noreply@example.com',
      fromName: payload.fromName || this.config.email?.email_from_name || 'System',
      to: recipients, 
      cc: Array.isArray(payload.cc) ? payload.cc : (payload.cc ? [payload.cc] : []),
      bcc: Array.isArray(payload.bcc) ? payload.bcc : (payload.bcc ? [payload.bcc] : []),
      subject: finalSubject,
      text: layoutResult.text,
      html: layoutResult.html,
      attachments: payload.attachments || [],
      replyTo: payload.replyTo || this.config.brand?.support_email || this.config.email?.email_from
    };

    console.log(`📧 [MailService ${this.requestId}] Sending via ${this.getDriverName()} to:`, recipients.join(', '));
    
    try {
      const result = await this.driver.send(emailForDriver);
      console.log(`📧 [MailService ${this.requestId}] Driver.send() completed:`, result);
      console.log(`📧 [MailService ${this.requestId}] ======= END send() =======\n`);
      return result;
    } catch (error) {
      // On failure, we remove the fingerprint so we can retry the send
      if (this.sentRegistry) this.sentRegistry.delete(fingerprint);
      console.error(`📧 [MailService ${this.requestId}] Driver.send() failed:`, error.message);
      throw error;
    }
  }




  static async create(config = null) {
    console.log(`📧 [MailService] Static create() called`);
    const service = new MailService(config);
    await service.init();
    return service;
  }

  /**
   * Render a template
   */
  async renderTemplate(templateName, context) {
    console.log(`📧 [MailService ${this.requestId}] renderTemplate(${templateName}) called`);
    const contentTemplate = await this.loadContentTemplate(templateName);
    if (!contentTemplate) {
      console.log(`📧 [MailService ${this.requestId}] Template not found: ${templateName}`);
      return {
        html: '',
        text: '',
        subject: context.data?.subject || 'No subject'
      };
    }

    // Get content from template functions
    const contentHtml = typeof contentTemplate.html === 'function' 
      ? contentTemplate.html(context)
      : '';

    const contentText = typeof contentTemplate.text === 'function'
      ? contentTemplate.text(context)
      : this.htmlToText(contentHtml);

    const templateSubject = typeof contentTemplate.subject === 'function'
      ? contentTemplate.subject(context)
      : context.data?.subject || 'No subject';

    console.log(`📧 [MailService ${this.requestId}] Template rendered:`, {
      hasHtml: !!contentHtml,
      hasText: !!contentText,
      subject: templateSubject
    });

    // Return RAW template content (not wrapped in layout)
    return {
      html: contentHtml,
      text: contentText,
      subject: templateSubject
    };
  }

  async loadContentTemplate(templateName) {
    console.log(`📧 [MailService ${this.requestId}] loadContentTemplate(${templateName}) called`);
    if (this.templateCache.has(templateName)) {
      console.log(`📧 [MailService ${this.requestId}] Template found in cache: ${templateName}`);
      return this.templateCache.get(templateName);
    }

    let folderName, fileName;
    if (templateName.includes('/')) {
      [folderName, fileName] = templateName.split('/');
    } else {
      folderName = fileName = templateName.toLowerCase();
    }

    // Handle both project root and semantqQL directory
    const baseDir = process.cwd();
    const isInSemantqQL = baseDir.endsWith('semantqQL') || 
                         fs.existsSync(path.join(baseDir, 'mail', 'templates'));
    
    let templatesBaseDir = baseDir;
    if (!isInSemantqQL) {
      templatesBaseDir = path.join(baseDir, 'semantqQL');
    }
    
    const templatePath = path.join(
      templatesBaseDir,
      'mail',
      'templates',
      folderName,
      `${fileName}.js`
    );

    console.log(`📧 [MailService ${this.requestId}] Looking for template at: ${templatePath}`);
    
    if (!fs.existsSync(templatePath)) {
      console.log(`📧 [MailService ${this.requestId}] Template file not found: ${templatePath}`);
      return null;
    }

    try {
      const fileUrl = pathToFileURL(templatePath).href;
      console.log(`📧 [MailService ${this.requestId}] Importing template from: ${fileUrl}`);
      const module = await import(fileUrl);
      const template = module.default || module;
      
      if (!template || typeof template !== 'object') {
        throw new Error('Template must export an object');
      }

      this.templateCache.set(templateName, template);
      console.log(`📧 [MailService ${this.requestId}] Template loaded and cached: ${templateName}`);
      return template;
      
    } catch (error) {
      console.log(`📧 [MailService ${this.requestId}] Failed to load template "${templateName}": ${error.message}`);
      return null;
    }
  }

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
    if (this.driver && this.driver.constructor && this.driver.constructor.name) {
      return this.driver.constructor.name.replace('Driver', '').toLowerCase();
    }
    return this.config?.email?.driver || 'log';
  }

  isRealDriver() {
    const driver = this.getDriverName();
    return driver !== 'log' && driver !== 'test';
  }
}