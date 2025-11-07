import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Run extends Model {
  static table = 'runs';

  @field('user_id') userId!: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime!: Date;
  @field('distance') distance!: number; // meters
  @field('duration') duration!: number; // seconds
  @field('pace') pace!: number; // minutes per mile
  @field('avg_speed') avgSpeed!: number; // mph
  @field('calories') calories!: number;
  @field('route') route!: string; // JSON string of coordinates
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

