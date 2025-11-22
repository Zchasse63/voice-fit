/**
 * Message Persistence Service
 *
 * Handles saving and loading chat messages to/from WatermelonDB.
 * Ensures chat history persists across app restarts and syncs to cloud.
 */

import { Q } from '@nozbe/watermelondb';
import { database } from '../database/watermelon/database';
import Message from '../database/watermelon/models/Message';

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  sender: 'user' | 'ai';
  messageType: 'workout_log' | 'question' | 'general' | 'onboarding' | 'adherence_alert';
  data?: any; // Additional structured data
  timestamp: Date;
}

class MessagePersistenceService {
  /**
   * Save a message to WatermelonDB
   */
  async saveMessage(message: ChatMessage): Promise<Message> {
    try {
      const savedMessage = await database.write(async () => {
        const newMessage = await database.get<Message>('messages').create((msg) => {
          msg.userId = message.userId;
          msg.text = message.text;
          msg.sender = message.sender;
          msg.messageType = message.messageType;
          msg.data = message.data ? JSON.stringify(message.data) : undefined;
          msg.synced = false; // Mark as unsynced for cloud backup
        });
        return newMessage;
      });

      console.log('✅ Message saved to WatermelonDB:', {
        id: savedMessage.id,
        sender: savedMessage.sender,
        messageType: savedMessage.messageType,
        synced: savedMessage.synced,
      });

      return savedMessage;
    } catch (error) {
      console.error('❌ Failed to save message to WatermelonDB:', error);
      throw error;
    }
  }

  /**
   * Load messages for a user from WatermelonDB
   */
  async loadMessages(userId: string, limit: number = 100): Promise<ChatMessage[]> {
    try {
      const messages = await database
        .get<Message>('messages')
        .query(
          Q.where('user_id', userId),
          Q.sortBy('created_at', Q.desc),
          Q.take(limit)
        )
        .fetch();

      // Reverse to get chronological order (oldest first)
      const chatMessages = messages.reverse().map((msg) => ({
        id: msg.id,
        userId: msg.userId,
        text: msg.text,
        sender: msg.sender as 'user' | 'ai',
        messageType: msg.messageType as any,
        data: msg.data ? JSON.parse(msg.data) : undefined,
        timestamp: msg.createdAt,
      }));

      console.log(`✅ Loaded ${chatMessages.length} messages from WatermelonDB for user ${userId}`);

      return chatMessages;
    } catch (error) {
      console.error('❌ Failed to load messages from WatermelonDB:', error);
      return [];
    }
  }

  /**
   * Clear all messages for a user (for testing/debugging)
   */
  async clearMessages(userId: string): Promise<void> {
    try {
      await database.write(async () => {
        const messages = await database
          .get<Message>('messages')
          .query(
            Q.where('user_id', userId)
          )
          .fetch();

        await Promise.all(messages.map((msg) => msg.markAsDeleted()));
      });

      console.log(`✅ Cleared all messages for user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to clear messages:', error);
      throw error;
    }
  }

  /**
   * Get unsynced messages for cloud sync
   */
  async getUnsyncedMessages(userId: string): Promise<Message[]> {
    try {
      const messages = await database
        .get<Message>('messages')
        .query(
          Q.where('user_id', userId),
          Q.where('synced', false),
          Q.sortBy('created_at', Q.asc)
        )
        .fetch();

      console.log(`✅ Found ${messages.length} unsynced messages for user ${userId}`);

      return messages;
    } catch (error) {
      console.error('❌ Failed to get unsynced messages:', error);
      return [];
    }
  }

  /**
   * Mark messages as synced
   */
  async markMessagesSynced(messageIds: string[]): Promise<void> {
    try {
      await database.write(async () => {
        const messages = await database
          .get<Message>('messages')
          .query(
            Q.where('id', Q.oneOf(messageIds))
          )
          .fetch();

        await Promise.all(
          messages.map((msg) =>
            msg.update((m) => {
              m.synced = true;
            })
          )
        );
      });

      console.log(`✅ Marked ${messageIds.length} messages as synced`);
    } catch (error) {
      console.error('❌ Failed to mark messages as synced:', error);
      throw error;
    }
  }
}

export const messagePersistenceService = new MessagePersistenceService();

