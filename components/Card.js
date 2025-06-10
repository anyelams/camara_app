import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * CompanyCard
 *
 * Props:
 * - item: { id: string, name: string, contactLabel: string, contactValue: string }
 * - onPress: (item) => void
 */
export default function CompanyCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.cardLeft}>
        <Text style={styles.companyName}>{item.name}</Text>
        <Text style={styles.companyId}>#{item.id}</Text>
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>{item.contactLabel}</Text>
          <Text style={styles.contactValue}>{item.contactValue}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#CCC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
    marginRight: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },
  companyId: {
    marginTop: 4,
    fontSize: 14,
    color: "#999",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  contactLabel: {
    fontSize: 14,
    color: "#444",
  },
  contactValue: {
    fontSize: 14,
    color: "#999",
  },
});
