import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Cloud, CloudOff, CheckCircle } from 'lucide-react-native';
import { syncService } from '../../services/sync/SyncService';

export default function SyncStatus() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    unsyncedWorkouts: 0,
    unsyncedSets: 0,
  });

  useEffect(() => {
    loadSyncStatus();
    
    // Refresh sync status every 5 seconds
    const interval = setInterval(loadSyncStatus, 5000);
    
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

  const totalUnsynced = syncStatus.unsyncedWorkouts + syncStatus.unsyncedSets;

  if (syncStatus.isSyncing) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="small" color={colors.accent.green} />
        <Text
          style={{
            marginLeft: 8,
            fontSize: tokens.typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          Syncing...
        </Text>
      </View>
    );
  }

  if (totalUnsynced > 0) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <CloudOff color={colors.accent.orange} size={16} />
        <Text
          style={{
            marginLeft: 8,
            fontSize: tokens.typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          {totalUnsynced} pending
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <CheckCircle color={colors.accent.green} size={16} />
      <Text
        style={{
          marginLeft: 8,
          fontSize: tokens.typography.fontSize.xs,
          color: colors.text.tertiary,
        }}
      >
        Synced
      </Text>
    </View>
  );
}

