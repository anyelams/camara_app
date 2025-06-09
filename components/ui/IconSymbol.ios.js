// IconSymbol.js
import { SymbolView } from "expo-symbols";
import React from "react";
/**
 * IconSymbol recibe las props:
 * - name: nombre del símbolo (string)
 * - size: tamaño en px (por defecto 24)
 * - color: color del ícono (string)
 * - style: estilo adicional (opcional)
 * - weight: peso del símbolo (por defecto 'regular')
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}) {
  return React.createElement(SymbolView, {
    name: name,
    weight: weight,
    tintColor: color,
    resizeMode: "scaleAspectFit",
    style: [{ width: size, height: size }, style],
  });
}
