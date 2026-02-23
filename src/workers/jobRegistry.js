import * as articleService from '../services/articleService.js';
import * as templateService from '../services/articleTemplateService.js';

// Map Job Types to Service Functions
export const JOB_REGISTRY = {
    'article-generation': async (userId, data) => {
        return articleService.generateArticleContent(userId, data.topic, data.depth, data.instructions, data.templateId);
    },
    'template-generation': async (userId, data) => {
        return templateService.generateTemplate(userId, data.description, data.category);
    }
};

export function getWorkerFunction(type) {
    return JOB_REGISTRY[type];
}
