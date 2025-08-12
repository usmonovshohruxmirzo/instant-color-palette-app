import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useImageColors } from '@/hooks/useImageColor';

export default function Index() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const colors = useImageColors(photoUri);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  async function captureAndExtractColors() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
      } catch (e) {
        console.error('Error extracting colors:', e);
        setPhotoUri(null);
      }
    }
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <MaterialIcons name="flip-camera-android" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={captureAndExtractColors}>
              <MaterialIcons name="camera" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', padding: 10 }}>
          {colors?.map((color, index) => (
            <View
              key={index}
              style={{
                backgroundColor: color,
                width: 50,
                height: 50,
                marginHorizontal: 10,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: 'black',
              }}
            />
          ))}
        </View>
      </CameraView>
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
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    alignSelf: 'center',
  },
});
