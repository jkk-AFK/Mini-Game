import http from 'node:http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { buildApp } from './app.js';
import { createRealtimeServer } from './websocket/realtime.js';
import { ensureSeedData } from './config/seeds.js';
import { initTelemetry, shutdownTelemetry } from './config/telemetry.js';

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/arcade';

async function bootstrap() {
  await initTelemetry().catch((error) => {
    console.warn('Telemetry initialization failed', error);
  });

  const app = buildApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN ?? '*',
      credentials: true,
    },
  });

  createRealtimeServer(io);

  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  await ensureSeedData();
  httpServer.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap backend', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await shutdownTelemetry();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdownTelemetry();
  process.exit(0);
});
