module.exports = {
  methods: ['credit_card', 'debit_card', 'upi', 'net_banking'],

  buildPayment: (orderId, method = 'credit_card') => ({ orderId, method }),

  invalid: {
    missingMethod: (orderId) => ({ orderId }),
    missingOrderId: { method: 'credit_card' },
    badOrderId: { orderId: 'ORD-INVALID-99999', method: 'credit_card' },
    badMethod: (orderId) => ({ orderId, method: 'cash_on_delivery' }),
    emptyBody: {},
  },

  nonExistentPaymentId: 'PAY-INVALID-99999',
};
