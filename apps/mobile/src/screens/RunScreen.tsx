import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Alert, Platform } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { useRunStore } from '../store/run.store';
import { Play, Pause, Square, MapPin } from 'lucide-react-native';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function RunScreen() {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    isTracking,
    isPaused,
    coordinates,
    stats,
    error,
    hasPermission,
    requestPermissions,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    reset,
  } = useRunStore();

  useEffect(() => {
    initializePermissions();
  }, []);

  useEffect(() => {
    // Center map on latest coordinate
    if (coordinates.length > 0 && mapRef.current) {
      const latestCoord = coordinates[coordinates.length - 1];
      mapRef.current.animateToRegion({
        latitude: latestCoord.latitude,
        longitude: latestCoord.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [coordinates]);

  const initializePermissions = async () => {
    try {
      await requestPermissions();
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize permissions:', err);
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'Voice Fit needs access to your location to track your runs.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: () => requestPermissions() },
        ]
      );
      return;
    }

    await startRun();
  };

  const handlePause = async () => {
    await pauseRun();
  };

  const handleResume = async () => {
    await resumeRun();
  };

  const handleStop = () => {
    Alert.alert(
      'Stop Run',
      'Are you sure you want to stop this run? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            await stopRun();
            // TODO: Save run to WatermelonDB
            Alert.alert('Run Saved', 'Your run has been saved successfully!', [
              { text: 'OK', onPress: () => reset() },
            ]);
          },
        },
      ]
    );
  };

  const formatDistance = (meters: number): string => {
    const miles = meters * 0.000621371;
    return miles.toFixed(2);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    if (pace === 0 || !isFinite(pace)) return '--:--';
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTerrain = (difficulty: string): string => {
    const terrainMap: { [key: string]: string } = {
      flat: 'Flat',
      rolling: 'Rolling',
      moderate_uphill: 'Moderate ↗',
      steep_uphill: 'Steep ↗',
      very_steep_uphill: 'Very Steep ↗',
      moderate_downhill: 'Moderate ↘',
      steep_downhill: 'Steep ↘',
    };
    return terrainMap[difficulty] || 'Flat';
  };

  if (isLoading) {
    return <LoadingSpinner message="Initializing GPS..." fullScreen />;
  }

  if (!hasPermission) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
        <MapPin color={isDark ? '#4A9B6F' : '#2C5F3D'} size={64} />
        <Text className={`text-2xl font-bold mt-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          Location Permission Required
        </Text>
        <Text className={`text-base text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Voice Fit needs access to your location to track your runs and outdoor workouts.
        </Text>
        <Pressable
          className="mt-6 px-6 py-3 bg-primary-500 rounded-xl active:opacity-80"
          onPress={requestPermissions}
          accessibilityLabel="Grant Location Permission"
          accessibilityRole="button"
        >
          <Text className="text-base font-bold text-white">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-background-light'}`}>
      {/* Map */}
      <View className="flex-1">
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={{ flex: 1 }}
          showsUserLocation
          showsMyLocationButton
          followsUserLocation={isTracking}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates.map((coord) => ({
                latitude: coord.latitude,
                longitude: coord.longitude,
              }))}
              strokeColor={isDark ? '#4A9B6F' : '#2C5F3D'}
              strokeWidth={4}
            />
          )}
        </MapView>
      </View>

      {/* Stats Overlay */}
      <View className={`absolute top-12 left-4 right-4 p-4 rounded-xl ${isDark ? 'bg-gray-800/90' : 'bg-white/90'}`}>
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Distance</Text>
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatDistance(stats.distance)} mi
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Duration</Text>
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatDuration(stats.duration)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pace</Text>
            <Text className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {formatPace(stats.pace)}
            </Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View className={`p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {error && (
          <Text className="text-sm text-red-500 mb-4 text-center">{error}</Text>
        )}

        <View className="flex-row justify-center items-center space-x-4">
          {!isTracking ? (
            <Pressable
              className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center active:opacity-80"
              onPress={handleStart}
              accessibilityLabel="Start Run"
              accessibilityRole="button"
            >
              <Play color="white" size={32} fill="white" />
            </Pressable>
          ) : (
            <>
              <Pressable
                className={`w-16 h-16 rounded-full items-center justify-center active:opacity-80 ${
                  isPaused ? 'bg-primary-500' : 'bg-secondary-500'
                }`}
                onPress={isPaused ? handleResume : handlePause}
                accessibilityLabel={isPaused ? 'Resume Run' : 'Pause Run'}
                accessibilityRole="button"
              >
                {isPaused ? (
                  <Play color="white" size={24} fill="white" />
                ) : (
                  <Pause color="white" size={24} fill="white" />
                )}
              </Pressable>

              <Pressable
                className="w-16 h-16 bg-red-500 rounded-full items-center justify-center active:opacity-80"
                onPress={handleStop}
                accessibilityLabel="Stop Run"
                accessibilityRole="button"
              >
                <Square color="white" size={24} fill="white" />
              </Pressable>
            </>
          )}
        </View>

        {/* Additional Stats */}
        {isTracking && (
          <>
            <View className="flex-row justify-around mt-6">
              <View className="items-center">
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Avg Speed</Text>
                <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {stats.avgSpeed.toFixed(1)} mph
                </Text>
              </View>
              <View className="items-center">
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Calories</Text>
                <Text className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {stats.calories}
                </Text>
              </View>
            </View>

            {/* Elevation & GAP Stats */}
            {(stats.elevationGain > 0 || stats.elevationLoss > 0) && (
              <View className="flex-row justify-around mt-4 pt-4 border-t border-gray-700">
                <View className="items-center">
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Elevation</Text>
                  <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    +{Math.round(stats.elevationGain)}m / -{Math.round(stats.elevationLoss)}m
                  </Text>
                </View>
                {stats.gradeAdjustedPace && (
                  <View className="items-center">
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>GAP</Text>
                    <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {formatPace(stats.gradeAdjustedPace)}/mi
                    </Text>
                  </View>
                )}
                <View className="items-center">
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Terrain</Text>
                  <Text className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {formatTerrain(stats.terrainDifficulty)}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

