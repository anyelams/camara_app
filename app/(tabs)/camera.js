import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { API_CAMARA_URL } = Constants.expoConfig.extra;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [autoFocusPoint, setAutoFocusPoint] = useState({ x: 0.5, y: 0.5 });
  const [liveDetections, setLiveDetections] = useState([]);
  const [photoDetections, setPhotoDetections] = useState([]);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [imageLayout, setImageLayout] = useState({ width: 640, height: 480 });
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const cameraRef = useRef(null);
  const liveIntervalRef = useRef(null);

  const BBOX_SCALE_FACTOR = 1.4;
  const BBOX_PADDING = 10;
  const DEBUG_OFFSET = { x: 0, y: 0 };

  const flipCamera = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
    setTorchEnabled(false);
    setAutoFocusPoint({ x: 0.5, y: 0.5 });
    setLiveDetections([]);
    setPhotoDetections([]);
  };

  const handleFocus = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    if (cameraLayout.width && cameraLayout.height) {
      setAutoFocusPoint({
        x: locationX / cameraLayout.width,
        y: locationY / cameraLayout.height,
      });
      setPhotoDetections([]);
    }
  };

  const processLiveFrame = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    setPhotoDetections([]);
    try {
      const snap = await cameraRef.current.takePictureAsync({
        quality: 0,
        base64: false,
        skipProcessing: true,
        shutterSound: false,
      });
      const resized = await ImageManipulator.manipulateAsync(
        snap.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      setImageLayout({ width: resized.width, height: resized.height });
      if (resized.base64) {
        const res = await fetch(`${API_CAMARA_URL}/api/read-code-base64/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: resized.base64 }),
        });
        if (res.ok) {
          const j = await res.json();
          setLiveDetections(j.result || []);
        } else {
          setLiveDetections([]);
        }
      }
    } catch (err) {
      console.log("Error live detect:", err);
      setLiveDetections([]);
    }
  };

  useEffect(() => {
    if (isCameraReady) {
      processLiveFrame();
      liveIntervalRef.current = setInterval(processLiveFrame, 1000);
    }
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    };
  }, [isCameraReady]);

  const takePhotoAndScan = async () => {
    if (!cameraRef.current || !isCameraReady || isTakingPhoto) return;
    setIsTakingPhoto(true);
    setPhotoDetections([]);
    try {
      const snap = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
        skipProcessing: false,
        shutterSound: false,
      });
      const resized = await ImageManipulator.manipulateAsync(
        snap.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      setImageLayout({ width: resized.width, height: resized.height });
      if (resized.base64) {
        const res = await fetch(`${API_CAMARA_URL}/api/read-code-base64/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: resized.base64 }),
        });
        if (res.ok) {
          const j = await res.json();
          setPhotoDetections(j.result || []);
        } else {
          setPhotoDetections([]);
        }
      }
    } catch (err) {
      console.log("Error take photo:", err);
      setPhotoDetections([]);
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const convertBoundingBox = (bbox) => {
    const padded = {
      x1: bbox.x1 - BBOX_PADDING,
      y1: bbox.y1 - BBOX_PADDING,
      x2: bbox.x2 + BBOX_PADDING,
      y2: bbox.y2 + BBOX_PADDING,
    };
    const cx = (padded.x1 + padded.x2) / 2;
    const cy = (padded.y1 + padded.y2) / 2;
    const w = Math.abs(padded.x2 - padded.x1);
    const h = Math.abs(padded.y2 - padded.y1);
    const scale = BBOX_SCALE_FACTOR;
    const scaled = {
      x1: cx - (w * scale) / 2,
      y1: cy - (h * scale) / 2,
      x2: cx + (w * scale) / 2,
      y2: cy + (h * scale) / 2,
    };
    const camAR = cameraLayout.width / cameraLayout.height;
    const imgAR = imageLayout.width / imageLayout.height;
    let scaleX,
      scaleY,
      offX = 0,
      offY = 0;
    if (camAR > imgAR) {
      scaleY = cameraLayout.height / imageLayout.height;
      scaleX = scaleY;
      offX = (cameraLayout.width - imageLayout.width * scaleX) / 2;
    } else {
      scaleX = cameraLayout.width / imageLayout.width;
      scaleY = scaleX;
      offY = (cameraLayout.height - imageLayout.height * scaleY) / 2;
    }
    return {
      x1: scaled.x1 * scaleX + offX + DEBUG_OFFSET.x,
      y1: scaled.y1 * scaleY + offY + DEBUG_OFFSET.y + 40,
      x2: scaled.x2 * scaleX + offX + DEBUG_OFFSET.x,
      y2: scaled.y2 * scaleY + offY + DEBUG_OFFSET.y + 40,
    };
  };

  const renderBoundingBoxes = (detections) =>
    detections.map((det, i) => {
      const b = convertBoundingBox(det.bounding_box);
      return (
        <View
          key={i}
          style={[
            styles.boundingBox,
            {
              left: Math.min(b.x1, b.x2),
              top: Math.min(b.y1, b.y2),
              width: Math.abs(b.x2 - b.x1),
              height: Math.abs(b.y2 - b.y1),
            },
          ]}
        >
          <View style={styles.labelContainer}>
            <Text style={styles.labelText}>
              {det.type}: {det.data}
            </Text>
          </View>
        </View>
      );
    });

  const onCameraLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted)
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Necesitamos permisos para usar la cámara
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.iconButton}>
          <Text style={styles.text}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleFocus}>
        <CameraView
          ref={cameraRef}
          facing={facing}
          enableTorch={torchEnabled}
          autoFocus={autoFocusPoint !== null}
          autoFocusPointOfInterest={autoFocusPoint}
          active
          style={styles.camera}
          animateShutter={false}
          onLayout={onCameraLayout}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {!isCameraReady
                ? "Iniciando cámara..."
                : liveDetections.length > 0
                ? `Detectado en vivo: ${[
                    ...new Set(liveDetections.map((d) => d.type)),
                  ].join(", ")}`
                : "Apunta al código"}
            </Text>
          </View>

          <View style={styles.overlay}>
            {renderBoundingBoxes(liveDetections)}
          </View>
          <View style={styles.overlay}>
            {renderBoundingBoxes(photoDetections)}
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={flipCamera}
              style={styles.iconButton}
              disabled={!isCameraReady}
            >
              <Ionicons name="camera-reverse-outline" size={30} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhotoAndScan}
              style={[
                styles.shutterButton,
                isTakingPhoto && styles.shutterDisabled,
              ]}
              disabled={!isCameraReady || isTakingPhoto}
            >
              {isTakingPhoto ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.shutterInner} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTorchEnabled((t) => !t)}
              style={[
                styles.iconButton,
                torchEnabled && { backgroundColor: "#ffe500" },
              ]}
              disabled={!isCameraReady || facing === "front"}
            >
              <Ionicons
                name={torchEnabled ? "flashlight" : "flashlight-outline"}
                size={28}
                color="#000"
              />
            </TouchableOpacity>
          </View>
        </CameraView>
      </TouchableWithoutFeedback>
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
  text: { fontSize: 13, color: "#000", fontWeight: "600" },
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
    backgroundColor: "rgba(0,255,0,0.1)",
    borderRadius: 4,
  },
  labelContainer: {
    position: "absolute",
    top: -24,
    left: 0,
    backgroundColor: "rgba(0,255,0,0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: { color: "#000", fontSize: 12, fontWeight: "bold" },
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
  iconButton: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  statusContainer: {
    position: "absolute",
    top: 40,
    left: 100,
    right: 100,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 3,
  },
  statusText: { color: "white", fontSize: 16, fontWeight: "600" },
});
