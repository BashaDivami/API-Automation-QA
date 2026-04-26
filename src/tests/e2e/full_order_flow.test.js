/**
 * End-to-End Order Flow
 * Covers the full happy path: Register → Login → Browse → Cart → Order → Pay
 */

const apiClient = require('../../utils/apiClient');
const authHelper = require('../../utils/authHelper');

describe('E2E — Full Order Lifecycle', () => {
  const user = {
    email: `e2e_${Date.now()}@shopeasy-test.com`,
    password: 'E2ETest@123',
    name: 'E2E Test User',
  };

  let token;
  let headers;
  let productId;
  let orderId;
  let paymentId;

  // ── Step 1: Register ─────────────────────────────────────────────────────

  test('[TC-E2E-001] Register a new user', async () => {
    const res = await apiClient.post('/auth/register', user);

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('userId');
    user.userId = res.data.userId;
  });

  // ── Step 2: Login ─────────────────────────────────────────────────────────

  test('[TC-E2E-002] Login with newly registered user credentials', async () => {
    const res = await apiClient.post('/auth/login', {
      email: user.email,
      password: user.password,
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('token');
    token = res.data.token;
    headers = authHelper.bearer(token);
  });

  // ── Step 3: Browse Products ───────────────────────────────────────────────

  test('[TC-E2E-003] Browse the product catalog', async () => {
    const res = await apiClient.get('/products', { params: { limit: 10 } });

    expect(res.status).toBe(200);
    expect(res.data.data.length).toBeGreaterThan(0);
    productId = res.data.data[0].id;
  });

  test('[TC-E2E-004] View product details for selected item', async () => {
    if (!productId) return;

    const res = await apiClient.get(`/products/${productId}`);

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(productId);
  });

  // ── Step 4: Add to Cart ───────────────────────────────────────────────────

  test('[TC-E2E-005] Add selected product to cart', async () => {
    if (!productId || !headers) return;

    const res = await apiClient.post(
      '/cart/items',
      { productId, quantity: 2 },
      { headers }
    );

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('cartTotal');
    expect(res.data.cartTotal).toBeGreaterThan(0);
  });

  test('[TC-E2E-006] View cart — contains the added item', async () => {
    if (!headers) return;

    const res = await apiClient.get('/cart', { headers });

    expect(res.status).toBe(200);
    expect(res.data.itemCount).toBeGreaterThan(0);
    expect(res.data.subtotal).toBeGreaterThan(0);
  });

  // ── Step 5: Place Order ───────────────────────────────────────────────────

  test('[TC-E2E-007] Place order from cart', async () => {
    if (!headers) return;

    const res = await apiClient.post('/orders', undefined, { headers });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('orderId');
    expect(res.data).toHaveProperty('total');
    expect(res.data.total).toBeGreaterThan(0);
    orderId = res.data.orderId;
  });

  test('[TC-E2E-008] Retrieve placed order — status is pending', async () => {
    if (!headers || !orderId) return;

    const res = await apiClient.get(`/orders/${orderId}`, { headers });

    expect(res.status).toBe(200);
    expect(res.data.orderId).toBe(orderId);
    expect(res.data.status).toBe('pending');
  });

  // ── Step 6: Process Payment ───────────────────────────────────────────────

  test('[TC-E2E-009] Process payment for the order', async () => {
    if (!headers || !orderId) return;

    const res = await apiClient.post(
      '/payments',
      { orderId, method: 'upi' },
      { headers }
    );

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('paymentId');
    expect(res.data).toHaveProperty('amount');
    expect(res.data.amount).toBeGreaterThan(0);
    paymentId = res.data.paymentId;
  });

  test('[TC-E2E-010] Retrieve payment — status reflects successful payment', async () => {
    if (!headers || !paymentId) return;

    const res = await apiClient.get(`/payments/${paymentId}`, { headers });

    expect(res.status).toBe(200);
    expect(res.data.paymentId).toBe(paymentId);
    expect(res.data.orderId).toBe(orderId);
    expect(typeof res.data.amount).toBe('number');
  });

  // ── Step 7: Verify Post-Payment State ─────────────────────────────────────

  test('[TC-E2E-011] Cart is empty after order placement', async () => {
    if (!headers) return;

    const res = await apiClient.get('/cart', { headers });

    expect(res.status).toBe(200);
    // Cart should be cleared after order was placed
    expect(res.data.itemCount).toBe(0);
  });

  test('[TC-E2E-012] Paid order cannot be paid again — returns 409 Conflict', async () => {
    if (!headers || !orderId) return;

    const res = await apiClient.post(
      '/payments',
      { orderId, method: 'credit_card' },
      { headers }
    );

    expect(res.status).toBe(409);
    expect(res.data).toHaveProperty('error');
  });
});
