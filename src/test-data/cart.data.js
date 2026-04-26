module.exports = {
  addItem: {
    valid: { productId: 1, quantity: 2 },
    anotherItem: { productId: 2, quantity: 1 },
    minQuantity: { productId: 1, quantity: 1 },
    zeroQuantity: { productId: 1, quantity: 0 },
    negativeQuantity: { productId: 1, quantity: -1 },
    missingProductId: { quantity: 2 },
    missingQuantity: { productId: 1 },
    invalidProductId: { productId: 999999, quantity: 1 },
    emptyBody: {},
  },
  removeItemId: {
    valid: 1,
    nonExistent: 999999,
  },
};
