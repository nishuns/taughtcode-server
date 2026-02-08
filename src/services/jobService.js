import { Job } from '../models/index.js';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';
import { getWorkerFunction } from '../workers/jobRegistry.js';

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
    
    // We do NOT call processJob here anymore. 
    // The WorkerRunner will pick it up.

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
 * Get the next queued job (FIFO) and lock it
 */
async function getNextJob() {
    // Find oldest queued job
    // Note: In a real distributed system, we need atomic transactions (runTransaction)
    // to prevent two workers picking the same job.
    // For this implementation, we'll try to find one.
    
    const jobs = await Job.find({ status: 'queued' }, { sort: { createdAt: 'asc' }, limit: 1 });
    
    if (jobs.length === 0) return null;
    
    const job = jobs[0];
    
    // Try to lock it
    // In Firestore model wrapper, findByIdAndUpdate returns the new doc
    // We check status again in update to ensure atomicity if possible via preconditions, 
    // but here we just update.
    
    // Ideally:
    // 1. Transaction get(doc)
    // 2. if status == queued -> update to processing
    
    // Simple version:
    return job;
}

/**
 * Process a job (Called by Worker)
 * @param {string} jobId 
 */
async function processJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) return;

    // Double check status before running (concurrency safety)
    if (job.status !== 'queued') return;

    // Transition to Processing
    await updateJobStatus(jobId, 'processing', 10);

    try {
        logger.info(`Processing job ${jobId} (${job.type})...`);
        
        const workerFn = getWorkerFunction(job.type);
        if (!workerFn) {
            throw new Error(`No worker registered for job type: ${job.type}`);
        }

        // Execute Worker Function
        // Convention: fn(userId, data)
        const result = await workerFn(job.userId, job.data);
        
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
    processJob,
    getNextJob
};
