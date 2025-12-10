// @semantq/mail/lib/MailService.js - FIXED WITH RECIPIENT HANDLING

import { BaseLayout } from './templates/BaseLayout.js';
import { SimpleTemplate } from './templates/simple.js';
import { pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

export class MailService {
  constructor(config = null) {
    this.config = config || null;
    this.driver = null;
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

  // Helper to check if we should log
  shouldLog() {
    return this.config?.email?.debug !== false;
  }

  async loadConfig() {
    try {
      const baseDir = process.cwd();
      
      // Check if we're already in semantqQL directory
      const isInSemantqQL = baseDir.endsWith('semantqQL') || 
                           fs.existsSync(path.join(baseDir, 'config_loader.js'));
      
      let configLoaderPath;
      
      if (isInSemantqQL) {
        // We're already in semantqQL directory
        configLoaderPath = path.join(baseDir, 'config_loader.js');
      } else {
        // We're at project root, need to go into semantqQL
        configLoaderPath = path.join(baseDir, 'semantqQL', 'config_loader.js');
      }
      
      if (this.shouldLog()) {
        //console.log(`Looking for config at: ${configLoaderPath}`);
      }
      
      if (!fs.existsSync(configLoaderPath)) {
        if (this.shouldLog()) {
          console.log('Using default email config');
        }
        return this.getDefaultConfig();
      }

      const fileUrl = pathToFileURL(configLoaderPath).href;
      const timestamp = Date.now();
      const freshUrl = `${fileUrl}?t=${timestamp}`;
      
      const module = await import(freshUrl);
      const getConfig = module.default || module.getConfig;
      
      if (typeof getConfig !== 'function') {
        throw new Error('config_loader.js does not export getConfig function');
      }

      const config = await getConfig();
      if (this.shouldLog()) {
       // console.log('Config loaded');
      }
      return config;

    } catch (error) {
      if (this.shouldLog()) {
        console.log(`Using default config: ${error.message}`);
      }
      return this.getDefaultConfig();
    }
  }

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
      if (this.shouldLog()) {
        console.log('No email config found, using LogDriver');
      }
      return this.loadDriver('log');
    }

    const driverName = this.config.email.driver || 'log';
    if (this.shouldLog()) {
      console.log(`Using email driver: ${driverName}`);
    }

    // Check if driver has required config
    if (driverName === 'resend' && !this.config.email.resend_api_key) {
      if (this.shouldLog()) {
        console.log('No Resend API key provided. Falling back to LogDriver.');
      }
      return this.loadDriver('log');
    }

    if (driverName === 'sendgrid' && !this.config.email.sendgrid_api_key) {
      if (this.shouldLog()) {
        console.log('No SendGrid API key provided. Falling back to LogDriver.');
      }
      return this.loadDriver('log');
    }

    if (driverName === 'smtp' && (!this.config.email.smtp_host || !this.config.email.smtp_user)) {
      if (this.shouldLog()) {
        console.log('Incomplete SMTP config. Falling back to LogDriver.');
      }
      return this.loadDriver('log');
    }

    try {
      return await this.loadDriver(driverName);
    } catch (error) {
      if (this.shouldLog()) {
        console.log(`Failed to load driver "${driverName}": ${error.message}`);
        console.log('Falling back to LogDriver');
      }
      return this.loadDriver('log');
    }
  }

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
      const module = await import(driverPath);
      const driverClassName = driverName.charAt(0).toUpperCase() + driverName.slice(1) + 'Driver';
      const DriverClass = module[driverClassName] || module.default;
      
      if (!DriverClass) {
        throw new Error(`Driver class not found in ${driverPath}`);
      }

      return new DriverClass(this.config?.email || {});
      
    } catch (error) {
      if (driverName === 'sendgrid') {
        if (this.shouldLog()) {
          console.log('SendGrid driver not available. Install @sendgrid/mail if needed.');
        }
        return this.loadDriver('log');
      }
      throw error;
    }
  }

  /**
   * Send email with new payload structure
   */
  async send(payload) {
    if (!this.driver) await this.init();

    // Validate required fields
    if (!payload.recipients) throw new Error('"recipients" field is required');
    if (!payload.subject) throw new Error('"subject" field is required');
    if (!payload.template) throw new Error('"template" field is required');

    // Ensure recipients is array
    const recipients = Array.isArray(payload.recipients) 
      ? payload.recipients 
      : [payload.recipients];

    let html = '';
    let text = '';
    let finalSubject = payload.subject;

    // Store payload content BEFORE template rendering
    const payloadText = payload.text;
    const payloadHtml = payload.html;
    const payloadBody = payload.body;

    // Determine recipient info
    let recipientInfo = { email: recipients[0] };
    
    // Check if payload has recipient info
    if (payload.recipient) {
      if (typeof payload.recipient === 'object') {
        recipientInfo = { 
          ...payload.recipient, 
          email: payload.recipient.email || recipients[0] 
        };
      } else if (typeof payload.recipient === 'string') {
        recipientInfo.name = payload.recipient;
      }
    }

    // Render template if provided
    if (payload.template) {
      const templateResult = await this.renderTemplate(payload.template, {
        data: payload.templateData || {},
        recipient: recipientInfo,
        brand: this.config?.brand || {}
      });
      
      html = templateResult.html;
      text = templateResult.text;
      finalSubject = templateResult.subject || finalSubject;
    }
    
    // CRITICAL FIX: Apply content overrides - payload content OVERRIDES template content
    // Use payload content if provided (overrides template)
    if (payloadText) {
      text = payloadText;
    }
    
    if (payloadHtml) {
      html = payloadHtml;
    }
    
    if (payloadBody) {
      html = payloadBody;
      if (!text && !payloadBody.includes('<')) {
        text = payloadBody;
      }
    }

    // If we have text but no html, convert text to html
    if (text && !html) {
      html = `<p>${this.escapeHtml(text)}</p>`;
    }

    // Ensure we have content
    if (!html && !text) {
      throw new Error('Email must have content (provide html, text, or body)');
    }

    // Apply base layout - PASS ALL CONTENT PARAMETERS INCLUDING RECIPIENT
    const layoutResult = this.baseLayout.render({
      text: text,                    // Pass text content
      html: html,                    // Pass html content
      body: payloadBody,             // Pass body if exists
      subject: finalSubject,
      brand: this.config?.brand || {},
      recipient: recipientInfo,      // Pass recipient info (with name if provided)
      templateData: payload.templateData || {}
    });

    html = layoutResult.html;
    text = layoutResult.text || text;

    // Prepare for driver
    const emailForDriver = {
      from: payload.from || this.config.email?.email_from || 'noreply@example.com',
      fromName: payload.fromName || this.config.email?.email_from_name || 'System',
      to: recipients,
      cc: Array.isArray(payload.cc) ? payload.cc : (payload.cc ? [payload.cc] : []),
      bcc: Array.isArray(payload.bcc) ? payload.bcc : (payload.bcc ? [payload.bcc] : []),
      subject: finalSubject,
      text,
      html,
      attachments: payload.attachments || [],
      replyTo: payload.replyTo || this.config.brand?.support_email || this.config.email?.email_from
    };

    if (this.shouldLog()) {
      console.log(`Sending email via ${this.getDriverName()} to ${recipients}`);
    }
    
    return this.driver.send(emailForDriver);
  }

  static async create(config = null) {
    const service = new MailService(config);
    await service.init();
    return service;
  }

  /**
   * Render a template
   */
  async renderTemplate(templateName, context) {
    if (this.shouldLog()) {
      console.log(`Rendering template: ${templateName}`);
    }
    
    const contentTemplate = await this.loadContentTemplate(templateName);
    if (!contentTemplate) {
      if (this.shouldLog()) {
        console.log(`Template "${templateName}" not found, using simple layout`);
      }
      const simple = new SimpleTemplate();
      return simple.render({
        html: '',
        text: '',
        subject: 'No subject',
        brand: context.brand || {},
        recipient: context.recipient || {}
      });
    }

    // Get content from template
    const contentHtml = typeof contentTemplate.html === 'function' 
      ? contentTemplate.html(context)
      : '';

    const contentText = typeof contentTemplate.text === 'function'
      ? contentTemplate.text(context)
      : this.htmlToText(contentHtml);

    const templateSubject = typeof contentTemplate.subject === 'function'
      ? contentTemplate.subject(context)
      : context.data?.subject || 'No subject';

    // Apply base layout to content
    return this.baseLayout.render({
      content: contentHtml,
      subject: templateSubject,
      brand: context.brand || {},
      recipient: context.recipient || {},
      themeColor: context.data?.themeColor || '#007bff'
    });
  }

  async loadContentTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
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
    
    // Check if we're already in semantqQL directory
    const isInSemantqQL = baseDir.endsWith('semantqQL') || 
                         fs.existsSync(path.join(baseDir, 'mail', 'templates'));
    
    let templatesBaseDir = baseDir;
    
    if (!isInSemantqQL) {
      // We're at project root, need to go into semantqQL
      templatesBaseDir = path.join(baseDir, 'semantqQL');
    }
    
    const templatePath = path.join(
      templatesBaseDir,
      'mail',
      'templates',
      folderName,
      `${fileName}.js`
    );

    if (this.shouldLog()) {
      console.log(`Looking for template at: ${templatePath}`);
    }

    if (!fs.existsSync(templatePath)) {
      if (this.shouldLog()) {
        console.log(`Template not found at: ${templatePath}`);
      }
      return null;
    }

    try {
      const fileUrl = pathToFileURL(templatePath).href;
      const module = await import(fileUrl);
      const template = module.default || module;
      
      if (!template || typeof template !== 'object') {
        throw new Error('Template must export an object');
      }

      if (this.shouldLog()) {
        console.log(`Loaded template: ${templateName}`);
      }
      this.templateCache.set(templateName, template);
      return template;
      
    } catch (error) {
      if (this.shouldLog()) {
        console.log(`Failed to load template "${templateName}": ${error.message}`);
      }
      return null;
    }
  }

  simpleBodyToHtml(body) {
    return `<pre style="font-family: sans-serif; line-height: 1.5; white-space: pre-wrap;">${this.escapeHtml(body)}</pre>`;
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