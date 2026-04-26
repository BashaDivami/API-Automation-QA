module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  globalSetup: './globalSetup.js',
  globalTeardown: './globalTeardown.js',
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'ShopEasy API — Execution Report',
        outputPath: './reports/execution/test-report.html',
        includeConsoleLog: true,
        includeFailureMsg: true,
        includeSuiteFailure: true,
        dateFormat: 'yyyy-mm-dd HH:MM:ss',
        sort: 'status',
        statusIgnoreFilter: '',
        executionTimeWarningThreshold: 5,
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './reports/execution',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' > ',
        addFileAttribute: 'true',
      },
    ],
    ['./reporters/apiCoverageReporter.js', {}],
  ],
  verbose: true,
};
