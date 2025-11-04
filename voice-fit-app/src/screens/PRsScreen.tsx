import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PRsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 PRs</Text>
      <Text style={styles.subtitle}>Personal records + progression</Text>
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

