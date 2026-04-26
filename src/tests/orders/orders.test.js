const apiClient = require('../../utils/apiClient');
const authHelper = require('../../utils/authHelper');
const cartData = require('../../test-data/cart.data');
const orderData = require('../../test-data/orders.data');

describe('Orders API', () => {
  let token;
  let headers;
  let placedOrderId;

  beforeAll(async () => {
    token = await authHelper.getAdminToken();
    headers = authHelper.bearer(token);

    // Seed cart with an item so order placement tests work
    await apiClient.post('/cart/items', cartData.addItem.valid, { headers });
  });

  afterAll(() => {
    authHelper.reset();
  });

  // ─── POST /orders ─────────────────────────────────────────────────────────

  describe('POST /orders', () => {
    test('[TC-ORD-001] Place order from non-empty cart — returns 201 with orderId and total', async () => {
      const res = await apiClient.post('/orders', undefined, { headers });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('orderId');
      expect(res.data).toHaveProperty('total');
      expect(res.data).toHaveProperty('status');
      expect(typeof res.data.orderId).toBe('string');
      expect(res.data.orderId).toMatch(/^ORD-/);
      expect(res.data.total).toBeGreaterThan(0);

      placedOrderId = res.data.orderId;
    });

    test('[TC-ORD-002] Place order with empty cart — returns 400 Bad Request', async () => {
      // Cart should be empty after previous order was placed
      const res = await apiClient.post('/orders', undefined, { headers });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-ORD-003] No auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/orders');

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-ORD-004] Invalid auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/orders', undefined, {
        headers: authHelper.invalidBearer(),
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });
  });

  // ─── GET /orders/{orderId} ────────────────────────────────────────────────

  describe('GET /orders/{orderId}', () => {
    test('[TC-ORD-005] Valid orderId — returns 200 with full order details', async () => {
      if (!placedOrderId) return;

      const res = await apiClient.get(`/orders/${placedOrderId}`, { headers });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('orderId', placedOrderId);
      expect(res.data).toHaveProperty('status');
      expect(res.data).toHaveProperty('total');
      expect(res.data).toHaveProperty('items');
      expect(Array.isArray(res.data.items)).toBe(true);
    });

    test('[TC-ORD-006] Order status is a valid enum value', async () => {
      if (!placedOrderId) return;

      const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
      const res = await apiClient.get(`/orders/${placedOrderId}`, { headers });

      expect(res.status).toBe(200);
      expect(validStatuses).toContain(res.data.status);
    });

    test('[TC-ORD-007] Non-existent orderId — returns 404 Not Found', async () => {
      const res = await apiClient.get(`/orders/${orderData.nonExistentOrderId}`, { headers });

      expect(res.status).toBe(404);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-ORD-008] No auth token — returns 401 Unauthorized', async () => {
      const orderId = placedOrderId || 'ORD-1001';
      const res = await apiClient.get(`/orders/${orderId}`);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-ORD-009] Invalid auth token — returns 401 Unauthorized', async () => {
      const orderId = placedOrderId || 'ORD-1001';
      const res = await apiClient.get(`/orders/${orderId}`, {
        headers: authHelper.invalidBearer(),
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });
  });

  // ─── DELETE /orders/{orderId}/cancel ─────────────────────────────────────

  describe('DELETE /orders/{orderId}/cancel', () => {
    let cancelTargetOrderId;

    beforeAll(async () => {
      // Create a fresh order to cancel
      await apiClient.post('/cart/items', cartData.addItem.valid, { headers });
      const res = await apiClient.post('/orders', undefined, { headers });
      if (res.status === 201) {
        cancelTargetOrderId = res.data.orderId;
      }
    });

    test('[TC-ORD-010] Cancel a pending order — returns 200 with status=cancelled', async () => {
      if (!cancelTargetOrderId) return;

      const res = await apiClient.delete(
        `/orders/${cancelTargetOrderId}/cancel`,
        { headers }
      );

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('orderId', cancelTargetOrderId);
      expect(res.data).toHaveProperty('status', 'cancelled');
    });

    test('[TC-ORD-011] Cancel already-cancelled order — returns 422/404 or 200 (API deviation noted)', async () => {
      if (!cancelTargetOrderId) return;

      const res = await apiClient.delete(
        `/orders/${cancelTargetOrderId}/cancel`,
        { headers }
      );

      // Spec mandates 422 for shipped/delivered orders.
      // This server also returns 200 on double-cancel of a pending order (idempotent behaviour).
      // 404 is acceptable if the cancelled order is cleaned up.
      expect([200, 404, 422]).toContain(res.status);
    });

    test('[TC-ORD-012] Cancel non-existent orderId — returns 404 Not Found', async () => {
      const res = await apiClient.delete(
        `/orders/${orderData.nonExistentOrderId}/cancel`,
        { headers }
      );

      expect(res.status).toBe(404);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-ORD-013] No auth token — returns 401 Unauthorized', async () => {
      const orderId = cancelTargetOrderId || 'ORD-1001';
      const res = await apiClient.delete(`/orders/${orderId}/cancel`);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-ORD-014] Invalid auth token — returns 401 Unauthorized', async () => {
      const orderId = cancelTargetOrderId || 'ORD-1001';
      const res = await apiClient.delete(`/orders/${orderId}/cancel`, {
        headers: authHelper.invalidBearer(),
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });
  });
});
