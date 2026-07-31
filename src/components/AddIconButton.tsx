import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function AddIconButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} hitSlop={10}>
      <Text style={styles.text}>+</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2f6f4f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: 'white', fontSize: 20, fontWeight: 'bold', lineHeight: 22 },
});
