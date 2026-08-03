import React, { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/types';
import * as api from '../api/endpoints';
import type { Provider } from '../types/api';
import { getProviderTypeLabel } from '../data/providerTypes';
import { isPlanLimitError, showLoadError } from '../utils/errorHandling';

type Props = NativeStackScreenProps<AppStackParamList, 'ProvidersMap'>;

// react-native-maps est un module natif : indisponible dans Expo Go (meme raison que
// react-native-purchases, cf. PurchasesContext). La detection d'environnement seule
// n'est pas fiable a 100% selon la version d'Expo Go : on entoure aussi le require()
// d'un try/catch pour ne jamais planter l'app si le module natif est absent.
let Maps: typeof import('react-native-maps') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Maps = require('react-native-maps') as typeof import('react-native-maps');
} catch {
  Maps = null;
}

export default function ProvidersMapScreen({ route, navigation }: Props) {
  const { householdId } = route.params;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    api
      .listProvidersForMap(householdId)
      .then((list) => {
        setProviders(list);
        setLoaded(true);
      })
      .catch((error) => {
        if (isPlanLimitError(error)) {
          navigation.replace('Paywall');
        } else {
          showLoadError(error);
        }
      });
  }, [householdId, navigation]);

  useFocusEffect(load);

  if (!Maps) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>
          La carte necessite un build de l&apos;app (indisponible dans Expo Go). Installe un build EAS pour la
          tester.
        </Text>
      </View>
    );
  }

  if (!loaded) {
    return null;
  }

  if (providers.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>
          Aucun intervenant geocode pour l&apos;instant. Renseigne une adresse dans le repertoire des
          intervenants pour qu&apos;il apparaisse ici.
        </Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: providers[0].latitude!,
    longitude: providers[0].longitude!,
    latitudeDelta: 0.2,
    longitudeDelta: 0.2,
  };

  return (
    <Maps.default style={styles.map} initialRegion={initialRegion}>
      {providers.map((provider) => (
        <Maps.Marker
          key={provider.id}
          coordinate={{ latitude: provider.latitude!, longitude: provider.longitude! }}
          title={provider.name}
          description={getProviderTypeLabel(provider.type)}
        >
          <Maps.Callout
            onPress={() => provider.address && Linking.openURL(`geo:0,0?q=${encodeURIComponent(provider.address)}`)}
          >
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{provider.name}</Text>
              <Text style={styles.calloutSubtitle}>{getProviderTypeLabel(provider.type)}</Text>
              {provider.address && <Text style={styles.calloutAddress}>{provider.address}</Text>}
            </View>
          </Maps.Callout>
        </Maps.Marker>
      ))}
    </Maps.default>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  hint: { color: '#8A7B68', textAlign: 'center' },
  callout: { minWidth: 160, padding: 4 },
  calloutTitle: { fontWeight: '700', color: '#3A3226' },
  calloutSubtitle: { color: '#B8863B', fontSize: 12, textTransform: 'uppercase', marginTop: 2 },
  calloutAddress: { color: '#8A7B68', marginTop: 4, fontSize: 12 },
});
