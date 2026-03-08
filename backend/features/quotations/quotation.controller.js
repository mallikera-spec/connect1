import { generateQuotationJSON } from './services/openaiService.js';
import { generateQuotationJSONTemplate2 } from './services/openaiServiceTemplate2.js';
import { generateQuotationJSONTemplate3 } from './services/openaiServiceTemplate3.js';
import { generateQuotationPDF } from './services/pdfService.js';
import { generateQuotationPDFTemplate2 } from './services/pdfServiceTemplate2.js';
import { generateQuotationPDFTemplate3 } from './services/pdfServiceTemplate3.js';
import { generateQuotationWord } from './services/wordService.js';
import { generateImages, generateConceptualIllustration } from './services/imageService.js';
import { successResponse } from '../../utils/apiResponse.js';
import { StatusCodes } from 'http-status-codes';

export const previewQuotation = async (req, res) => {
    const {
        clientName, industry, projectType, problemStatement,
        keyFeatures, targetAudience, budget, timeline,
        provider = 'openai', style = 'corporate'
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
        let quotationContent;
        if (style === 'template2') {
            quotationContent = await generateQuotationJSONTemplate2(wizardData);
        } else if (style === 'template3') {
            quotationContent = await generateQuotationJSONTemplate3(wizardData);
        } else {
            quotationContent = await generateQuotationJSON(wizardData);
        }
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
        let pdfBuffer, docxBuffer;

        if (style === 'template2') {
            [pdfBuffer, docxBuffer] = await Promise.all([
                generateQuotationPDFTemplate2(quotationData),
                generateQuotationWord(quotationData, style), // Fallback word for now
            ]);
        } else if (style === 'template3') {
            [pdfBuffer, docxBuffer] = await Promise.all([
                generateQuotationPDFTemplate3(quotationData, style, {}),
                generateQuotationWord(quotationData, style), // Fallback word for now
            ]);
        } else {
            [pdfBuffer, docxBuffer] = await Promise.all([
                generateQuotationPDF(quotationData, style, {}),
                generateQuotationWord(quotationData, style),
            ]);
        }

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

