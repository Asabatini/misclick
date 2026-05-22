const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function testCharacterEquipment() {
  try {
    // Get OAuth token
    const tokenResponse = await axios.post(
      'https://oauth.battle.net/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        auth: {
          username: process.env.BLIZZARD_CLIENT_ID,
          password: process.env.BLIZZARD_CLIENT_SECRET,
        },
      }
    );
    
    const token = tokenResponse.data.access_token;
    console.log('✓ Got OAuth token\n');
    
    // First, get the roster to find real character names
    const rosterResponse = await axios.get(
      'https://us.api.blizzard.com/data/wow/guild/sargeras/misclick/roster',
      {
        params: {
          namespace: 'profile-us',
          locale: 'en_US',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log(`✓ Got roster with ${rosterResponse.data.members.length} members\n`);
    
    // Test equipment endpoint for first 3 characters
    const testChars = rosterResponse.data.members.slice(0, 5);
    
    for (const member of testChars) {
      const charName = member.character.name;
      const charNameLower = charName.toLowerCase();
      const realm = member.character.realm.slug;
      
      console.log(`\nTesting ${charName} (${member.character.playable_class.name}) on ${realm}...`);
      
      const equipUrl = `https://us.api.blizzard.com/profile/wow/character/${realm}/${charNameLower}/equipment`;
      
      try {
        const equipResponse = await axios.get(equipUrl, {
          params: {
            namespace: 'profile-us',
            locale: 'en_US',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const items = equipResponse.data.equipped_items || [];
        if (items.length > 0) {
          const totalIlvl = items.reduce((sum, item) => sum + (item.level?.value || 0), 0);
          const avgIlvl = Math.round(totalIlvl / items.length);
          console.log(`  ✓ Average ilvl: ${avgIlvl} (${items.length} items)`);
        } else {
          console.log(`  ✗ No equipped items`);
        }
        
      } catch (error) {
        console.log(`  ✗ Failed: ${error.response?.status || error.message}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
    }
  }
}

testCharacterEquipment();
