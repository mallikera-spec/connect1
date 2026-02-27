import { generateQuotationAnthropic } from './features/quotations/services/anthropicService.js';
import { generateQuotationJSON } from './features/quotations/services/openaiService.js';

const testData = {
    clientName: "Global Logistics Corp",
    industry: "Logistics & Supply Chain",
    projectType: "Real-time Fleet Tracking & AI Optimizer",
    problemStatement: "Current manual dispatching causes 20% fuel waste and frequent delivery delays.",
    keyFeatures: ["Live GPS tracking", "AI Route Optimization", "Driver Performance Dashboard"],
    targetAudience: "Operations managers and dispatchers",
    budget: "₹45,00,000",
    timeline: "6 months"
};

async function verify() {
    console.log("=== Testing Content Density (Opus 4.6 / GPT-4o) ===");

    try {
        console.log("\n1. Testing Anthropic (Opus 4.6)...");
        const anthResult = await generateQuotationAnthropic(testData);
        console.log("✓ Methodology Length:", anthResult.methodology?.length || 0);
        console.log("✓ Security Length:", anthResult.security?.length || 0);
        if (anthResult.methodology) console.log("Sample:", anthResult.methodology[0]);

        console.log("\n2. Testing OpenAI (GPT-4o)...");
        const oaiResult = await generateQuotationJSON(testData);
        console.log("✓ Methodology Length:", oaiResult.methodology?.length || 0);
        console.log("✓ Security Length:", oaiResult.security?.length || 0);
        if (oaiResult.methodology) console.log("Sample:", oaiResult.methodology[0]);

    } catch (err) {
        console.error("Verification failed:", err);
    }
}

verify();
