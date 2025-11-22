/**
 * SyncStatus Component
 * 
 * Displays sync status and allows manual sync trigger.
 * Shows pending sync count and sync in progress indicator.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import tokens from '../../theme/tokens';
import { syncService } from '../../services/sync/SyncService';
import { useAuthStore } from '../../store/auth.store';

export default function SyncStatus() {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? 'dark' : 'light'];
  const user = useAuthStore((state) => state.user);

  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    unsyncedWorkouts: 0,
    unsyncedSets: 0,
    unsyncedRuns: 0,
    unsyncedMessages: 0,
    unsyncedReadinessScores: 0,
    unsyncedPRHistory: 0,
  });

  const totalUnsynced =
    syncStatus.unsyncedWorkouts +
    syncStatus.unsyncedSets +
    syncStatus.unsyncedRuns +
    syncStatus.unsyncedMessages +
    syncStatus.unsyncedReadinessScores +
    syncStatus.unsyncedPRHistory;

  useEffect(() => {
    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleManualSync = async () => {
    if (!user?.id || syncStatus.isSyncing) return;

    try {
      await syncService.fullSync(user.id);
      await loadSyncStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  return (
    <Pressable
      onPress={handleManualSync}
      disabled={syncStatus.isSyncing}
      style={[
        styles.container,
        {
          backgroundColor: colors.background.secondary,
          borderColor: colors.border.primary,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        {syncStatus.isSyncing ? (
          <ActivityIndicator size="small" color={colors.text.brand} />
        ) : totalUnsynced > 0 ? (
          <CloudOff size={16} color={colors.text.warning} />
        ) : (
          <Cloud size={16} color={colors.text.success} />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.statusText, { color: colors.text.primary }]}>
          {syncStatus.isSyncing
            ? 'Syncing...'
            : totalUnsynced > 0
            ? `${totalUnsynced} pending`
            : 'All synced'}
        </Text>
        {!syncStatus.isSyncing && totalUnsynced > 0 && (
          <Text style={[styles.tapText, { color: colors.text.secondary }]}>
            Tap to sync
          </Text>
        )}
      </View>

      {!syncStatus.isSyncing && totalUnsynced > 0 && (
        <RefreshCw size={14} color={colors.text.secondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
    borderWidth: 1,
    gap: tokens.spacing.sm,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: '600',
  },
  tapText: {
    fontSize: tokens.typography.fontSize.xs,
    marginTop: 2,
  },
});

