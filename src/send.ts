#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { produce } from './producer';

const argv = yargs(hideBin(process.argv))
  .option('topic', { type: 'string', default: 'test-topic', description: 'Kafka topic' })
  .option('count', { type: 'number', default: 100, description: 'Number of messages to send' })
  .option('interval', { type: 'number', default: 0, description: 'Interval between messages (ms)' })
  .help()
  .argv as { topic: string; count: number; interval: number };

async function run() {
  const { topic, count, interval } = argv;
  console.log(`Producing ${count} messages to topic ${topic} (interval ${interval}ms)`);

  for (let i = 0; i < count; i++) {
    const payload = { id: i + 1, ts: new Date().toISOString(), value: `message-${i + 1}` };
    await produce(topic, payload);
    if (interval > 0) await new Promise((r) => setTimeout(r, interval));
  }

  console.log('Done producing messages');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
