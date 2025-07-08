const { getDefaultConfig } = require('expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

// Ensure image extensions are properly handled
defaultConfig.resolver.assetExts = [
  ...defaultConfig.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
];

defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'cjs',
];

module.exports = defaultConfig;