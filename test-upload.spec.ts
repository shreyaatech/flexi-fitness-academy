import { test, expect } from '@playwright/test';

test('upload media from browser', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:3001/login');
  
  // Login as admin
  await page.fill('input[placeholder*="ID or Email"]', 'admin@123');
  await page.fill('input[type="password"]', '123');
  await page.click('button[type="submit"]');

  // Wait for Admin Portal authentication gate
  await page.waitForSelector('text=Admin Portal');
  await page.fill('input[placeholder="••••••••"]', '123');
  await page.click('button:has-text("Authenticate")');

  // Click Upload Global Media in sidebar
  await page.click('button:has-text("Upload Global Media")');

  // Wait for modal
  await page.waitForSelector('h3:has-text("Upload Global Media")');

  // Set file
  await page.setInputFiles('input[type="file"]', 'test.txt');

  // Click Upload
  await page.click('button:has-text("Upload Media")');

  // Check if it finishes (modal closes)
  await page.waitForSelector('text=Upload Global Media', { state: 'hidden' });
  
  console.log('Upload successful');
});
