import { Article, User, Review, Tag } from '../models/index.js';
import logger from '../utils/logger.js';
import * as aiService from './aiService.js';
import * as storageService from './storageService.js';
import { generateStructurePrompt, generateContentPrompt } from '../prompts/articlePrompts.js';

/**
 * Generate an article using AI
 * @param {string} authorId
 * @param {string} topic
 */
async function generateArticleContent(authorId, topic) {
    logger.info(`ArticleService: Generating article for topic "${topic}"`);

    // 1. Generate Structure
    const structureResult = await aiService.generateText(generateStructurePrompt(topic), {
        responseMimeType: 'application/json',
        model: 'flash'
    });

    let structure;
    try {
        structure = JSON.parse(structureResult.text);
    } catch (e) {
        // Fallback if AI didn't return strict JSON (try to find JSON block)
        const match = structureResult.text.match(/\{[\s\S]*\}/);
        if (match) {
            structure = JSON.parse(match[0]);
        } else {
            throw new Error("Failed to generate valid article structure");
        }
    }

    // 2. Generate and Upload Images
    const imageUrls = {};
    for (const section of structure.sections) {
        if (section.imagePrompt) {
            try {
                const imageResult = await aiService.generateImage(section.imagePrompt);
                if (imageResult.success && imageResult.images.length > 0) {
                    const imgPart = imageResult.images[0];
                    let buffer, mimeType;

                    if (typeof imgPart === 'string') {
                        // Handle URL (like placeholders or other providers)
                        const response = await fetch(imgPart);
                        const arrayBuffer = await response.arrayBuffer();
                        buffer = Buffer.from(arrayBuffer);
                        mimeType = response.headers.get('content-type') || 'image/png';
                    } else if (imgPart.inlineData) {
                        // Handle native Gemini inlineData (base64)
                        buffer = Buffer.from(imgPart.inlineData.data, 'base64');
                        mimeType = imgPart.inlineData.mimeType;
                    }

                    if (buffer) {
                        // Upload to Storage
                        const uploadResult = await storageService.uploadUserAsset(
                            authorId,
                            buffer,
                            mimeType,
                            'generated_images'
                        );

                        imageUrls[section.heading] = uploadResult.url;
                    }
                }
            } catch (err) {
                logger.warn(`Failed to generate/upload image for section "${section.heading}":`, err);
            }
        }
    }

    // 3. Generate Full Content
    const contentResult = await aiService.generateText(generateContentPrompt(structure, imageUrls));
    const content = contentResult.text;

    // 4. Save Article
    const articleData = {
        title: structure.title,
        description: structure.description,
        content: content,
        tags: structure.tags || [],
        status: 'draft', // Safety first
        access: 'free'
    };

    return await createArticle(authorId, articleData);
}

/**
 * Create a new article
 * @param {string} authorId 
 * @param {Object} articleData 
 */
async function createArticle(authorId, articleData) {
    // 1. Generate Slug
    let slug = articleData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    // Check for collision and append random suffix if needed
    const existing = await Article.findBySlug(slug);
    if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(7)}`;
    }

    // 2. Handle Tags
    if (articleData.tags && Array.isArray(articleData.tags)) {
        // Process tags in parallel
        await Promise.all(articleData.tags.map(tagName => Tag.findOrCreate(tagName)));
    }

    const payload = {
        ...articleData,
        authorId,
        slug,
        status: articleData.status || 'draft',
        publishedAt: articleData.status === 'published' ? new Date() : null
    };

    const article = await Article.create(payload);
    logger.info(`Article created: ${article.id} by ${authorId}`);
    return article;
}

/**
 * Add a review to an article
 * @param {string} articleId 
 * @param {string} userId 
 * @param {Object} reviewData 
 */
async function addReview(articleId, userId, reviewData) {
    // Check if article exists
    const article = await Article.findById(articleId);
    if (!article) throw new Error('Article not found');

    // Create review
    const review = await Review.create({
        articleId,
        userId,
        rating: reviewData.rating,
        comment: reviewData.comment
    });

    // Update Article stats
    // Note: In a high-traffic app, this should be an aggregation or cloud function
    const reviews = await Review.findByArticle(articleId);
    const count = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = count > 0 ? totalRating / count : 0;

    await Article.findByIdAndUpdate(articleId, {
        reviewCount: count,
        averageRating: parseFloat(averageRating.toFixed(1))
    });

    return review;
}

/**
 * Get article by slug (Public/Reader view)
 * Checks access rights based on monetization
 * @param {string} slug 
 * @param {string} [userId] - Current user ID (optional for public)
 */
async function getArticleBySlug(slug, userId = null) {
    const article = await Article.findBySlug(slug);
    if (!article) {
        throw new Error('Article not found');
    }

    // If draft, only author can view
    if (article.status !== 'published') {
        if (userId !== article.authorId) {
            throw new Error('Access denied: Article is not published');
        }
        return article;
    }

    // Check Access
    const access = await checkAccess(article, userId);

    if (access.granted) {
        return article;
    } else {
        // Return limited view for locked content
        return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            description: article.description,
            preview: article.preview, // The "teaser"
            access: article.access,
            price: article.price,
            currency: article.currency,
            authorId: article.authorId,
            isLocked: true,
            lockReason: access.reason
        };
    }
}

/**
 * Check if a user has access to an article
 * @param {Object} article 
 * @param {string} userId 
 */
async function checkAccess(article, userId) {
    // 1. Free Content
    if (article.access === 'free') {
        return { granted: true };
    }

    // 2. Author (Always has access)
    if (userId && article.authorId === userId) {
        return { granted: true };
    }

    // 3. User not logged in (and content is not free)
    if (!userId) {
        return { granted: false, reason: 'login_required' };
    }

    // 4. Paid Single (Pay-Per-View)
    if (article.access === 'paid_single') {
        // TODO: Check if user purchased this specific article
        // const hasPurchased = await Transaction.hasPurchased(userId, article.id);
        const hasPurchased = false; // Mock
        if (hasPurchased) return { granted: true };
        return { granted: false, reason: 'purchase_required' };
    }

    // 5. Author Subscription
    if (article.access === 'subscription_author') {
        // TODO: Check if user subscribes to author
        // const isSubscriber = await Subscription.isSubscribedToAuthor(userId, article.authorId);
        const isSubscriber = false; // Mock
        if (isSubscriber) return { granted: true };
        return { granted: false, reason: 'author_subscription_required' };
    }

    // 6. Platform Subscription
    if (article.access === 'subscription_platform') {
        // TODO: Check user's platform subscription tier
        // const userTier = await User.getSubscriptionTier(userId);
        const userTier = 'free'; // Mock
        // Simple check: if user has any paid tier (assuming 'premium' > 'free')
        if (userTier === 'premium' || userTier === 'pro') return { granted: true };
        return { granted: false, reason: 'platform_subscription_required' };
    }

    return { granted: false, reason: 'unknown_access_type' };
}

/**
 * Update article
 */
async function updateArticle(id, authorId, updates) {
    const article = await Article.findById(id);
    if (!article) throw new Error('Article not found');

    if (article.authorId !== authorId) {
        throw new Error('Unauthorized');
    }

    const updated = await Article.findByIdAndUpdate(id, updates, { new: true });
    return updated;
}

/**
 * List articles (with filters)
 */
async function listArticles(filters = {}) {
    return await Article.find(filters);
}

export {
    createArticle,
    getArticleBySlug,
    updateArticle,
    listArticles,
    checkAccess,
    addReview,
    generateArticleContent
};
