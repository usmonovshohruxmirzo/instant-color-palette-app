import React, { useRef, useState, useCallback } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, router } from 'expo-router';

export default function Index() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [croppedPixelUris, setCroppedPixelUris] = useState<string[]>([]);
  const [cameraReady, setCameraReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('Camera screen focused');
      setCameraReady(true);
      return () => {
        console.log('Camera screen unfocused');
        setCameraReady(false);
      };
    }, [])
  );

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      await processImage(result.assets[0]);
    }
  }

  async function processImage(photo: { uri: string; width?: number; height?: number }) {
    try {
      setPhotoUri(null);
      setCroppedPixelUris([]);

      let imageUri = photo.uri;

      if (Platform.OS !== 'web') {
        try {
          const permanentUri = `${FileSystem.documentDirectory}photos/${uuidv4()}.jpg`;
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}photos`, {
            intermediates: true,
          });
          await FileSystem.moveAsync({
            from: photo.uri,
            to: permanentUri,
          });
          imageUri = permanentUri;
        } catch (e) {
          console.warn('Error moving image to permanent storage:', e);
        }
      } else {
        console.warn('File system operations not supported on web. Using temporary URI.');
      }

      setPhotoUri(imageUri);

      const { width = 1000, height = 1000 } = photo;

      const samplePoints = [
        { x: Math.floor(width / 2), y: Math.floor(height / 2) },
        { x: Math.floor(width / 4), y: Math.floor(height / 4) },
        { x: Math.floor((3 * width) / 4), y: Math.floor(height / 4) },
        { x: Math.floor(width / 4), y: Math.floor((3 * height) / 4) },
        { x: Math.floor((3 * width) / 4), y: Math.floor((3 * height) / 4) },
      ];

      const pixelUris: string[] = [];

      for (let i = 0; i < samplePoints.length; i++) {
        const { x, y } = samplePoints[i];

        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ crop: { originX: x, originY: y, width: 1, height: 1 } }],
          { format: ImageManipulator.SaveFormat.JPEG }
        );

        if (!manipResult.uri) {
          console.warn(`Failed to crop point ${i + 1}`);
          continue;
        }

        let pixelUri = manipResult.uri;

        if (Platform.OS !== 'web') {
          try {
            const pixelPermanentUri = `${FileSystem.documentDirectory}pixels/${uuidv4()}.jpg`;
            await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}pixels`, {
              intermediates: true,
            });
            await FileSystem.moveAsync({
              from: manipResult.uri,
              to: pixelPermanentUri,
            });
            pixelUri = pixelPermanentUri;
          } catch (e) {
            console.warn(`Error saving cropped pixel ${i + 1}:`, e);
          }
        }

        pixelUris.push(pixelUri);
      }

      if (pixelUris.length === 0) {
        console.warn('No valid cropped pixels generated');
        return;
      }

      setCroppedPixelUris(pixelUris);
    } catch (e) {
      console.error('Error processing image:', e);
      setPhotoUri(null);
      setCroppedPixelUris([]);
    }
  }

  async function captureAndExtractPalette() {
    if (!cameraRef.current || !cameraReady) {
      console.warn('Camera is not ready or ref is null');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
      });

      if (!photo.uri) {
        console.error('Failed to capture image');
        return;
      }

      await processImage(photo);
    } catch (e) {
      console.error('Error capturing image:', e);
    }
  }

  async function savePalette() {
    if (!photoUri || croppedPixelUris.length === 0) {
      console.warn('No photo or cropped pixels to save');
      return;
    }

    try {
      const newPalette = {
        id: uuidv4(),
        image: photoUri,
        croppedPixelUris,
      };

      console.log('Saving palette:', newPalette);

      const existingPalettesJson = await AsyncStorage.getItem('palettes');
      let existingPalettes = [];
      try {
        existingPalettes = existingPalettesJson ? JSON.parse(existingPalettesJson) : [];
        if (!Array.isArray(existingPalettes)) {
          console.warn('Existing palettes is not an array, resetting to empty array');
          existingPalettes = [];
        }
      } catch (e) {
        console.warn('Error parsing existing palettes, resetting to empty array:', e);
        existingPalettes = [];
      }

      const updatedPalettes = [...existingPalettes, newPalette];

      await AsyncStorage.setItem('palettes', JSON.stringify(updatedPalettes));
      console.log('Palette saved successfully, navigating to saved-palettes');

      setPhotoUri(null);
      setCroppedPixelUris([]);
      router.push('/saved-palettes');
    } catch (e) {
      console.error('Error saving palette:', e);
    }
  }

  const cancelPalette = () => {
    setPhotoUri(null);
    setCroppedPixelUris([]);
  };

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <View style={styles.webContainer}>
          <Text style={styles.message}>Camera is not supported on web. Upload an image instead.</Text>
          <Button title="Upload Image" onPress={pickImage} />
        </View>
      ) : (
        cameraReady && (
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            onCameraReady={() => setCameraReady(true)}
          >
            <View style={styles.buttonContainer}>
              <View style={styles.buttons}>
                <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                  <MaterialIcons name="flip-camera-android" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={captureAndExtractPalette}>
                  <MaterialIcons name="camera" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        )
      )}

      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={{ width: 200, height: 200, marginTop: 10, alignSelf: 'center' }}
        />
      )}

      {croppedPixelUris.length > 0 && (
        <View style={styles.colorPreview}>
          <Text style={styles.colorsTitle}>Color Palette</Text>
          <View style={styles.pixelContainer}>
            {croppedPixelUris.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={{ width: 50, height: 50, margin: 5, borderWidth: 1, borderColor: '#000' }}
              />
            ))}
          </View>
          <View style={styles.buttonRow}>
            <Button title="Save" color="teal" onPress={savePalette} />
            <Button title="Cancel" color="gray" onPress={cancelPalette} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  webContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { textAlign: 'center', paddingBottom: 10, fontSize: 16, color: '#666' },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    alignSelf: 'center',
  },
  colorPreview: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  colorsTitle: {
    fontSize: 20,
  },
  pixelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '40%',
    marginTop: 10,
  },
});
