import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly, relation } from '@nozbe/watermelondb/decorators';

export default class RunningShoe extends Model {
  static table = 'running_shoes';

  @text('brand') brand!: string;
  @text('model') model!: string;
  @date('purchase_date') purchaseDate!: Date;
  @field('total_mileage') totalMileage!: number;
  @field('replacement_threshold') replacementThreshold!: number;
  @field('is_active') isActive!: boolean;
  @text('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Computed properties
  get mileagePercentage(): number {
    return (this.totalMileage / this.replacementThreshold) * 100;
  }

  get isNearReplacement(): boolean {
    return this.mileagePercentage >= 80;
  }

  get needsReplacement(): boolean {
    return this.mileagePercentage >= 100;
  }

  get mileageRemaining(): number {
    return Math.max(0, this.replacementThreshold - this.totalMileage);
  }
}

