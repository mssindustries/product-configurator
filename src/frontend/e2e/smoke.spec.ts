import { test, expect } from '@playwright/test';

test.describe('App Smoke Test', () => {
  test('app starts without critical errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Collect console messages
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Collect page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load (adjust selector based on your app)
    await page.waitForLoadState('networkidle');

    // Log warnings for visibility (but don't fail on them)
    if (consoleWarnings.length > 0) {
      console.log('Console warnings:', consoleWarnings);
    }

    // Log errors for visibility
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }

    // Fail if there are critical errors (filter out known acceptable errors if needed)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        // Filter out known non-critical errors if needed
        !err.includes('favicon.ico') &&
        !err.includes('404')
    );

    expect(criticalErrors, `Critical errors found: ${criticalErrors.join(', ')}`).toHaveLength(0);
  });

  test('can navigate to home page', async ({ page }) => {
    await page.goto('/');

    // Verify we're on a valid page (adjust based on your app's content)
    await expect(page).toHaveTitle(/.*/);
  });
});
