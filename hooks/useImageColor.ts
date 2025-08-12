import React, { useEffect } from 'react';
import { getColors } from 'react-native-image-colors';

export const useImageColors = (uri: string | null) => {
  const [colors, setColors] = React.useState<string[] | null>(null);

  useEffect(() => {
    if (!uri) {
      setColors(null);
      return;
    }

    getColors(uri, {
      fallback: '#228B22',
      cache: true,
      key: uri,
    })
      .then((result) => {
        if ('platform' in result) {
          if (result.platform === 'ios') {
            setColors([
              result.primary,
              result.secondary,
              result.background,
              result.detail,
            ]);
          } else {
            setColors([
              result.dominant,
              result.vibrant,
              result.darkVibrant,
              result.lightVibrant,
              result.muted,
            ]);
          }
        } else {
          setColors(['#228B22']);
        }
      })
      .catch(() => setColors(['#228B22']));
  }, [uri]);

  return colors;
};
