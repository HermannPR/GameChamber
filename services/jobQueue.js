import { EventEmitter } from 'events';

/**
 * Job Queue System
 * Manages concurrent game generation jobs with priority support
 */

export class JobQueue extends EventEmitter {
  constructor(options = {}) {
    super();

    this.maxConcurrent = options.maxConcurrent || 3;
    this.timeout = options.timeout || 600000; // 10 minutes default

    this.queue = []; // Pending jobs
    this.activeJobs = new Map(); // Currently running jobs
    this.completedJobs = new Map(); // Completed job history
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalProcessingTime: 0
    };
  }

  /**
   * Add a job to the queue
   */
  addJob(jobId, jobData, priority = 0) {
    const job = {
      id: jobId,
      data: jobData,
      priority,
      status: 'queued',
      queuedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      error: null,
      timeoutId: null
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(j => j.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    this.stats.totalJobs++;
    this.emit('jobQueued', job);

    // Try to process immediately
    this.processNext();

    return job;
  }

  /**
   * Process next job in queue
   */
  processNext() {
    // Check if we can process more jobs
    if (this.activeJobs.size >= this.maxConcurrent) {
      return;
    }

    // Get next job from queue
    if (this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    job.status = 'processing';
    job.startedAt = Date.now();

    // Add to active jobs
    this.activeJobs.set(job.id, job);

    // Set timeout
    job.timeoutId = setTimeout(() => {
      this.failJob(job.id, new Error('Job timeout exceeded'));
    }, this.timeout);

    this.emit('jobStarted', job);

    // Emit event for external processing
    this.emit('processJob', job);
  }

  /**
   * Mark job as completed
   */
  completeJob(jobId, result) {
    const job = this.activeJobs.get(jobId);

    if (!job) {
      console.warn(`Job ${jobId} not found in active jobs`);
      return;
    }

    // Clear timeout
    if (job.timeoutId) {
      clearTimeout(job.timeoutId);
    }

    // Update job status
    job.status = 'completed';
    job.completedAt = Date.now();
    job.result = result;

    // Update stats
    const processingTime = job.completedAt - job.startedAt;
    this.stats.completedJobs++;
    this.stats.totalProcessingTime += processingTime;

    // Move to completed
    this.activeJobs.delete(jobId);
    this.completedJobs.set(jobId, job);

    this.emit('jobCompleted', job);

    // Process next job
    this.processNext();

    return job;
  }

  /**
   * Mark job as failed
   */
  failJob(jobId, error) {
    const job = this.activeJobs.get(jobId);

    if (!job) {
      console.warn(`Job ${jobId} not found in active jobs`);
      return;
    }

    // Clear timeout
    if (job.timeoutId) {
      clearTimeout(job.timeoutId);
    }

    // Update job status
    job.status = 'failed';
    job.completedAt = Date.now();
    job.error = error.message || 'Unknown error';

    // Update stats
    this.stats.failedJobs++;

    // Move to completed
    this.activeJobs.delete(jobId);
    this.completedJobs.set(jobId, job);

    this.emit('jobFailed', job, error);

    // Process next job
    this.processNext();

    return job;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId) {
    // Check if job is in queue
    const queueIndex = this.queue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      const job = this.queue.splice(queueIndex, 1)[0];
      job.status = 'cancelled';
      this.completedJobs.set(jobId, job);
      this.emit('jobCancelled', job);
      return true;
    }

    // Check if job is active
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      this.failJob(jobId, new Error('Job cancelled by user'));
      return true;
    }

    return false;
  }

  /**
   * Get job status
   */
  getJob(jobId) {
    // Check active jobs
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId);
    }

    // Check completed jobs
    if (this.completedJobs.has(jobId)) {
      return this.completedJobs.get(jobId);
    }

    // Check queue
    const queuedJob = this.queue.find(j => j.id === jobId);
    if (queuedJob) {
      return queuedJob;
    }

    return null;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queue: {
        pending: this.queue.length,
        active: this.activeJobs.size,
        maxConcurrent: this.maxConcurrent
      },
      stats: {
        ...this.stats,
        averageProcessingTime: this.stats.completedJobs > 0
          ? Math.round(this.stats.totalProcessingTime / this.stats.completedJobs)
          : 0
      },
      activeJobs: Array.from(this.activeJobs.values()).map(job => ({
        id: job.id,
        status: job.status,
        startedAt: job.startedAt,
        data: job.data
      })),
      queuedJobs: this.queue.map(job => ({
        id: job.id,
        priority: job.priority,
        queuedAt: job.queuedAt,
        data: job.data
      }))
    };
  }

  /**
   * Get all jobs (for admin)
   */
  getAllJobs(limit = 50) {
    const completed = Array.from(this.completedJobs.values())
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);

    const active = Array.from(this.activeJobs.values());
    const queued = [...this.queue];

    return {
      active,
      queued,
      completed
    };
  }

  /**
   * Clear completed jobs older than specified time
   */
  clearOldJobs(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    const toDelete = [];

    for (const [jobId, job] of this.completedJobs.entries()) {
      if (job.completedAt && (now - job.completedAt) > maxAge) {
        toDelete.push(jobId);
      }
    }

    toDelete.forEach(jobId => this.completedJobs.delete(jobId));

    return toDelete.length;
  }

  /**
   * Update max concurrent jobs
   */
  setMaxConcurrent(max) {
    this.maxConcurrent = max;
    // Try to process more jobs if limit was increased
    while (this.activeJobs.size < this.maxConcurrent && this.queue.length > 0) {
      this.processNext();
    }
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.paused = true;
    this.emit('queuePaused');
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.paused = false;
    this.emit('queueResumed');
    // Process pending jobs
    while (this.activeJobs.size < this.maxConcurrent && this.queue.length > 0 && !this.paused) {
      this.processNext();
    }
  }
}

export default JobQueue;
