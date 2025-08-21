import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface OrderOptions {
  amount: number; // amount in paise (INR)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  partialPayment?: boolean;
}

export interface SubscriptionOptions {
  planId: string;
  totalCount?: number;
  quantity?: number;
  startAt?: number;
  expireBy?: number;
  addons?: Array<{
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }>;
  notes?: Record<string, string>;
  notifyInfo?: {
    notifyEmail?: string;
    notifyPhone?: string;
  };
}

export interface PaymentLinkOptions {
  amount: number;
  currency?: string;
  description: string;
  customer?: {
    name: string;
    email: string;
    contact?: string;
  };
  notify?: {
    sms?: boolean;
    email?: boolean;
  };
  reminderEnable?: boolean;
  notes?: Record<string, string>;
  callbackUrl?: string;
  callbackMethod?: string;
}

class RazorpayService {
  /**
   * Create an order for one-time payments
   */
  async createOrder(options: OrderOptions): Promise<any> {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(options.amount * 100), // Convert to paise
        currency: options.currency || 'INR',
        receipt: options.receipt || `order_${Date.now()}`,
        notes: options.notes || {},
        partial_payment: options.partialPayment || false,
      });

      return order;
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(data: {
    name: string;
    email: string;
    contact?: string;
    failExisting?: boolean;
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      const customer = await razorpay.customers.create({
        name: data.name,
        email: data.email,
        contact: data.contact,
        fail_existing: data.failExisting || false,
        notes: data.notes || {},
      });

      return customer;
    } catch (error) {
      console.error('Razorpay create customer error:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Create a subscription plan
   */
  async createPlan(data: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      description?: string;
      amount: number;
      currency: string;
    };
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      const plan = await razorpay.plans.create({
        period: data.period,
        interval: data.interval,
        item: {
          name: data.item.name,
          description: data.item.description,
          amount: Math.round(data.item.amount * 100), // Convert to paise
          currency: data.item.currency,
        },
        notes: data.notes || {},
      });

      return plan;
    } catch (error) {
      console.error('Razorpay create plan error:', error);
      throw new Error('Failed to create subscription plan');
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(
    customerId: string,
    options: SubscriptionOptions
  ): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: options.planId,
        customer_id: customerId,
        total_count: options.totalCount,
        quantity: options.quantity || 1,
        start_at: options.startAt,
        expire_by: options.expireBy,
        addons: options.addons,
        notes: options.notes || {},
        notify_info: options.notifyInfo,
      });

      return subscription;
    } catch (error) {
      console.error('Razorpay create subscription error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = false
  ): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.cancel(subscriptionId, {
        cancel_at_cycle_end: cancelAtCycleEnd,
      });

      return subscription;
    } catch (error) {
      console.error('Razorpay cancel subscription error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Create a payment link
   */
  async createPaymentLink(options: PaymentLinkOptions): Promise<any> {
    try {
      const paymentLink = await razorpay.paymentLink.create({
        amount: Math.round(options.amount * 100), // Convert to paise
        currency: options.currency || 'INR',
        description: options.description,
        customer: options.customer,
        notify: options.notify || { sms: true, email: true },
        reminder_enable: options.reminderEnable !== false,
        notes: options.notes || {},
        callback_url: options.callbackUrl,
        callback_method: options.callbackMethod || 'get',
      });

      return paymentLink;
    } catch (error) {
      console.error('Razorpay create payment link error:', error);
      throw new Error('Failed to create payment link');
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Razorpay verify signature error:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Razorpay verify webhook signature error:', error);
      return false;
    }
  }

  /**
   * Fetch payment details
   */
  async getPayment(paymentId: string): Promise<any> {
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Razorpay get payment error:', error);
      throw new Error('Failed to fetch payment details');
    }
  }

  /**
   * Fetch order details
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      const order = await razorpay.orders.fetch(orderId);
      return order;
    } catch (error) {
      console.error('Razorpay get order error:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  /**
   * Fetch subscription details
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Razorpay get subscription error:', error);
      throw new Error('Failed to fetch subscription details');
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentId: string,
    options: {
      amount?: number;
      speed?: 'normal' | 'optimum';
      notes?: Record<string, string>;
      receipt?: string;
    } = {}
  ): Promise<any> {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: options.amount ? Math.round(options.amount * 100) : undefined,
        speed: options.speed || 'normal',
        notes: options.notes || {},
        receipt: options.receipt,
      });

      return refund;
    } catch (error) {
      console.error('Razorpay create refund error:', error);
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Fetch refund details
   */
  async getRefund(paymentId: string, refundId: string): Promise<any> {
    try {
      const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
      return refund;
    } catch (error) {
      console.error('Razorpay get refund error:', error);
      throw new Error('Failed to fetch refund details');
    }
  }

  /**
   * Create a QR code for payments
   */
  async createQRCode(options: {
    type: 'upi_qr' | 'bharat_qr';
    name: string;
    usage: 'single_use' | 'multiple_use';
    amount?: number;
    description?: string;
    image?: string;
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      const qrCode = await razorpay.qrCode.create({
        type: options.type,
        name: options.name,
        usage: options.usage,
        amount: options.amount ? Math.round(options.amount * 100) : undefined,
        description: options.description,
        image: options.image,
        notes: options.notes || {},
      });

      return qrCode;
    } catch (error) {
      console.error('Razorpay create QR code error:', error);
      throw new Error('Failed to create QR code');
    }
  }

  /**
   * Get settlement details
   */
  async getSettlements(options: {
    from?: number;
    to?: number;
    count?: number;
    skip?: number;
  } = {}): Promise<any> {
    try {
      const settlements = await razorpay.settlements.all(options);
      return settlements;
    } catch (error) {
      console.error('Razorpay get settlements error:', error);
      throw new Error('Failed to fetch settlements');
    }
  }

  /**
   * Create a virtual account
   */
  async createVirtualAccount(options: {
    receivers: {
      types: Array<'bank_account' | 'vpa'>;
    };
    description?: string;
    customer_id?: string;
    notes?: Record<string, string>;
  }): Promise<any> {
    try {
      const virtualAccount = await razorpay.virtualAccounts.create({
        receivers: options.receivers,
        description: options.description,
        customer_id: options.customer_id,
        notes: options.notes || {},
      });

      return virtualAccount;
    } catch (error) {
      console.error('Razorpay create virtual account error:', error);
      throw new Error('Failed to create virtual account');
    }
  }
}

export const razorpayService = new RazorpayService();
export default razorpayService;
