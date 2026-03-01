import BaseIntegrationProvider from "../base.js";
import { Octokit } from "@octokit/rest";

class GitHubIntegrationProvider extends BaseIntegrationProvider {
    /**
     * @param {Object} config
     * @param {string} config.accessToken - GitHub Personal Access Token or OAuth Token
     * @param {string} config.owner - GitHub username or organization name
     * @param {string} config.repo - Default repository name
     */
    constructor(config) {
        super(config);
        
        if (config?.accessToken) {
            this.client = new Octokit({
                auth: config.accessToken
            });
        }
    }

    /**
     * Connect/Validate the GitHub connection
     */
    async connect() {
        try {
            if (!this.client) {
                throw new Error("GitHub Access Token is required for connection");
            }
            // Simple request to verify the token
            const { data } = await this.client.users.getAuthenticated();
            return {
                success: true,
                user: data.login,
                name: data.name
            };
        } catch (error) {
            throw new Error(`GitHub Connection Error: ${error.message}`);
        }
    }

    /**
     * Validates if the repository exists and is accessible
     */
    async validate() {
        try {
            const { owner, repo } = this.config;
            if (!owner || !repo) {
                throw new Error("GitHub owner and repo are required for validation");
            }

            await this.client.repos.get({
                owner,
                repo
            });

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
     * Example sync: Get latest commits or content
     */
    async sync(options = {}) {
        try {
            const { owner, repo, path = "" } = { ...this.config, ...options };
            
            const { data } = await this.client.repos.getContent({
                owner,
                repo,
                path
            });

            return data;
        } catch (error) {
            throw new Error(`GitHub Sync Error: ${error.message}`);
        }
    }

    /**
     * Helper to get list of repositories for the authenticated user
     */
    async getRepositories() {
        try {
            const { data } = await this.client.repos.listForAuthenticatedUser({
                sort: 'updated',
                per_page: 100
            });
            return data.map(repo => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                private: repo.private
            }));
        } catch (error) {
            throw new Error(`GitHub API Error: ${error.message}`);
        }
    }
}

export default GitHubIntegrationProvider;
