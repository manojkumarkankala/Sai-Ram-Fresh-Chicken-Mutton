import { inr, ORDER_TYPE_LABELS, STATUS_LABELS } from './format';
import type { BusinessSettings, CartItem, Order } from './types';
import { itemAmount } from './format';

export function buildOrderMessage(
  orderNumber: string,
  customerName: string,
  items: CartItem[],
  subtotal: number,
  discount: number,
  deliveryCharge: number,
  total: number,
  address: string,
  preferredTime: string,
): string {
  const lines: string[] = [];
  lines.push('Hello Sai Ram Fresh Chicken & Mutton!');
  lines.push('');
  lines.push('I would like to place an order.');
  lines.push('');
  lines.push(`Order ID: ${orderNumber}`);
  lines.push(`Customer Name: ${customerName}`);
  lines.push('');
  lines.push('Products:');
  items.forEach((item, i) => {
    const qty = item.unit === 'kg'
      ? (item.quantity === 0.25 ? '250 G' : item.quantity === 0.5 ? '500 G' : item.quantity === 0.75 ? '750 G' : `${item.quantity} KG`)
      : `${item.quantity} PCS`;
    lines.push(`${i + 1}. ${item.name} - ${qty} - ${inr(itemAmount(item.unit, item.quantity, item.pricePerKg, item.pricePerPiece, item.discountPercent))}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${inr(subtotal)}`);
  if (discount > 0) lines.push(`Discount: -${inr(discount)}`);
  lines.push(`Delivery Charge: ${inr(deliveryCharge)}`);
  lines.push(`Total Amount: ${inr(total)}`);
  lines.push('');
  lines.push(`Delivery Address: ${address || 'Shop pickup'}`);
  if (preferredTime) lines.push(`Preferred Delivery Time: ${preferredTime}`);
  lines.push('');
  lines.push('Please confirm my order.');
  return lines.join('\n');
}

export function buildOrderMessageFromOrder(order: Order, business: BusinessSettings): string {
  const lines: string[] = [];
  lines.push(`Hello ${business.business_name}!`);
  lines.push('');
  lines.push(`Order ID: ${order.order_number}`);
  lines.push(`Customer Name: ${order.customer_name}`);
  lines.push('');
  lines.push('Products:');
  (order.order_items ?? []).forEach((item, i) => {
    lines.push(`${i + 1}. ${item.product_name} - ${item.quantity_label} - ${inr(item.amount)}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${inr(order.subtotal)}`);
  if (order.discount_amount > 0) lines.push(`Discount: -${inr(order.discount_amount)}`);
  lines.push(`Delivery Charge: ${inr(order.delivery_charge)}`);
  lines.push(`Total Amount: ${inr(order.total_amount)}`);
  lines.push('');
  lines.push(`Order Type: ${ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}`);
  lines.push(`Delivery Address: ${order.delivery_address || 'Shop pickup'}`);
  if (order.preferred_time) lines.push(`Preferred Delivery Time: ${order.preferred_time}`);
  lines.push('');
  lines.push(`Status: ${STATUS_LABELS[order.status]}`);
  lines.push('');
  lines.push('Please confirm my order.');
  return lines.join('\n');
}

export function buildInvoiceMessage(order: Order, business: BusinessSettings): string {
  const lines: string[] = [];
  lines.push(`*${business.business_name}*`);
  lines.push('INVOICE');
  lines.push(`Invoice Number: ${order.order_number}`);
  lines.push(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`);
  lines.push('');
  lines.push('Customer Details:');
  lines.push(`Name: ${order.customer_name}`);
  lines.push(`Mobile: ${order.phone}`);
  lines.push(`Address: ${order.delivery_address || 'Shop pickup'}`);
  lines.push('');
  lines.push('ITEMS');
  (order.order_items ?? []).forEach((item, i) => {
    lines.push(`${i + 1}. ${item.product_name} | ${item.quantity_label} | ${item.rate_label} | ${inr(item.amount)}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${inr(order.subtotal)}`);
  if (order.discount_amount > 0) lines.push(`Discount: -${inr(order.discount_amount)}`);
  lines.push(`Delivery Charge: ${inr(order.delivery_charge)}`);
  lines.push(`*GRAND TOTAL: ${inr(order.total_amount)}*`);
  lines.push(`Payment Status: ${order.payment_status === 'paid' ? 'Paid' : 'Pending'}`);
  lines.push('');
  lines.push(`Thank you for ordering with ${business.business_name}!`);
  return lines.join('\n');
}
