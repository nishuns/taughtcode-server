import FirebaseModel from '../utils/firebaseModel.js';
import userProfileModel from './userProfileModel.js';

// Export specific models
export const User = userProfileModel;

// Helper to create simple models on the fly
export const createModel = (collectionName, schema = null) => {
    return new FirebaseModel(collectionName, schema);
};

// Example: const Blog = createModel('blogs', blogSchema);
