const { getDefaultConfig } = require('expo/metro-config');
const resolveFrom = require('resolve-from');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Expo 50+ ships event-target-shim@5, but react-native-webrtc (used by
// @videosdk.live/react-native-sdk) needs v6. Resolve the shim relative to the
// webrtc package so it picks up v6, while RN core keeps using v5.
// Ref: https://github.com/react-native-webrtc/react-native-webrtc/issues/1503
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith('event-target-shim') &&
    context.originModulePath.includes('@videosdk.live/react-native-webrtc')
  ) {
    const updatedModuleName = moduleName.endsWith('/index')
      ? moduleName.replace('/index', '')
      : moduleName;

    const eventTargetShimPath = resolveFrom(context.originModulePath, updatedModuleName);

    return {
      filePath: eventTargetShimPath,
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
