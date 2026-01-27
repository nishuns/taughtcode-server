import { GoogleGenAI } from "@google/genai";
import BaseAIProvider from "../base.js";
import { AI_CONFIG } from "../../../config/ai.js";

class GeminiAIProvider extends BaseAIProvider {
    constructor() {
        super();

        if (!AI_CONFIG.gemini.apiKey) {
            throw new Error("GEMINI_API_KEY is not configured in environment variables");
        }

        this.ai = new GoogleGenAI({
            apiKey: AI_CONFIG.gemini.apiKey,
        });

        this.config = AI_CONFIG.gemini;
        this.toolsEnabled = AI_CONFIG.common.enableTools;
    }

    /**
     * Helper to safely extract text from response
     * @private
     */
    _getText(response) {
        if (typeof response.text === 'function') {
            return response.text();
        }
        return response.text || "";
    }

    /**
     * Helper to safely extract function calls from response
     * @private
     */
    _getFunctionCalls(response) {
        if (typeof response.functionCalls === 'function') {
            return response.functionCalls();
        }
        return response.functionCalls || null;
    }

    /**
     * Generate text from a single prompt
     * @param {string} prompt - The prompt to generate text from
     * @param {object} options - Generation options
     * @param {string} options.model - Model to use ('flash' or 'pro' or full model name)
     * @param {number} options.temperature - Sampling temperature
     * @param {number} options.maxTokens - Maximum tokens to generate
     * @param {boolean} options.useTools - Enable Google Search grounding (default: false)
     * @param {string} options.responseMimeType - Response MIME type (e.g., 'application/json')
     * @param {object} options.responseJsonSchema - JSON schema for structured output
     * @returns {Promise<object>} - Generated text response with optional grounding metadata
     */
    async generateText(prompt, options = {}) {
        try {
            const model = this._getModelName(options.model);
            const useTools = options.useTools && this.toolsEnabled;

            const config = {
                model: model,
                contents: prompt,
                generationConfig: {
                    temperature: options.temperature || this.config.generationConfig.temperature,
                    maxOutputTokens: options.maxTokens || this.config.generationConfig.maxOutputTokens,
                    topP: options.topP || this.config.generationConfig.topP,
                    topK: options.topK || this.config.generationConfig.topK,
                },
            };

            // Add structured output configuration
            if (options.responseMimeType) {
                config.config = config.config || {};
                config.config.responseMimeType = options.responseMimeType;
            }

            if (options.responseJsonSchema) {
                config.config = config.config || {};
                config.config.responseSchema = options.responseJsonSchema;
            }

            // Add tools if enabled
            if (useTools || options.tools) {
                config.config = config.config || {};
                config.config.tools = this._getToolsConfig(options.tools, useTools);
            }

            const response = await this.ai.models.generateContent(config);

            // With grounding tool, results are automatically included in response
            return {
                success: true,
                text: this._getText(response),
                provider: "gemini",
                model: model,
                groundingMetadata: response.groundingMetadata || null,
                functionCalls: this._getFunctionCalls(response),
            };
        } catch (error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }

    /**
     * Chat with conversational context
     * @param {Array} messages - Array of message objects with role and content
     * @param {object} options - Generation options
     * @param {boolean} options.useTools - Enable Google Search grounding (default: false)
     * @param {string} options.responseMimeType - Response MIME type (e.g., 'application/json')
     * @param {object} options.responseJsonSchema - JSON schema for structured output
     * @returns {Promise<object>} - Generated response message with optional grounding metadata
     */
    async chat(messages, options = {}) {
        try {
            const model = this._getModelName(options.model);
            const useTools = options.useTools && this.toolsEnabled;

            // Convert messages to Gemini format
            const contents = messages.map(msg => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            }));

            const config = {
                model: model,
                contents: contents,
                generationConfig: {
                    temperature: options.temperature || this.config.generationConfig.temperature,
                    maxOutputTokens: options.maxTokens || this.config.generationConfig.maxOutputTokens,
                    topP: options.topP || this.config.generationConfig.topP,
                    topK: options.topK || this.config.generationConfig.topK,
                },
            };

            // Add structured output configuration
            if (options.responseMimeType) {
                config.config = config.config || {};
                config.config.responseMimeType = options.responseMimeType;
            }

            if (options.responseJsonSchema) {
                config.config = config.config || {};
                config.config.responseSchema = options.responseJsonSchema;
            }

            // Add tools if enabled
            if (useTools || options.tools) {
                config.config = config.config || {};
                config.config.tools = this._getToolsConfig(options.tools, useTools);
            }

            const response = await this.ai.models.generateContent(config);

            // With grounding tool, results are automatically included in response
            return {
                success: true,
                message: {
                    role: "assistant",
                    content: this._getText(response),
                },
                provider: "gemini",
                model: model,
                groundingMetadata: response.groundingMetadata || null,
                functionCalls: this._getFunctionCalls(response),
            };
        } catch (error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }

    /**
     * Get tools configuration for Gemini
     * @private
     * @param {object[]} customTools - Custom function declarations
     * @param {boolean} useGoogleSearch - Whether to enable Google Search
     * @returns {object[]}
     */
    _getToolsConfig(customTools = [], useGoogleSearch = false) {
        const tools = [];

        // Use Gemini's native grounding tool (Google Search)
        if (useGoogleSearch) {
            tools.push({ googleSearch: {} });
        }

        // Add custom function declarations
        if (customTools && customTools.length > 0) {
            // If customTools is array of function declarations, wrap it
            // The structure expected by Gemini SDK is usually [{ functionDeclarations: [...] }]
            // but checking if the user passed pre-formatted tools or just declarations
            const hasDeclarations = customTools.some(t => t.functionDeclarations);

            if (hasDeclarations) {
                tools.push(...customTools);
            } else {
                // Assume these are raw function declarations
                tools.push({ functionDeclarations: customTools });
            }
        }

        return tools;
    }

    /**
     * Helper method to resolve model name
     * Supports: 'flash', 'pro', or full model name
     * @private
     */
    _getModelName(modelOption) {
        if (!modelOption) {
            return this.config.defaultModel;
        }

        // Check if it's a shorthand (flash/pro)
        if (modelOption === "flash") {
            return this.config.models.flash;
        }

        if (modelOption === "pro") {
            return this.config.models.pro;
        }

        // Otherwise, assume it's a full model name
        return modelOption;
    }
}

export default GeminiAIProvider;