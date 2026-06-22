const asyncHandler = require('../utils/asyncHandler');
const reminderService = require('../services/reminderService');
const apiResponse = require('../utils/apiResponse');

const getToday = asyncHandler(async (req, res) => {
  const reminders = await reminderService.getTodayReminders(req.user.id, req.scope);
  apiResponse.success(res, reminders, "Today's reminders");
});

const acknowledge = asyncHandler(async (req, res) => {
  const reminder = await reminderService.acknowledge(req.params.id, req.user.id, req.scope);
  apiResponse.success(res, reminder, 'Marked as taken');
});

const snooze = asyncHandler(async (req, res) => {
  const reminder = await reminderService.snooze(req.params.id, req.user.id, req.body.minutes, req.scope);
  apiResponse.success(res, reminder, 'Reminder snoozed');
});

const miss = asyncHandler(async (req, res) => {
  const reminder = await reminderService.miss(req.params.id, req.user.id, req.scope);
  apiResponse.success(res, reminder, 'Marked as missed');
});

module.exports = { getToday, acknowledge, snooze, miss };
