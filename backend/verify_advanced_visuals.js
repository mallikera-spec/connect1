import { generateQuotationPDF } from './features/quotations/services/pdfService.js';
import fs from 'fs';

const mockQuotationData = {
    clientName: "Global Logistics Tech",
    projectName: "LogiFlow AI",
    industry: "Logistics",
    projectType: "Enterprise Platform",
    overview: ["AI Powered logistics management", "Real-time fleet tracking"],
    features: [
        { module: "Fleet Management", items: ["Live tracking", "Fuel monitoring"] }
    ],
    commercialEstimate: "₹25,00,000 INR",
    visuals: {
        diagrams: [
            {
                title: "Delivery Lifecycle",
                mermaid: "graph LR; Order-->Warehouse; Warehouse-->Dispatch; Dispatch-->Customer;"
            }
        ],
        analytics: [
            {
                title: "Operational Efficiency",
                type: "bar",
                data: { labels: ["Old System", "LogiFlow AI"], values: [45, 92] }
            }
        ],
        illustrationPrompt: "A futuristic 3D isometric representation of a global AI logistics network with glowing data paths."
    },
    conceptualIllustration: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" // Mock small image
};

const mockImages = {
    mobileHome: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    mobileFlow: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    dashboard: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
};

async function test() {
    console.log("Generating Advanced PDF...");
    try {
        const buffer = await generateQuotationPDF(mockQuotationData, 'corporate', mockImages);
        fs.writeFileSync('test_advanced_quotation.pdf', buffer);
        console.log("✓ PDF Generated successfully: test_advanced_quotation.pdf");
        console.log("Check the PDF for Mermaid diagrams and Chart.js visuals.");
    } catch (err) {
        console.error("Verification failed:", err);
    }
}

test();
