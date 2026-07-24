const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config/env');
const spaces = require('../config/spaces');
const User = require('../models/User');
const { removeImageBackground } = require('./imageProcessor');
const logger = require('../config/logger');

const runMigration = async () => {
  // Connect to DB
  await mongoose.connect(config.MONGODB_URI);
  logger.info('Connected to database for avatar migration');

  // Find all doctors with avatars
  const doctors = await User.find({ role: 'doctor', avatar: { $ne: null } });
  logger.info(`Found ${doctors.length} doctors with avatars`);

  for (const doc of doctors) {
    // Skip if already processed to transparent PNG (standard checks: has .png extension or key janki-avatars)
    if (doc.avatar.includes('.png') && doc.avatar.includes('processed')) {
      logger.info(`Doctor ${doc.name} already has a processed transparent avatar: ${doc.avatar}`);
      continue;
    }

    logger.info(`Processing avatar for doctor ${doc.name}: ${doc.avatar}`);
    try {
      // 1. Fetch current avatar image
      let response;
      if (doc.avatar.startsWith('http')) {
        response = await axios.get(doc.avatar, { responseType: 'arraybuffer' });
      } else {
        // Local path
        const absolutePath = path.isAbsolute(doc.avatar) 
          ? doc.avatar 
          : path.join(__dirname, '../../uploads', doc.avatar.replace(/.*\/uploads\//, ''));
        if (!fs.existsSync(absolutePath)) {
          logger.warn(`Local file not found for ${doc.name}: ${absolutePath}`);
          continue;
        }
        const data = await fs.promises.readFile(absolutePath);
        response = { data };
      }

      const inputBuffer = Buffer.from(response.data);

      // 2. Remove background
      logger.info(`Removing background for ${doc.name}...`);
      const processedBuffer = await removeImageBackground(inputBuffer);

      // 3. Persist the new transparent image
      let newAvatarUrl = '';
      const client = spaces.getClient();
      const filename = `${crypto.randomUUID()}-processed.png`;
      const relativeKey = `janki-avatars/${doc._id}/${filename}`;

      if (client) {
        // Cloud Storage
        newAvatarUrl = await spaces.upload(relativeKey, processedBuffer, 'image/png', 'public-read');
      } else {
        // Local Storage
        const absolutePath = path.join(__dirname, '../../uploads', relativeKey);
        await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.promises.writeFile(absolutePath, processedBuffer);
        // Fallback placeholder host (use localhost as default if running script)
        newAvatarUrl = `http://localhost:${config.PORT}/uploads/${relativeKey}`;
      }

      // 4. Update doctor avatar URL in DB
      doc.avatar = newAvatarUrl;
      await doc.save();
      logger.info(`Successfully updated avatar for doctor ${doc.name} to: ${newAvatarUrl}`);
    } catch (err) {
      logger.error(`Failed to process avatar for doctor ${doc.name}:`, err.message);
    }
  }

  logger.info('Avatar migration complete');
  await mongoose.disconnect();
};

runMigration().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
