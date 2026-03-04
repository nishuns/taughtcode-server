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
     * @param {string} threadId 
     * @param {string} userMessage 
     * @returns {AsyncGenerator}
     */
    async *streamReply(threadId, userMessage) {
        // 1. Add user message to the thread
        await this.addMessageToThread(threadId, 'user', userMessage);

        // 2. Prepare the context for the AI (all previous messages + the one just added)
        const updatedThread = await this.getThread(threadId);
        const messagesForAI = updatedThread.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 3. Request the stream from AI Service
        const stream = aiService.chatStream(messagesForAI);

        // 4. Yield chunks and aggregate full response
        let fullResponse = '';
        for await (const chunk of stream) {
            if (chunk && chunk.text) {
                fullResponse += chunk.text;
                yield chunk.text;
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
