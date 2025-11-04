import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>➕ START</Text>
      <Text style={styles.subtitle}>New workout or run</Text>
      <Text style={styles.description}>PRIMARY ACTION - Center, elevated</Text>
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
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

