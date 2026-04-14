import OpenAI from 'openai';
import { buildClaudePrompt, SYSTEM_PROMPT } from '../utils/prompt.builder.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calls OpenAI API to generate structured project documentation.
 * @param {Object} formData - Project Manager input form data.
 * @returns {Promise<Object>} - Parsed JSON from GPT-4o.
 */
export const generateProjectData = async (formData) => {
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  
  try {
    const userPrompt = buildClaudePrompt(formData);

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);

    return {
      success: true,
      data: parsed,
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
      },
      model: response.model,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to generate project data: ${error.message}`);
  }
};
