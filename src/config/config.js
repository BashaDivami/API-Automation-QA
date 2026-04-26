require('dotenv').config();

module.exports = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  timeout: parseInt(process.env.TIMEOUT || '15000'),
  credentials: {
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@shopeasy.com',
      password: process.env.ADMIN_PASSWORD || 'password123',
    },
  },
};
