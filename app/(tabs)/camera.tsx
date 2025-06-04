import {
    CameraCapturedPicture,
    CameraType,
    CameraView,
    useCameraPermissions,
} from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useRef, useState } from 'react';
import {
    Alert,
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

  const base64DePrueba = "AQUI_PONES_TU_BASE64_DE_PRUEBA_SI_QUIERES";

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

      const manipulated = await ImageManipulator.manipulateAsync(
        capturedPhoto.uri,
        [{ resize: { width: 640 } }], // Reduce resolución
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (manipulated.base64) {
        console.log('Tamaño base64:', manipulated.base64.length);
        sendBase64ToAPI(manipulated.base64);
      } else {
        console.log('No se pudo generar base64 de la imagen manipulada');
      }
    }
  };

  const sendBase64ToAPI = async (base64String: string) => {
    const payload = { image_base64: base64String };
    console.log('Enviando base64 al servidor...');

    try {
      const response = await fetch('http://3.145.153.44/api/read-code-base64/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      console.log('Respuesta cruda:', text);

      if (!response.ok) {
        Alert.alert('Error del servidor', `Código: ${response.status}\n${text}`);
        return;
      }

      if (contentType.includes('application/json')) {
        const data = JSON.parse(text);
        const result = data.result?.[0];
        Alert.alert(
          'Código leído',
          `Código: ${result.data}\nTipo: ${result.type}\nBox: (${result.bounding_box.x1},${result.bounding_box.y1})-(${result.bounding_box.x2},${result.bounding_box.y2})`
        );
      } else {
        Alert.alert('Respuesta inesperada', text);
      }
    } catch (error) {
      Alert.alert('Error al enviar la imagen', (error as Error).message);
    }
  };

  const sendBase64Prueba = async () => {
    const payload = { image_base64: base64DePrueba };
    console.log('Enviando base64 de prueba');

    try {
      const response = await fetch('http://3.145.153.44/api/read-code-base64/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      console.log('Respuesta cruda:', text);

      if (!response.ok) {
        Alert.alert('Error del servidor', `Código: ${response.status}\n${text}`);
        return;
      }

      if (contentType.includes('application/json')) {
        const data = JSON.parse(text);
        Alert.alert('Código leído (prueba)', JSON.stringify(data.result?.[0]?.data ?? data));
      } else {
        Alert.alert('Respuesta inesperada', text);
      }
    } catch (error) {
      Alert.alert('Error al enviar la imagen', (error as Error).message);
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
            <TouchableOpacity onPress={sendBase64Prueba} style={styles.button}>
              <Text style={styles.text}>Probar base64 fijo</Text>
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
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    gap: 10,
  },
  button: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
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
