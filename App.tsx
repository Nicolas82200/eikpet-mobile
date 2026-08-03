import { StatusBar } from 'expo-status-bar';
import { TextInput } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/auth/AuthContext';
import { PurchasesProvider } from './src/subscriptions/PurchasesContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';

// Sur certains telephones (mode sombre systeme notamment), le TextInput Android herite
// d'une couleur de placeholder claire par defaut, illisible sur nos fonds clairs. On force
// une couleur lisible pour tous les champs de l'app plutot que de la repeter partout.
(TextInput as unknown as { defaultProps: Record<string, unknown> }).defaultProps = {
  ...(TextInput as unknown as { defaultProps?: Record<string, unknown> }).defaultProps,
  placeholderTextColor: colors.textMuted,
};

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
