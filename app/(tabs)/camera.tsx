import {
  CameraCapturedPicture,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface DetectionResult {
  data: string;
  type: string;
  bounding_box: BoundingBox; // coordenadas relativas a imagen 640×480
}

export default function CameraScreen() {
  // === ESTADOS Y REFS ===
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  // La detección en vivo arranca automáticamente al entrar (true por defecto).
  const [liveDetections, setLiveDetections] = useState<DetectionResult[]>([]);
  const [photoDetections, setPhotoDetections] = useState<DetectionResult[]>([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState({ width: 640, height: 480 });
  const [preciseMode, setPreciseMode] = useState(true);
  const [isLiveDetecting, setIsLiveDetecting] = useState(true); // activo de inicio
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const BBOX_SCALE_FACTOR = 1.4;
  const BBOX_PADDING = 10;
  const DEBUG_OFFSET = { x: 0, y: 0 };

  // === FUNCIONES DE CONTROL ===

  // Voltear cámara y limpiar detecciones
  const flipCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
    setLiveDetections([]);
    setPhotoDetections([]);
  };

  // Alternar detección en vivo (opcional: el usuario aún puede pausar)
  const toggleLiveDetecting = () => {
    if (isLiveDetecting) {
      setIsLiveDetecting(false);
      setLiveDetections([]);
    } else {
      setIsLiveDetecting(true);
      setLiveDetections([]);
    }
  };

  // === DETECCIÓN EN VIVO CON IA ===

  // Toma un mini-frame y lo envía a la IA cada segundo
  const processLiveFrame = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    try {
      // 1) Foto ligera sin destello ni sonido
      const photo: CameraCapturedPicture =
        await cameraRef.current.takePictureAsync({
          quality: 0,
          base64: false,
          skipProcessing: true,
          shutterSound: false,
        });
      // 2) Redimensionar a ancho = 640 px
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
      // 3) Enviar a backend IA si hay base64
      if (resized.base64) {
        const response = await fetch(
          "http://3.145.153.44/api/detect-code-boxes/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: resized.base64 }),
          }
        );
        if (response.ok) {
          const json = await response.json();
          setLiveDetections(json.result || []);
        } else {
          setLiveDetections([]);
        }
      } else {
        setLiveDetections([]);
      }
    } catch (error) {
      console.log("Error en detección en vivo:", error);
      setLiveDetections([]);
    }
  };

  // useEffect para arrancar/detener el bucle de detección en vivo
  useEffect(() => {
    if (isLiveDetecting && isCameraReady) {
      // Ejecutar inmediatamente una detección
      processLiveFrame();
      // Luego repetir cada 1 segundo
      liveIntervalRef.current = setInterval(() => {
        processLiveFrame();
      }, 1000);
    } else if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isLiveDetecting, isCameraReady]);

  // === TOMA DE FOTO FINAL CON IA ===

  // Toma foto en alta calidad y envía al backend IA
  const takePhotoAndScan = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto) return;
    setIsTakingPhoto(true);
    setPhotoDetections([]);
    try {
      // 1) Foto en alta calidad sin destello ni sonido
      const photo: CameraCapturedPicture =
        await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          skipProcessing: false,
          shutterSound: false,
        });
      // 2) Redimensionar a ancho = 640 px
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
      // 3) Enviar a IA si hay base64
      if (resized.base64) {
        const response = await fetch(
          "http://3.145.153.44/api/read-code-base64/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_base64: resized.base64 }),
          }
        );
        if (response.ok) {
          const json = await response.json();
          setPhotoDetections(json.result || []);
        } else {
          setPhotoDetections([]);
        }
      } else {
        setPhotoDetections([]);
      }
    } catch (error) {
      console.log("Error al tomar foto o procesar IA:", error);
      setPhotoDetections([]);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // === CONVERTIR COORDENADAS 640×480 → PREVIEW EN PANTALLA ===

  const convertBoundingBox = (bbox: BoundingBox) => {
    // 1) Padding
    const padded = {
      x1: bbox.x1 - BBOX_PADDING,
      y1: bbox.y1 - BBOX_PADDING,
      x2: bbox.x2 + BBOX_PADDING,
      y2: bbox.y2 + BBOX_PADDING,
    };
    // 2) Centro y dimensiones
    const centerX = (padded.x1 + padded.x2) / 2;
    const centerY = (padded.y1 + padded.y2) / 2;
    const w = Math.abs(padded.x2 - padded.x1);
    const h = Math.abs(padded.y2 - padded.y1);
    // 3) Escalado (preciso/expandido)
    const scale = preciseMode ? 1 : BBOX_SCALE_FACTOR;
    const scaledW = w * scale;
    const scaledH = h * scale;
    const scaled = {
      x1: centerX - scaledW / 2,
      y1: centerY - scaledH / 2,
      x2: centerX + scaledW / 2,
      y2: centerY + scaledH / 2,
    };
    // 4) Ajustar a ratio preview vs imagen 640×480
    const cameraAspect = cameraLayout.width / cameraLayout.height;
    const imageAspect = imageLayout.width / imageLayout.height; // ≈ 4/3
    let scaleX: number,
      scaleY: number,
      offsetX = 0,
      offsetY = 0;
    if (cameraAspect > imageAspect) {
      // escala por altura
      scaleY = cameraLayout.height / imageLayout.height;
      scaleX = scaleY;
      offsetX = (cameraLayout.width - imageLayout.width * scaleX) / 2;
    } else {
      // escala por ancho
      scaleX = cameraLayout.width / imageLayout.width;
      scaleY = scaleX;
      offsetY = (cameraLayout.height - imageLayout.height * scaleY) / 2;
    }
    return {
      x1: scaled.x1 * scaleX + offsetX + DEBUG_OFFSET.x,
      y1: scaled.y1 * scaleY + offsetY + DEBUG_OFFSET.y + 40,
      x2: scaled.x2 * scaleX + offsetX + DEBUG_OFFSET.x,
      y2: scaled.y2 * scaleY + offsetY + DEBUG_OFFSET.y + 40,
    };
  };

  // Renderiza un recuadro para cada detección del array proporcionado
  const renderBoundingBoxes = (detections: DetectionResult[]) => {
    return detections.map((det, index) => {
      const box = convertBoundingBox(det.bounding_box);
      const width = Math.abs(box.x2 - box.x1);
      const height = Math.abs(box.y2 - box.y1);
      const left = Math.min(box.x1, box.x2);
      const top = Math.min(box.y1, box.y2);

      return (
        <View
          key={index}
          style={[styles.boundingBox, { left, top, width, height }]}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>
              {det.type}: {det.data}
            </Text>
          </View>
        </View>
      );
    });
  };

  // Captura el ancho/alto reales del <CameraView> en pantalla
  const onCameraLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  // === PERMISOS ===

  if (!permission) {
    return <View style={styles.container} />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Necesitamos permisos para usar la cámara
        </Text>
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
        animateShutter={false} // SIN animación de obturador (sin destello)
        flash="off"
        active
        onLayout={onCameraLayout}
        onCameraReady={() => setIsCameraReady(true)}
      >
        {/* ===== Mensaje Superior ===== */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {!isCameraReady
              ? "Iniciando cámara..."
              : liveDetections.length > 0
              ? `Detectado en vivo: ${[
                  ...new Set(liveDetections.map((d) => d.type)),
                ].join(", ")}`
              : "Apunta el código (detección en vivo)"}
          </Text>
        </View>

        {/* ===== Overlay: recuadros en vivo ===== */}
        <View style={styles.overlay}>
          {renderBoundingBoxes(liveDetections)}
        </View>

        {/* ===== Overlay: recuadros foto final ===== */}
        <View style={styles.overlay}>
          {renderBoundingBoxes(photoDetections)}
        </View>

        {/* ===== Controles Inferiores ===== */}
        <View style={styles.controls}>
          {/* Voltear Cámara */}
          <TouchableOpacity
            onPress={flipCamera}
            style={styles.button}
            disabled={!isCameraReady}
          >
            <Text style={styles.text}>🔄</Text>
          </TouchableOpacity>

          {/* Opcional: Pause/Resume detección en vivo */}

          {/* Tomar Foto y Enviar a IA */}
          <TouchableOpacity
            onPress={takePhotoAndScan}
            style={[
              styles.scanButton,
              isTakingPhoto && { backgroundColor: "#999" },
            ]}
            disabled={!isCameraReady || isTakingPhoto}
          >
            {isTakingPhoto ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.scanButtonText}>Tomar Foto</Text>
            )}
          </TouchableOpacity>

          {/* Modo Preciso / Expandido */}
          <TouchableOpacity
            onPress={() => {
              setPreciseMode((prev) => !prev);
              setLiveDetections([]);
              setPhotoDetections([]);
            }}
            style={[
              styles.button,
              { backgroundColor: preciseMode ? "#00ff00" : "#ffcc00" },
            ]}
            disabled={!isCameraReady}
          >
            <Text style={styles.text}>
              {preciseMode ? "Preciso" : "Expandido"}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
    fontSize: 16,
  },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#00ff00",
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    borderRadius: 4,
  },
  labelContainer: {
    position: "absolute",
    top: -24,
    left: 0,
    backgroundColor: "rgba(0, 255, 0, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  button: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 25,
    minWidth: 80,
    alignItems: "center",
  },
  text: {
    fontSize: 13,
    color: "#000",
    fontWeight: "600",
  },
  liveButton: {
    backgroundColor: "#44ff44",
    padding: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center",
  },
  liveButtonText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "bold",
  },
  scanButton: {
    backgroundColor: "#44aaee",
    padding: 15,
    borderRadius: 30,
    minWidth: 120,
    alignItems: "center",
  },
  scanButtonText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "bold",
  },
  statusContainer: {
    position: "absolute",
    top: 36,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 3,
  },
  statusText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
