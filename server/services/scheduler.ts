import cron from 'node-cron';
import axios from 'axios';
import logger from '../utils/logger';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

/**
 * Sync boss kills from Raider.IO
 */
async function syncBossKills() {
  try {
    logger.info('🔄 Starting scheduled boss kills sync...');
    const response = await axios.post(`${API_BASE_URL}/api/boss-kills/sync`);
    logger.info(`✅ Boss kills synced: ${response.data.synced} kills updated`);
  } catch (error) {
    logger.error('❌ Failed to sync boss kills:', error);
  }
}

/**
 * Sync guild roster from Blizzard API
 */
async function syncGuildRoster() {
  try {
    logger.info('🔄 Starting scheduled guild roster sync...');
    const response = await axios.post(`${API_BASE_URL}/api/members/sync`);
    logger.info(`✅ Guild roster synced: ${response.data.synced} members updated`);
  } catch (error) {
    logger.error('❌ Failed to sync guild roster:', error);
  }
}

/**
 * Initialize all scheduled tasks
 */
export function initializeScheduler() {
  logger.info('📅 Initializing task scheduler...');

  // Sync boss kills every day at 6:00 AM server time
  cron.schedule('0 6 * * *', async () => {
    logger.info('⏰ Running daily 6 AM boss kills sync...');
    await syncBossKills();
  }, {
    timezone: 'America/New_York' // Adjust to your server timezone
  });

  // Sync progression (boss kills) multiple times during the day
  // At 12:00 PM (noon)
  cron.schedule('0 12 * * *', async () => {
    logger.info('⏰ Running noon boss kills sync...');
    await syncBossKills();
  }, {
    timezone: 'America/New_York'
  });

  // At 6:00 PM (evening)
  cron.schedule('0 18 * * *', async () => {
    logger.info('⏰ Running evening boss kills sync...');
    await syncBossKills();
  }, {
    timezone: 'America/New_York'
  });

  // At 10:00 PM (night)
  cron.schedule('0 22 * * *', async () => {
    logger.info('⏰ Running night boss kills sync...');
    await syncBossKills();
  }, {
    timezone: 'America/New_York'
  });

  // Sync guild roster once per day at 3:00 AM (when fewer players are online)
  cron.schedule('0 3 * * *', async () => {
    logger.info('⏰ Running daily guild roster sync...');
    await syncGuildRoster();
  }, {
    timezone: 'America/New_York'
  });

  logger.info('✅ Scheduler initialized successfully');
  logger.info('📋 Scheduled tasks:');
  logger.info('  • Boss kills sync: 6:00 AM, 12:00 PM, 6:00 PM, 10:00 PM');
  logger.info('  • Guild roster sync: 3:00 AM');
}

/**
 * Manual trigger functions for testing
 */
export const manualSync = {
  bossKills: syncBossKills,
  guildRoster: syncGuildRoster,
};
