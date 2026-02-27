import { generateQuotationPDF } from './features/quotations/services/pdfService.js';
import fs from 'fs';

const mockQuotationData = {
    clientName: "Timeout Test Client",
    projectName: "Speedy Logistics",
    industry: "Logistics",
    projectType: "Enterprise Platform",
    overview: ["Optimizing for speed", "Reducing latency"],
    visuals: {
        diagrams: [],
        analytics: []
    },
    // Using real public URLs to test Puppeteer's ability to fetch while rendering
    conceptualIllustration: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1024"
};

const mockUrls = {
    mobileHome: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1024",
    mobileFlow: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=1024",
    dashboard: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1024"
};

async function test() {
    console.log("Generating PDF with external URLs (Performance Mode)...");
    try {
        const start = Date.now();
        const buffer = await generateQuotationPDF(mockQuotationData, 'corporate', mockUrls);
        fs.writeFileSync('test_optimized_quotation.pdf', buffer);
        const duration = (Date.now() - start) / 1000;
        console.log(`✓ PDF Generated successfully in ${duration}s: test_optimized_quotation.pdf`);
    } catch (err) {
        console.error("Verification failed:", err);
    }
}

test();
