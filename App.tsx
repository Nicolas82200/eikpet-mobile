import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { PurchasesProvider } from './src/subscriptions/PurchasesContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PurchasesProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </PurchasesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
