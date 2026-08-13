import { Socket } from 'socket.io';
import { YtSyncPayload } from './types.js';

export function registerYtHandlers(socket: Socket) {
  // Watch Together Co-Browsing Sync Event
  // Dedicated YouTube WebSocket Sync Events (yt_play, yt_pause, yt_sync, yt_force_sync)
  socket.on('yt_play', (data: { channelId: string; time: number }) => {
    socket.broadcast.emit('yt_play', { ...data, senderId: socket.id });
  });

  socket.on('yt_pause', (data: { channelId: string; time: number }) => {
    socket.broadcast.emit('yt_pause', { ...data, senderId: socket.id });
  });

  socket.on('yt_sync', (data: YtSyncPayload) => {
    socket.broadcast.emit('yt_sync', { ...data, senderId: socket.id });
  });

  socket.on('yt_force_sync', (data: YtSyncPayload) => {
    socket.broadcast.emit('yt_force_sync', { ...data, senderId: socket.id });
  });
}
