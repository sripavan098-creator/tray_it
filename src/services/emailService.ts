import emailjs from '@emailjs/browser';

// EmailJS Configuration
// Get your credentials from https://www.emailjs.com/
// Replace these with your actual EmailJS credentials
const EMAILJS_CONFIG = {
  serviceId: (window as any).__EMAILJS_SERVICE_ID__ || 'YOUR_SERVICE_ID',
  templateId: (window as any).__EMAILJS_TEMPLATE_ID__ || 'YOUR_TEMPLATE_ID',
  publicKey: (window as any).__EMAILJS_PUBLIC_KEY__ || 'YOUR_PUBLIC_KEY',
};

// Initialize EmailJS
export function initEmailJS() {
  if (EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
    return true;
  }
  return false;
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
  if (!initEmailJS()) {
    console.warn('EmailJS not configured. Using demo mode.');
    return false;
  }

  try {
    const templateParams = {
      to_email: email,
      to_name: name,
      otp_code: otp,
      app_name: 'tray-it',
      message: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    };

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderId: string,
  items: string[],
  total: number,
  counter: string,
  pickupCode: string
): Promise<boolean> {
  if (!initEmailJS()) {
    console.warn('EmailJS not configured.');
    return false;
  }

  try {
    const templateParams = {
      to_email: email,
      to_name: name,
      order_id: orderId,
      items: items.join(', '),
      total: `₹${total}`,
      counter: counter,
      pickup_code: pickupCode,
      app_name: 'tray-it',
      message: `Order #${orderId}\n\nItems: ${items.join(', ')}\nTotal: ₹${total}\nCounter: ${counter}\nPickup Code: ${pickupCode}\n\nThank you for ordering with tray-it!`,
    };

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

// Send payment receipt email
export async function sendPaymentReceiptEmail(
  email: string,
  name: string,
  orderId: string,
  amount: number,
  method: string,
  reference: string
): Promise<boolean> {
  if (!initEmailJS()) {
    console.warn('EmailJS not configured.');
    return false;
  }

  try {
    const templateParams = {
      to_email: email,
      to_name: name,
      order_id: orderId,
      amount: `₹${amount}`,
      method: method,
      reference: reference,
      app_name: 'tray-it',
      message: `Payment Receipt\n\nOrder: #${orderId}\nAmount: ₹${amount}\nMethod: ${method}\nReference: ${reference}\n\nThank you for your payment!`,
    };

    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    return true;
  } catch (error) {
    console.error('Failed to send payment receipt email:', error);
    return false;
  }
}

// Check if email is configured
export function isEmailConfigured(): boolean {
  return EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY' &&
         EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID' &&
         EMAILJS_CONFIG.templateId !== 'YOUR_TEMPLATE_ID';
}
