// Test script for Blizzard API integration
import dotenv from 'dotenv';
import { getBlizzardAccessToken, fetchGuildRoster } from './server/services/blizzard.js';

dotenv.config();

// Class ID to Name mapping
const CLASS_MAP: Record<number, string> = {
  1: 'Warrior', 2: 'Paladin', 3: 'Hunter', 4: 'Rogue', 5: 'Priest',
  6: 'Death Knight', 7: 'Shaman', 8: 'Mage', 9: 'Warlock', 10: 'Monk',
  11: 'Druid', 12: 'Demon Hunter', 13: 'Evoker',
};

async function testBlizzardAPI() {
  console.log('🔍 Testing Blizzard API Integration...\n');
  
  console.log('Configuration:');
  console.log(`  Region: ${process.env.BLIZZARD_REGION}`);
  console.log(`  Realm: ${process.env.WOW_REALM}`);
  console.log(`  Guild: ${process.env.WOW_GUILD_NAME}`);
  console.log(`  Client ID: ${process.env.BLIZZARD_CLIENT_ID?.substring(0, 8)}...`);
  console.log('');

  try {
    // Test 1: Get access token
    console.log('📡 Step 1: Getting OAuth2 access token...');
    const token = await getBlizzardAccessToken();
    console.log('✅ Access token obtained successfully!\n');

    // Test 2: Fetch guild roster
    console.log('📡 Step 2: Fetching guild roster...');
    const rosterData = await fetchGuildRoster();
    
    console.log('✅ Guild roster fetched successfully!\n');
    console.log('📊 Roster Summary:');
    console.log(`  Guild Name: ${rosterData.guild?.name || 'Unknown'}`);
    console.log(`  Total Members: ${rosterData.members?.length || 0}`);
    
    if (rosterData.members && rosterData.members.length > 0) {
      console.log('\n👥 First 10 Members:');
      rosterData.members.slice(0, 10).forEach((member: any, index: number) => {
        const char = member.character;
        const classId = char.playable_class?.id;
        const className = classId ? CLASS_MAP[classId] || 'Unknown' : 'Unknown';
        console.log(`  ${index + 1}. ${char.name} - ${className} (Level ${char.level}, Rank ${member.rank})`);
      });
      
      if (rosterData.members.length > 10) {
        console.log(`  ... and ${rosterData.members.length - 10} more members`);
      }
    }
    
    console.log('\n✨ SUCCESS! Blizzard API integration is working correctly.');
    console.log('You can now use the "Sync from Blizzard" button in the app.\n');
    
  } catch (error: any) {
    console.error('\n❌ ERROR: Blizzard API test failed');
    
    if (error.response) {
      console.error(`\nHTTP ${error.response.status}: ${error.response.statusText}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 This looks like an authentication error.');
        console.error('Please verify your BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET are correct.');
      } else if (error.response.status === 404) {
        console.error('\n💡 Guild not found.');
        console.error('Please verify:');
        console.error('  - Realm name is correct (case-sensitive)');
        console.error('  - Guild name is correct (case-sensitive)');
        console.error('  - Guild exists on the specified realm');
      }
    } else if (error.message) {
      console.error('\nError:', error.message);
    } else {
      console.error('\nUnknown error:', error);
    }
    
    process.exit(1);
  }
}

testBlizzardAPI();
