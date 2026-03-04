import FirebaseModel from '../utils/firebaseModel.js';

class ConversationModel extends FirebaseModel {
    constructor() {
        super('conversations');
    }

    /**
     * Optional: Validate conversation data before save/update
     * @param {object} data
     */
    validate(data) {
        if (!data.userId) {
            throw new Error('userId is required for conversations');
        }
        return true;
    }

    /**
     * Retrieves all conversations for a specific user
     * @param {string} userId
     * @returns {Promise<Array>}
     */
    async getByUserId(userId) {
        try {
            const querySnapshot = await this.collection.where('userId', '==', userId).orderBy('updatedAt', 'desc').get();
            const docs = [];
            querySnapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            return docs;
        } catch (error) {
            throw new Error(`Error getting conversations for user: ${error.message}`);
        }
    }
}

export default new ConversationModel();
