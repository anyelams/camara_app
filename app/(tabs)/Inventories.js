import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import CustomHeader from "../../components/CustomHeader";
import InventoryCard from "../../components/InventoryCard";
import SearchFilterBar from "../../components/SearchFilterBar";

const sampleData = [
  {
    id: "1",
    name: "Nombre Inventario",
    status: "Completado",
    section: "[Sección]",
    subsection: "[Subsección]",
  },
  {
    id: "2",
    name: "Nombre Inventario",
    status: "Pendiente",
    section: "[Sección]",
    subsection: "[Subsección]",
  },
  {
    id: "3",
    name: "Nombre Inventario",
    status: "Sin completar",
    section: "[Sección]",
    subsection: "[Subsección]",
  },
];

export default function Inventories() {
  const [search, setSearch] = useState("");
  const filtered = sampleData.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <CustomHeader title="Inventario" backRoute="/(tabs)/company" />

      <Text style={styles.subtitle}>
        En esta sección podrás visualizar los inventarios asociados a la empresa
        [Nombre].
      </Text>

      <SearchFilterBar
        value={search}
        onChangeText={setSearch}
        onFilterPress={() => {}}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <InventoryCard
            name={item.name}
            id={item.id}
            status={item.status}
            section={item.section}
            subsection={item.subsection}
            onPress={() => {
              // navegar a detalle de inventario
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron inventarios.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9FA",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});
