import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server } from 'socket.io';
import apiRouter from './routes/index.js';
import { streamMediaFile } from './services/media.service.js';
import { setupSockets } from './sockets/index.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e8 // 100MB for sockets if needed
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for file uploads up to 500MB
const uploadsDir = path.join(process.cwd(), 'uploads');

// Custom 206 Partial Content Range Streaming for Media Files (MP4, WEBM, MP3, etc.)
app.get('/uploads/:filename', streamMediaFile);
app.use('/uploads', express.static(uploadsDir));

// Central API Routes Router (/api/auth, /api/users, /api/servers, /api/channels, /api/messages, /api/upload, /api/gifs)
app.use('/api', apiRouter);

// Socket setup
setupSockets(io);

const PORT = process.env.PORT || 3001;

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`==========================================`);
  console.log(`🚀 Custom Discord Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Static Uploads directory: ${uploadsDir}`);
  console.log(`==========================================`);
});