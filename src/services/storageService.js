import { StorageProvider } from '../providers/storage/registry.js';
import logger from '../utils/logger.js';

class StorageService {
    constructor() {
        this.provider = StorageProvider('firebase');
    }

    /**
     * Upload a user-specific asset
     * Stores in: users/{userId}/{folder}/{filename}
     * @param {string} userId 
     * @param {Buffer} fileBuffer 
     * @param {string} mimeType 
     * @param {string} type - e.g., 'profile', 'blogs', 'attachments'
     * @param {string} [filename] - Optional custom filename, else generated
     * @returns {Promise<Object>} { url, path, metadata }
     */
    async uploadUserAsset(userId, fileBuffer, mimeType, type = 'general', filename = null) {
        const ext = mimeType.split('/')[1] || 'bin';
        const finalFilename = filename || `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const destination = `users/${userId}/${type}/${finalFilename}`;

        logger.info(`StorageService: Uploading ${type} for user ${userId}`);

        return await this.provider.upload(fileBuffer, destination, {
            mimeType: mimeType,
            isPublic: true, // Defaulting to public for user assets like avatars/blogs
            metadata: {
                userId,
                type
            }
        });
    }

    /**
     * Delete a specific file
     * @param {string} path 
     */
    async deleteFile(path) {
        logger.info(`StorageService: Deleting file at ${path}`);
        return await this.provider.delete(path);
    }
}

export default new StorageService();
