import React, { useEffect, useState } from 'react';
import { Image, type StyleProp, type ImageStyle } from 'react-native';
import { getAccessToken } from '../auth/token-storage';

interface Props {
  uri: string;
  style?: StyleProp<ImageStyle>;
}

/** Image chargee depuis une route protegee (Authorization: Bearer ...), ex: photo d'animal, document. */
export default function AuthenticatedImage({ uri, style }: Props) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then(setToken);
  }, [uri]);

  if (!token) {
    return null;
  }

  return <Image source={{ uri, headers: { Authorization: `Bearer ${token}` } }} style={style} />;
}
