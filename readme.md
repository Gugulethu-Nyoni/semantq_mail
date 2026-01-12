# @semantq/mail

**Lightweight, Auto-Configuring Email Service for semantq full stack (semantqQL) Projects**

Effortlessly send emails from your semantqQL applications with zero boilerplate. Auto-configures from your existing `server.config.js`, providing both simple and advanced emailing sending APIs.

## Quick Start

### Installation
```bash
npm install @semantq/mail
```

### Configuration
Add email configuration to your existing `semantqQL/server.config.js`:

```javascript
export default {
  // ... your existing database, server config
  
  email: {
    driver: 'resend', // 'resend' | 'sendgrid' | 'smtp' | 'log'
    resend_api_key: process.env.RESEND_API_KEY,
    sendgrid_api_key: process.env.SENDGRID_API_KEY,
    email_from: process.env.EMAIL_FROM || 'noreply@example.com',
    email_from_name: process.env.EMAIL_FROM_NAME || 'Our Team'
  },
  
  brand: {
    name: process.env.BRAND_NAME || 'My App',
    support_email: process.env.BRAND_SUPPORT_EMAIL || 'support@example.com'
  }
};
```

## Complete Setup Guide

### 1. Generate Email Resources with CLI

Create a complete email service with one command:

```bash
# Generate Welcome email service
semantq make:mail Welcome

# Creates these files:
# - semantqQL/services/WelcomeService.js
# - semantqQL/mail/templates/welcome/welcome.js
# - semantqQL/mail/test-welcomeMail.js
```

### Quick Start: Where to Focus

**Focus on this file:** `semantqQL/mail/test-welcomeMail.js`

This is your starting template. Copy the email payload from here and customize it for your actual use case. The file contains complete examples for both basic and full-featured emails.

#### Basic Email Setup
```javascript
// In your actual application (anywhere in your codebase)
import welcomeMail from './services/WelcomeService.js'; // Adjust path as needed

const emailData = {
  recipients: ['user@example.com','anotherUser@example.com'], // Required: recipient emails
  subject: 'Basic Welcome Test',     // Required: email subject (customise)
  template: 'welcome/welcome',      // Required: template path (folder/filename) (leave as is)
  recipient: {                      // Optional: recipient details for personalization
    email: 'user@example.com',
    name: 'User Name'              // Shows as "Hi User Name,"
  },
  text: 'This is your email content.' // Content: Use text, html, OR body
};

await welcomeMail.sendWelcome(emailData);
```

#### Content Options (Use ONE of these):
```javascript
// 1. Plain text
text: 'Simple text message'

// 2. HTML content  
html: '<h2>Styled HTML</h2><p>With <strong>formatting</strong></p>'

// 3. Simple body (auto-detects HTML/text)
body: 'Can be plain text or HTML'
```

#### Full Featured Setup
```javascript
const fullOptions = {
  recipients: ['customer@example.com', 'backup@example.com'],
  subject: 'Complete Order Details',
  template: 'orders/confirmation',
  recipient: {
    email: 'customer@example.com',
    name: 'John Smith'
  },
  
  // Content options (choose one):
  text: 'Plain text content here',
  // OR html: '<p>HTML content here</p>',
  // OR body: 'Simple content here',
  
  // Optional features:
  cc: ['team@example.com'],
  bcc: ['analytics@example.com'],
  replyTo: 'support@example.com',
  from: 'noreply@example.com',
  fromName: 'Your Company',
  
  attachments: [
    {
      filename: 'invoice.pdf',
      content: 'base64String',
      contentType: 'application/pdf'
    }
  ],
  
  templateData: {          // Optional template variables
    themeColor: '#4CAF50', // Changes button colors
    orderNumber: '12345',
    orderDate: '2024-12-10'
  }
};
```

#### Important: Import Paths
The generated test script assumes you're running from `semantqQL` directory. If you're calling emails from elsewhere:

