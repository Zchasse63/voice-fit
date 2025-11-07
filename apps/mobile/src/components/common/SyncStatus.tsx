import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Cloud, CloudOff, CheckCircle } from 'lucide-react-native';
import { syncService } from '../../services/sync/SyncService';

export default function SyncStatus() {
  const { isDark } = useTheme();
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
      <View className="flex-row items-center">
        <ActivityIndicator size="small" color={isDark ? '#4A9B6F' : '#2C5F3D'} />
        <Text className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Syncing...
        </Text>
      </View>
    );
  }

  if (totalUnsynced > 0) {
    return (
      <View className="flex-row items-center">
        <CloudOff color={isDark ? '#F9AC60' : '#DD7B57'} size={16} />
        <Text className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {totalUnsynced} pending
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center">
      <CheckCircle color={isDark ? '#4A9B6F' : '#2C5F3D'} size={16} />
      <Text className={`text-xs ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Synced
      </Text>
    </View>
  );
}

