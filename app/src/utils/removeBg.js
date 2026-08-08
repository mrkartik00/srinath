import * as FileSystem from 'expo-file-system';

// Change this API key to your actual Remove.bg API key.
// You can also define it as EXPO_PUBLIC_REMOVE_BG_API_KEY in your env file.
const REMOVE_BG_API_KEY = process.env.EXPO_PUBLIC_REMOVE_BG_API_KEY || 'EZSdxkmStkFpAaQRcCaJvGeX';

/**
 * Sends a local image URI to Remove.bg API and returns the local URI of the transparent PNG.
 * 
 * @param {string} localUri - The local file URI of the image (e.g. file:///...)
 * @returns {Promise<string>} The local file URI of the background-removed PNG
 */
export async function removeImageBackground(localUri) {
  if (!REMOVE_BG_API_KEY || REMOVE_BG_API_KEY === 'YOUR_REMOVE_BG_API_KEY') {
    console.warn('Remove.bg API key is not configured. Skipping background removal.');
    return localUri;
  }

  try {
    const formData = new FormData();
    formData.append('image_file', {
      uri: localUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });
    // size 'auto' is optimized for profile images (preview resolution is often free or low-credit cost)
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Remove.bg error response:', errorText);
      throw new Error(`Remove.bg API responded with status ${response.status}`);
    }

    const blob = await response.blob();
    
    // Read the binary blob as base64 using FileReader
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl === 'string') {
          const base64 = dataUrl.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read response data as string'));
        }
      };
      reader.onerror = reject;
    });
    
    reader.readAsDataURL(blob);
    const base64Data = await base64Promise;

    // Save the base64 transparent PNG to a cached local file
    const destinationUri = FileSystem.cacheDirectory + `doctor_avatar_nobg_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(destinationUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return destinationUri;
  } catch (error) {
    console.error('Background removal failed:', error);
    // Return original URI as fallback if the API call fails so the upload doesn't break entirely
    return localUri;
  }
}
