import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CoachScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Coach</Text>
      <Text style={styles.subtitle}>AI conversational interface + settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C5F3D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

