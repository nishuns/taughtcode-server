import BaseIntegrationProvider from "../base.js";
import axios from "axios";

class LinkedInIntegrationProvider extends BaseIntegrationProvider {
    /**
     * @param {Object} config
     * @param {string} config.accessToken - LinkedIn OAuth Token
     * @param {string} config.personUrn - LinkedIn Member URN (e.g., 'urn:li:person:12345')
     */
    constructor(config) {
        super(config);
        
        if (config?.accessToken) {
            this.client = axios.create({
                baseURL: "https://api.linkedin.com/v2",
                headers: {
                    Authorization: `Bearer ${config.accessToken}`,
                    "cache-control": "no-cache",
                    "X-Restli-Protocol-Version": "2.0.0",
                },
            });
        }
    }

    /**
     * Connect/Validate the LinkedIn connection and get Member URN
     */
    async connect() {
        try {
            if (!this.client) {
                throw new Error("LinkedIn Access Token is required for connection");
            }
            
            // Get user profile to verify token and get URN
            const { data } = await this.client.get("/me");
            
            return {
                success: true,
                urn: `urn:li:person:${data.id}`,
                firstName: data.localizedFirstName,
                lastName: data.localizedLastName
            };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            throw new Error(`LinkedIn Connection Error: ${message}`);
        }
    }

    async validate() {
        try {
            await this.connect();
            return true;
        } catch (error) {
            return false;
        }
    }

    async disconnect() {
        this.client = null;
        return true;
    }

    /**
     * Share content to LinkedIn
     * @param {Object} options
     * @param {string} options.text - The post content
     * @param {string} options.url - Optional link to share
     * @param {string} options.title - Optional title for the link
     */
    async sync(options = {}) {
        try {
            if (!this.client) throw new Error("Not connected to LinkedIn");
            
            const { text, url, title, personUrn = this.config.personUrn } = options;
            
            if (!personUrn) throw new Error("LinkedIn Person URN is required to post");

            const postData = {
                author: personUrn,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: text
                        },
                        shareMediaCategory: url ? "ARTICLE" : "NONE"
                    }
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
            };

            if (url) {
                postData.specificContent["com.linkedin.ugc.ShareContent"].media = [
                    {
                        status: "READY",
                        description: {
                            text: text.substring(0, 200)
                        },
                        originalUrl: url,
                        title: {
                            text: title || "New Content from TaughtCode"
                        }
                    }
                ];
            }

            const { data } = await this.client.post("/ugcPosts", postData);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            throw new Error(`LinkedIn Post Error: ${message}`);
        }
    }
}

export default LinkedInIntegrationProvider;
