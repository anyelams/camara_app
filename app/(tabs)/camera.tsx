// app/(tabs)/camera.tsx
import {
    CameraCapturedPicture,
    CameraType,
    CameraView,
    useCameraPermissions,
} from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
    Button,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos permisos para usar la cámara</Text>
        <Button onPress={requestPermission} title="Dar permiso" />
      </View>
    );
  }

  const flipCamera = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const capturedPhoto = await cameraRef.current.takePictureAsync();
      setPhoto(capturedPhoto);
    }
  };

  const resetPhoto = () => {
    setPhoto(null);
  };

  return (
    <View style={styles.container}>
      {!photo ? (
        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
        >
          <View style={styles.controls}>
            <TouchableOpacity onPress={flipCamera} style={styles.button}>
              <Text style={styles.text}>Cambiar cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePicture} style={styles.button}>
              <Text style={styles.text}>Tomar foto</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.preview}>
          <Image source={{ uri: photo.uri }} style={styles.image} />
          <TouchableOpacity onPress={resetPhoto} style={styles.button}>
            <Text style={styles.text}>Tomar otra</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: { flex: 1 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  button: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
  },
  text: { fontSize: 16, color: '#000' },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  image: { width: '100%', height: '80%', resizeMode: 'contain' },
});
