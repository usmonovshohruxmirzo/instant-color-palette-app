import React from "react";
import { View, Image, StyleSheet, FlatList, Button } from "react-native";

interface SamplePalettes {
  id: string,
  image: string,
  colors: string[]
}

interface PalleteCard {
  image: string;
  colors: string[];
}

const samplePalettes: SamplePalettes[] = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
    colors: ["#FF5733", "#33FF57", "#3357FF", "#F0F033", "#F033F0"],
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
    colors: ["#000000", "#222222", "#444444", "#666666", "#888888"],
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
    colors: ["#000000", "#222222", "#444444", "#666666", "#888888"],
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
    colors: ["#000000", "#222222", "#444444", "#666666", "#888888"],
  },
];

function PaletteCard({ image, colors }: PalleteCard) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: image }} style={styles.image} />
      <View style={styles.colorsRow}>
        {colors.map((color, i) => (
          <View
            key={i}
            style={[styles.colorBlock, { backgroundColor: color }]}
          />
        ))}
      </View>
      <Button color="teal" title="Downlaod as PNG" />
    </View>
  );
}

export default function SavedPalletesScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={samplePalettes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaletteCard image={item.image} colors={item.colors} />
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  colorsRow: {
    flexDirection: "row",
    justifyContent: "center"
  },
  colorBlock: {
    flex: 1,
    height: 30,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#000",
    marginHorizontal: 2,
    marginBottom: 10,
  },
});
