const { withAndroidColors, AndroidConfig } = require('@expo/config-plugins');

/**
 * Defines the Android color resources that the VideoSDK expo-config-plugin
 * references in AppTheme (colorPrimary) but does not itself declare. Without
 * these, `assembleDebug/Release` fails at resource linking:
 *   error: resource color/colorPrimary not found
 *
 * We also define colorPrimaryDark and colorAccent proactively — VideoSDK's
 * in-call notification/foreground-service UI can reference them on some
 * Android versions.
 */
const COLORS = {
  colorPrimary: '#255946',
  colorPrimaryDark: '#011A2D',
  colorAccent: '#22c55e',
};

module.exports = function withVideoSDKColors(config) {
  return withAndroidColors(config, (config) => {
    for (const [name, value] of Object.entries(COLORS)) {
      config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
        name,
        value,
      });
    }
    return config;
  });
};
