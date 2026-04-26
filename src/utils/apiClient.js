const axios = require('axios');
const config = require('../config/config');

const apiClient = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true, // never throw on HTTP errors — tests assert status codes directly
});

apiClient.interceptors.request.use((req) => {
  req.metadata = { startTime: Date.now() };
  return req;
});

apiClient.interceptors.response.use((res) => {
  const ms = Date.now() - res.config.metadata.startTime;
  const method = res.config.method.toUpperCase().padEnd(6);
  const url = res.config.url;
  const status = res.status;
  const mark = status < 400 ? '✓' : '✗';
  console.log(`  ${mark} ${method} ${url}  →  ${status}  (${ms}ms)`);
  return res;
});

module.exports = apiClient;
