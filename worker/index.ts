/**
 * Worker: Polls database for due jobs and processes them
 * Runs as a continuous background process
 * 
 * Usage:
 *   npx tsx worker/index.ts
 */

import { processDueJobs } from "./processor";

// Configuration
const POLL_INTERVAL_MS = process.env.WORKER_POLL_INTERVAL
  ? parseInt(process.env.WORKER_POLL_INTERVAL, 10)
  : 3000; // 3 seconds default

const MAX_CONCURRENT_JOBS = process.env.WORKER_MAX_CONCURRENT
  ? parseInt(process.env.WORKER_MAX_CONCURRENT, 10)
  : 3;

let isRunning = false;

/**
 * Main worker loop
 */
async function workerLoop() {
  while (true) {
    try {
      if (!isRunning) {
        isRunning = true;

        try {
          const processed = await processDueJobs(MAX_CONCURRENT_JOBS);

          if (processed > 0) {
            console.log(
              `[${new Date().toISOString()}] Processed ${processed} jobs`
            );
          }
        } finally {
          isRunning = false;
        }
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    } catch (error) {
      console.error("[Worker] Fatal error:", error);
      // Continue looping even on error
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

/**
 * Graceful shutdown
 */
function setupGracefulShutdown() {
  const signals = ["SIGTERM", "SIGINT"];

  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`[${signal}] Received, gracefully shutting down...`);

      // Wait for current job to finish
      let attempts = 0;
      while (isRunning && attempts < 30) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (isRunning) {
        console.warn("Force shutting down (job still running)");
      }

      console.log("Worker stopped");
      process.exit(0);
    });
  });
}

/**
 * Start the worker
 */
async function start() {
  console.log("Meta Lab Worker starting...");
  console.log(`  Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`  Max concurrent jobs: ${MAX_CONCURRENT_JOBS}`);
  console.log(`  Dry-run mode: ${process.env.META_DRY_RUN === "true" ? "ON" : "OFF"}`);

  setupGracefulShutdown();

  // Start the main loop
  await workerLoop();
}

// Run the worker
start().catch((error) => {
  console.error("Failed to start worker:", error);
  process.exit(1);
});
