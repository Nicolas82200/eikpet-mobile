import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  const onPress = () => {
    Alert.alert('Se deconnecter ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Deconnexion', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={styles.text}>Deconnexion</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: { color: '#a33', fontWeight: '600' },
});
