// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// --- Firebase Compatibility ---
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}
config.resolver.unstable_enablePackageExports = false;

// --- Apply NativeWind ---
module.exports = withNativeWind(config, { input: "./global.css" });
