const fs = require('fs');
const path = require('path');

/**
 * Custom Jest reporter that generates an API endpoint coverage report.
 * Maps test results to API endpoints and produces JSON + HTML reports.
 */

const API_ENDPOINTS = [
  { tag: 'Auth',     method: 'POST',   path: '/auth/login',              describeKey: 'POST /auth/login' },
  { tag: 'Auth',     method: 'POST',   path: '/auth/register',           describeKey: 'POST /auth/register' },
  { tag: 'Products', method: 'GET',    path: '/products',                describeKey: 'GET /products' },
  { tag: 'Products', method: 'GET',    path: '/products/{id}',           describeKey: 'GET /products/{id}' },
  { tag: 'Cart',     method: 'POST',   path: '/cart/items',              describeKey: 'POST /cart/items' },
  { tag: 'Cart',     method: 'GET',    path: '/cart',                    describeKey: 'GET /cart' },
  { tag: 'Cart',     method: 'DELETE', path: '/cart/items/{itemId}',     describeKey: 'DELETE /cart/items/{itemId}' },
  { tag: 'Orders',   method: 'POST',   path: '/orders',                  describeKey: 'POST /orders' },
  { tag: 'Orders',   method: 'GET',    path: '/orders/{orderId}',        describeKey: 'GET /orders/{orderId}' },
  { tag: 'Orders',   method: 'DELETE', path: '/orders/{orderId}/cancel', describeKey: 'DELETE /orders/{orderId}/cancel' },
  { tag: 'Payments', method: 'POST',   path: '/payments',                describeKey: 'POST /payments' },
  { tag: 'Payments', method: 'GET',    path: '/payments/{paymentId}',    describeKey: 'GET /payments/{paymentId}' },
];

class ApiCoverageReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._suiteMap = {}; // describeKey → { tests: [], passed, failed }
  }

  onTestCaseResult(_test, result) {
    // Ancestor titles: ['Auth API', 'POST /auth/login']
    const ancestors = result.ancestorTitles || [];
    const endpointKey = ancestors[ancestors.length - 1] || '';

    if (!this._suiteMap[endpointKey]) {
      this._suiteMap[endpointKey] = { tests: [], passed: 0, failed: 0, skipped: 0 };
    }

    const entry = this._suiteMap[endpointKey];
    entry.tests.push({ title: result.title, status: result.status });

    if (result.status === 'passed') entry.passed++;
    else if (result.status === 'failed') entry.failed++;
    else entry.skipped++;
  }

  onRunComplete(_contexts, results) {
    const coverage = this._buildCoverageData(results);
    const outputDir = path.resolve('./reports/coverage');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    fs.writeFileSync(
      path.join(outputDir, 'api-coverage.json'),
      JSON.stringify(coverage, null, 2)
    );

    fs.writeFileSync(
      path.join(outputDir, 'api-coverage.html'),
      this._renderHTML(coverage)
    );

    this._printSummary(coverage);
  }

  _buildCoverageData(results) {
    const endpointCoverage = API_ENDPOINTS.map((ep) => {
      const suite = this._suiteMap[ep.describeKey] || null;
      const hasSuite = suite !== null;
      const hasTests = hasSuite && suite.tests.length > 0;
      const allPassing = hasTests && suite.failed === 0 && suite.passed > 0;

      return {
        ...ep,
        covered: hasTests,
        passing: allPassing,
        testCount: suite ? suite.tests.length : 0,
        passed: suite ? suite.passed : 0,
        failed: suite ? suite.failed : 0,
        skipped: suite ? suite.skipped : 0,
        tests: suite ? suite.tests : [],
      };
    });

    const covered = endpointCoverage.filter((e) => e.covered).length;
    const passing = endpointCoverage.filter((e) => e.passing).length;
    const total = API_ENDPOINTS.length;

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalEndpoints: total,
        coveredEndpoints: covered,
        passingEndpoints: passing,
        coveragePercent: Math.round((covered / total) * 100),
        passPercent: Math.round((passing / total) * 100),
        totalTests: results.numTotalTests,
        passedTests: results.numPassedTests,
        failedTests: results.numFailedTests,
        skippedTests: results.numPendingTests,
      },
      endpoints: endpointCoverage,
    };
  }

  _printSummary(coverage) {
    const { summary } = coverage;
    const bar = (pct) => {
      const filled = Math.round(pct / 5);
      return '█'.repeat(filled) + '░'.repeat(20 - filled);
    };

    console.log('\n' + '═'.repeat(60));
    console.log('  API Coverage Report — ShopEasy');
    console.log('═'.repeat(60));
    console.log(`  Endpoints covered : ${summary.coveredEndpoints}/${summary.totalEndpoints}  [${bar(summary.coveragePercent)}] ${summary.coveragePercent}%`);
    console.log(`  Endpoints passing : ${summary.passingEndpoints}/${summary.totalEndpoints}  [${bar(summary.passPercent)}] ${summary.passPercent}%`);
    console.log(`  Tests  passed     : ${summary.passedTests}/${summary.totalTests}`);
    if (summary.failedTests > 0) {
      console.log(`  Tests  FAILED     : ${summary.failedTests}`);
    }
    console.log('─'.repeat(60));
    console.log('  HTML report → reports/coverage/api-coverage.html');
    console.log('  JSON data  → reports/coverage/api-coverage.json');
    console.log('═'.repeat(60) + '\n');
  }

  _renderHTML(coverage) {
    const { summary, endpoints } = coverage;
    const tagColors = {
      Auth: '#6366f1', Products: '#0ea5e9', Cart: '#f59e0b',
      Orders: '#10b981', Payments: '#ef4444',
    };

    const endpointRows = endpoints
      .map((ep) => {
        const color = tagColors[ep.tag] || '#6b7280';
        const statusBadge = ep.covered
          ? ep.passing
            ? '<span class="badge pass">PASS</span>'
            : '<span class="badge fail">FAIL</span>'
          : '<span class="badge not-tested">NOT TESTED</span>';

        const testList = ep.tests
          .map(
            (t) =>
              `<li class="test-item ${t.status}">${this._escapeHtml(t.title)}</li>`
          )
          .join('');

        return `
        <tr>
          <td><span class="tag" style="background:${color}">${ep.tag}</span></td>
          <td><span class="method method-${ep.method.toLowerCase()}">${ep.method}</span></td>
          <td class="path"><code>${ep.path}</code></td>
          <td>${statusBadge}</td>
          <td>${ep.testCount}</td>
          <td class="pass-count">${ep.passed}</td>
          <td class="fail-count">${ep.failed > 0 ? ep.failed : '—'}</td>
          <td><ul class="test-list">${testList || '<li class="test-item not-tested">No tests found</li>'}</ul></td>
        </tr>`;
      })
      .join('');

    const coveragePct = summary.coveragePercent;
    const passPct = summary.passPercent;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Coverage Report — ShopEasy</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 2rem 2.5rem; border-bottom: 1px solid #334155; }
    .header h1 { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; }
    .header p  { color: #94a3b8; margin-top: 0.3rem; font-size: 0.85rem; }
    .main { padding: 2rem 2.5rem; max-width: 1400px; margin: 0 auto; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.2rem 1.5rem; }
    .stat-card .label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.4rem; }
    .stat-card .value { font-size: 2rem; font-weight: 700; color: #f1f5f9; }
    .stat-card .sub   { font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem; }

    .progress-section { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem; }
    .progress-section h2 { font-size: 0.9rem; color: #94a3b8; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.06em; }
    .progress-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem; }
    .progress-label { width: 180px; font-size: 0.82rem; color: #cbd5e1; }
    .progress-bar-bg { flex: 1; background: #334155; border-radius: 6px; height: 10px; overflow: hidden; }
    .progress-bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
    .fill-coverage { background: linear-gradient(90deg, #6366f1, #818cf8); }
    .fill-pass     { background: linear-gradient(90deg, #10b981, #34d399); }
    .progress-pct  { width: 45px; text-align: right; font-size: 0.82rem; font-weight: 600; color: #f1f5f9; }

    table { width: 100%; border-collapse: collapse; background: #1e293b; border: 1px solid #334155; border-radius: 10px; overflow: hidden; font-size: 0.84rem; }
    thead tr { background: #0f172a; }
    th { padding: 0.9rem 1rem; text-align: left; color: #64748b; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #334155; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #1e293b; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.02); }

    .tag { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 4px; font-size: 0.7rem; font-weight: 600; color: #fff; }
    .method { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; font-family: monospace; }
    .method-get    { background: #064e3b; color: #34d399; }
    .method-post   { background: #1e3a5f; color: #60a5fa; }
    .method-delete { background: #4c0519; color: #f87171; }
    .method-put    { background: #422006; color: #fb923c; }
    .method-patch  { background: #3b0764; color: #c084fc; }

    .path code { font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #7dd3fc; background: #0f172a; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }

    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 5px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge.pass       { background: #064e3b; color: #34d399; }
    .badge.fail       { background: #4c0519; color: #f87171; }
    .badge.not-tested { background: #1e293b; color: #64748b; border: 1px solid #334155; }

    .pass-count { color: #34d399; font-weight: 600; }
    .fail-count { color: #f87171; font-weight: 600; }

    .test-list { list-style: none; padding: 0; margin: 0; }
    .test-item { font-size: 0.72rem; padding: 0.15rem 0; color: #94a3b8; }
    .test-item::before { margin-right: 0.4rem; }
    .test-item.passed::before    { content: '✓'; color: #34d399; }
    .test-item.failed::before    { content: '✗'; color: #f87171; }
    .test-item.skipped::before   { content: '–'; color: #64748b; }
    .test-item.not-tested { color: #475569; font-style: italic; }
    .test-item.not-tested::before { content: '○'; color: #475569; }

    .section-title { font-size: 1rem; font-weight: 600; color: #f1f5f9; margin-bottom: 1rem; }
    .timestamp { color: #475569; font-size: 0.72rem; margin-top: 2rem; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ShopEasy — API Coverage Report</h1>
    <p>Generated: ${new Date(coverage.generatedAt).toLocaleString()} &nbsp;|&nbsp; ${summary.totalEndpoints} endpoints &nbsp;|&nbsp; ${summary.totalTests} test cases</p>
  </div>

  <div class="main">

    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Endpoint Coverage</div>
        <div class="value">${coveragePct}%</div>
        <div class="sub">${summary.coveredEndpoints} / ${summary.totalEndpoints} endpoints</div>
      </div>
      <div class="stat-card">
        <div class="label">Endpoints Passing</div>
        <div class="value">${passPct}%</div>
        <div class="sub">${summary.passingEndpoints} / ${summary.totalEndpoints} fully green</div>
      </div>
      <div class="stat-card">
        <div class="label">Tests Passed</div>
        <div class="value" style="color:#34d399">${summary.passedTests}</div>
        <div class="sub">of ${summary.totalTests} total</div>
      </div>
      <div class="stat-card">
        <div class="label">Tests Failed</div>
        <div class="value" style="color:${summary.failedTests > 0 ? '#f87171' : '#34d399'}">${summary.failedTests}</div>
        <div class="sub">${summary.failedTests === 0 ? 'All clean!' : 'Needs attention'}</div>
      </div>
      <div class="stat-card">
        <div class="label">Skipped</div>
        <div class="value" style="color:#64748b">${summary.skippedTests}</div>
        <div class="sub">pending tests</div>
      </div>
    </div>

    <div class="progress-section">
      <h2>Coverage Overview</h2>
      <div class="progress-row">
        <span class="progress-label">Endpoint Coverage</span>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill fill-coverage" style="width:${coveragePct}%"></div>
        </div>
        <span class="progress-pct">${coveragePct}%</span>
      </div>
      <div class="progress-row">
        <span class="progress-label">Passing Endpoints</span>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill fill-pass" style="width:${passPct}%"></div>
        </div>
        <span class="progress-pct">${passPct}%</span>
      </div>
    </div>

    <p class="section-title">Endpoint Details</p>
    <table>
      <thead>
        <tr>
          <th>Module</th>
          <th>Method</th>
          <th>Endpoint</th>
          <th>Status</th>
          <th>Tests</th>
          <th>Pass</th>
          <th>Fail</th>
          <th>Test Cases</th>
        </tr>
      </thead>
      <tbody>
        ${endpointRows}
      </tbody>
    </table>

    <p class="timestamp">ShopEasy API Automation Suite &nbsp;·&nbsp; ${new Date(coverage.generatedAt).toUTCString()}</p>
  </div>
</body>
</html>`;
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

module.exports = ApiCoverageReporter;
