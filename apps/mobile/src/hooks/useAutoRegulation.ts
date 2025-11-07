/**
 * useAutoRegulation Hook
 * 
 * Manages auto-regulation checks and modal display for workout flow.
 * Checks if auto-regulation should be triggered before workout starts.
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import {
  autoRegulationService,
  AutoRegulationTrigger,
  LoadAdjustment,
} from '../services/autoregulation/AutoRegulationService';

export function useAutoRegulation() {
  const user = useAuthStore((state) => state.user);
  const [isChecking, setIsChecking] = useState(false);
  const [trigger, setTrigger] = useState<AutoRegulationTrigger | null>(null);
  const [showModal, setShowModal] = useState(false);

  /**
   * Check if auto-regulation should be triggered
   */
  const checkAutoRegulation = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      setIsChecking(true);
      const result = await autoRegulationService.shouldTriggerAutoRegulation(user.id);
      setTrigger(result);
      
      if (result.triggered) {
        setShowModal(true);
        return true;
      }
      
      setIsChecking(false);
      return false;
    } catch (error) {
      console.error('Failed to check auto-regulation:', error);
      setIsChecking(false);
      return false;
    }
  };

  /**
   * Get recommended load adjustment for an exercise
   */
  const getRecommendedLoad = async (
    exerciseId: string,
    currentWeight: number
  ): Promise<{ weight: number; adjustment: LoadAdjustment } | null> => {
    if (!user) return null;

    try {
      const result = await autoRegulationService.getRecommendedLoad(
        user.id,
        exerciseId,
        currentWeight
      );
      return result;
    } catch (error) {
      console.error('Failed to get recommended load:', error);
      return null;
    }
  };

  /**
   * Handle modal approval
   */
  const handleApprove = () => {
    setShowModal(false);
    setIsChecking(false);
    console.log('✅ Auto-regulation adjustment approved');
  };

  /**
   * Handle modal rejection
   */
  const handleReject = () => {
    setShowModal(false);
    setIsChecking(false);
    console.log('❌ Auto-regulation adjustment rejected');
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setShowModal(false);
    setIsChecking(false);
  };

  return {
    isChecking,
    trigger,
    showModal,
    checkAutoRegulation,
    getRecommendedLoad,
    handleApprove,
    handleReject,
    closeModal,
  };
}

