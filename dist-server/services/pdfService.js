import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
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
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [297, 167.1],
        });
        const tempImgDir = path.join(process.cwd(), 'img', 'temp_pdf');
        if (!fs.existsSync(tempImgDir)) {
            fs.mkdirSync(tempImgDir, { recursive: true });
        }
        for (let i = 0; i < pages.length; i++) {
            const customPage = pages[i];
            // Note: Using localhost:3000 or 3001 depending on where the app is served. 
            // Assuming 3001 for the dev server as per previous logs.
            const url = `http://localhost:3001/?client=${encodeURIComponent(client)}&page=${customPage.id}&isPdfMode=true`;
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
            await page.waitForSelector('#root', { timeout: 30000 }).catch(() => new Promise(res => setTimeout(res, 2000)));
            // Give a bit more time for charts/widgets to stabilize if needed
            await new Promise(resolve => setTimeout(resolve, 2000));
            const imgPath = path.join(tempImgDir, `page_${i}.png`);
            await page.screenshot({ path: imgPath });
            const imgData = fs.readFileSync(imgPath).toString('base64');
            if (i > 0) {
                pdf.addPage([297, 167.1], 'landscape');
            }
            pdf.addImage(`data:image/png;base64,${imgData}`, 'PNG', 0, 0, 297, 167.1);
            // Clean up temp image
            fs.unlinkSync(imgPath);
        }
        const timestamp = new Date().getTime();
        const pdfPath = path.join(downloadsPath, `Relatorio_vRx_${client}_${timestamp}.pdf`);
        const buffer = Buffer.from(pdf.output('arraybuffer'));
        fs.writeFileSync(pdfPath, buffer);
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
