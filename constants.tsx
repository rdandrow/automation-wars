
import { Difficulty, Scenario, Category, Framework } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'maint-cy-util-intercept',
    title: 'Repairing Intercept Utilities',
    category: Category.MAINTENANCE,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'A global intercept utility used for stubbing user profiles is failing because the API endpoint changed from /api/v1/user to /api/v2/profile. Update the utility to restore the test.',
    learningObjectives: [
      'Refactoring shared utility functions',
      'Updating cy.intercept path patterns',
      'Validating mock data injection'
    ],
    playwrightStarterCode: `// Not applicable for this Cypress-focused maintenance task`,
    playwrightSnippet: `// Use page.route for equivalent Playwright logic
await page.route('**/api/v2/profile', route => route.fulfill({
  status: 200,
  body: { name: 'Refactored User' }
}));`,
    cypressStarterCode: `// utils/api.ts
export const setupUserMock = () => {
  // FIX ME: This endpoint is outdated (v1/user -> v2/profile)
  cy.intercept('GET', '**/api/v1/user', {
    body: { name: 'Test User' }
  }).as('getUser');
};

it('should display mocked user name', () => {
  setupUserMock();
  cy.visit('/playground/cy-util-repair');
  cy.wait('@getUser');
  cy.contains('Test User').should('be.visible');
});`,
    cypressSnippet: `// utils/api.ts
export const setupUserMock = () => {
  cy.intercept('GET', '**/api/v2/profile', {
    body: { name: 'Test User' }
  }).as('getUser');
};

it('should display mocked user name', () => {
  setupUserMock();
  cy.visit('/playground/cy-util-repair');
  cy.wait('@getUser');
  cy.contains('Test User').should('be.visible');
});`,
    playgroundPath: 'cy-util-repair',
    supportedFrameworks: [Framework.CYPRESS]
  },
  {
    id: 'cy-util-custom-cmd',
    title: 'Defining Custom Commands',
    category: Category.CYPRESS_UTILS,
    difficulty: Difficulty.BASIC,
    description: 'Implement a reusable custom command "cy.resetDatabase()" that makes a POST request to a cleanup endpoint to ensure a clean state before every test.',
    learningObjectives: [
      'Using Cypress.Commands.add()',
      'Wrapping cy.request in custom commands',
      'Implementing global test hooks'
    ],
    playwrightSnippet: `// In Playwright, we use a global setup or a test.beforeEach hook
test.beforeEach(async ({ request }) => {
  await request.post('/api/database/reset');
});`,
    cypressSnippet: `Cypress.Commands.add('resetDatabase', () => {
  cy.request('POST', '/api/database/reset');
});

describe('Database Management', () => {
  beforeEach(() => {
    cy.resetDatabase();
  });

  it('starts with a fresh state', () => {
    cy.visit('/playground/cy-db-status');
    cy.contains('Database: Ready').should('be.visible');
  });
});`,
    playgroundPath: 'cy-db-status',
    supportedFrameworks: [Framework.CYPRESS],
    apiSpecification: {
      method: 'POST',
      endpoint: '/api/database/reset',
      expectedResponse: '200 OK - { status: "cleaned" }'
    }
  },
  {
    id: 'maint-brittle-selectors',
    title: 'Repairing Brittle Selectors',
    category: Category.MAINTENANCE,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'A recent UI update changed auto-generated class names, breaking the existing test. Refactor the brittle CSS selector to use a robust Playwright/Cypress locator.',
    learningObjectives: [
      'Identifying brittle CSS selectors',
      'Implementing user-facing locators (getByRole, getByLabel)',
      'Improving test stability against UI style changes'
    ],
    playwrightStarterCode: `import { test, expect } from '@playwright/test';

test('submit feedback form', async ({ page }) => {
  await page.goto('/playground/feedback');
  // FIX ME: This selector is brittle and fails after the UI update
  await page.locator('.css-1x9a2-submit-feedback-btn-v2').click();
  await expect(page.getByText('Thank you!')).toBeVisible();
});`,
    playwrightSnippet: `test('submit feedback form', async ({ page }) => {
  await page.goto('/playground/feedback');
  await page.getByRole('button', { name: 'Submit Feedback' }).click();
  await expect(page.getByText('Thank you!')).toBeVisible();
});`,
    cypressStarterCode: `it('submit feedback form', () => {
  cy.visit('/playground/feedback');
  // FIX ME: This selector is brittle
  cy.get('.css-1x9a2-submit-feedback-btn-v2').click();
  cy.contains('Thank you!').should('be.visible');
});`,
    cypressSnippet: `it('submit feedback form', () => {
  cy.visit('/playground/feedback');
  cy.contains('button', 'Submit Feedback').click();
  cy.contains('Thank you!').should('be.visible');
});`,
    playgroundPath: 'feedback-form',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'maint-async-wait',
    title: 'Fixing Flaky Async Waits',
    category: Category.MAINTENANCE,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'The test fails because it tries to click a button that only appears after a random loading delay. Add proper waiting logic to handle the dynamic element.',
    learningObjectives: [
      'Understanding automatic waiting in Playwright',
      'Handling dynamic elements in Cypress',
      'Eliminating fixed "sleep" or "pause" statements'
    ],
    playwrightStarterCode: `import { test, expect } from '@playwright/test';

test('load and click secret button', async ({ page }) => {
  await page.goto('/playground/async-loading');
  // FIX ME: This fails because the button takes 2 seconds to appear
  await page.getByRole('button', { name: 'Reveal Secret' }).click();
  await expect(page.getByText('The secret code is 42')).toBeVisible();
});`,
    playwrightSnippet: `test('load and click secret button', async ({ page }) => {
  await page.goto('/playground/async-loading');
  // Playwright locators wait automatically, but if it was missing, we ensure it exists
  const btn = page.getByRole('button', { name: 'Reveal Secret' });
  await btn.click();
  await expect(page.getByText('The secret code is 42')).toBeVisible();
});`,
    cypressStarterCode: `it('load and click secret button', () => {
  cy.visit('/playground/async-loading');
  // FIX ME: This fails because Cypress default timeout might be too short 
  // or the element isn't guarded properly
  cy.get('#reveal-btn').click();
  cy.contains('The secret code is 42').should('be.visible');
});`,
    cypressSnippet: `it('load and click secret button', () => {
  cy.visit('/playground/async-loading');
  // Increase timeout or rely on default assertions
  cy.get('#reveal-btn', { timeout: 5000 }).should('be.visible').click();
  cy.contains('The secret code is 42').should('be.visible');
});`,
    playgroundPath: 'async-loading',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'maint-text-regression',
    title: 'Updating Legacy Assertions',
    category: Category.MAINTENANCE,
    difficulty: Difficulty.BASIC,
    description: 'The product team rebranded "Submit Order" to "Finalize Checkout". Update the outdated test assertions to match the new UI copy.',
    learningObjectives: [
      'Updating string-based assertions',
      'Syncing tests with UI copy changes',
      'Best practices for matching text'
    ],
    playwrightStarterCode: `import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  await page.goto('/playground/checkout');
  // FIX ME: The button text changed to "Finalize Checkout"
  await page.getByRole('button', { name: 'Submit Order' }).click();
  await expect(page.getByText('Order Complete')).toBeVisible();
});`,
    playwrightSnippet: `test('complete checkout flow', async ({ page }) => {
  await page.goto('/playground/checkout');
  await page.getByRole('button', { name: 'Finalize Checkout' }).click();
  await expect(page.getByText('Checkout Successful')).toBeVisible();
});`,
    cypressStarterCode: `it('complete checkout flow', () => {
  cy.visit('/playground/checkout');
  // FIX ME: Text is now "Finalize Checkout"
  cy.contains('Submit Order').click();
  cy.contains('Order Complete').should('be.visible');
});`,
    cypressSnippet: `it('complete checkout flow', () => {
  cy.visit('/playground/checkout');
  cy.contains('Finalize Checkout').click();
  cy.contains('Checkout Successful').should('be.visible');
});`,
    playgroundPath: 'checkout',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'basic-auth',
    title: 'Login Form Submission',
    category: Category.WEB_UI,
    difficulty: Difficulty.BASIC,
    description: 'Practice basic input filling, clicking, and simple assertions on a standard login form.',
    learningObjectives: [
      'Locating elements by label or ID',
      'Using type/fill and click actions',
      'Asserting success messages'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/playground/login');
  await page.getByLabel('Username').fill('playwright_pro');
  await page.getByLabel('Password').fill('master_the_web');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  await expect(page.getByText('Welcome back!')).toBeVisible();
});`,
    cypressSnippet: `describe('Login Flow', () => {
  it('should login successfully', () => {
    cy.visit('/playground/login');
    cy.get('#user').type('playwright_pro');
    cy.get('#pass').type('master_the_web');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Welcome back!').should('be.visible');
  });
});`,
    playgroundPath: 'login',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'basic-iframe',
    title: 'Iframe Content Interaction',
    category: Category.IFRAME_TESTING,
    difficulty: Difficulty.BASIC,
    description: 'Learn how to switch context to an iframe and interact with elements hosted inside it.',
    learningObjectives: [
      'Using page.frameLocator() to target iframes',
      'Interacting with buttons inside a frame',
      'Asserting on visibility of elements within frame context'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('interact with iframe', async ({ page }) => {
  await page.goto('/playground/iframe-testing');
  const frame = page.frameLocator('#my-iframe');
  await frame.getByRole('button', { name: 'Click Me' }).click();
  await expect(frame.getByText('Success!')).toBeVisible();
});`,
    cypressSnippet: `it('interact with iframe', () => {
  cy.visit('/playground/iframe-testing');
  cy.get('#my-iframe')
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap)
    .find('button')
    .contains('Click Me')
    .click();
    
  cy.get('#my-iframe')
    .its('0.contentDocument.body')
    .should('contain', 'Success!');
});`,
    playgroundPath: 'iframe-testing',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'advanced-nested-iframe',
    title: 'Deeply Nested Iframes',
    category: Category.IFRAME_TESTING,
    difficulty: Difficulty.ADVANCED,
    description: 'Master complex scenarios where elements are buried inside multiple nested iframe layers.',
    learningObjectives: [
      'Chaining frameLocator() for nested structures',
      'Handling asynchronous frame loading',
      'Locating elements deep in the shadow/frame tree'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('interact with nested iframe', async ({ page }) => {
  await page.goto('/playground/nested-iframes');
  const outerFrame = page.frameLocator('#outer-iframe');
  const innerFrame = outerFrame.frameLocator('#inner-iframe');
  
  await innerFrame.getByRole('button', { name: 'Submit Inner' }).click();
  await expect(innerFrame.getByText('Nested Success!')).toBeVisible();
});`,
    cypressSnippet: `it('interact with nested iframe', () => {
  cy.visit('/playground/nested-iframes');
  cy.get('#outer-iframe')
    .its('0.contentDocument.body').should('not.be.empty')
    .then(cy.wrap)
    .find('#inner-iframe')
    .its('0.contentDocument.body').should('not.be.empty')
    .then(cy.wrap)
    .find('button')
    .click();
    
  // Check results inside nested frame
  cy.get('#outer-iframe').then($outer => {
     const $inner = $outer.contents().find('#inner-iframe');
     cy.wrap($inner.contents().find('body')).should('contain', 'Nested Success!');
  });
});`,
    playgroundPath: 'nested-iframes',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'api-key-auth',
    title: 'Secure Header-Based API Key Auth',
    category: Category.API_TESTING,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Test an API endpoint that requires a custom security header for authentication.',
    learningObjectives: [
      'Sending custom headers in API requests',
      'Validating unauthorized (401) responses when headers are missing',
      'Asserting on secure resource access with correct credentials'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('should access protected resource with API key', async ({ request }) => {
  const response = await request.get('/api/secure-data', {
    headers: {
      'x-api-key': 'top-secret-key-123'
    }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.secret).toBe('The password is "blue-falcon"');
});`,
    cypressSnippet: `it('should access protected resource with API key', () => {
  cy.request({
    method: 'GET',
    url: '/api/secure-data',
    headers: {
      'x-api-key': 'top-secret-key-123'
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.secret).to.contain('blue-falcon');
  });
});`,
    playgroundPath: 'api-console',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS],
    apiSpecification: {
      method: 'GET',
      endpoint: '/api/secure-data',
      requestBody: 'None',
      expectedResponse: '200 OK - { secret: string } (Requires "x-api-key" header)'
    }
  },
  {
    id: 'pw-trace-viewer',
    title: 'Playwright: Trace Config',
    category: Category.PERFORMANCE,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Configure and utilize the Playwright Trace Viewer to debug flaky tests and inspect snapshots.',
    learningObjectives: [
      'Setting trace: "on-first-retry" in config',
      'Capturing screenshots and snapshots',
      'Viewing action metadata in the trace'
    ],
    playwrightSnippet: `// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});`,
    cypressSnippet: `// Not applicable for Cypress`,
    playgroundPath: 'performance',
    supportedFrameworks: [Framework.PLAYWRIGHT]
  },
  {
    id: 'cy-custom-commands',
    title: 'Cypress: Custom Commands',
    category: Category.WEB_UI,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Extend the Cypress global "cy" object with custom utility commands for repeated actions.',
    learningObjectives: [
      'Defining Cypress.Commands.add()',
      'Handling parent and child commands',
      'Typing custom commands for IntelliSense'
    ],
    playwrightSnippet: `// Not applicable for Playwright`,
    cypressSnippet: `Cypress.Commands.add('login', (email, password) => {
  cy.get('#email').type(email);
  cy.get('#password').type(password);
  cy.get('button').click();
});

it('uses custom login', () => {
  cy.login('user@test.com', 'pass123');
});`,
    playgroundPath: 'login',
    supportedFrameworks: [Framework.CYPRESS]
  },
  {
    id: 'api-oauth-token',
    title: 'OAuth2 Token Exchange',
    category: Category.API_TESTING,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Simulate an OAuth2 flow where you exchange an authorization code for an access token and validate the response metadata.',
    learningObjectives: [
      'Handling POST requests with JSON payloads',
      'Validating sensitive response fields (tokens)',
      'Asserting status codes and header logic'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('should exchange code for token', async ({ request }) => {
  const response = await request.post('/api/auth/token', {
    data: {
      grant_type: 'authorization_code',
      code: 'mock_code_123',
      client_id: 'playwright-lab',
      client_secret: 'secret-key'
    }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  
  expect(body.access_token).toBeDefined();
  expect(body.token_type).toBe('Bearer');
  expect(body.expires_in).toBe(3600);
});`,
    cypressSnippet: `it('should exchange code for token', () => {
  cy.request('POST', '/api/auth/token', {
    grant_type: 'authorization_code',
    code: 'mock_code_123',
    client_id: 'cypress-lab',
    client_secret: 'secret-key'
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.access_token).to.exist;
    expect(response.body.token_type).to.eq('Bearer');
  });
});`,
    playgroundPath: 'api-console',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS],
    apiSpecification: {
      method: 'POST',
      endpoint: '/api/auth/token',
      requestBody: `{
  "grant_type": "authorization_code",
  "code": "string",
  "client_id": "string",
  "client_secret": "string"
}`,
      expectedResponse: '200 OK - { access_token: string, token_type: "Bearer", expires_in: 3600 }'
    }
  },
  {
    id: 'api-basic-get',
    title: 'REST API: GET Request',
    category: Category.API_TESTING,
    difficulty: Difficulty.BASIC,
    description: 'Learn how to perform a simple GET request using Playwrights request context and validate the response payload.',
    learningObjectives: [
      'Using request.get() for API calls',
      'Checking status code expectations',
      'Extracting and asserting JSON properties'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('should fetch user details', async ({ request }) => {
  const response = await request.get('/api/users/1');
  expect(response.ok()).toBeTruthy();
  
  const body = await response.json();
  expect(body.name).toBe('John Doe');
});`,
    cypressSnippet: `it('should fetch user details', () => {
  cy.request('GET', '/api/users/1').then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.name).to.eq('John Doe');
  });
});`,
    playgroundPath: 'api-console',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS],
    apiSpecification: {
      method: 'GET',
      endpoint: '/api/users/:id',
      expectedResponse: '200 OK - { id: number, name: string, email: string }'
    }
  },
  {
    id: 'adv-api-mocking',
    title: 'API Request Interception',
    category: Category.API_TESTING,
    difficulty: Difficulty.ADVANCED,
    description: 'Intercept a real network request from the UI and provide a mock response to test specific client-side states like error handling.',
    learningObjectives: [
      'Using page.route() for interception',
      'Providing fulfill/mock responses',
      'Testing UI error handling states'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('should show error when API fails', async ({ page }) => {
  await page.route('**/api/data', route => route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Server exploded' })
  }));
  
  await page.goto('/playground/api-mock');
  await page.getByRole('button', { name: 'Fetch Data' }).click();
  await expect(page.getByText('Error: Server exploded')).toBeVisible();
});`,
    cypressSnippet: `it('should show error when API fails', () => {
  cy.intercept('GET', '**/api/data', {
    statusCode: 500,
    body: { error: 'Server exploded' }
  }).as('getData');
  
  cy.visit('/playground/api-mock');
  cy.get('button').contains('Fetch Data').click();
  await cy.wait('@getData');
  cy.contains('Error: Server exploded').should('be.visible');
});`,
    playgroundPath: 'api-mock',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS],
    apiSpecification: {
      method: 'GET',
      endpoint: '/api/data',
      expectedResponse: '200 OK - { data: string } (unless mocked to 500)'
    }
  },
  {
    id: 'basic-dropdowns',
    title: 'Select Dropdowns',
    category: Category.WEB_UI,
    difficulty: Difficulty.BASIC,
    description: 'Interact with standard HTML select elements and verify selection states.',
    learningObjectives: [
      'Selecting options by value or label',
      'Asserting dropdown selection',
      'Handling change events'
    ],
    playwrightSnippet: `test('should select a framework', async ({ page }) => {
  await page.goto('/playground/dropdowns');
  await page.locator('#framework-select').selectOption('playwright');
  await expect(page.locator('#framework-select')).toHaveValue('playwright');
  await expect(page.getByText('Selected: Playwright')).toBeVisible();
});`,
    cypressSnippet: `it('should select a framework', () => {
  cy.visit('/playground/dropdowns');
  cy.get('#framework-select').select('playwright');
  cy.get('#framework-select').should('have.value', 'playwright');
  cy.contains('Selected: Playwright').should('be.visible');
});`,
    playgroundPath: 'dropdowns',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'inter-table-data',
    title: 'Table Data Manipulation',
    category: Category.WEB_UI,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Practice locating specific rows in a data table and extracting information or performing row-specific actions.',
    learningObjectives: [
      'Locating rows using inner text filters',
      'Accessing child elements within a table row',
      'Asserting on dynamic table content'
    ],
    playwrightSnippet: `test('should verify user status in table', async ({ page }) => {
  await page.goto('/playground/table-data');
  const charlieRow = page.locator('tr').filter({ hasText: 'Charlie' });
  await expect(charlieRow.locator('.status-badge')).toContainText('Active');
  await charlieRow.getByRole('button', { name: 'View' }).click();
  await expect(page.getByText('Viewing details for Charlie')).toBeVisible();
});`,
    cypressSnippet: `it('should verify user status in table', () => {
  cy.visit('/playground/table-data');
  cy.contains('tr', 'Charlie').find('.status-badge').should('contain', 'Active');
  cy.contains('tr', 'Charlie').find('button').contains('View').click();
  cy.contains('Viewing details for Charlie').should('be.visible');
});`,
    playgroundPath: 'table-data',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'adv-a11y-tree',
    title: 'Semantic Tree Inspection',
    category: Category.ACCESSIBILITY,
    difficulty: Difficulty.ADVANCED,
    description: "Use Playwright's native accessibility API to inspect the semantic tree and verify ARIA properties.",
    learningObjectives: [
      'Capturing the full page accessibility snapshot',
      'Verifying specific node roles and names',
      'Ensuring interactive elements are reachable in the tree'
    ],
    playwrightSnippet: `import { test, expect } from '@playwright/test';

test('verify semantic tree structure', async ({ page }) => {
  await page.goto('/playground/accessibility-tree');
  const snapshot = await page.accessibility.snapshot();
  const submitButton = snapshot.children.find(node => 
    node.name === 'Submit Order' && node.role === 'button'
  );
  expect(submitButton).toBeTruthy();
  expect(submitButton.disabled).toBeFalsy();
});`,
    cypressSnippet: `it('verify accessibility compliance', () => {
  cy.visit('/playground/accessibility-tree');
  cy.injectAxe(); 
  cy.checkA11y();
});`,
    playgroundPath: 'accessibility-tree',
    supportedFrameworks: [Framework.PLAYWRIGHT]
  },
  {
    id: 'inter-file-upload',
    title: 'File Upload Interactions',
    category: Category.WEB_UI,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Practice uploading files and asserting the upload status and metadata.',
    learningObjectives: [
      'Using setInputFiles or selectFile',
      'Handling hidden file inputs',
      'Verifying post-upload UI changes'
    ],
    playwrightSnippet: `test('should upload a configuration file', async ({ page }) => {
  await page.goto('/playground/file-upload');
  await page.setInputFiles('input[type="file"]', {
    name: 'config.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"test": true}')
  });
  await expect(page.getByText('File "config.json" uploaded')).toBeVisible();
});`,
    cypressSnippet: `it('should upload a configuration file', () => {
  cy.visit('/playground/file-upload');
  cy.get('input[type="file"]').selectFile({
    contents: JSON.stringify({ test: true }),
    fileName: 'config.json',
  });
  cy.contains('File "config.json" uploaded').should('be.visible');
});`,
    playgroundPath: 'file-upload',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  },
  {
    id: 'adv-selectors-deep',
    title: 'Surgical CSS Selectors',
    category: Category.ADVANCED_SELECTORS,
    difficulty: Difficulty.INTERMEDIATE,
    description: 'Target elements that lack IDs using complex CSS combinations and custom data attributes.',
    learningObjectives: [
      'Attribute-based selection [data-test-id]',
      'Using CSS nth-of-type or nth-child',
      'Combining locators for precision'
    ],
    playwrightSnippet: `test('should click specific item in list', async ({ page }) => {
  await page.goto('/playground/advanced-selectors');
  await page.locator('.item-container [data-item-type="premium"]:nth-child(3)').click();
  await expect(page.locator('.selection-status')).toContainText('Premium Item 3 selected');
});`,
    cypressSnippet: `it('should click specific item in list', () => {
  cy.visit('/playground/advanced-selectors');
  cy.get('.item-container [data-item-type="premium"]').eq(2).click();
  cy.get('.selection-status').should('contain', 'Premium Item 3 selected');
});`,
    playgroundPath: 'advanced-selectors',
    supportedFrameworks: [Framework.PLAYWRIGHT, Framework.CYPRESS]
  }
];
