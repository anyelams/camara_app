import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

/**
 * SearchFilterBar
 *
 * Props:
 * - value: string
 * - onChangeText: (text) => void
 * - onFilterPress: () => void
 * - placeholder?: string
 */
export default function SearchFilterBar({
  value,
  onChangeText,
  onFilterPress,
  placeholder = "Buscar...",
}) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity style={styles.button} onPress={onFilterPress}>
        <Ionicons name="filter-outline" size={20} color="#555" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  button: {
    marginLeft: 8,
    backgroundColor: "#EFEFEF",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
