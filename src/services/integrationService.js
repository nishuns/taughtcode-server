import { User } from '../models/index.js';
import logger from '../utils/logger.js';
import { IntegrationProvider } from '../providers/integrations/registry.js';

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
        accountName: validation.user,
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
