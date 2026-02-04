import Joi from 'joi';

export const createArticleSchema = Joi.object({
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().max(500),
    content: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'published').default('draft'),
    access: Joi.string().valid('free', 'paid_single', 'subscription_author', 'subscription_platform').default('free'),
    price: Joi.number().min(0),
    currency: Joi.string().default('USD'),
    preview: Joi.string().allow(''),
    imagesAttached: Joi.array().items(Joi.string().uri()),
    references: Joi.array().items(Joi.object({
        title: Joi.string(),
        url: Joi.string().uri()
    }))
});

export const updateArticleSchema = Joi.object({
    title: Joi.string().min(3).max(200),
    description: Joi.string().max(500),
    content: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    status: Joi.string().valid('draft', 'published', 'archived'),
    access: Joi.string().valid('free', 'paid_single', 'subscription_author', 'subscription_platform'),
    price: Joi.number().min(0),
    preview: Joi.string().allow(''),
    imagesAttached: Joi.array().items(Joi.string().uri()),
    references: Joi.array().items(Joi.object({
        title: Joi.string(),
        url: Joi.string().uri()
    }))
});

export const addReviewSchema = Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().max(1000).allow('')
});
