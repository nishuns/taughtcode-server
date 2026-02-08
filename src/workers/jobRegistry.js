import * as articleService from '../services/articleService.js';
import * as templateService from '../services/articleTemplateService.js';

// Map Job Types to Service Functions
export const JOB_REGISTRY = {
    'article-generation': async (userId, data) => {
        return articleService.generateArticleContent(userId, data.topic, data.depth, data.instructions);
    },
    'template-generation': async (userId, data) => {
        return templateService.generateTemplate(userId, data.topic, data.category);
    }
};

export function getWorkerFunction(type) {
    return JOB_REGISTRY[type];
}
