import { Conversation } from '../models/index.js';
import * as aiService from './aiService.js';

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
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (initialMessage) {
            threadData.messages.push({
                role: 'user',
                content: initialMessage,
                timestamp: new Date().toISOString()
            });
        }

        const id = await Conversation.create(threadData);
        return { id, ...threadData };
    }

    /**
     * Get a conversation thread by ID
     * @param {string} threadId 
     * @returns {Promise<object>}
     */
    async getThread(threadId) {
        const thread = await Conversation.getById(threadId);
        if (!thread) {
            throw new Error('Conversation not found');
        }
        return thread;
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
        const thread = await this.getThread(threadId);
        
        const newMessage = {
            role,
            content,
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...(thread.messages || []), newMessage];

        await Conversation.update(threadId, {
            messages: updatedMessages,
            updatedAt: new Date()
        });

        return newMessage;
    }

    /**
     * Get the stream for a new message, saving the history
     * @param {string} threadId 
     * @param {string} userMessage 
     * @returns {AsyncGenerator}
     */
    async *streamReply(threadId, userMessage) {
        // 1. Fetch thread and add user message
        const thread = await this.getThread(threadId);
        await this.addMessageToThread(threadId, 'user', userMessage);

        // 2. Prepare the context for the AI
        // We include the existing messages + the new user message we just added
        const updatedThread = await this.getThread(threadId);
        const messagesForAI = updatedThread.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 3. Request the stream from AI Service
        const stream = aiService.chatStream(messagesForAI, {
            // Optional: configure model or tokens here if needed
        });

        // 4. Yield chunks back to the controller, aggregating the full response
        let fullResponse = '';
        for await (const chunk of stream) {
            if (chunk && chunk.text) {
                fullResponse += chunk.text;
                yield chunk.text;
            }
        }

        // 5. After the stream is complete, save the assistant's response to the thread
        if (fullResponse) {
            await this.addMessageToThread(threadId, 'assistant', fullResponse);
        }
    }
    
    /**
     * Delete a conversation
     * @param {string} threadId 
     */
    async deleteThread(threadId) {
        return await Conversation.delete(threadId);
    }
}

export default new ConversationService();
