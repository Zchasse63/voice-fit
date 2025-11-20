/**
 * Coach Store
 * 
 * Manages coach-specific state including selected client and assigned clients list.
 */

import { create } from 'zustand';
import { supabase } from '../services/database/supabase.client';

interface Client {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface CoachState {
  // State
  selectedClientId: string | null;
  assignedClients: Client[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedClientId: (clientId: string | null) => void;
  fetchAssignedClients: () => Promise<void>;
  clearCoachState: () => void;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  // Initial state
  selectedClientId: null,
  assignedClients: [],
  isLoading: false,
  error: null,

  // Set selected client
  setSelectedClientId: (clientId: string | null) => {
    set({ selectedClientId: clientId });
  },

  // Fetch assigned clients from Supabase
  fetchAssignedClients: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch assigned clients
      const { data: assignments, error } = await supabase
        .from('client_assignments')
        .select(`
          client_id,
          user_profiles!client_id (
            user_id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('coach_id', user.id)
        .is('revoked_at', null);

      if (error) throw error;

      // Transform data
      const clients: Client[] = (assignments || []).map((assignment: any) => ({
        id: assignment.user_profiles.user_id,
        email: assignment.user_profiles.email,
        full_name: assignment.user_profiles.full_name,
        avatar_url: assignment.user_profiles.avatar_url,
      }));

      set({ 
        assignedClients: clients,
        isLoading: false,
        // Auto-select first client if none selected
        selectedClientId: get().selectedClientId || (clients.length > 0 ? clients[0].id : null),
      });
    } catch (error: any) {
      console.error('Error fetching assigned clients:', error);
      set({ 
        error: error.message || 'Failed to fetch clients',
        isLoading: false,
      });
    }
  },

  // Clear coach state (on logout)
  clearCoachState: () => {
    set({
      selectedClientId: null,
      assignedClients: [],
      isLoading: false,
      error: null,
    });
  },
}));

