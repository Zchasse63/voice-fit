/**
 * Message Model
 * 
 * WatermelonDB model for chat messages in unified chat interface.
 * Stores workout logging messages, AI coaching Q&A, onboarding conversations, and adherence alerts.
 */

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Message extends Model {
  static table = 'messages';

  @field('user_id') userId!: string;
  @field('text') text!: string;
  @field('sender') sender!: string; // 'user' or 'ai'
  @field('message_type') messageType!: string; // 'workout_log', 'question', 'general', 'onboarding', 'adherence_alert'
  @field('data') data?: string; // JSON string of additional data (parsed workout data, alert details, etc.)
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

