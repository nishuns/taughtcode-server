import GitHubIntegrationProvider from "./github/index.js";

const integrationProviders = {
    github: GitHubIntegrationProvider,
};

/**
 * Factory for Integration Providers
 * @param {string} providerName - 'github', etc.
 * @param {Object} config - Integration specific configuration
 * @returns {import('./base').default} Integration Provider Instance
 */
export function IntegrationProvider(providerName, config = {}) {
    const ProviderClass = integrationProviders[providerName];

    if (!ProviderClass) {
        throw new Error(`Integration provider '${providerName}' not found`);
    }

    return new ProviderClass(config);
}
