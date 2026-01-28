import Joi from 'joi';

export const userProfileSchema = Joi.object({
    uid: Joi.string().required(),
    email: Joi.string().email().required(),
    displayName: Joi.string().optional(),
    photoURL: Joi.string().uri().optional(),
    role: Joi.string().valid('user', 'admin', 'moderator').default('user'),
    preferences: Joi.object({
        theme: Joi.string().valid('light', 'dark').default('light'),
        notifications: Joi.boolean().default(true)
    }).optional(),
    createdAt: Joi.date().optional(),
    updatedAt: Joi.date().optional()
});
