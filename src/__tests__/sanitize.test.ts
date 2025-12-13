import { describe, it, expect } from '@jest/globals';
import { sanitizePaymentError } from '@/lib/common/sanitize';

describe('sanitizePaymentError', () => {
  it('should return generic message if no error provided', () => {
    const result = sanitizePaymentError();
    expect(result).toBe('Payment failed');
  });

  it('should map card_declined error code correctly', () => {
    const result = sanitizePaymentError('Your card was declined', 'card_declined');
    expect(result).toBe('Card was declined');
  });

  it('should map insufficient_funds error code correctly', () => {
    const result = sanitizePaymentError('Insufficient funds', 'insufficient_funds');
    expect(result).toBe('Insufficient funds');
  });

  it('should map incorrect_cvc error code correctly', () => {
    const result = sanitizePaymentError('Incorrect CVC', 'incorrect_cvc');
    expect(result).toBe('Incorrect security code');
  });

  it('should map expired_card error code correctly', () => {
    const result = sanitizePaymentError('Card expired', 'expired_card');
    expect(result).toBe('Card has expired');
  });

  it('should sanitize message containing "card" and "decline"', () => {
    const result = sanitizePaymentError('Your card was declined by the bank');
    expect(result).toBe('Card was declined');
  });

  it('should sanitize message containing "insufficient"', () => {
    const result = sanitizePaymentError('Insufficient balance in account');
    expect(result).toBe('Insufficient funds');
  });

  it('should sanitize message containing "expired"', () => {
    const result = sanitizePaymentError('Your payment card has expired');
    expect(result).toBe('Card has expired');
  });

  it('should sanitize message containing "cvc"', () => {
    const result = sanitizePaymentError('Invalid CVC number provided');
    expect(result).toBe('Incorrect security code');
  });

  it('should return generic safe message for unknown errors', () => {
    const result = sanitizePaymentError('Some internal stripe error XYZ123');
    expect(result).toBe('Payment failed. Please try again or use a different payment method.');
  });

  it('should not leak sensitive technical details', () => {
    const result = sanitizePaymentError('Database connection failed at 192.168.1.1:5432');
    expect(result).not.toContain('192.168.1.1');
    expect(result).not.toContain('5432');
    expect(result).toBe('Payment failed. Please try again or use a different payment method.');
  });

  it('should handle empty string', () => {
    const result = sanitizePaymentError('');
    expect(result).toBe('Payment failed');
  });

  it('should prioritize error code over message patterns', () => {
    const result = sanitizePaymentError('Card has expired', 'card_declined');
    expect(result).toBe('Card was declined'); // Uses error code mapping
  });
});
