import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
const getAppBaseUrl = () => {
    if (process.env.APP_BASE_URL) {
        return process.env.APP_BASE_URL;
    }
    const port = Number(process.env.PORT) || 3000;
    return `http://localhost:${port}`;
};
export async function generatePdfFromUrl(url) {
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
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF.');
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
}
export async function generatePdfFromPages(client, pages) {
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
        await page.evaluateOnNewDocument(({ selectedClient, selectedPages }) => {
            localStorage.setItem('selected_client', selectedClient);
            localStorage.setItem('custom_pages', JSON.stringify(selectedPages));
        }, {
            selectedClient: client,
            selectedPages: pages
        });
        const baseUrl = getAppBaseUrl();
        const url = `${baseUrl}/?client=${encodeURIComponent(client)}&exportAll=true&isPdfMode=true`;
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
        await page.waitForSelector('#root', { timeout: 30000 });
        await page.waitForSelector('.pdf-page-wrapper', { timeout: 30000 }).catch(() => null);
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
    }
    catch (error) {
        console.error('Error generating PDF from pages:', error);
        throw error;
    }
    finally {
        if (browser)
            await browser.close();
    }
}
