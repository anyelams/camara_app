var __rest =
  (this && this.__rest) ||
  function (s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (
          e.indexOf(p[i]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(s, p[i])
        )
          t[p[i]] = s[p[i]];
      }
    return t;
  };
import { Link } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import React from "react";
import { Platform } from "react-native";
export function ExternalLink(_a) {
  var { href } = _a,
    rest = __rest(_a, ["href"]);
  return React.createElement(
    Link,
    Object.assign({ target: "_blank" }, rest, {
      href: href,
      onPress: async (event) => {
        if (Platform.OS !== "web") {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href);
        }
      },
    })
  );
}
