import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import { IntegrationProvider } from '../providers/integrations/registry.js';
import { INTEGRATIONS_CONFIG } from '../config/integrations.js';
import axios from 'axios';

/**
 * Generate OAuth Authorization URL
 */
export function getAuthUrl(providerName, state) {
    const config = INTEGRATIONS_CONFIG[providerName];
    if (!config) throw new Error(`Provider ${providerName} not configured`);

    if (providerName === 'github') {
        return `https://github.com/login/oauth/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scopes.join(' ')}&state=${state}`;
    } else if (providerName === 'linkedin') {
        return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${config.clientId}&redirect_uri=${config.redirectUri}&scope=${config.scopes.join(' ')}&state=${state}`;
    }
    
    throw new Error(`Unsupported OAuth provider: ${providerName}`);
}

/**
 * Handle OAuth Callback and exchange code for token
 */
export async function handleCallback(providerName, code, userId) {
    const config = INTEGRATIONS_CONFIG[providerName];
    if (!config) throw new Error(`Provider ${providerName} not configured`);

    let tokenData;

    if (providerName === 'github') {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            redirect_uri: config.redirectUri
        }, {
            headers: { Accept: 'application/json' }
        });
        tokenData = { accessToken: response.data.access_token };
    } else if (providerName === 'linkedin') {
        const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        tokenData = { accessToken: response.data.access_token, expiresIn: response.data.expires_in };
    }

    if (!tokenData?.accessToken) {
        throw new Error(`Failed to obtain access token from ${providerName}`);
    }

    // Connect and get account info
    const provider = IntegrationProvider(providerName, tokenData);
    const accountInfo = await provider.connect();

    // Store in user profile
    await updateIntegration(userId, providerName, {
        ...tokenData,
        ...accountInfo,
        connected: true
    });

    return accountInfo;
}

/**
 * Update user integration settings (e.g., GitHub)
 * @param {string} userId - User Doc ID
 * @param {string} providerName - 'github', etc.
 * @param {Object} config - Connection config
 */
export async function updateIntegration(userId, providerName, config) {
    const profile = await User.findById(userId);
    if (!profile) throw new Error('User not found');

    // Requirement: Only admins can configure integrations in their profile
    if (profile.role !== 'admin') {
        throw new Error('Only admins can configure profile integrations');
    }

    // Initialize and validate the integration connection
    const provider = IntegrationProvider(providerName, config);
    const validation = await provider.connect();

    if (!validation.success) {
        throw new Error(`Failed to connect to ${providerName}`);
    }

    // Update the profile with new integration settings
    const integrations = profile.integrations || {};
    integrations[providerName] = {
        ...config,
        // Normalize identifying fields across providers
        accountName: validation.accountName || validation.user || validation.name || validation.urn,
        personUrn: validation.personUrn || validation.urn || null,
        connectedAt: integrations[providerName]?.connectedAt || new Date(),
        updatedAt: new Date()
    };

    const updatedProfile = await User.findByIdAndUpdate(userId, { integrations }, { new: true });
    logger.info(`IntegrationService: User ${userId} updated integration: ${providerName}`);
    
    return updatedProfile;
}

/**
 * Get configured integration for a user
 * @param {string} userId 
 * @param {string} providerName 
 */
export async function getIntegration(userId, providerName) {
    const profile = await User.findById(userId);
    if (!profile || !profile.integrations) return null;
    return profile.integrations[providerName] || null;
}

/**
 * Sync data from an integration
 * @param {string} userId 
 * @param {string} providerName 
 * @param {Object} syncOptions 
 */
export async function syncIntegration(userId, providerName, syncOptions = {}) {
    const config = await getIntegration(userId, providerName);
    if (!config) throw new Error(`Integration ${providerName} not configured for this user`);

    const provider = IntegrationProvider(providerName, config);
    // Connect first
    await provider.connect();
    
    const data = await provider.sync(syncOptions);
    logger.info(`IntegrationService: Synced data for ${providerName} (User: ${userId})`);
    
    return data;
}

/**
 * Remove an integration from a user's profile
 * @param {string} userId 
 * @param {string} providerName 
 */
export async function removeIntegration(userId, providerName) {
    const profile = await User.findById(userId);
    if (!profile || !profile.integrations) return null;

    const integrations = { ...profile.integrations };
    delete integrations[providerName];

    const updatedProfile = await User.findByIdAndUpdate(userId, { integrations }, { new: true });
    logger.info(`IntegrationService: User ${userId} removed integration: ${providerName}`);
    
    return updatedProfile;
}

/**
 * List all integrations for a user
 * @param {string} userId 
 */
export async function listIntegrations(userId) {
    const profile = await User.findById(userId);
    if (!profile) throw new Error('User not found');
    return profile.integrations || {};
}
