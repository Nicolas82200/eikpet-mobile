import React, { useEffect, useState } from 'react';
import { Image, type StyleProp, type ImageStyle } from 'react-native';
import { getAccessToken } from '../auth/token-storage';

interface Props {
  uri: string;
  style?: StyleProp<ImageStyle>;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Image chargee depuis une route protegee (Authorization: Bearer ...), ex: photo d'animal, document.
 * Le composant Image de React Native n'envoie pas fiablement la prop `headers` (notamment sur iOS),
 * donc on telecharge le fichier nous-memes puis on l'affiche en data URI.
 */
export default function AuthenticatedImage({ uri, style }: Props) {
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUri(null);
    (async () => {
      const token = await getAccessToken();
      const response = await fetch(uri, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        return;
      }
      const blob = await response.blob();
      const result = await blobToDataUri(blob);
      if (!cancelled) {
        setDataUri(result);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (!dataUri) {
    return null;
  }

  return <Image source={{ uri: dataUri }} style={style} />;
}
