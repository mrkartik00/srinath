const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Ensures the Android color resources referenced by VideoSDK's config plugin
 * (colorPrimary in AppTheme) actually exist. Without them, gradle resource
 * linking fails:
 *   error: resource color/colorPrimary not found
 *
 * Uses withDangerousMod so it runs AFTER every other mod has written
 * colors.xml (e.g. the datetimepicker plugin, which rewrites the file and
 * would otherwise clobber a withAndroidColors change). We edit the file on
 * disk directly, making the fix ordering-proof and prebuild-safe.
 */
const COLORS = {
  colorPrimary: '#255946',
  colorPrimaryDark: '#011A2D',
  colorAccent: '#22c55e',
};

module.exports = function withAndroidColors(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const colorsPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'values',
        'colors.xml'
      );

      let xml = fs.existsSync(colorsPath)
        ? fs.readFileSync(colorsPath, 'utf8')
        : '<resources>\n</resources>\n';

      const additions = Object.entries(COLORS)
        .filter(([name]) => !new RegExp(`name="${name}"`).test(xml))
        .map(([name, value]) => `    <color name="${name}">${value}</color>`)
        .join('\n');

      if (additions) {
        xml = xml.replace('</resources>', `${additions}\n</resources>`);
        fs.writeFileSync(colorsPath, xml);
      }

      return config;
    },
  ]);
};
