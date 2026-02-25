import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import { CustomPage } from '../types.js';

export async function generatePdfFromUrl(url: string): Promise<string> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    const downloadsPath = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }

    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    const timestamp = new Date().getTime();
    const filename = `relatorio_${timestamp}.pdf`;
    const pdfPath = path.join(downloadsPath, filename);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
    });

    return pdfPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function generatePdfFromPages(client: string, pages: CustomPage[]): Promise<string> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const downloadsPath = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(downloadsPath)) {
      fs.mkdirSync(downloadsPath, { recursive: true });
    }

    const url = `http://localhost:3001/?client=${encodeURIComponent(client)}&exportAll=true&isPdfMode=true`;

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
    await page.waitForSelector('#root', { timeout: 30000 }).catch(() => new Promise(res => setTimeout(res, 2000)));
    // Give more time for charts/widgets to stabilize if needed since it's a long page
    await new Promise(resolve => setTimeout(resolve, 5000));

    const timestamp = new Date().getTime();
    const pdfPath = path.join(downloadsPath, `Relatorio_vRx_${client}_${timestamp}.pdf`);

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
    });

    return pdfPath;
  } catch (error) {
    console.error('Error generating PDF from pages:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
