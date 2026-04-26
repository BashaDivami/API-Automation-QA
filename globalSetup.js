const fs = require('fs');

module.exports = async () => {
  const dirs = [
    './reports/execution',
    './reports/coverage',
    './reports/artifacts',
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  console.log('\n  ShopEasy API Automation Suite starting...\n');
};
