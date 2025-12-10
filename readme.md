# @semantq/mail

**Lightweight, Auto-Configuring Email Service for semantq full stack (semantqQL) Projects**

Effortlessly send emails from your semantqQL applications with zero boilerplate. Auto-configures from your existing `server.config.js`, providing both simple and advanced APIs.


## Quick Start

### Installation
```bash
npm install @semantq/mail
```

### Send Your First Email (15 seconds)
```javascript
import { sendEmail } from '@semantq/mail';

// Send plain text email
await sendEmail('user@example.com', 'Welcome to our platform!');

// Use built-in template
await sendEmail('user@example.com', 'welcome', {
  name: 'John Doe',
  confirmationUrl: 'https://app.com/confirm/123'
});
```


## Features


✔ Zero Configuration - Auto-detects your existing `server.config.js`

✔ Simple & Advanced APIs - Choose your level of complexity

✔ Multiple Drivers - Resend, SendGrid, SMTP, and Log (development)

✔ Built-in Templates - Professionally designed templates included

✔ Environment Aware - Development mode prevents accidental sends

✔ Auto-Fallback - Falls back to environment variables if config not found


##  API Reference

### Simple API (`sendEmail`)

Perfect for quick email sending:

```javascript
import { sendEmail } from '@semantq/mail';

// Send plain text
await sendEmail('user@example.com', 'Your order has shipped!');

// Use template with data
await sendEmail('user@example.com', 'welcome', {
  name: 'Sarah',
  confirmationUrl: 'https://...',
  nextSteps: ['Complete profile', 'Invite team members']
});

// Multiple recipients
await sendEmail(['user1@example.com', 'user2@example.com'], 'Meeting reminder');
```

### Advanced API (`MailService`)

Full control when you need it:

```javascript
import { MailService } from '@semantq/mail';

const mail = new MailService();

await mail.send({
  // Recipients
  to: ['user1@example.com', 'user2@example.com'],
  cc: ['manager@example.com'],
  bcc: ['archive@example.com'],
  
  // Content
  subject: 'Quarterly Report Available',
  template: 'notification',
  templateData: {
    title: 'Q4 Report Published',
    message: 'The quarterly financial report is now available for review.',
    actionUrl: 'https://app.com/reports/q4',
    actionText: 'View Report'
  },
  
  // Attachments
  attachments: [
    {
      filename: 'report.pdf',
      content: base64String, // Base64 encoded file
      contentType: 'application/pdf'
    }
  ],
  
  // Metadata
  metadata: {
    userId: '123',
    campaign: 'quarterly-reports'
  }
});
```



## ⚙️ Configuration

### Option 1: Use Existing `server.config.js` (Recommended)

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

### Option 2: Environment Variables Only

If no `server.config.js` is found, falls back to environment variables:

```bash
# Required for Resend
EMAIL_DRIVER=resend
RESEND_API_KEY=re_xxxxxxxxxx

# Required for SendGrid
EMAIL_DRIVER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxx

# Required for SMTP
EMAIL_DRIVER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional defaults
EMAIL_FROM=noreply@example.com
EMAIL_FROM_NAME="Your App Name"
BRAND_NAME="Your App"
BRAND_SUPPORT_EMAIL=support@example.com
```

## Built-in Templates

### 1. **Welcome Template** (`'welcome'`)
Perfect for onboarding emails.

```javascript
await sendEmail('user@example.com', 'welcome', {
  name: 'John Doe',
  confirmationUrl: 'https://app.com/confirm/123',
  nextSteps: [
    'Complete your profile',
    'Add team members',
    'Explore tutorials'
  ]
});
```

### 2. **Notification Template** (`'notification'`)
General purpose notifications with action buttons.

```javascript
await sendEmail('user@example.com', 'notification', {
  title: 'Document Approved',
  message: 'Your proposal has been reviewed and approved by the committee.',
  actionUrl: 'https://app.com/documents/456',
  actionText: 'View Document',
  details: 'Please review the feedback and proceed with next steps.'
});
```

### 3. **Simple Template** (`'simple'`)
Plain text emails with minimal styling.

```javascript
await sendEmail('user@example.com', 'simple', {
  message: 'Your password has been changed successfully.\n\nIf you did not make this change, please contact support immediately.',
  subject: 'Password Changed'
});
```

## Drivers

