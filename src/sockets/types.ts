export interface VoiceParticipant {
  socketId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  channelId: string;
  isMuted?: boolean;
  isDeafened?: boolean;
  isScreenSharing?: boolean;
  isDualStream?: boolean;
}

export interface SendMessagePayload {
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  replyToId?: string;
  replyToUser?: string;
  replyToContent?: string;
  channelId?: string;
  recipientId?: string;
  authorId: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  authorId: string;
  channelId?: string;
  recipientId?: string;
}

export interface YtSyncPayload {
  channelId: string;
  url?: string;
  videoId?: string;
  time: number;
}
