import BaseAuthProvider from "./base.js";

class ApiKeyProvider extends BaseAuthProvider {
    constructor() {
        super();
    }

    async verifyToken(apiKey) {
        // TODO: Implement actual API key lookup against Organization settings or a dedicated collection
        // For now, allow a dev key or fail
        if (process.env.DEV_API_KEY && apiKey === process.env.DEV_API_KEY) {
            return { uid: 'system', role: 'admin', authType: 'apikey' };
        }
        throw new Error("Invalid API Key");
    }

    async isAuthenticated(apiKey) {
        try {
            await this.verifyToken(apiKey);
            return true;
        } catch (error) {
            return false;
        }
    }
}

export default ApiKeyProvider;
