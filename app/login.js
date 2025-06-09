// app/login.js
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();

  const handleFakeLogin = () => {
    // Simula el login y redirige a /camera
    router.replace("/camera");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Esperando componente de login...</Text>

      <TouchableOpacity style={styles.button} onPress={handleFakeLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
