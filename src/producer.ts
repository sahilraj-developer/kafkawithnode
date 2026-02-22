import kafka from './kafka';

export async function produce(topic: string, message: unknown) {
  const producer = kafka.producer();
  // connect/send/disconnect for each message is simple but can be optimized.
  await producer.connect();
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } finally {
    await producer.disconnect();
  }
}