### Resend Driver (Default)
Uses [Resend.com](https://resend.com) API. Fast, reliable, great deliverability.

```javascript
// Configuration
email: {
  driver: 'resend',
  resend_api_key: 're_xxxxxxxxxx'
}
```

### SMTP Driver
Traditional SMTP for any email server.

```javascript
// Configuration
email: {
  driver: 'smtp',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: 'your-email@gmail.com',
  smtp_pass: 'your-app-password'
}
```

### SendGrid Driver
Uses [SendGrid](https://sendgrid.com) API.

```javascript
// Configuration
email: {
  driver: 'sendgrid',
  sendgrid_api_key: 'SG.xxxxxxxxxx'
}
```

### Log Driver (Development)
Logs emails to console instead of sending. Perfect for development.

```javascript
// Configuration
email: {
  driver: 'log' // Default in development
}
```


## Creating Custom Templates

### Method 1: JavaScript Template Class

Create `templates/custom-template.js` in your project:

```javascript
import BaseTemplate from '@semantq/mail/lib/templates/BaseTemplate.js';

export default class CustomTemplate extends BaseTemplate {
  render(data) {
    const name = this.escapeHtml(data.name);
    
    return {
      html: `<h1>Hello ${name}!</h1><p>${data.message}</p>`,
      text: `Hello ${name}!\n\n${data.message}`,
      subject: data.subject || 'Custom Email'
    };
  }
}

// Usage
await sendEmail('user@example.com', 'custom-template', {
  name: 'John',
  message: 'This is a custom template!'
});
```

### Method 2: Template Files (Future)
*Planned feature: Support for `.ejs`, `.hbs`, `.mjml` template files.*


## Advanced Usage

### Custom Configuration
```javascript
import { MailService } from '@semantq/mail';

// Pass custom config (overrides auto-detected)
const mail = new MailService({
  email: {
    driver: 'smtp',
    smtp_host: 'custom.smtp.com',
    // ...
  }
});
```

### Check Configuration
```javascript
import { MailService } from '@semantq/mail';

const mail = new MailService();
console.log('Driver:', mail.getDriverName()); // 'resend'
console.log('Config:', mail.getConfig()); // Full config object
```

### Template Existence Check
```javascript
import { MailService } from '@semantq/mail';

const mail = new MailService();
console.log(mail.templateExists('welcome')); // true
console.log(mail.templateExists('custom')); // false (unless you created it)
```



## Error Handling

```javascript
import { sendEmail } from '@semantq/mail';

try {
  const result = await sendEmail('user@example.com', 'welcome', {
    name: 'John'
  });
  
  console.log('Email sent:', result.messageId);
} catch (error) {
  console.error('Failed to send email:', error.message);
  
  // Check error types
  if (error.message.includes('API key')) {
    // Handle missing credentials
  } else if (error.message.includes('template')) {
    // Handle missing template
  } else {
    // Handle other errors
  }
}
```


## Development & Testing

### Development Mode
In development (`NODE_ENV=development`), the LogDriver is used by default:

```bash
NODE_ENV=development npm run dev
```

Emails are logged to console and HTML is saved to `.email-previews/` directory.

### Testing
```javascript
// In your tests
import { MailService } from '@semantq/mail';

// Mock configuration for tests
const testMail = new MailService({
  email: { driver: 'log' }
});

// Assert email would be sent
const result = await testMail.send({
  to: 'test@example.com',
  subject: 'Test',
  text: 'Test message'
});

expect(result.success).toBe(true);
expect(result.driver).toBe('log');
```


## Integration with SemantQ CLI

### Generate Custom Email Service
```bash
# Create a custom email service
semantq make:mail Welcome

# With custom methods
semantq make:mail Order --methods "sendConfirmation,sendShippingUpdate"

# Creates: services/WelcomeService.js
```

Generated service example:
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

## Driver Comparison

| Driver | Best For | Setup Complexity | Cost | Delivery Rate |
|--|-||||
| **Resend** | Modern apps, startups | Very Low | $$$ | Excellent |
| **SendGrid** | Enterprise, high volume | Low | $$$$ | Excellent |
| **SMTP** | Self-hosted, existing infra | Medium | $-$$ | Varies |
| **Log** | Development, testing | None | Free | N/A |


## Security Notes

1. **API Keys**: Never commit API keys to version control. Use environment variables.
2. **Rate Limiting**: Implement your own rate limiting for public endpoints.
3. **Input Validation**: Always validate user input before using in templates.
4. **BCC for Privacy**: Use BCC when sending to multiple recipients to protect privacy.


## Troubleshooting

### "Cannot find server.config.js"
The package searches in:
1. `./config/server.config.js`
2. `./semantqQL/config/server.config.js`
3. `../config/server.config.js`

Or set environment variables as fallback.

### "Driver not found"
Ensure driver name is one of: `resend`, `sendgrid`, `smtp`, `log`

### "Template not found"
Check template exists:
```javascript
const mail = new MailService();
console.log(mail.templateExists('template-name'));
```

### Emails not sending in production
1. Check `NODE_ENV` is not `development`
2. Verify API keys are set
3. Check driver configuration


## Performance Tips

1. **Reuse MailService instance** - Don't create new instance for each email
2. **Queue bulk sends** - Use `sendBulk` method for large volumes
3. **Cache templates** - Templates are automatically cached after first load
4. **Async processing** - Consider background jobs for non-critical emails



## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on GitHub.

### Development Setup
```bash
git clone https://github.com/semantq/mail.git
cd mail
npm install
npm test
```


## 📄License

MIT © semantqQL Team


## 🔗 Links

- [SemantQ Documentation](https://semantq.dev)
- [GitHub Repository](https://github.com/semantq/mail)
- [Report Issue](https://github.com/semantq/mail/issues)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)



**Enjoy sending emails with @semantq/mail