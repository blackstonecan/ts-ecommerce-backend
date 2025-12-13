/**
 * Sanitizes error messages to prevent sensitive information leakage
 */

const SAFE_ERROR_MESSAGES: { [key: string]: string } = {
    // Card errors
    'card_declined': 'Card was declined',
    'insufficient_funds': 'Insufficient funds',
    'incorrect_cvc': 'Incorrect security code',
    'expired_card': 'Card has expired',
    'processing_error': 'Payment processing error',
    'incorrect_number': 'Invalid card number',

    // Network/System errors
    'network_error': 'Network connection error',
    'api_error': 'Payment service error',
    'rate_limit': 'Too many requests',

    // Generic
    'generic_decline': 'Payment was declined'
};

/**
 * Sanitizes payment error messages to prevent leaking sensitive details
 * Maps detailed Stripe errors to safe, user-friendly messages
 */
export function sanitizePaymentError(errorMessage?: string, errorCode?: string): string {
    if (!errorMessage) {
        return 'Payment failed';
    }

    // If we have a known error code, use the safe message
    if (errorCode && SAFE_ERROR_MESSAGES[errorCode]) {
        return SAFE_ERROR_MESSAGES[errorCode];
    }

    // Check if message contains known patterns
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('card') && lowerMessage.includes('decline')) {
        return 'Card was declined';
    }

    if (lowerMessage.includes('insufficient')) {
        return 'Insufficient funds';
    }

    if (lowerMessage.includes('expired')) {
        return 'Card has expired';
    }

    if (lowerMessage.includes('cvc') || lowerMessage.includes('security code')) {
        return 'Incorrect security code';
    }

    // Default safe message for unknown errors
    return 'Payment failed. Please try again or use a different payment method.';
}
