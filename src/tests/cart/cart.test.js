const apiClient = require('../../utils/apiClient');
const authHelper = require('../../utils/authHelper');
const cartData = require('../../test-data/cart.data');

describe('Cart API', () => {
  let token;
  let headers;

  beforeAll(async () => {
    token = await authHelper.getAdminToken();
    headers = authHelper.bearer(token);
  });

  afterAll(() => {
    authHelper.reset();
  });

  // ─── POST /cart/items ────────────────────────────────────────────────────────

  describe('POST /cart/items', () => {
    test('[TC-CART-001] Add valid item — returns 201 with cartTotal', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.valid, { headers });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('cartTotal');
      expect(typeof res.data.cartTotal).toBe('number');
      expect(res.data.cartTotal).toBeGreaterThan(0);
    });

    test('[TC-CART-002] Add another item — cartTotal increases', async () => {
      const before = await apiClient.get('/cart', { headers });
      const subtotalBefore = before.data.subtotal || 0;

      const res = await apiClient.post('/cart/items', cartData.addItem.anotherItem, { headers });

      expect(res.status).toBe(201);
      expect(res.data.cartTotal).toBeGreaterThanOrEqual(subtotalBefore);
    });

    test('[TC-CART-003] No auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.valid);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-004] Invalid auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.valid, {
        headers: authHelper.invalidBearer(),
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-005] Missing productId — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.missingProductId, {
        headers,
      });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-006] Missing quantity — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.missingQuantity, {
        headers,
      });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-007] Non-existent productId — returns 404 Not Found', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.invalidProductId, {
        headers,
      });

      expect(res.status).toBe(404);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-008] Zero quantity — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.zeroQuantity, { headers });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-009] Empty body — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/cart/items', cartData.addItem.emptyBody, { headers });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });
  });

  // ─── GET /cart ───────────────────────────────────────────────────────────────

  describe('GET /cart', () => {
    test('[TC-CART-010] View cart — returns 200 with items, subtotal, itemCount', async () => {
      const res = await apiClient.get('/cart', { headers });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('items');
      expect(res.data).toHaveProperty('subtotal');
      expect(res.data).toHaveProperty('itemCount');
      expect(Array.isArray(res.data.items)).toBe(true);
      expect(typeof res.data.subtotal).toBe('number');
      expect(Number.isInteger(res.data.itemCount)).toBe(true);
    });

    test('[TC-CART-011] Cart subtotal matches itemCount > 0 when items added', async () => {
      // Ensure at least one item in cart
      await apiClient.post('/cart/items', cartData.addItem.minQuantity, { headers });

      const res = await apiClient.get('/cart', { headers });
      expect(res.status).toBe(200);
      expect(res.data.itemCount).toBeGreaterThan(0);
      expect(res.data.subtotal).toBeGreaterThan(0);
    });

    test('[TC-CART-012] No auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.get('/cart');

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-013] Invalid auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.get('/cart', { headers: authHelper.invalidBearer() });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });
  });

  // ─── DELETE /cart/items/{itemId} ─────────────────────────────────────────────

  describe('DELETE /cart/items/{itemId}', () => {
    beforeAll(async () => {
      // Ensure the item to remove is in cart
      await apiClient.post('/cart/items', cartData.addItem.valid, { headers });
    });

    test('[TC-CART-014] Remove existing item — returns 200 with updated cartTotal', async () => {
      const res = await apiClient.delete(
        `/cart/items/${cartData.removeItemId.valid}`,
        { headers }
      );

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('message');
      expect(res.data).toHaveProperty('cartTotal');
    });

    test('[TC-CART-015] Remove non-existent item — returns 404 Not Found', async () => {
      const res = await apiClient.delete(
        `/cart/items/${cartData.removeItemId.nonExistent}`,
        { headers }
      );

      expect(res.status).toBe(404);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-016] No auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.delete(`/cart/items/${cartData.removeItemId.valid}`);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-CART-017] Invalid auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.delete(`/cart/items/${cartData.removeItemId.valid}`, {
        headers: authHelper.invalidBearer(),
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });
  });
});
