import { generateQuotationJSON } from './services/openaiService.js';
import { generateQuotationPDF } from './services/pdfService.js';
import { generateQuotationWord } from './services/wordService.js';
import { generateImages, generateConceptualIllustration } from './services/imageService.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const previewQuotation = async (req, res) => {
    const {
        clientName, industry, projectType, problemStatement,
        keyFeatures, targetAudience, budget, timeline,
        provider = 'openai'
    } = req.body;

    if (!industry || !projectType) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Industry and project type are required.' });
    }

    const wizardData = {
        clientName: clientName || '',
        industry,
        projectType,
        problemStatement: problemStatement || '',
        keyFeatures: keyFeatures || [],
        targetAudience: targetAudience || '',
        budget: budget || 'Not specified',
        timeline: timeline || 'Not specified',
    };

    try {
        const quotationContent = await generateQuotationJSON(wizardData);
        successResponse(res, quotationContent, 'Preview generated');
    } catch (err) {
        console.error("Preview Generation Error:", err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message || 'AI generation failed. Please try again or check your API keys.'
        });
    }
};

export const finalizeQuotation = async (req, res) => {
    // Extend timeout to 2 minutes for AI generation
    req.setTimeout(120000);

    const { quotationData, style = 'corporate', provider = 'openai' } = req.body;

    if (!quotationData) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'quotationData is required.' });
    }

    try {
        const [pdfBuffer, docxBuffer] = await Promise.all([
            generateQuotationPDF(quotationData, style, {}),
            generateQuotationWord(quotationData, style),
        ]);

        successResponse(res, {
            pdfBase64: Buffer.from(pdfBuffer).toString('base64'),
            docxBase64: Buffer.from(docxBuffer).toString('base64'),
        }, 'Documents generated');
    } catch (err) {
        console.error("Finalization Error:", err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: err.message || 'Failed to generate PDF. Please try again.'
        });
    }
};
