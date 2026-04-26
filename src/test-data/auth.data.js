const uid = () => Date.now();

module.exports = {
  login: {
    valid: { email: 'admin@shopeasy.com', password: 'password123' },
    wrongPassword: { email: 'admin@shopeasy.com', password: 'wrongpassword' },
    nonExistentUser: { email: `nouser_${uid()}@example.com`, password: 'password123' },
    missingPassword: { email: 'admin@shopeasy.com' },
    missingEmail: { password: 'password123' },
    emptyBody: {},
  },
  register: {
    newUser: () => ({
      email: `testuser_${uid()}@example.com`,
      password: 'SecurePass123!',
      name: 'Test User',
    }),
    duplicateEmail: {
      email: 'admin@shopeasy.com',
      password: 'AnyPass123',
      name: 'Duplicate Admin',
    },
    missingName: () => ({
      email: `noname_${uid()}@example.com`,
      password: 'SecurePass123!',
    }),
    missingEmail: { password: 'SecurePass123!', name: 'No Email User' },
    missingPassword: () => ({
      email: `nopwd_${uid()}@example.com`,
      name: 'No Password User',
    }),
    emptyBody: {},
  },
};
