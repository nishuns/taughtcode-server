import { AIProvider } from "../providers/ai/registry.js";

const ai = AIProvider(process.env.AI_PROVIDER || "gemini");

async function generateText(prompt, options = {}) {
    try {
        const result = await ai.generateText(prompt, options);
        return result;
    } catch (error) {
        throw new Error(`AI Service Error: ${error.message}`);
    }
}

async function chat(messages, options = {}) {
    try {
        const result = await ai.chat(messages, options);
        return result;
    } catch (error) {
        throw new Error(`AI Service Error: ${error.message}`);
    }
}

async function* chatStream(messages, options = {}) {
    try {
        const stream = await ai.chatStream(messages, options);
        for await (const chunk of stream) {
            yield chunk;
        }
    } catch (error) {
        throw new Error(`AI Service Error: ${error.message}`);
    }
}

async function generateImage(prompt, options = {}) {
    try {
        return await ai.generateImage(prompt, options);
    } catch (error) {
        throw new Error(`AI Service Error: ${error.message}`);
    }
}

export { generateText, chat, chatStream, generateImage };
