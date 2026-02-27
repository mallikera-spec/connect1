import OpenAI from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetches an image from a URL and converts it to base64.
 * @param {string} url - The image URL.
 * @returns {Promise<string>} Base64 encoded image with data URI prefix.
 */
const getBase64FromUrl = async (url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        return `data:image/png;base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error("Error fetching image for base64 conversion:", error);
        return "";
    }
};

/**
 * Generates dynamic prototype images using DALL-E 3.
 * @param {Object} context - { projectName, industry, projectType }
 * @param {Object} customPrompts - Optional pre-generated prompts from Claude.
 * @returns {Promise<Object>} Object containing base64 strings for mobileHome, mobileFlow, and dashboard.
 */
export const generateImages = async (context, customPrompts = null) => {
    const { projectName, industry, projectType } = context;
    const typeStr = Array.isArray(projectType) ? projectType.join(' and ') : projectType;

    const defaultPrompts = {
        homePage: `Professionally designed mobile app home screen UI for '${projectName}', a ${typeStr} solution in the ${industry} industry. High-fidelity, modern, clean aesthetic, 4k, premium look.`,
        flowchart: `Professional 3D isometric flowchart diagram for a ${typeStr} system in the ${industry} industry. Clean lines, logical process flow, modern enterprise aesthetic, minimal text, high visual impact.`,
        architecture: `High-level technical system architecture visualization for '${projectName}'. Clean server, cloud, and data node icons, isometric view, professional enterprise IT infrastructure aesthetic.`
    };

    const finalPrompts = customPrompts ? {
        homePage: customPrompts.homePage || defaultPrompts.homePage,
        flowchart: customPrompts.flowchart || defaultPrompts.flowchart,
        architecture: customPrompts.architecture || defaultPrompts.architecture
    } : defaultPrompts;

    try {
        const [homeRes, flowRes, archRes] = await Promise.all([
            openai.images.generate({
                model: "dall-e-3",
                prompt: finalPrompts.homePage,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            }),
            openai.images.generate({
                model: "dall-e-3",
                prompt: finalPrompts.flowchart,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            }),
            openai.images.generate({
                model: "dall-e-3",
                prompt: finalPrompts.architecture,
                n: 1,
                size: "1024x1024",
                quality: "standard",
            })
        ]);

        return {
            homePage: homeRes.data[0].url,
            flowchart: flowRes.data[0].url,
            architecture: archRes.data[0].url
        };
    } catch (error) {
        console.error("Error generating images with DALL-E:", error);
        return { homePage: "", flowchart: "", architecture: "" };
    }
};

/**
 * Generates a conceptual illustration using DALL-E 3.
 * @param {string} prompt - The descriptive prompt from the AI.
 * @returns {Promise<string>} Image URL.
 */
export const generateConceptualIllustration = async (prompt) => {
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt + ". Professional, premium, 3D isometric illustration, vibrant colors, clean aesthetic.",
            n: 1,
            size: "1024x1024",
            quality: "standard",
        });

        return response.data[0].url;
    } catch (error) {
        console.error("Error generating conceptual illustration:", error);
        return "";
    }
};
