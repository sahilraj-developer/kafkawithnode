import kafka from './kafka';

export async function consume(topic: string, handler: (msg: string) => Promise<void> | void) {
  const consumer = kafka.consumer({ groupId: 'ts-group' });
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = message.value?.toString() ?? '';
      await handler(value);
    },
  });
  return consumer;
}
