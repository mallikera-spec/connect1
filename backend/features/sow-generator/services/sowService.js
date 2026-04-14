import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as docx from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates SoW PDF document from template.
 */
export const generatePDF = async (data) => {
  const templatePath = path.join(__dirname, '../templates/sow-template.ejs');
  const html = await ejs.renderFile(templatePath, { data });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:9px; color:#2E86C1; width:100%; padding:5px 15mm; 
                    border-bottom:1px solid #2E86C1; font-family:Arial;">
          Argosmob Tech and AI Pvt. Ltd. | <span class="title"></span>
        </div>`,
      footerTemplate: `
        <div style="font-size:9px; color:#888; width:100%; padding:5px 15mm; 
                    border-top:1px solid #ddd; font-family:Arial; display:flex; 
                    justify-content:space-between;">
          <span>CONFIDENTIAL</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>`,
    });

    return pdf; // Buffer
  } finally {
    await browser.close();
  }
};

/**
 * Generates SoW DOCX document.
 */
export const generateDOCX = async (data) => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = docx;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: data.sow_data.project_overview.project_summary_table.find(r => r.key === 'Project Name')?.value || 'Scope of Work',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Client: ${data.client_name}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Start Date: ${data.project_start_date}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '', spacing: { before: 400 } }),
          new Paragraph({
            text: 'Project Objective',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: data.sow_data.project_overview.project_objective,
          }),
          // ... (More sections can be added here)
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
};
