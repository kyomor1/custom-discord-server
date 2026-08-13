import { Server, Socket } from 'socket.io';
import { voiceChannels, broadcastGlobalVoiceStates } from './state.js';
import { VoiceParticipant } from './types.js';

export function registerVoiceHandlers(io: Server, socket: Socket) {
  socket.on('join_voice', (data: { channelId: string; userId: string; username: string; avatarUrl: string }) => {
    const { channelId, userId, username, avatarUrl } = data;
    const roomName = `voice_${channelId}`;

    socket.join(roomName);

    if (!voiceChannels.has(channelId)) {
      voiceChannels.set(channelId, new Map());
    }

    const channelMap = voiceChannels.get(channelId)!;
    const participant: VoiceParticipant = {
      socketId: socket.id,
      userId,
      username,
      avatarUrl,
      channelId
    };

    channelMap.set(socket.id, participant);

    // Notify existing users in channel about new participant
    const existingParticipants = Array.from(channelMap.values()).filter(p => p.socketId !== socket.id);
    socket.emit('voice_participants', existingParticipants);

    // Notify others in channel that new user joined
    socket.to(roomName).emit('user_joined_voice', participant);

    // BROADCAST TO ALL CLIENTS ON SERVER ON VOICE JOIN
    broadcastGlobalVoiceStates(io);

    console.log(`[Voice] ${username} (${socket.id}) joined voice channel ${channelId}`);
  });

  socket.on('leave_voice', (data: { channelId: string }) => {
    const { channelId } = data;
    const roomName = `voice_${channelId}`;

    socket.leave(roomName);

    if (voiceChannels.has(channelId)) {
      const channelMap = voiceChannels.get(channelId)!;
      const participant = channelMap.get(socket.id);

      if (participant) {
        channelMap.delete(socket.id);
        socket.to(roomName).emit('user_left_voice', { socketId: socket.id, userId: participant.userId });
        console.log(`[Voice] ${participant.username} left voice channel ${channelId}`);
      }

      if (channelMap.size === 0) {
        voiceChannels.delete(channelId);
      }
    }

    // BROADCAST TO ALL CLIENTS ON SERVER ON VOICE LEAVE
    broadcastGlobalVoiceStates(io);
  });

  socket.on('speaking_status', (data: { channelId: string; isSpeaking: boolean }) => {
    socket.to(`voice_${data.channelId}`).emit('user_speaking_status', {
      socketId: socket.id,
      isSpeaking: data.isSpeaking
    });
  });

  socket.on('screen_share_status', (data: { channelId: string; isSharing: boolean; isDual?: boolean }) => {
    const channelMap = voiceChannels.get(data.channelId);
    if (channelMap) {
      const p = channelMap.get(socket.id);
      if (p) {
        p.isScreenSharing = data.isSharing;
        p.isDualStream = data.isDual;
      }
    }

    socket.to(`voice_${data.channelId}`).emit('screen_share_status', {
      socketId: socket.id,
      isSharing: data.isSharing,
      isDual: data.isDual
    });

    broadcastGlobalVoiceStates(io);
  });

  socket.on('webrtc_offer', (data: any) => {
    socket.to(data.targetSocketId).emit('webrtc_offer', {
      offer: data.offer,
      senderSocketId: socket.id,
      senderUserId: data.senderUserId,
      username: data.username,
      isScreenShare: data.isScreenShare
    });
  });

  socket.on('webrtc_answer', (data: any) => {
    socket.to(data.targetSocketId).emit('webrtc_answer', {
      answer: data.answer,
      senderSocketId: socket.id
    });
  });

  socket.on('webrtc_ice', (data: any) => {
    socket.to(data.targetSocketId).emit('webrtc_ice', {
      candidate: data.candidate,
      senderSocketId: socket.id
    });
  });
}
