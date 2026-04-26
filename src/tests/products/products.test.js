const apiClient = require('../../utils/apiClient');
const pd = require('../../test-data/products.data');

describe('Products API', () => {
  // ─── GET /products ──────────────────────────────────────────────────────────

  describe('GET /products', () => {
    test('[TC-PROD-001] No filters — returns 200 with product list and pagination meta', async () => {
      const res = await apiClient.get('/products');

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('total');
      expect(res.data).toHaveProperty('page');
      expect(res.data).toHaveProperty('limit');
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    test('[TC-PROD-002] Filter by category=electronics — returns 200 with filtered results', async () => {
      const res = await apiClient.get('/products', { params: pd.filters.byCategory });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      res.data.data.forEach((p) => {
        expect(p.category.toLowerCase()).toBe('electronics');
      });
    });

    test('[TC-PROD-003] Pagination — page=1&limit=5 returns at most 5 products', async () => {
      const res = await apiClient.get('/products', { params: pd.filters.paginated });

      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(5);
      expect(res.data.page).toBe(1);
      expect(res.data.limit).toBe(5);
    });

    test('[TC-PROD-004] Pagination — page=2 returns next set of results', async () => {
      const res = await apiClient.get('/products', { params: pd.filters.page2 });

      expect(res.status).toBe(200);
      expect(res.data.page).toBe(2);
    });

    test('[TC-PROD-005] Combined filter — category + pagination returns correct shape', async () => {
      const res = await apiClient.get('/products', { params: pd.filters.combined });

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('total');
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    test('[TC-PROD-006] Unknown category — returns 200 with empty data array', async () => {
      const res = await apiClient.get('/products', { params: pd.filters.unknownCategory });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    test('[TC-PROD-007] Product object schema — has id, name, price, category, stock', async () => {
      const res = await apiClient.get('/products', { params: { limit: 1 } });

      expect(res.status).toBe(200);
      if (res.data.data.length > 0) {
        const product = res.data.data[0];
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('stock');
        expect(typeof product.price).toBe('number');
        expect(product.price).toBeGreaterThan(0);
      }
    });
  });

  // ─── GET /products/{id} ─────────────────────────────────────────────────────

  describe('GET /products/{id}', () => {
    test('[TC-PROD-008] Valid product ID — returns 200 with product details', async () => {
      const res = await apiClient.get(`/products/${pd.validId}`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('id', pd.validId);
      expect(res.data).toHaveProperty('name');
      expect(res.data).toHaveProperty('price');
      expect(res.data).toHaveProperty('category');
      expect(res.data).toHaveProperty('stock');
    });

    test('[TC-PROD-009] Non-existent product ID — returns 404 Not Found', async () => {
      const res = await apiClient.get(`/products/${pd.nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-PROD-010] Product price is a positive number', async () => {
      const res = await apiClient.get(`/products/${pd.validId}`);

      expect(res.status).toBe(200);
      expect(typeof res.data.price).toBe('number');
      expect(res.data.price).toBeGreaterThan(0);
    });

    test('[TC-PROD-011] Product stock is a non-negative integer', async () => {
      const res = await apiClient.get(`/products/${pd.validId}`);

      expect(res.status).toBe(200);
      expect(Number.isInteger(res.data.stock)).toBe(true);
      expect(res.data.stock).toBeGreaterThanOrEqual(0);
    });
  });
});
