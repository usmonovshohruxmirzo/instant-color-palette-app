import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Button,
  Text,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect } from 'expo-router';

interface Palette {
  id: string;
  image: string;
  croppedPixelUris?: string[];
}

interface PaletteCardProps {
  image: string;
  croppedPixelUris: string[];
  id: string;
  onDelete: (id: string) => void;
}

type ViewShotRef = React.RefObject<ViewShot>;

function PaletteCard({
  image,
  croppedPixelUris,
  id,
  onDelete,
}: PaletteCardProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const shareContentRef = useRef<ViewShot>(null);

  const requestMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Media library permission is required to save to Downloads.',
      );
      return false;
    }
    return true;
  };

  const downloadAsPNG = useCallback(async () => {
    if (Platform.OS === 'web') {
      console.warn('Direct downloading is handled differently on web.');
      if (!viewShotRef.current) {
        console.error('ViewShot ref is null or undefined');
        return;
      }
      try {
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1.0,
        });
        const link = document.createElement('a');
        link.href = uri;
        link.download = `palette_${new Date().toISOString().replace(/:/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading PNG on web:', error);
        Alert.alert(
          'Error',
          'Failed to download the palette as PNG. Please try again.',
        );
      }
      return;
    }

    if (!viewShotRef.current) {
      console.error('ViewShot ref is null or undefined');
      return;
    }

    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
      });
      const fileName = `palette_${new Date().toISOString().replace(/:/g, '-')}.png`;
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('Downloads', asset, true);
      await FileSystem.deleteAsync(uri, { idempotent: true });
      console.log('File saved to Downloads album');
      Alert.alert(
        'Success',
        'Palette downloaded to Downloads folder successfully!',
      );
    } catch (error) {
      console.error('Error downloading PNG:', error);
      Alert.alert(
        'Error',
        'Failed to download the palette as PNG. Please try again.',
      );
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!shareContentRef.current) {
      console.error('Share content ref is null or undefined');
      return;
    }

    try {
      const uri = await captureRef(shareContentRef, {
        format: 'png',
        quality: 1.0,
      });

      if (Platform.OS === 'web' && navigator.share) {
        const response = await fetch(uri);
        const blob = await response.blob();
        await navigator.share({
          title: 'Color Palette',
          text: 'Check out my color palette!',
          files: [new File([blob], `palette_${id}.png`, { type: 'image/png' })],
        });
      } else if (Platform.OS !== 'web') {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your palette',
        });
      } else {
        console.warn('Sharing is not supported on this web browser.');
        Alert.alert(
          'Warning',
          'Sharing is not supported on this browser. Try downloading instead.',
        );
      }
    } catch (error) {
      console.error('Error sharing palette:', error);
      Alert.alert('Error', 'Failed to share the palette. Please try again.');
    }
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this palette?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(id),
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
      <View style={styles.card}>
        <ViewShot
          ref={shareContentRef}
          options={{ format: 'png', quality: 1.0 }}
        >
          <View style={styles.shareContent}>
            <Image source={{ uri: image }} style={styles.image} />
            <View style={styles.colorsRow}>
              {croppedPixelUris?.length > 0 ? (
                croppedPixelUris.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.colorBlock} />
                ))
              ) : (
                <Text style={styles.emptyText}>No colors available</Text>
              )}
            </View>
          </View>
        </ViewShot>
        <View style={styles.buttonContainer}>
          <Button
            color="blue"
            title="Download"
            onPress={downloadAsPNG}
            disabled={Platform.OS === 'web'}
          />
          <Button color="green" title="Share" onPress={handleShare} />
          <Button color="red" title="Delete" onPress={handleDelete} />
        </View>
      </View>
    </ViewShot>
  );
}

export default function SavedPalettesScreen() {
  const [palettes, setPalettes] = useState<Palette[]>([]);

  const fetchPalettes = useCallback(async () => {
    try {
      const palettesJson = await AsyncStorage.getItem('palettes');
      const fetchedPalettes: Palette[] = palettesJson
        ? JSON.parse(palettesJson)
        : [];
      const validPalettes = fetchedPalettes.filter(
        (palette): palette is Palette =>
          palette &&
          typeof palette.id === 'string' &&
          typeof palette.image === 'string' &&
          (!palette.croppedPixelUris ||
            (Array.isArray(palette.croppedPixelUris) &&
              palette.croppedPixelUris.every(
                (uri) => typeof uri === 'string',
              ))),
      );
      setPalettes(validPalettes);
    } catch (error) {
      console.error('Error fetching palettes:', error);
      setPalettes([]);
    }
  }, []);

  const handleDeletePalette = useCallback(
    async (idToDelete: string) => {
      try {
        const palettesJson = await AsyncStorage.getItem('palettes');
        const currentPalettes: Palette[] = palettesJson
          ? JSON.parse(palettesJson)
          : [];
        const updatedPalettes = currentPalettes.filter(
          (palette) => palette.id !== idToDelete,
        );
        await AsyncStorage.setItem('palettes', JSON.stringify(updatedPalettes));
        fetchPalettes();
      } catch (error) {
        console.error('Error deleting palette:', error);
      }
    },
    [fetchPalettes],
  );

  useEffect(() => {
    fetchPalettes();
  }, [fetchPalettes]);

  useFocusEffect(
    useCallback(() => {
      console.log('SavedPalettesScreen focused, refreshing palettes');
      fetchPalettes();
    }, [fetchPalettes]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={palettes.sort((a, b) => b.id.localeCompare(a.id))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaletteCard
            image={item.image}
            croppedPixelUris={item.croppedPixelUris || []}
            id={item.id}
            onDelete={handleDeletePalette}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No palettes saved yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: '100%',
    height: 500,
    borderRadius: 8,
    marginBottom: 12,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  colorBlock: {
    flex: 1,
    width: 40,
    height: 40,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#000',
    marginHorizontal: 2,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  shareContent: {
    marginBottom: 10,
  },
});