```javascript
// If running from project root:
import welcomeMail from './semantqQL/services/WelcomeService.js';

// If running from other directories:
import welcomeMail from '../services/WelcomeService.js';

// If your service is in a different location:
import welcomeMail from '../../path/to/services/WelcomeService.js';
```

**Pro Tip:** Test your import path by running the generated test script first:
```bash
cd semantqQL
node mail/test-welcomeMail.js
```

Once the test works, copy the payload structure to your actual application code.


### 2. Generated Files Structure

**A. Service File** (`semantqQL/services/WelcomeService.js`)
```javascript
import { MailService } from '@semantq/mail';

class WelcomeService {
  constructor() {
    this.mail = new MailService();
  }

  async sendWelcome(user, options = {}) {
    return this.mail.send({
      to: user.email,
      subject: `Welcome to ${this.mail.config.brand?.name}!`,
      template: 'welcome',
      templateData: { name: user.name, ...options }
    });
  }
}

export default new WelcomeService();
```

**B. Content Template** (`semantqQL/mail/templates/welcome/welcome.js`)
```javascript
// Welcome Email Template
// This template returns EMPTY content since content comes from payload

export default {
    subject: ({ data, brand }) => {
        return data.subject || `Message from ${brand?.name || 'Our Service'}`;
    },

    html: ({ data, recipient, brand }) => {
        // Content comes from payload (text, html, or body fields)
        return '';
    },

    text: ({ data, recipient, brand }) => {
        return '';
    }
};
```

**C. Test Script** (`semantqQL/mail/test-welcomeMail.js`)
```javascript
// test-welcomeMail.js
// Minimal test script for Welcome email service
// Run: cd semantqQL && node mail/test-welcomeMail.js

import welcomeMail from '../services/WelcomeService.js';

async function testWelcomeMailEmail() {
  
  try {
    // 1. Initialize service
    await welcomeMail.init();
    console.log('[STATUS] Service ready | Driver: ' + welcomeMail.mail?.getDriverName());

    // ============================================
    // CONFIGURATION: EDIT EMAIL ADDRESS BELOW
    // ============================================
    
    // BASIC EXAMPLE - Simple text email
    const emailData = {
      recipients: ['test@example.com'], // <--- Replace with your email
      subject: 'Basic Welcome Test',
      template: 'welcome/welcome',
      recipient: {
        email: 'test@example.com',
        name: 'Test User'
      },
      text: 'This is a test email from the Welcome service.'
    };
    
    // ============================================
    // CORE FUNCTION: DO NOT ALTER CORE CODE HERE
    // ============================================
    console.log('\n[SENDING] Dispatching email...');
    const result = await welcomeMail.sendWelcome(emailData);
    
    if (result.success) {
      console.log('[RESULT] Basic test: PASS');
    } else {
      console.log(`[RESULT] Basic test: FAILED TEST - ${result.message || 'Unknown Error'}`);
    }

    return result.success;

  } catch (error) {
    console.error('\n[ERROR] Setup/Runtime Failure:', error.message);
    return false;
  }
}

// Run test
testWelcomeMailEmail()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(() => {
    process.exit(1);
  });
```

### 3. Customizing Your Email Service

#### A. Update the Service Method
Edit `services/WelcomeService.js` to add custom logic:

