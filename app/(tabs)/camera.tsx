import {
  CameraType,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DetectionResult {
  data: string;
  type: string;
  bounding_box: BoundingBox;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState({ width: 640, height: 480 });
  const [debugOffset, setDebugOffset] = useState({ x: 0, y: 0 });
  const [preciseMode, setPreciseMode] = useState(true);

  const BBOX_SCALE_FACTOR = 1.4;
  const BBOX_PADDING = 10;
  const cameraRef = useRef<CameraView>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const flipCamera = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const processFrame = async () => {
    if (!cameraRef.current || !isScanning || !isCameraReady) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0,
        base64: false,
        skipProcessing: true,
      });

      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      setImageLayout({ width: resized.width, height: resized.height });

      if (resized.base64) {
        await sendFrameToAPI(resized.base64);
      }
    } catch (error) {
      console.log('❌ Error al procesar frame:', error);
    }
  };

  const sendFrameToAPI = async (base64String: string) => {
    try {
      const response = await fetch('http://3.145.153.44/api/read-code-base64/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64String }),
      });

      if (response.ok) {
        const data = await response.json();
        setDetections(data.result || []);
      } else {
        setDetections([]);
      }
    } catch (error) {
      setDetections([]);
    }
  };

  const toggleScanning = () => {
    if (isScanning) {
      setIsScanning(false);
      setDetections([]);
    } else {
      if (!isCameraReady) return;
      setIsScanning(true);
      setDetections([]);
    }
  };

  useEffect(() => {
    if (isScanning && isCameraReady) {
      scanIntervalRef.current = setInterval(() => {
        processFrame();
      }, 1500);
    } else if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isScanning, isCameraReady]);

  const convertBoundingBox = (bbox: BoundingBox) => {
    const paddedBbox = {
      x1: bbox.x1 - BBOX_PADDING,
      y1: bbox.y1 - BBOX_PADDING,
      x2: bbox.x2 + BBOX_PADDING,
      y2: bbox.y2 + BBOX_PADDING,
    };

    const centerX = (paddedBbox.x1 + paddedBbox.x2) / 2;
    const centerY = (paddedBbox.y1 + paddedBbox.y2) / 2;
    const width = Math.abs(paddedBbox.x2 - paddedBbox.x1);
    const height = Math.abs(paddedBbox.y2 - paddedBbox.y1);

    const scaledWidth = width * (preciseMode ? 1.0 : BBOX_SCALE_FACTOR);
    const scaledHeight = height * (preciseMode ? 1.0 : BBOX_SCALE_FACTOR);

    const scaledBbox = {
      x1: centerX - scaledWidth / 2,
      y1: centerY - scaledHeight / 2,
      x2: centerX + scaledWidth / 2,
      y2: centerY + scaledHeight / 2,
    };

    const cameraAspect = cameraLayout.width / cameraLayout.height;
    const imageAspect = imageLayout.width / imageLayout.height;

    let scaleX, scaleY, offsetX = 0, offsetY = 0;

    if (cameraAspect > imageAspect) {
      scaleY = cameraLayout.height / imageLayout.height;
      scaleX = scaleY;
      offsetX = (cameraLayout.width - imageLayout.width * scaleX) / 2;
    } else {
      scaleX = cameraLayout.width / imageLayout.width;
      scaleY = scaleX;
      offsetY = (cameraLayout.height - imageLayout.height * scaleY) / 2;
    }

    return {
      x1: scaledBbox.x1 * scaleX + offsetX + debugOffset.x,
      y1: scaledBbox.y1 * scaleY + offsetY + debugOffset.y + 40,
      x2: scaledBbox.x2 * scaleX + offsetX + debugOffset.x,
      y2: scaledBbox.y2 * scaleY + offsetY + debugOffset.y + 40,
    };
  };

  const renderBoundingBoxes = () => {
    return detections.map((detection, index) => {
      const bbox = convertBoundingBox(detection.bounding_box);
      const width = Math.abs(bbox.x2 - bbox.x1);
      const height = Math.abs(bbox.y2 - bbox.y1);
      const left = Math.min(bbox.x1, bbox.x2);
      const top = Math.min(bbox.y1, bbox.y2);

      return (
        <View
          key={index}
          style={[styles.boundingBox, { left, top, width, height }]}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>
              {detection.type}: {detection.data}
            </Text>
          </View>
        </View>
      );
    });
  };

  const onCameraLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos permisos para usar la cámara</Text>
        <Button onPress={requestPermission} title="Dar permiso" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        facing={facing}
        style={styles.camera}
        onLayout={onCameraLayout}
        onCameraReady={() => setIsCameraReady(true)}
        enableTorch={false}
        flash="off"
        active
      >
        {/* Mensaje superior */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {!isCameraReady
              ? 'Iniciando cámara...'
              : isScanning
                ? detections.length > 0
                  ? `Escaneado${detections.length > 1 ? 's' : ''}: ${[...new Set(detections.map(d => d.type))].join(', ')}`
                  : 'Escaneando...'
                : 'Presiona Escanear'}
          </Text>
        </View>

        <View style={styles.overlay}>{renderBoundingBoxes()}</View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={flipCamera} style={styles.button}>
            <Text style={styles.text}>🔄 Cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleScanning} style={styles.scanButton}>
            <Text style={styles.scanButtonText}>
              {isScanning ? '⏹ Parar' : '▶ Escanear'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPreciseMode(!preciseMode)}
            style={[
              styles.button,
              { backgroundColor: preciseMode ? '#00ff00' : '#ffcc00' },
            ]}
          >
            <Text style={styles.text}>
              {preciseMode ? '🎯 Preciso' : '📦 Expandido'}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#00ff00',
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 4,
  },
  labelContainer: {
    position: 'absolute',
    top: -25,
    left: 0,
    backgroundColor: 'rgba(0, 255, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  button: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
  },
  text: {
    fontSize: 13,
    color: '#000',
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#44ff44',
    padding: 15,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 15,
    color: '#000',
    fontWeight: 'bold',
  },
  statusContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 3,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
