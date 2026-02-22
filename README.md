# Kafka TypeScript Example

This repository is a minimal TypeScript example using Kafka (KafkaJS) with unit tests
and a local Docker Compose setup for development.

**Prerequisites**
- Install Node.js (16+ recommended)
- Install Docker & Docker Compose (for local Kafka broker)

**Install dependencies**

```bash
npm install
```

**Run Kafka locally (Docker)**

Start Zookeeper + Kafka for local development:

```bash
npm run docker:up
```

Stop and remove the containers:

```bash
npm run docker:down
```

Kafka is configured to advertise on `localhost:9092`. If you need to create a topic
manually, exec into the Kafka container and use the Kafka CLI. Example (PowerShell):

```powershell
docker-compose exec kafka bash
# inside container
KAFKA_HOME/bin/kafka-topics.sh --create --topic test-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
exit
```

**Run the code**

Dev (auto-reload using `ts-node-dev`):

```bash
npm run dev
```

Build and run the compiled output:

```bash
npm run build
npm start
```

The entry point (`src/index.ts`) starts a consumer on `test-topic` and sends a single
message to the same topic as a demo.

**Tests**

Unit tests are written with Jest and mock `kafkajs` so they run without a running
Kafka broker.

```bash
npm test
```

**Integration test (optional)**

To run tests against the real Kafka broker started via Docker, you can write an
integration test (not included by default) and run the following sequence:

1. Start Docker: `npm run docker:up`
2. Run your integration test file with Jest (or a custom Node script) that
	 produces and consumes messages against `localhost:9092`.
3. Stop Docker: `npm run docker:down`

If you want, I can add a ready-to-run integration test and an npm script
like `test:integration` that spins up Docker Compose, waits for readiness,
runs the tests, and tears down the environment.

**Linting**

Run ESLint:

```bash
npm run lint
```

**Notes & tips**
- Unit tests use `__mocks__/kafkajs.ts` so they don't require Docker.
- If you run Kafka inside a VM or remote host, update `src/kafka.ts` broker
	addresses and `docker-compose.yml` `KAFKA_CFG_ADVERTISED_LISTENERS`.
