import FirebaseModel from '../utils/firebaseModel.js';
import userProfileModel from './userProfileModel.js';
import organizationModel from './organizationModel.js';
import apiKeyModel from './apiKeyModel.js';

// Export specific models
export const User = userProfileModel;
export const Organization = organizationModel;
export const ApiKey = apiKeyModel;

// Helper to create simple models on the fly
export const createModel = (collectionName, schema = null) => {
    return new FirebaseModel(collectionName, schema);
};

// Example: const Blog = createModel('blogs', blogSchema);
