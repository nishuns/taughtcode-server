import FirebaseModel from '../utils/firebaseModel.js';
import userProfileModel from './userProfileModel.js';
import organizationModel from './organizationModel.js';
import apiKeyModel from './apiKeyModel.js';
import articleModel from './articleModel.js';
import reviewModel from './reviewModel.js';
import tagModel from './tagModel.js';
import articleTemplateModel from './articleTemplateModel.js';
import jobModel from './jobModel.js';
import clientAppModel from './clientAppModel.js';

// Export specific models
export const User = userProfileModel;
export const Organization = organizationModel;
export const ApiKey = apiKeyModel;
export const Article = articleModel;
export const Review = reviewModel;
export const Tag = tagModel;
export const ArticleTemplate = articleTemplateModel;
export const Job = jobModel;
export const ClientApp = clientAppModel;

// Helper to create simple models on the fly
export const createModel = (collectionName, schema = null) => {
    return new FirebaseModel(collectionName, schema);
};

// Example: const Blog = createModel('blogs', blogSchema);
