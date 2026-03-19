/**
 * Worker entry point.
 * Run separately from the Next.js process:
 *   npx tsx src/lib/queue/start-workers.ts
 */

import { startTaskWorkers } from './task-worker';
import { startPollingWorker } from './polling-worker';
import { startBatchWorker } from './batch-worker';

console.log('='.repeat(50));
console.log('POD AI Studio — Worker Process Starting...');
console.log('='.repeat(50));

const taskWorkers = startTaskWorkers();
const pollingWorker = startPollingWorker();
const batchWorker = startBatchWorker();

const allWorkers = [...taskWorkers, pollingWorker, batchWorker];

// Graceful shutdown
async function shutdown() {
  console.log('\n[Shutdown] Closing workers...');
  await Promise.all(allWorkers.map((w) => w.close()));
  console.log('[Shutdown] All workers closed.');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`\n[Ready] ${allWorkers.length} workers running. Press Ctrl+C to stop.\n`);
