import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, Text, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Volontairement pas le composant Modal de RN : sur Android, Modal ouvre une fenetre native
 * separee, qui n'herite ni du redimensionnement automatique au clavier ni d'un systeme de
 * coordonnees coherent avec le reste de l'app -- source des scrolls incoherents constates.
 * La gestion du clavier lui-meme est deleguee a react-native-keyboard-controller (comportement
 * natif identique aux autres apps), plus fiable que le bricolage JS tente precedemment.
 */
export default function AddModal({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(windowHeight)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateY, { toValue: windowHeight, duration: 200, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) {
            setRendered(false);
          }
        },
      );
    }
  }, [visible, windowHeight, translateY]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!rendered) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheetWrapper} pointerEvents="box-none">
        {/* maxHeight : sur un formulaire long (suggestions ouvertes + chips + champs), le
            contenu peut depasser l'ecran. Sans limite + scroll, le bas du formulaire devient
            inaccessible (cf. retour utilisateur). Un seul mecanisme de compensation clavier
            (KeyboardAwareScrollView, ci-dessous) : en cumuler un deuxieme ici double la
            correction et decale les champs au lieu de les degager (cf. retour utilisateur). */}
        <Animated.View style={[styles.sheet, { maxHeight: windowHeight * 0.85, transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          </View>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 + insets.bottom }}
            bottomOffset={20}
          >
            {children}
          </KeyboardAwareScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold' },
  close: { color: '#B8863B', fontWeight: '600' },
});
