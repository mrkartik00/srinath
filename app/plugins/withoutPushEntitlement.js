const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Removes the `aps-environment` (Push Notifications) entitlement that
 * expo-notifications injects. Free/personal Apple development teams cannot
 * provision the Push Notifications capability, which breaks local dev builds
 * with "Personal development teams do not support the Push Notifications
 * capability".
 *
 * Local notifications (expo-notifications on-device scheduling) do NOT require
 * this entitlement, so removing it is safe until a paid Apple Developer account
 * is used for remote push. When you move to a paid team + remote push, delete
 * this plugin from app.json.
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
