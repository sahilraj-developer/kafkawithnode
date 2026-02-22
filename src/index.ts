import { produce } from './producer';
import { consume } from './consumer';

async function main() {
  // Demo: start consumer and produce one message
  await consume('test-topic', async (msg) => {
    console.log('Consumed message:', msg);
  });

  await produce('test-topic', { hello: 'world' });
  console.log('Produced message to test-topic');
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
