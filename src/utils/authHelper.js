const apiClient = require('./apiClient');
const config = require('../config/config');

let _adminToken = null;

const authHelper = {
  async getAdminToken() {
    if (!_adminToken) {
      const res = await apiClient.post('/auth/login', config.credentials.admin);
      if (res.status !== 200 || !res.data.token) {
        throw new Error(`Admin login failed: ${JSON.stringify(res.data)}`);
      }
      _adminToken = res.data.token;
    }
    return _adminToken;
  },

  async loginAs(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    return res;
  },

  bearer(token) {
    return { Authorization: `Bearer ${token}` };
  },

  invalidBearer() {
    return { Authorization: 'Bearer invalid_token_xyz' };
  },

  reset() {
    _adminToken = null;
  },
};

module.exports = authHelper;
