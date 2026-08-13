import { Server, Socket } from 'socket.io';
import { getGlobalVoiceStates, broadcastGlobalVoiceStates, voiceChannels } from './state.js';
import { registerChatHandlers } from './chat.handler.js';
import { registerVoiceHandlers } from './voice.handler.js';
import { registerYtHandlers } from './yt.handler.js';

export function setupSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    // Send initial global voice states map to newly connected socket
    socket.emit('voice_state_update', getGlobalVoiceStates());

    // Allow fetching current voice states on demand
    socket.on('get_voice_states', () => {
      socket.emit('voice_state_update', getGlobalVoiceStates());
    });

    // Join room for channel or DM
    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined room ${room}`);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
      console.log(`[Socket] ${socket.id} left room ${room}`);
    });

    // Register sub-handlers
    registerChatHandlers(io, socket);
    registerVoiceHandlers(io, socket);
    registerYtHandlers(socket);

    // Handle Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);

      let statesChanged = false;
      voiceChannels.forEach((channelMap, channelId) => {
        if (channelMap.has(socket.id)) {
          const p = channelMap.get(socket.id)!;
          channelMap.delete(socket.id);
          socket.to(`voice_${channelId}`).emit('user_left_voice', { socketId: socket.id, userId: p.userId });
          statesChanged = true;
        }
      });

      if (statesChanged) {
        broadcastGlobalVoiceStates(io);
      }
    });
  });
}
