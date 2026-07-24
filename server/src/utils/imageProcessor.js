const axios = require('axios');
const FormData = require('form-data');
const logger = require('../config/logger');

let removeBackgroundFn = null;

// Dynamically import @imgly/background-removal-node so it doesn't slow down server boot time.
try {
  const { removeBackground } = require('@imgly/background-removal-node');
  removeBackgroundFn = removeBackground;
} catch (err) {
  logger.error('Failed to load @imgly/background-removal-node, fallback to API mode only:', err.message);
}

/**
 * Remove the background from an image.
 * Uses Remove.bg API if REMOVE_BG_API_KEY is configured in the environment,
 * otherwise falls back to a local AI model (@imgly/background-removal-node).
 *
 * @param {Buffer} imageBuffer - Input image file buffer
 * @returns {Promise<Buffer>} - Background-removed image buffer (PNG format)
 */
const removeImageBackground = async (imageBuffer) => {
  const removeBgKey = process.env.REMOVE_BG_API_KEY;

  if (removeBgKey) {
    logger.info('Using Remove.bg API for premium background removal');
    try {
      const formData = new FormData();
      formData.append('image_file', imageBuffer, { filename: 'avatar.jpg' });
      formData.append('size', 'auto');

      const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
        headers: {
          ...formData.getHeaders(),
          'X-Api-Key': removeBgKey,
        },
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (err) {
      const errMsg = err.response ? err.response.data.toString() : err.message;
      logger.error('Remove.bg API failed, attempting local fallback:', errMsg);
    }
  }

  // Fallback to local AI model running on ONNX/WASM
  if (!removeBackgroundFn) {
    throw new Error('Background removal engine is not initialized');
  }

  logger.info('Using local AI model (@imgly/background-removal-node) for background removal');
  try {
    // removeBackground accepts buffer directly. It will fetch model files on the first run and cache them locally.
    const resultBlob = await removeBackgroundFn(imageBuffer);
    const arrayBuffer = await resultBlob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    logger.error('Local background removal failed:', err.message);
    throw new Error(`Background removal failed: ${err.message}`);
  }
};

module.exports = {
  removeImageBackground,
};
