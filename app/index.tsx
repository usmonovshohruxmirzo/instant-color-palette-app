import React, { useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImageManipulator from 'expo-image-manipulator';

export default function Index() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [croppedPixelUris, setCroppedPixelUris] = useState<string[]>([]);

  async function captureAndExtractPalette() {
    if (!cameraRef.current) return;

    try {
      setPhotoUri(null);
      setCroppedPixelUris([]);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 1,
      });

      if (!photo.base64 || !photo.uri) throw new Error('Failed to capture image or get base64');

      setPhotoUri(photo.uri);

      const { width, height } = photo;

      if (!width || !height) throw new Error('Invalid image dimensions');

      const samplePoints = [
        { x: Math.floor(width / 2), y: Math.floor(height / 2) },
        { x: Math.floor(width / 4), y: Math.floor(height / 4) },
        { x: Math.floor((3 * width) / 4), y: Math.floor(height / 4) },
        { x: Math.floor(width / 4), y: Math.floor((3 * height) / 4) },
        { x: Math.floor((3 * width) / 4), y: Math.floor((3 * height) / 4) },
      ];

      const colors: string[] = [];
      const pixelUris: string[] = [];

      for (let i = 0; i < samplePoints.length; i++) {
        const { x, y } = samplePoints[i];

        const manipResult = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ crop: { originX: x, originY: y, width: 1, height: 1 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );

        if (!manipResult.base64 || !manipResult.uri) {
          console.warn(`Failed to crop point ${i + 1}`);
          continue;
        }

        pixelUris.push(manipResult.uri);

        try {
          const binary = atob(manipResult.base64);
          const offset = 20;

          if (binary.length < offset + 3) {
            console.warn(`Base64 too short for point ${i + 1}: ${binary.length} bytes`);
            continue;
          }

          const r = binary.charCodeAt(offset);
          const g = binary.charCodeAt(offset + 1);
          const b = binary.charCodeAt(offset + 2);
          const hexColor = `#${((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16)
            .slice(1)
            .padStart(6, '0')}`;

          colors.push(hexColor);
        } catch (e) {
          console.warn(`Error extracting color for point ${i + 1}:`, e);
        }
      }

      setCroppedPixelUris(pixelUris);
    } catch (e) {
      console.error('Error in captureAndExtractPalette:', e);
      setPhotoUri(null);
      setCroppedPixelUris([]);
    }
  }

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
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
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

      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={{ width: 200, height: 200, marginTop: 10, alignSelf: 'center', borderRadius: 20 }}
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
                style={{ width: 50, height: 50, margin: 5, borderWidth: 1, borderColor: '#000', borderRadius: "50%" }}
              />
            ))}
          </View>
          <Button title="Save" color="teal" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  message: { textAlign: 'center', paddingBottom: 10 },
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
    fontSize: 20
  },
  pixelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  paletteContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  colorEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
});
