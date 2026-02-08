import { getNextJob, processJob } from '../services/jobService.js';
import logger from '../utils/logger.js';

const POLLING_INTERVAL_MS = 5000; // 5 seconds
let isRunning = false;

async function runWorkerLoop() {
    if (isRunning) return; // Prevent concurrent loops
    isRunning = true;

    try {
        const job = await getNextJob();
        
        if (job) {
            logger.info(`Worker: Picked up job ${job.id}`);
            await processJob(job.id);
            // If we found a job, check again immediately (don't wait 5s)
            isRunning = false;
            setImmediate(runWorkerLoop);
        } else {
            // No job, wait and poll
            isRunning = false;
            setTimeout(runWorkerLoop, POLLING_INTERVAL_MS);
        }
    } catch (error) {
        logger.error('Worker Loop Error:', error);
        isRunning = false;
        setTimeout(runWorkerLoop, POLLING_INTERVAL_MS);
    }
}

export function startWorker() {
    logger.info('🚀 Worker Runner Started');
    runWorkerLoop();
}
