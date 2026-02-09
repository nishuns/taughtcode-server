import { Job } from '../models/index.js';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';
import { getWorkerFunction } from '../workers/jobRegistry.js';
import { jobQueue } from '../workers/queueFactory.js';

// Event Emitter for notifications
export const jobEvents = new EventEmitter();

/**
 * Add a job to the queue (Firestore + BullMQ)
 * @param {string} type - Job type (e.g., 'article-generation')
 * @param {Object} data - Payload
 * @param {string} userId - User initiating the job
 */
async function addJob(type, data, userId) {
    // 1. Persist in Firestore (Source of Truth)
    const job = await Job.create({
        type,
        data,
        userId,
        status: 'queued',
        progress: 0
    });

    logger.info(`Job persisted: ${job.id} (${type})`);
    
    // 2. Push to BullMQ (Execution Trigger)
    await jobQueue.add(type, {
        firestoreJobId: job.id,
        type,
        ...data
    });

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
 * Process a job (Called by Worker)
 * @param {string} jobId 
 */
async function processJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) return;

    // Double check status before running (concurrency safety)
    // Although BullMQ handles concurrency, this prevents reprocessing if manually triggered
    if (job.status !== 'queued' && job.status !== 'failed') return; 

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
        throw error; // Rethrow so BullMQ knows it failed
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
