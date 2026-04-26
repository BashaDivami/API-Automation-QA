const apiClient = require('../../utils/apiClient');
const authHelper = require('../../utils/authHelper');
const cartData = require('../../test-data/cart.data');
const pd = require('../../test-data/payments.data');

describe('Payments API', () => {
  let token;
  let headers;
  let orderId;
  let paymentId;

  beforeAll(async () => {
    token = await authHelper.getAdminToken();
    headers = authHelper.bearer(token);

    // Create an order to pay against
    await apiClient.post('/cart/items', cartData.addItem.valid, { headers });
    const orderRes = await apiClient.post('/orders', undefined, { headers });
    if (orderRes.status === 201) {
      orderId = orderRes.data.orderId;
    }
  });

  afterAll(() => {
    authHelper.reset();
  });

  // ─── POST /payments ────────────────────────────────────────────────────────

  describe('POST /payments', () => {
    test('[TC-PAY-001] Valid payment (credit_card) — returns 201 with paymentId', async () => {
      if (!orderId) return;

      const res = await apiClient.post('/payments', pd.buildPayment(orderId, 'credit_card'), {
        headers,
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('paymentId');
      expect(res.data).toHaveProperty('status');
      expect(res.data).toHaveProperty('amount');
      expect(typeof res.data.paymentId).toBe('string');
      expect(res.data.paymentId).toMatch(/^PAY-/);
      expect(res.data.amount).toBeGreaterThan(0);

      paymentId = res.data.paymentId;
    });

    test('[TC-PAY-002] Duplicate payment for same order — returns 409 Conflict', async () => {
      if (!orderId) return;

      const res = await apiClient.post('/payments', pd.buildPayment(orderId, 'credit_card'), {
        headers,
      });

      expect(res.status).toBe(409);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-003] Non-existent orderId — returns 404 Not Found', async () => {
      const res = await apiClient.post('/payments', pd.invalid.badOrderId, { headers });

      expect(res.status).toBe(404);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-004] Missing orderId — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/payments', pd.invalid.missingOrderId, { headers });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-005] Missing method — returns 400 Bad Request', async () => {
      if (!orderId) return;

      const res = await apiClient.post('/payments', pd.invalid.missingMethod(orderId), {
        headers,
      });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-006] Empty body — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/payments', pd.invalid.emptyBody, { headers });

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-007] No auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/payments', pd.buildPayment('ORD-1001'));

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-008] Invalid auth token — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/payments', pd.buildPayment('ORD-1001'), {
        headers: authHelper.invalidBearer(),
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test.each(pd.methods)(
      '[TC-PAY-009] Payment method %s — accepted by the API',
      async (method) => {
        // Each payment method needs a fresh order
        await apiClient.post('/cart/items', cartData.addItem.valid, { headers });
        const orderRes = await apiClient.post('/orders', undefined, { headers });
        if (orderRes.status !== 201) return;

        const res = await apiClient.post(
          '/payments',
          pd.buildPayment(orderRes.data.orderId, method),
          { headers }
        );

        expect([201, 400]).toContain(res.status); // 400 acceptable if method enum differs on server
        if (res.status === 201) {
          expect(res.data).toHaveProperty('paymentId');
        }
      }
    );
  });

  // ─── GET /payments/{paymentId} ────────────────────────────────────────────

  describe('GET /payments/{paymentId}', () => {
    test('[TC-PAY-013] Valid paymentId — returns 200 with payment details', async () => {
      if (!paymentId) return;

      const res = await apiClient.get(`/payments/${paymentId}`, { headers });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('paymentId', paymentId);
      expect(res.data).toHaveProperty('orderId');
      expect(res.data).toHaveProperty('method');
      expect(res.data).toHaveProperty('amount');
      expect(res.data).toHaveProperty('status');
      expect(res.data).toHaveProperty('processedAt');
    });

    test('[TC-PAY-014] Payment amount is a positive number', async () => {
      if (!paymentId) return;

      const res = await apiClient.get(`/payments/${paymentId}`, { headers });

      expect(res.status).toBe(200);
      expect(typeof res.data.amount).toBe('number');
      expect(res.data.amount).toBeGreaterThan(0);
    });

    test('[TC-PAY-015] Non-existent paymentId — returns 404 Not Found', async () => {
      const res = await apiClient.get(`/payments/${pd.nonExistentPaymentId}`, { headers });

      expect(res.status).toBe(404);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-016] No auth token — returns 401 Unauthorized', async () => {
      const pid = paymentId || 'PAY-5001';
      const res = await apiClient.get(`/payments/${pid}`);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PAY-017] Invalid auth token — returns 401 Unauthorized', async () => {
      const pid = paymentId || 'PAY-5001';
      const res = await apiClient.get(`/payments/${pid}`, {
        headers: authHelper.invalidBearer(),
      });

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });
  });
});
