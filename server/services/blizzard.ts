import axios from 'axios';
import logger from '../utils/logger';

interface BlizzardToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// WoW Class ID to Name mapping
const CLASS_MAP: Record<number, string> = {
  1: 'Warrior',
  2: 'Paladin',
  3: 'Hunter',
  4: 'Rogue',
  5: 'Priest',
  6: 'Death Knight',
  7: 'Shaman',
  8: 'Mage',
  9: 'Warlock',
  10: 'Monk',
  11: 'Druid',
  12: 'Demon Hunter',
  13: 'Evoker',
};

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getBlizzardAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  const region = process.env.BLIZZARD_REGION || 'us';

  if (!clientId || !clientSecret) {
    throw new Error('Blizzard API credentials not configured');
  }

  try {
    const response = await axios.post<BlizzardToken>(
      `https://${region}.battle.net/oauth/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early
    
    logger.info('Blizzard access token obtained successfully');
    return cachedToken;
  } catch (error) {
    logger.error('Failed to obtain Blizzard access token', error);
    throw error;
  }
}

export async function fetchGuildRoster() {
  const token = await getBlizzardAccessToken();
  const region = process.env.BLIZZARD_REGION || 'us';
  const realm = process.env.WOW_REALM;
  const guildName = process.env.WOW_GUILD_NAME;

  if (!realm || !guildName) {
    throw new Error('Guild configuration not set');
  }

  const realmSlug = realm.toLowerCase().replace(/\s+/g, '-');
  const guildSlug = guildName.toLowerCase().replace(/\s+/g, '-');

  logger.info(`Fetching guild roster: ${guildName} on ${realmSlug} (${region})`);

  try {
    const response = await axios.get(
      `https://${region}.api.blizzard.com/data/wow/guild/${realmSlug}/${guildSlug}/roster`,
      {
        params: {
          namespace: `profile-${region}`,
          locale: 'en_US',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const memberCount = response.data.members?.length || 0;
    logger.info(`Fetched roster for ${guildName} - ${memberCount} members found`);
    
    // Log member list for debugging
    if (response.data.members) {
      const memberNames = response.data.members.map((m: any) => m.character?.name).filter(Boolean);
      logger.info(`Member names: ${memberNames.join(', ')}`);
    }
    
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch guild roster', error);
    throw error;
  }
}

export async function fetchCharacterEquipment(realm: string, characterName: string) {
  const token = await getBlizzardAccessToken();
  const region = process.env.BLIZZARD_REGION || 'us';
  const realmSlug = realm.toLowerCase().replace(/\s+/g, '-');
  const charSlug = characterName.toLowerCase();

  try {
    const response = await axios.get(
      `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${charSlug}/equipment`,
      {
        params: {
          namespace: `profile-${region}`,
          locale: 'en_US',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Calculate average item level from equipped items
    const equippedItems = response.data.equipped_items || [];
    if (equippedItems.length === 0) return null;
    
    const totalIlvl = equippedItems.reduce((sum: number, item: any) => {
      return sum + (item.level?.value || 0);
    }, 0);
    
    const avgIlvl = Math.round(totalIlvl / equippedItems.length);
    logger.info(`Fetched equipment for ${characterName} - avg ilvl: ${avgIlvl}`);
    return avgIlvl;
  } catch (error: any) {
    // Character not found or private profile - log but don't fail
    if (error.response?.status === 404) {
      logger.warn(`Character ${characterName} not found or profile is private`);
      return null;
    }
    logger.error(`Failed to fetch equipment for ${characterName}`, error);
    return null;
  }
}

// Raider.IO API for guild progression
export async function fetchRaiderIOGuildBossKills() {
  const region = process.env.BLIZZARD_REGION || 'us';
  const realm = process.env.WOW_REALM;
  const guildName = process.env.WOW_GUILD_NAME;

  if (!realm || !guildName) {
    throw new Error('Guild configuration not set');
  }

  const realmSlug = realm.toLowerCase().replace(/\s+/g, '-');
  const guildSlug = encodeURIComponent(guildName);

  try {
    // Fetch guild profile with raid encounters for each tier separately
    // (Raider.IO API only returns one tier's encounters when multiple are requested)
    
    // tier-mn-1 = Midnight Season 1
    const midnightResponse = await axios.get(
      'https://raider.io/api/v1/guilds/profile',
      {
        params: {
          region: region,
          realm: realmSlug,
          name: guildName,
          fields: 'raid_encounters:tier-mn-1:mythic'
        }
      }
    );

    // sporefall = Sporefall raid
    const sporefallResponse = await axios.get(
      'https://raider.io/api/v1/guilds/profile',
      {
        params: {
          region: region,
          realm: realmSlug,
          name: guildName,
          fields: 'raid_encounters:sporefall:mythic'
        }
      }
    );

    // Combine encounters from both raids
    const midnightEncounters = midnightResponse.data?.raid_encounters || [];
    const sporefallEncounters = sporefallResponse.data?.raid_encounters || [];
    const allEncounters = [...midnightEncounters, ...sporefallEncounters];

    logger.info(`Fetched Raider.IO boss kills for ${guildName}`);
    logger.info(`Found ${allEncounters.length} total boss encounters (Midnight: ${midnightEncounters.length}, Sporefall: ${sporefallEncounters.length})`);
    
    // Log all encounters
    allEncounters.forEach((encounter: any) => {
      logger.info(`  - ${encounter.name} (${encounter.difficulty || 'no-difficulty'}): ${encounter.defeatedAt ? 'Defeated' : 'Not defeated'}`);
    });
    
    // Return combined data
    return {
      ...midnightResponse.data,
      raid_encounters: allEncounters
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      logger.warn(`Guild ${guildName} not found on Raider.IO`);
      return null;
    }
    logger.error('Failed to fetch Raider.IO guild data', error);
    throw error;
  }
}
