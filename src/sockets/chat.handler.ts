import { Server, Socket } from 'socket.io';
import { prisma } from '../db.js';
import {
  generateAiResponse,
  getAiUsageStatsFormatted,
  incrementAiUsage,
  getOrCreateAiBotUser
} from '../services/ai.service.js';
import { SendMessagePayload, DeleteMessagePayload } from './types.js';

export function registerChatHandlers(io: Server, socket: Socket) {
  // Handle Delete Message
  socket.on('delete_message', async (data: DeleteMessagePayload) => {
    try {
      const msg = await prisma.message.findUnique({
        where: { id: data.messageId }
      });

      if (!msg || msg.authorId !== data.authorId) {
        return;
      }

      await prisma.message.deleteMany({
        where: { id: data.messageId, authorId: data.authorId }
      });

      const room = data.channelId
        ? `channel_${data.channelId}`
        : data.recipientId
        ? [data.authorId, data.recipientId].sort().join('_')
        : null;

      if (room) {
        io.to(room).emit('message_deleted', { messageId: data.messageId });
      } else {
        io.emit('message_deleted', { messageId: data.messageId });
      }
    } catch (err) {
      console.error('Socket delete_message error:', err);
    }
  });

  // Handle Send Message
  socket.on('send_message', async (data: SendMessagePayload) => {
    try {
      const message = await prisma.message.create({
        data: {
          content: data.content || null,
          fileUrl: data.fileUrl || null,
          fileName: data.fileName || null,
          fileType: data.fileType || null,
          fileSize: data.fileSize ? BigInt(data.fileSize) : null,
          authorId: data.authorId,
          channelId: data.channelId || null,
          recipientId: data.recipientId || null
        },
        include: {
          author: {
            select: { id: true, username: true, avatarUrl: true }
          },
          recipient: {
            select: { id: true, username: true, avatarUrl: true }
          }
        }
      });

      const serialized = {
        ...message,
        replyToId: data.replyToId || null,
        replyToUser: data.replyToUser || null,
        replyToContent: data.replyToContent || null,
        fileSize: message.fileSize ? Number(message.fileSize) : null
      };

      if (data.channelId) {
        io.to(`channel_${data.channelId}`).emit('new_message', serialized);
      } else if (data.recipientId) {
        const room1 = `dm_${data.authorId}_${data.recipientId}`;
        const room2 = `dm_${data.recipientId}_${data.authorId}`;
        io.to(room1).to(room2).emit('new_message', serialized);
      }

      // Check for AI usage / commands
      const contentStr = (data.content || '').trim();
      const isUsageCmd = contentStr === '/usage';
      const isAiRequest = contentStr.startsWith('/ai') || contentStr.includes('@AI');

      const targetRoom = data.channelId ? `channel_${data.channelId}` : `dm_${data.authorId}_${data.recipientId}`;

      // Handle /usage command
      if (isUsageCmd) {
        const usageText = getAiUsageStatsFormatted();

        const aiSerialized = {
          id: `usage_${Date.now()}`,
          content: usageText,
          authorId: 'ai_bot_system_id',
          channelId: data.channelId || null,
          recipientId: data.recipientId || null,
          createdAt: new Date().toISOString(),
          replyToId: message.id,
          replyToUser: message.author.username,
          replyToContent: message.content || '/usage',
          fileSize: null,
          author: {
            id: 'ai_bot_system_id',
            username: 'AI Assistant 🤖',
            avatarUrl: 'https://api.iconify.design/lucide:bot.svg'
          }
        };

        io.to(targetRoom).emit('new_message', aiSerialized);
        return;
      }

      // Handle /ai prompt requests
      if (isAiRequest) {
        incrementAiUsage();

        // Broadcast "🤖 ИИ думает..." typing status
        io.to(targetRoom).emit('ai_typing', { channelId: data.channelId, isTyping: true });

        setTimeout(async () => {
          const aiAnswer = await generateAiResponse(contentStr);
          let aiSavedMessage: any;

          try {
            const aiBotDbUser = await getOrCreateAiBotUser();

            aiSavedMessage = await prisma.message.create({
              data: {
                content: aiAnswer,
                authorId: aiBotDbUser.id,
                channelId: data.channelId || null,
                recipientId: data.recipientId || null
              },
              include: {
                author: {
                  select: { id: true, username: true, avatarUrl: true }
                }
              }
            });
          } catch (e) {
            console.warn('[AI Bot] DB save fallback:', e);
            aiSavedMessage = {
              id: `ai_${Date.now()}`,
              content: aiAnswer,
              authorId: 'ai_bot_system_id',
              channelId: data.channelId || null,
              recipientId: data.recipientId || null,
              createdAt: new Date().toISOString(),
              author: {
                id: 'ai_bot_system_id',
                username: 'AI Assistant 🤖',
                avatarUrl: 'https://api.iconify.design/lucide:bot.svg'
              }
            };
          }

          const aiSerialized = {
            ...aiSavedMessage,
            replyToId: message.id,
            replyToUser: message.author.username,
            replyToContent: message.content || '[Question]',
            fileSize: null
          };

          // Clear typing status and broadcast answer
          io.to(targetRoom).emit('ai_typing', { channelId: data.channelId, isTyping: false });
          io.to(targetRoom).emit('new_message', aiSerialized);
        }, 600);
      }
    } catch (err) {
      console.error('[Socket] Error saving message:', err);
    }
  });
}
