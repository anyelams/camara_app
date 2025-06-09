import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function FormScreen() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Aquí puedes validar y enviar tu formulario...
    if (!form.nombre || !form.email || !form.password) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }
    // Ejemplo de salida
    console.log("Formulario enviado:", form);
    Alert.alert("Éxito", "Formulario enviado correctamente.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: null })}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.title}>Subseccion?</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          value={form.nombre}
          onChangeText={(text) => handleChange("nombre", text)}
        />

        <Text style={styles.label}>...</Text>
        <TextInput
          style={styles.input}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(text) => handleChange("email", text)}
        />

        <Text style={styles.label}>...</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => handleChange("...", text)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inner: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: "#4A90E2",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
