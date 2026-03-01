import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const CACHE_FILE = path.join(process.cwd(), 'daily_quote.json');

export const getQuoteOfTheDay = async () => {
    try {
        // 1. Try to read from cache
        let cache = null;
        try {
            const content = await fs.readFile(CACHE_FILE, 'utf-8');
            cache = JSON.parse(content);
        } catch (e) {
            // No cache yet
        }

        const today = new Date().toISOString().split('T')[0];

        if (cache && cache.date === today) {
            return cache.data;
        }

        // 2. Fetch from OpenAI if no valid cache
        console.log('Fetching new daily quote from OpenAI...');
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that generates professional, powerful, and short inspirational quotes for a productivity dashboard."
                },
                {
                    role: "user",
                    content: "Generate a short inspirational quote (max 15 words) for a professional workspace. Focus on themes like focus, teamwork, progress, or leadership. Return strictly valid JSON: { \"quote\": \"string\", \"author\": \"string\" }"
                }
            ],
            response_format: { type: "json_object" }
        });

        const quoteData = JSON.parse(response.choices[0].message.content);

        // 3. Save to cache
        await fs.writeFile(CACHE_FILE, JSON.stringify({
            date: today,
            data: quoteData
        }));

        return quoteData;
    } catch (error) {
        console.error('Error fetching quote:', error);
        return {
            quote: "Small progress is still progress.",
            author: "Anonymous"
        };
    }
};
