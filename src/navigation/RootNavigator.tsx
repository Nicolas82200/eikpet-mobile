import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DefaultTheme, NavigationContainer, useNavigation, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme/colors';
import { registerForPushNotifications } from '../notifications/registerForPushNotifications';
import type { AppStackParamList, AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import AccountScreen from '../screens/AccountScreen';
import HouseholdsScreen from '../screens/HouseholdsScreen';
import AnimalsScreen from '../screens/AnimalsScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';
import MedicalProfileScreen from '../screens/MedicalProfileScreen';
import HealthEntriesScreen from '../screens/HealthEntriesScreen';
import CalendarScreen from '../screens/CalendarScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import AppointmentFollowUpScreen from '../screens/AppointmentFollowUpScreen';
import HouseholdMembersScreen from '../screens/HouseholdMembersScreen';
import PaywallScreen from '../screens/PaywallScreen';
import ProvidersScreen from '../screens/ProvidersScreen';
import BoardingsScreen from '../screens/BoardingsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BudgetScreen from '../screens/BudgetScreen';
import RidingSessionsScreen from '../screens/RidingSessionsScreen';
import ProvidersMapScreen from '../screens/ProvidersMapScreen';
import PracticalInfoScreen from '../screens/PracticalInfoScreen';
import WeightCurveScreen from '../screens/WeightCurveScreen';
import EmergencySheetScreen from '../screens/EmergencySheetScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
  },
};

const headerScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.accent,
  headerTitleStyle: { color: colors.textPrimary, fontWeight: '600' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  navigation: NativeStackNavigationProp<AppStackParamList>,
) {
  const data = response.notification.request.content.data;
  if (data?.kind === 'appointment-followup' && typeof data.animalId === 'number' && typeof data.entryId === 'number') {
    navigation.navigate('AppointmentFollowUp', { animalId: data.animalId, entryId: data.entryId });
  }
}

function AppNavigator() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  useEffect(() => {
    registerForPushNotifications().catch(() => undefined);

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response, navigation);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      handleNotificationResponse(response, navigation),
    );
    return () => subscription.remove();
  }, [navigation]);

  return (
    <AppStack.Navigator screenOptions={headerScreenOptions}>
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
      <AppStack.Screen
        name="AppointmentFollowUp"
        component={AppointmentFollowUpScreen}
        options={{ title: 'Suivi du rendez-vous' }}
      />
      <AppStack.Screen
        name="HouseholdMembers"
        component={HouseholdMembersScreen}
        options={{ title: 'Membres du foyer' }}
      />
      <AppStack.Screen name="Account" component={AccountScreen} options={{ title: 'Mon compte' }} />
      <AppStack.Screen name="Paywall" component={PaywallScreen} options={{ title: 'Abonnement' }} />
      <AppStack.Screen name="Providers" component={ProvidersScreen} options={{ title: 'Intervenants' }} />
      <AppStack.Screen name="Boardings" component={BoardingsScreen} options={{ title: 'Pension' }} />
      <AppStack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Comptes-rendus' }} />
      <AppStack.Screen name="Budget" component={BudgetScreen} options={{ title: 'Budget' }} />
      <AppStack.Screen name="RidingSessions" component={RidingSessionsScreen} options={{ title: 'Seances' }} />
      <AppStack.Screen name="ProvidersMap" component={ProvidersMapScreen} options={{ title: 'Carte' }} />
      <AppStack.Screen name="PracticalInfo" component={PracticalInfoScreen} options={{ title: 'Infos pratiques' }} />
      <AppStack.Screen name="WeightCurve" component={WeightCurveScreen} options={{ title: 'Courbe de poids' }} />
      <AppStack.Screen
        name="EmergencySheet"
        component={EmergencySheetScreen}
        options={{ title: "Fiche d'urgence" }}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
