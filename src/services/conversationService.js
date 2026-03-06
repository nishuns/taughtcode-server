import { Conversation } from '../models/index.js';
import * as aiService from './aiService.js';
import { uploadUserAsset } from './storageService.js';
import { imageGeneratorToolSchema } from '../tools/imageGenerator.js';

/**
 * Service for handling AI conversation threads
 */
class ConversationService {
    /**
     * Create a new conversation thread
     * @param {string} userId 
     * @param {string} title 
     * @param {string} initialMessage 
     * @returns {Promise<object>} The created thread document
     */
    async createThread(userId, title, initialMessage) {
        const threadData = {
            userId,
            title: title || 'New Conversation',
            messages: []
        };

        if (initialMessage) {
            threadData.messages.push({
                role: 'user',
                content: initialMessage,
                timestamp: new Date().toISOString()
            });
        }

        // FirebaseModel.create returns { id, ...data }
        return await Conversation.create(threadData);
    }

    /**
     * Get a conversation thread by ID
     * @param {string} threadId 
     * @returns {Promise<object>}
     */
    async getThread(threadId) {
        const thread = await Conversation.findById(threadId);
        if (!thread) {
            throw new Error('Conversation not found');
        }
        return thread;
    }

    /**
     * Update thread metadata (title, pinned status)
     * @param {string} threadId 
     * @param {object} updates 
     * @returns {Promise<object>}
     */
    async updateThread(threadId, updates) {
        const allowedUpdates = ['title', 'isPinned'];
        const filteredUpdates = {};
        
        allowedUpdates.forEach(key => {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        });

        if (Object.keys(filteredUpdates).length === 0) {
            throw new Error('No valid update fields provided');
        }

        return await Conversation.findByIdAndUpdate(threadId, filteredUpdates, { new: true });
    }

    /**
     * Get all conversations for a user
     * @param {string} userId 
     * @returns {Promise<Array>}
     */
    async getUserThreads(userId) {
        return await Conversation.getByUserId(userId);
    }

    /**
     * Add a message to an existing thread
     * @param {string} threadId 
     * @param {string} role 'user' | 'assistant'
     * @param {string} content 
     * @returns {Promise<object>}
     */
    async addMessageToThread(threadId, role, content) {
        const newMessage = {
            role,
            content,
            timestamp: new Date().toISOString()
        };

        await Conversation.addMessage(threadId, newMessage);
        return newMessage;
    }

    /**
     * Get the stream for a new message, saving the history
     * @param {string} userId
     * @param {string} threadId 
     * @param {string} userMessage 
     * @returns {AsyncGenerator}
     */
    async *streamReply(userId, threadId, userMessage) {
        // 1. Add user message to the thread
        await this.addMessageToThread(threadId, 'user', userMessage);

        // 2. Prepare the context for the AI (all previous messages + the one just added)
        const updatedThread = await this.getThread(threadId);
        const messagesForAI = updatedThread.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 3. Request the stream from AI Service
        const stream = aiService.chatStream(messagesForAI, {
            tools: [{ functionDeclarations: [imageGeneratorToolSchema] }]
        });

        // 4. Yield chunks and aggregate full response
        let fullResponse = '';
        for await (const chunk of stream) {
            if (chunk && chunk.text) {
                fullResponse += chunk.text;
                yield chunk.text;
            }

            // Handle function calls
            if (chunk && chunk.functionCalls && chunk.functionCalls.length > 0) {
                for (const call of chunk.functionCalls) {
                    if (call.name === 'generate_image') {
                        const args = call.args || {};
                        const prompt = args.prompt;
                        
                        yield '\n\n*Generating image...*\n\n';
                        
                        try {
                            const imageResult = await aiService.generateImage(prompt);
                            
                            if (imageResult && imageResult.images && imageResult.images.length > 0) {
                                // Assume first image
                                const inlineData = imageResult.images[0].inlineData;
                                const buffer = Buffer.from(inlineData.data, 'base64');
                                const mimeType = inlineData.mimeType;
                                
                                const filename = `${threadId}_${Date.now()}.png`;
                                const uploadResult = await uploadUserAsset(userId, buffer, mimeType, 'threads', filename);
                                
                                const markdownImage = `\n\n![Generated Image](${uploadResult.publicUrl})\n\n`;
                                fullResponse += markdownImage;
                                yield markdownImage;
                            } else {
                                const errorMsg = '\n\n*Failed to generate image.*\n\n';
                                fullResponse += errorMsg;
                                yield errorMsg;
                            }
                        } catch (error) {
                            console.error('Image generation error:', error);
                            const errorMsg = `\n\n*Failed to generate image: ${error.message}*\n\n`;
                            fullResponse += errorMsg;
                            yield errorMsg;
                        }
                    }
                }
            }
        }

        // 5. Save the complete AI response
        if (fullResponse) {
            await this.addMessageToThread(threadId, 'assistant', fullResponse);
        }
    }
    
    /**
     * Delete a conversation
     * @param {string} threadId 
     */
    async deleteThread(threadId) {
        return await Conversation.findByIdAndDelete(threadId);
    }
}

export default new ConversationService();
