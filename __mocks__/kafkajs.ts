const connect = jest.fn(async () => {});
const send = jest.fn(async () => {});
const disconnect = jest.fn(async () => {});
const subscribe = jest.fn(async () => {});
const run = jest.fn(async () => {});
const consumerDisconnect = jest.fn(async () => {});

export class Kafka {
  constructor() {}
  producer() {
    return { connect, send, disconnect };
  }
  consumer() {
    return { connect, subscribe, run, disconnect: consumerDisconnect };
  }
}
