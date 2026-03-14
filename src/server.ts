import express from 'express';
import bodyParser from 'body-parser';
import { produce } from './producer';
import { consume } from './consumer';

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.static('public'));

const defaultTopic = 'test-topic';
const messageCache: Record<string, string[]> = {};
const analyticsData: Record<string, { total: number; timestamps: number[] }> = {};
const sseClients: Record<string, Set<express.Response>> = {};

function recordAnalytics(topic: string) {
  const now = Date.now();
  if (!analyticsData[topic]) {
    analyticsData[topic] = { total: 0, timestamps: [] };
  }
  analyticsData[topic].total += 1;
  analyticsData[topic].timestamps.push(now);
  analyticsData[topic].timestamps = analyticsData[topic].timestamps.filter((t) => now - t <= 60_000);
}

function getAnalytics(topic: string) {
  const info = analyticsData[topic] || { total: 0, timestamps: [] };
  return {
    topic,
    totalMessages: info.total,
    messagesLastMinute: info.timestamps.length,
    ratePerMinute: info.timestamps.length,
  };
}

function sendSse(topic: string, message: string) {
  const clients = sseClients[topic];
  if (!clients || clients.size === 0) return;
  for (const res of clients) {
    res.write(`event: message\n`);
    res.write(`data: ${JSON.stringify({ topic, message, ts: new Date().toISOString() })}\n\n`);
  }
}

async function startConsumer(topic = defaultTopic) {
  if (messageCache[topic] && messageCache[topic].length > 0) return;
  if (!messageCache[topic]) messageCache[topic] = [];

  await consume(topic, async (msg) => {
    messageCache[topic].push(msg);
    if (messageCache[topic].length > 1000) {
      messageCache[topic].shift();
    }
    recordAnalytics(topic);
    sendSse(topic, msg);
  });
}

app.post('/api/messages', async (req, res) => {
  const { topic = defaultTopic, payload } = req.body;
  if (!topic || payload === undefined) {
    return res.status(400).json({ error: 'topic and payload are required' });
  }

  try {
    await produce(topic, payload);
    await startConsumer(topic);
    return res.status(200).json({ status: 'ok', topic, sentMessages: 1 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Kafka send failed', detail: (err as Error).message });
  }
});

app.get('/api/messages/latest', async (req, res) => {
  const topic = (req.query.topic as string) || defaultTopic;
  const limit = Number(req.query.limit ?? 10);
  await startConsumer(topic);
  const data = messageCache[topic] || [];
  return res.status(200).json({ topic, messages: data.slice(-Math.max(1, limit)) });
});

app.get('/api/analytics', (req, res) => {
  const topic = (req.query.topic as string) || defaultTopic;
  return res.status(200).json(getAnalytics(topic));
});

app.get('/api/stream', (req, res) => {
  const topic = (req.query.topic as string) || defaultTopic;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!sseClients[topic]) {
    sseClients[topic] = new Set();
  }
  sseClients[topic].add(res);

  req.on('close', () => {
    sseClients[topic]?.delete(res);
  });
});

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Kafka API server running on http://localhost:${port}`);
  console.log('POST /api/messages { topic, payload }');
  console.log('GET /api/messages/latest?topic=test-topic&limit=10');
  console.log('GET /api/analytics?topic=test-topic');
  console.log('GET /api/stream?topic=test-topic');
});
