import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { registerForPushNotifications } from '../notifications/registerForPushNotifications';
import type { AppStackParamList, AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HouseholdsScreen from '../screens/HouseholdsScreen';
import AnimalsScreen from '../screens/AnimalsScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import MedicalProfileScreen from '../screens/MedicalProfileScreen';
import HealthEntriesScreen from '../screens/HealthEntriesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import DocumentsScreen from '../screens/DocumentsScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  useEffect(() => {
    registerForPushNotifications().catch(() => undefined);
  }, []);

  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Households" component={HouseholdsScreen} options={{ title: 'Mes foyers' }} />
      <AppStack.Screen name="Animals" component={AnimalsScreen} options={{ title: 'Animaux' }} />
      <AppStack.Screen name="AnimalDetail" component={AnimalDetailScreen} options={{ title: 'Animal' }} />
      <AppStack.Screen
        name="MedicalProfile"
        component={MedicalProfileScreen}
        options={{ title: 'Fiche medicale' }}
      />
      <AppStack.Screen name="HealthEntries" component={HealthEntriesScreen} options={{ title: 'Carnet de sante' }} />
      <AppStack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Calendrier' }} />
      <AppStack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Documents' }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <NavigationContainer>{isAuthenticated ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
