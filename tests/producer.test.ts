import { produce } from '../src/producer';

describe('producer', () => {
  it('sends message to topic', async () => {
    const send = jest.fn(async () => {});
    const connect = jest.fn(async () => {});
    const disconnect = jest.fn(async () => {});

    jest.mock('kafkajs', () => ({
      Kafka: class {
        producer() {
          return { connect, send, disconnect };
        }
      },
    }));

    // re-require the producer to pick up the mocked module
    const { produce: produceFn } = await import('../src/producer');

    const payload = { a: 1 };
    await produceFn('topic1', payload);

    expect(send).toHaveBeenCalledWith({
      topic: 'topic1',
      messages: [{ value: JSON.stringify(payload) }],
    });
  });
});
