# tray-it — Email Integration Setup Guide

## Overview

tray-it now supports **real email sending** for:
- ✅ OTP verification during sign-in
- ✅ Order confirmation emails
- ✅ Payment receipt emails

All emails are sent using [EmailJS](https://www.emailjs.com/), a client-side email service that doesn't require a backend server.

---

## Quick Start

### 1. Create an EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month on free tier)
3. Verify your email address

### 2. Add an Email Service

1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Connect your email account
5. Note your **Service ID** (e.g., `service_abc123`)

### 3. Create an Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Use the following template:

```html
Subject: {{subject}}

Hello {{to_name}},

{{message}}

---
This is an automated message from tray-it.
```

4. In the template settings, set these variables:
   - `to_email` - Recipient email
   - `to_name` - Recipient name
   - `subject` - Email subject
   - `message` - Email body
   - `otp_code` - OTP code (for OTP emails)
   - `order_id` - Order ID (for order emails)
   - `items` - Order items (for order emails)
   - `total` - Order total (for order emails)
   - `counter` - Canteen counter (for order emails)
   - `pickup_code` - Pickup code (for order emails)
   - `amount` - Payment amount (for receipt emails)
   - `method` - Payment method (for receipt emails)
   - `reference` - Transaction reference (for receipt emails)

5. Note your **Template ID** (e.g., `template_xyz789`)

### 4. Get Your Public Key

1. Go to **Account** > **API Keys**
2. Copy your **Public Key** (e.g., `user_abc123def456`)

### 5. Configure tray-it

1. Open tray-it in your browser
2. Sign in (or create an account)
3. Go to **Agent Hub** > **Account & consent**
4. Scroll to **Email Configuration**
5. Enter your:
   - Service ID
   - Template ID
   - Public Key
6. Click **Save Configuration**

That's it! Now tray-it will send real emails for OTP, order confirmations, and payment receipts.

---

## How It Works

### OTP Email Flow

1. User enters email, phone, and name during sign-in
2. System generates a 6-digit OTP code
3. EmailJS sends the OTP to the user's email
4. User enters the OTP to verify their account
5. Account is created with email + phone

### Order Confirmation Email Flow

1. User places an order
2. System creates the order in the database
3. EmailJS sends a confirmation email with:
   - Order ID
   - Items ordered
   - Total amount
   - Counter location
   - Pickup code
4. User receives email confirmation

### Payment Receipt Email Flow

1. Payment is captured successfully
2. EmailJS sends a receipt email with:
   - Order ID
   - Payment amount
   - Payment method
   - Transaction reference
3. User receives payment receipt

---

## Template Examples

### OTP Email Template

```
Subject: Your tray-it OTP Code

Hello {{to_name}},

Your OTP code is: {{otp_code}}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

---
tray-it — Your intelligent campus dining agent
```

### Order Confirmation Template

```
Subject: Order #{{order_id}} Confirmed

Hello {{to_name}},

Your order has been confirmed!

Order ID: #{{order_id}}
Items: {{items}}
Total: {{total}}
Counter: {{counter}}
Pickup Code: {{pickup_code}}

Show this code at the counter to collect your order.

Thank you for ordering with tray-it!

---
tray-it — Your intelligent campus dining agent
```

### Payment Receipt Template

```
Subject: Payment Receipt - Order #{{order_id}}

Hello {{to_name}},

Payment received successfully!

Order: #{{order_id}}
Amount: {{amount}}
Method: {{method}}
Reference: {{reference}}

Thank you for your payment!

---
tray-it — Your intelligent campus dining agent
```

---

## Demo Mode

If EmailJS is not configured, tray-it will run in **demo mode**:
- OTP codes are shown in the UI (yellow box)
- No real emails are sent
- All other functionality works normally

You'll see a log entry: `Email not configured - using demo mode`

---

## Troubleshooting

### Emails not sending?

1. Check that all three credentials are saved correctly
2. Verify your EmailJS account is active
3. Check the browser console for errors
4. Verify your email template variables match the ones listed above

### "Email not configured" message?

1. Go to **Agent Hub** > **Account & consent**
2. Scroll to **Email Configuration**
3. Enter your Service ID, Template ID, and Public Key
4. Click **Save Configuration**

### OTP not arriving?

1. Check your spam/junk folder
2. Verify the email address is correct
3. Check EmailJS dashboard for delivery status
4. Ensure your email service is connected and active

---

## Privacy & Security

- EmailJS sends emails directly from the browser (no backend required)
- Your EmailJS credentials are stored in the browser's memory only
- Credentials are not persisted to localStorage
- Each session requires re-configuration (for security)
- EmailJS has rate limits to prevent abuse

---

## EmailJS Pricing

- **Free tier**: 200 emails/month
- **Personal**: $10/month for 1,000 emails
- **Professional**: $25/month for 5,000 emails
- **Enterprise**: Custom pricing

For most demo/testing purposes, the free tier is sufficient.

---

## Support

For EmailJS support: [https://support.emailjs.com/](https://support.emailjs.com/)

For tray-it issues: Check the browser console and agent activity log.

---

## Example Configuration

Here's a complete example of what your configuration should look like:

```
Service ID: service_abc123
Template ID: template_xyz789
Public Key: user_abc123def456
```

After saving, you'll see a "✓ Saved!" confirmation, and emails will start sending automatically.

---

## Next Steps

Once email is configured:
1. Test sign-in with your email
2. Place a test order
3. Verify you receive the confirmation email
4. Complete payment and check for the receipt email

All email activity is logged in the **Agent activity** tab for debugging.
