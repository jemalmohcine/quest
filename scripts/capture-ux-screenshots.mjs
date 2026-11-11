#!/usr/bin/env node
/**
 * Headless screenshots for UX overhaul (390x844 mobile, 1440x900 desktop).
 * AFTER: run with NEXT_PUBLIC_QUEST_SCREENSHOT_FIXTURES=1 on the app server.
 * BEFORE (in-app): same fixtures on main build, or use existing prod captures for login.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = '/opt/cursor/artifacts';
const phase = process.argv.includes('--before') ? 'before' : 'after';
const baseUrl =
  process.argv.find((a) => a.startsWith('--url='))?.split('=')[1] ??
  (phase === 'before' ? 'https://quest-v0.vercel.app' : 'http://127.0.0.1:3010');

const mobile = { width: 390, height: 844 };
const desktop = { width: 1440, height: 900 };

async function shot(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(400);
  const file = path.join(OUT, `${name}-${phase}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', file);
}

async function clickNavByIndex(page, index) {
  const nav = page.locator('nav').filter({ has: page.locator('button') }).last();
  const btn = nav.locator('button').nth(index);
  await btn.click({ timeout: 15000 });
  await page.waitForTimeout(600);
}

async function captureApp(page, viewport, suffix = '') {
  await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1200);

  await shot(page, `01-home${suffix}`, viewport);
  await clickNavByIndex(page, 1);
  await shot(page, `02-activities${suffix}`, viewport);
  await clickNavByIndex(page, 2);
  await shot(page, `03-stats${suffix}`, viewport);
  await clickNavByIndex(page, 3);
  await shot(page, `04-resumes${suffix}`, viewport);
  await clickNavByIndex(page, 4);
  await shot(page, `05-settings-goals${suffix}`, viewport);

  await clickNavByIndex(page, 0);
  const logBtn = page.getByRole('button', { name: /log deed|enregistrer un acte/i });
  await logBtn.first().click();
  await page.waitForTimeout(700);
  await shot(page, `06-log-deed${suffix}`, viewport);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const progressWidget = page.getByRole('button', { name: /progress|progrès|widget/i }).first();
  if ((await progressWidget.count()) > 0) {
    await progressWidget.click();
    await page.waitForTimeout(600);
    await shot(page, `07-timer${suffix}`, viewport);
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  const mobileCtx = await browser.newContext({ viewport: mobile, colorScheme: 'light' });
  const mobilePage = await mobileCtx.newPage();

  await mobilePage.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await shot(mobilePage, '08-auth', mobile);

  if (phase === 'after' || process.env.SCREENSHOT_FIXTURES === '1') {
    await captureApp(mobilePage, mobile);
  }

  const deskCtx = await browser.newContext({ viewport: desktop, colorScheme: 'light' });
  const deskPage = await deskCtx.newPage();
  if (phase === 'after' || process.env.SCREENSHOT_FIXTURES === '1') {
    await deskPage.goto(`${baseUrl}/app`, { waitUntil: 'networkidle' });
    await deskPage.waitForTimeout(1000);
    await shot(deskPage, '09-home-desktop', desktop);
    const sidebarButtons = deskPage.locator('aside nav button');
    if ((await sidebarButtons.count()) >= 5) {
      await sidebarButtons.nth(4).click();
      await deskPage.waitForTimeout(600);
    }
    await shot(deskPage, '10-settings-desktop', desktop);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
