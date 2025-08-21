import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'stg.violin@gmail.com',
        pass: process.env.SMTP_PASS || 'mwgf havu awnz tqpe',
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM || 'stg.violin@gmail.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(to: string, name: string, role: string): Promise<void> {
    const subject = 'Welcome to Rise Up Creators!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF3C2A;">Welcome to Rise Up Creators!</h1>
        <p>Hi ${name},</p>
        <p>Welcome to Rise Up Creators, the platform that empowers ${role === 'artist' ? 'music creators' : 'music fans'}!</p>
        ${role === 'artist' 
          ? '<p>As an artist, you can now upload your music, connect with fans, and monetize your content through subscriptions, merchandise, and events.</p>'
          : '<p>As a fan, you can discover new music, support your favorite artists, and get access to exclusive content.</p>'
        }
        <p>Get started by exploring the platform and setting up your profile.</p>
        <p>Best regards,<br>The Rise Up Creators Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const subject = 'Reset Your Password - Rise Up Creators';
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF3C2A;">Reset Your Password</h1>
        <p>You requested to reset your password for your Rise Up Creators account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(90deg, #FF3C2A, #7A0C0C); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Rise Up Creators Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendOrderConfirmationEmail(to: string, orderDetails: any): Promise<void> {
    const subject = `Order Confirmation - ${orderDetails.orderNumber}`;
    
    const itemsHtml = orderDetails.items.map((item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF3C2A;">Order Confirmation</h1>
        <p>Thank you for your purchase! Your order has been confirmed.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order Number:</strong> ${orderDetails.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(orderDetails.createdAt).toLocaleDateString()}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 16px;">
          <p><strong>Subtotal: $${orderDetails.totals.subtotal.toFixed(2)}</strong></p>
          <p><strong>Shipping: $${orderDetails.totals.shipping.toFixed(2)}</strong></p>
          <p><strong>Total: $${orderDetails.totals.total.toFixed(2)}</strong></p>
        </div>
        
        ${orderDetails.shipping ? `
          <h3>Shipping Address</h3>
          <p>
            ${orderDetails.shipping.address.fullName}<br>
            ${orderDetails.shipping.address.addressLine1}<br>
            ${orderDetails.shipping.address.addressLine2 ? orderDetails.shipping.address.addressLine2 + '<br>' : ''}
            ${orderDetails.shipping.address.city}, ${orderDetails.shipping.address.state} ${orderDetails.shipping.address.postalCode}<br>
            ${orderDetails.shipping.address.country}
          </p>
        ` : ''}
        
        <p>You will receive another email with tracking information once your order ships.</p>
        <p>Best regards,<br>The Rise Up Creators Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendTicketEmail(to: string, ticketDetails: any, qrCodeUrl: string): Promise<void> {
    const subject = `Your Ticket - ${ticketDetails.eventTitle}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF3C2A;">Your Event Ticket</h1>
        <p>Your ticket for ${ticketDetails.eventTitle} is ready!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h2 style="margin-top: 0;">${ticketDetails.eventTitle}</h2>
          <p><strong>Date:</strong> ${new Date(ticketDetails.dateTime).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(ticketDetails.dateTime).toLocaleTimeString()}</p>
          <p><strong>Venue:</strong> ${ticketDetails.venue.name}</p>
          <p><strong>Ticket Type:</strong> ${ticketDetails.ticketType}</p>
          <p><strong>Ticket Number:</strong> ${ticketDetails.ticketNumber}</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 200px;">
            <p style="font-size: 12px; color: #666;">Present this QR code at the venue</p>
          </div>
        </div>
        
        <p><strong>Important:</strong> Please save this email or take a screenshot of the QR code. You'll need to present it at the venue for entry.</p>
        
        <p>We look forward to seeing you at the event!</p>
        <p>Best regards,<br>The Rise Up Creators Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendNewFollowerNotification(to: string, followerName: string, artistName: string): Promise<void> {
    const subject = 'New Follower on Rise Up Creators';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF3C2A;">New Follower!</h1>
        <p>Great news! ${followerName} started following ${artistName} on Rise Up Creators.</p>
        <p>Keep creating amazing content to engage with your growing fanbase!</p>
        <p>Best regards,<br>The Rise Up Creators Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }

  async sendSubscriptionConfirmation(to: string, subscriptionDetails: any): Promise<void> {
    const subject = `Subscription Confirmed - ${subscriptionDetails.artistName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF3C2A;">Subscription Confirmed!</h1>
        <p>You've successfully subscribed to ${subscriptionDetails.artistName}!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h3>Subscription Details</h3>
          <p><strong>Artist:</strong> ${subscriptionDetails.artistName}</p>
          <p><strong>Tier:</strong> ${subscriptionDetails.tier.name}</p>
          <p><strong>Price:</strong> $${subscriptionDetails.tier.price}/${subscriptionDetails.tier.interval}</p>
          <p><strong>Next Billing Date:</strong> ${new Date(subscriptionDetails.nextBillDate).toLocaleDateString()}</p>
        </div>
        
        <p>You now have access to exclusive content and perks from ${subscriptionDetails.artistName}!</p>
        <p>Best regards,<br>The Rise Up Creators Team</p>
      </div>
    `;

    await this.sendEmail({ to, subject, html });
  }
}

export const emailService = new EmailService();
