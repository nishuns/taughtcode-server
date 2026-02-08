import { Job } from '../models/index.js';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';

// Event Emitter for notifications
export const jobEvents = new EventEmitter();

/**
 * Add a job to the queue
 * @param {string} type - Job type (e.g., 'article-generation')
 * @param {Object} data - Payload
 * @param {string} userId - User initiating the job
 */
async function addJob(type, data, userId) {
    const job = await Job.create({
        type,
        data,
        userId,
        status: 'queued',
        progress: 0
    });

    logger.info(`Job added: ${job.id} (${type})`);
    
    // Trigger processing immediately (or could be polled)
    processJob(job.id).catch(err => console.error("Background processing error:", err));

    return job;
}

/**
 * Get job status
 * @param {string} jobId 
 */
async function getJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) throw new Error('Job not found');
    return job;
}

/**
 * Process a job (Simulates Worker / FSM transition)
 * @param {string} jobId 
 */
async function processJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) return;

    if (job.status !== 'queued') return;

    // Transition to Processing
    await updateJobStatus(jobId, 'processing', 10);

    try {
        logger.info(`Processing job ${jobId}...`);
        
        let result;
        
        // --- Worker Logic Router ---
        // Ideally this delegates to specific worker functions
        if (job.type === 'article-generation') {
            const { generateArticleContent } = await import('./articleService.js');
            // Mocking the behavior for the 'worker' concept: 
            // In a real scenario, this runs in a worker thread.
            const { authorId, topic, depth, instructions } = job.data;
            
            // Pass job reference if we want progress updates from within the service
            // For now, we await the result
            result = await generateArticleContent(authorId, topic, depth, instructions);
        } else {
            throw new Error(`Unknown job type: ${job.type}`);
        }
        
        // Transition to Completed
        await updateJobStatus(jobId, 'completed', 100, result);
        
    } catch (error) {
        logger.error(`Job ${jobId} failed:`, error);
        // Transition to Failed
        await updateJobStatus(jobId, 'failed', 0, null, error.message);
    }
}

/**
 * Update job status (FSM transitions)
 */
async function updateJobStatus(jobId, status, progress, result = null, error = null) {
    const updates = {
        status,
        progress,
        updatedAt: new Date()
    };

    if (result) updates.result = result;
    if (error) updates.error = error;
    if (status === 'completed' || status === 'failed') updates.completedAt = new Date();

    const updatedJob = await Job.findByIdAndUpdate(jobId, updates, { new: true });
    
    // Notify
    jobEvents.emit('statusUpdate', updatedJob);
    logger.info(`Job ${jobId} status: ${status}`);
    
    return updatedJob;
}

export {
    addJob,
    getJob,
    processJob
};
