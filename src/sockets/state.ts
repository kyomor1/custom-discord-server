import { Server } from 'socket.io';
import { VoiceParticipant } from './types.js';

// Map channelId -> Map<socketId, VoiceParticipant>
export const voiceChannels = new Map<string, Map<string, VoiceParticipant>>();

export function getGlobalVoiceStates(): Record<string, VoiceParticipant[]> {
  const result: Record<string, VoiceParticipant[]> = {};
  voiceChannels.forEach((channelMap, channelId) => {
    result[channelId] = Array.from(channelMap.values());
  });
  return result;
}

export function broadcastGlobalVoiceStates(io: Server) {
  const states = getGlobalVoiceStates();
  io.emit('voice_state_update', states);
}
