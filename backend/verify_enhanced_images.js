import { generateImagePrompts } from './features/quotations/services/anthropicService.js';
import { generateImages } from './features/quotations/services/imageService.js';

const testContext = {
    projectName: "SafeGuard Health Plus",
    industry: "Healthcare",
    projectType: ["Mobile App", "Admin Dashboard"]
};

async function test() {
    console.log("Starting enhanced image generation test...");
    try {
        console.log("1. Generating Claude-enhanced prompts...");
        const customPrompts = await generateImagePrompts(testContext);
        console.log("Claude Prompts Generated:");
        console.log("- Mobile Home:", customPrompts.mobileHome.substring(0, 50) + "...");

        console.log("2. Generating images with DALL-E using these prompts...");
        const images = await generateImages(testContext, customPrompts);

        console.log("Final Result:");
        console.log("- Mobile Home Base64 length:", images.mobileHome.length);
        console.log("- Dashboard Base64 length:", images.dashboard.length);

        if (images.mobileHome.startsWith('data:image/png;base64,')) {
            console.log("✓ Dynamic Enhanced Image is valid Base64");
        }

    } catch (error) {
        console.error("Enhanced test failed:", error);
    }
}

test();
