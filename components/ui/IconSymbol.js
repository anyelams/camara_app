// IconSymbol.js
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
/**
 * Mapea nombres de SF Symbols a nombres de Material Icons.
 * Ajusta este objeto según tus necesidades.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
};
/**
 * IconSymbol recibe las props:
 * - name: cadena que debe existir como clave en MAPPING
 * - size: tamaño en px (por defecto 24)
 * - color: color del ícono (string u OpaqueColorValue)
 * - style: estilo adicional (opcional)
 *
 * Retorna el <MaterialIcons> correspondiente según el mapping.
 * Si no hay mapping para “name”, usa un ícono por defecto (aquí “help-outline”).
 */
export function IconSymbol({ name, size = 24, color, style }) {
  const iconName = MAPPING[name] || "help-outline";
  return React.createElement(MaterialIcons, {
    name: iconName,
    size: size,
    color: color,
    style: style,
  });
}
