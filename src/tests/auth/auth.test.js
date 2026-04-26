const apiClient = require('../../utils/apiClient');
const authData = require('../../test-data/auth.data');

describe('Auth API', () => {
  // ─── POST /auth/login ───────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    test('[TC-AUTH-001] Valid credentials — returns 200 with token and userId', async () => {
      const res = await apiClient.post('/auth/login', authData.login.valid);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('token');
      expect(res.data).toHaveProperty('userId');
      expect(typeof res.data.token).toBe('string');
      expect(res.data.token.length).toBeGreaterThan(0);
    });

    test('[TC-AUTH-002] Wrong password — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/auth/login', authData.login.wrongPassword);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-003] Non-existent user — returns 401 Unauthorized', async () => {
      const res = await apiClient.post('/auth/login', authData.login.nonExistentUser);

      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-004] Missing password field — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/auth/login', authData.login.missingPassword);

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-005] Missing email field — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/auth/login', authData.login.missingEmail);

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-006] Empty request body — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/auth/login', authData.login.emptyBody);

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-007] Response schema — token is a non-empty string', async () => {
      const res = await apiClient.post('/auth/login', authData.login.valid);

      expect(res.status).toBe(200);
      expect(res.data.token).toMatch(/^.+$/);
      expect(Number.isInteger(res.data.userId)).toBe(true);
    });
  });

  // ─── POST /auth/register ────────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    test('[TC-AUTH-008] New user registration — returns 201 with userId', async () => {
      const res = await apiClient.post('/auth/register', authData.register.newUser());

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('userId');
      expect(Number.isInteger(res.data.userId)).toBe(true);
    });

    test('[TC-AUTH-009] Duplicate email — returns 409 Conflict', async () => {
      const res = await apiClient.post('/auth/register', authData.register.duplicateEmail);

      expect(res.status).toBe(409);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-010] Missing name field — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/auth/register', authData.register.missingName());

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-011] Missing email field — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/auth/register', authData.register.missingEmail);

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-012] Missing password field — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/auth/register', authData.register.missingPassword());

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-013] Empty request body — returns 400 Bad Request', async () => {
      const res = await apiClient.post('/auth/register', authData.register.emptyBody);

      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
    });

    test('[TC-AUTH-014] Registered user can login immediately after registration', async () => {
      const newUser = authData.register.newUser();
      const registerRes = await apiClient.post('/auth/register', newUser);
      expect(registerRes.status).toBe(201);

      const loginRes = await apiClient.post('/auth/login', {
        email: newUser.email,
        password: newUser.password,
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.data).toHaveProperty('token');
    });
  });
});
