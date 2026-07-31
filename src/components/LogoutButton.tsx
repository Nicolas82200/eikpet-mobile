import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();
  return (
    <TouchableOpacity onPress={() => logout()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={styles.text}>Deconnexion</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: { color: '#a33', fontWeight: '600' },
});
