import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import Header from "../../components/Header";

const data = [
  {
    id: "1",
    name: "Empresa Pedro",
    contactInfo: "Contacto",
  },
  {
    id: "2",
    name: "Empresa Juan",
    contactInfo: "Contacto",
  },
];

export default function Company() {
  const [search, setSearch] = useState("");
  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNotificationPress = () => {
    // lógica de notificaciones
  };

  const handleFilterPress = () => {
    // lógica de filtro
  };

  return (
    <View style={styles.container}>
      <Header
        title="Bienvenido!"
        onNotificationPress={handleNotificationPress}
      />
      <Text style={styles.subtitle}>
        Conoce las empresas asociadas a tu usuario.
      </Text>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            name={item.name}
            id={item.id}
            contactInfo={item.contactInfo}
            date={item.date}
            onPress={() => {
              // navegación a detalle
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron empresas.</Text>
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