```javascript
// Add custom methods
class WelcomeService {
  constructor() {
    this.mail = new MailService();
  }

  async sendWelcome(user) {
    return this.mail.send({
      recipients: [user.email],
      subject: `Welcome to ${this.mail.config.brand?.name}!`,
      template: 'welcome/welcome',
      recipient: {
        email: user.email,
        name: user.fullName
      },
      text: `Welcome ${user.fullName}! We're excited to have you on board.`
    });
  }

  async sendPasswordReset(user, resetUrl) {
    return this.mail.send({
      recipients: [user.email],
      subject: 'Reset Your Password',
      template: 'auth/password-reset',
      recipient: {
        email: user.email,
        name: user.firstName
      },
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
      `
    });
  }
}
```

#### B. Customize Content in Payload
Content comes from `text`, `html`, or `body` fields in your payload:

```javascript
// Plain text email
const emailData = {
  recipients: ['user@example.com'],
  subject: 'Basic Email',
  template: 'welcome/welcome',
  recipient: { email: 'user@example.com', name: 'John' },
  text: 'This is a plain text message.'
};

// HTML email
const emailData = {
  recipients: ['user@example.com'],
  subject: 'Styled Email',
  template: 'welcome/welcome',
  recipient: { email: 'user@example.com', name: 'John' },
  html: `
    <h2>Welcome John!</h2>
    <p>This is a custom HTML email with styling.</p>
    <a href="https://example.com" style="color: #007bff;">Visit Website</a>
  `
};

// Using templateData for additional variables
const emailData = {
  recipients: ['user@example.com'],
  subject: 'Order Confirmation',
  template: 'orders/confirmation',
  recipient: { email: 'user@example.com', name: 'John' },
  text: 'Your order #123 has been confirmed.',
  templateData: {
    orderNumber: '123',
    orderDate: '2024-12-10',
    themeColor: '#4CAF50' // Customizes button colors
  }
};
```

### 4. Email Payload Structure

#### Basic Email Payload
```javascript
{
  // REQUIRED fields
  recipients: ['user@example.com'],
  subject: 'Email Subject',
  template: 'template-name',
  
  // OPTIONAL content (use one)
  text: 'Plain text content',
  html: '<p>HTML content</p>',
  body: 'Simple text or HTML',
  
  // OPTIONAL recipient info
  recipient: {
    email: 'user@example.com',
    name: 'User Name'
  },
  
  // OPTIONAL template data
  templateData: {
    themeColor: '#007bff',
    customField: 'Any data'
  },
  
  // OPTIONAL email routing
  cc: ['team@example.com'],
  bcc: ['archive@example.com'],
  replyTo: 'support@example.com',
  from: 'noreply@example.com',
  fromName: 'Your Brand',
  
  // OPTIONAL attachments
  attachments: [
    {
      filename: 'document.pdf',
      content: 'base64String',
      contentType: 'application/pdf'
    }
  ]
}
```

#### Full Featured Example
```javascript
const fullOptions = {
  // REQUIRED: Core email fields
  recipients: ['customer@example.com', 'backup@example.com'],
  subject: 'Full Featured Email',
  template: 'template-name',
  
  // OPTIONAL: Content (use one or more)
  text: 'Plain text version of the email',
  html: '<p>HTML <strong>version</strong> of the email</p>',
  
  // OPTIONAL: Recipient info
  recipient: {
    email: 'customer@example.com',
    name: 'Customer Name'
  },
  
  // OPTIONAL: Email routing
  cc: ['team@example.com'],
  bcc: ['analytics@example.com'],
  replyTo: 'support@example.com',
  from: 'noreply@example.com',
  fromName: 'Your Team',
  
  // OPTIONAL: Attachments
  attachments: [
    {
      filename: 'test.txt',
      content: 'This is a test attachment',
      contentType: 'text/plain'
    }
  ],
  
  // OPTIONAL: Additional template data
  templateData: {
    features: ['Feature 1', 'Feature 2'],
    customField: 'Any data you need',
    themeColor: '#667eea'
  }
};
```

### 5. Running Your Email Tests

```bash
# Run the generated test script
cd semantqQL
node mail/test-welcomeMail.js

# Output:
# [STATUS] Service ready | Driver: resend
# [SENDING] Dispatching email...
# [RESULT] Basic test: PASS
```

### 6. Customizing Email Templates

#### Option A: Custom Content Template
Create a template that generates content:

```javascript
// semantqQL/mail/templates/welcome/custom-welcome.js
export default {
    subject: ({ data, brand }) => {
        return data.subject || `Welcome to ${brand?.name}`;
    },

    html: ({ data, recipient, brand }) => {
        const recipientName = recipient?.name || 'there';
        return `
<div>
    <h2>Welcome ${recipientName}!</h2>
    <p>Thank you for joining ${brand?.name}.</p>
    ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
</div>
        `;
    },

    text: ({ data, recipient, brand }) => {
        const recipientName = recipient?.name || 'there';
        return `Welcome ${recipientName}!\n\nThank you for joining ${brand?.name}.`;
    }
};

// Usage
const emailData = {
  recipients: ['user@example.com'],
  subject: 'Welcome',
  template: 'welcome/custom-welcome',
  recipient: { email: 'user@example.com', name: 'John' },
  templateData: {
    customMessage: 'Check out our getting started guide!'
  }
};
```

#### Option B: Use BaseLayout for Consistent Design
All emails use BaseLayout which provides:
- Clean, non-boxed design
- Responsive layout
- Brand header (optional)
- Footer with support info
- Automatic text version generation

Customize via `templateData.themeColor`:
```javascript
templateData: {
  themeColor: '#4CAF50' // Changes button and link colors
}
```

## API Reference

### MailService Class
```javascript
import { MailService } from '@semantq/mail';

const mail = new MailService();

// Send email
await mail.send({
  recipients: ['user@example.com'],
  subject: 'Test Email',
  template: 'template-name',
  text: 'Email content',
  recipient: { email: 'user@example.com', name: 'User Name' }
});

// Check driver
console.log(mail.getDriverName()); // 'resend', 'sendgrid', 'smtp', or 'log'

// Check if using real driver
console.log(mail.isRealDriver()); // true for resend/sendgrid/smtp, false for log
```

### Content Sources Priority
When sending emails, content is determined in this order:
1. `html` field in payload
2. `text` field in payload  
3. `body` field in payload
4. Template-generated content (if template provides it)
5. Fallback: "Your message here"

## Configuration Options

### Email Drivers
```javascript
// Resend (Recommended)
email: {
  driver: 'resend',
  resend_api_key: 're_xxxxxxxxxx',
  email_from: 'noreply@example.com',
  email_from_name: 'Your Brand'
}

// SendGrid
email: {
  driver: 'sendgrid',
  sendgrid_api_key: 'SG.xxxxxxxxxx'
}

// SMTP
email: {
  driver: 'smtp',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: 'user@gmail.com',
  smtp_pass: 'password'
}

// Log (Development)
email: {
  driver: 'log'
}
```

### Brand Configuration
```javascript
brand: {
  name: 'Your App Name',
  support_email: 'support@example.com'
}
```

## Troubleshooting

### Emails not sending
1. Check `server.config.js` has correct email configuration
2. Verify API keys are set (for Resend/SendGrid)
3. Check `NODE_ENV` is not forcing log driver
4. Run test script to verify connectivity

### Recipient name not showing
Ensure `recipient` field includes both email and name:
```javascript
recipient: {
  email: 'someuser@example.com',
  name: 'User Name'  // Required for personalized greeting
}
```

### Content not appearing
Content must come from `text`, `html`, or `body` fields:
```javascript
// WRONG - templateData.message won't show
templateData: { message: 'Hello' }

// CORRECT - use text, html, or body
text: 'Hello'  // or
html: '<p>Hello</p>'  // or  
body: 'Hello'
```

### Template not found
Check template path matches structure:
```javascript
// Template file: mail/templates/orders/confirmation.js
template: 'orders/confirmation'  // folder/filename (no .js)
```

## Best Practices

1. **Always include recipient name** for personalized emails
2. **Use test scripts** to verify email sending before production
3. **Keep templates simple** - content comes from payload
4. **Use environment variables** for API keys
5. **Test with log driver** during development
6. **Customize via templateData.themeColor** for brand consistency
7. **Note that @semantq/auth ships with its own email services**

## License

MIT © semantq Team

## Links

- [semantqQL Documentation](https://github.com/Gugulethu-Nyoni/semantqQL)
- [GitHub Repository](https://github.com/semantq/mail)
- [Report Issue](https://github.com/semantq/mail/issues)

To DO:
- Scafolding for adding additional drivers