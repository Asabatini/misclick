const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function testRoster() {
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
    console.log('✓ Got OAuth token');
    
    // Fetch guild roster
    const realm = process.env.WOW_REALM || 'sargeras';
    const guild = process.env.WOW_GUILD || 'misclick';
    
    const rosterUrl = `https://us.api.blizzard.com/data/wow/guild/${realm}/${guild}/roster`;
    console.log(`\nFetching roster from: ${rosterUrl}`);
    
    const response = await axios.get(rosterUrl, {
      params: {
        namespace: 'profile-us',
        locale: 'en_US',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('\n✓ Got roster data');
    console.log(`Total members: ${response.data.members.length}`);
    
    // Find Juicerjuice
    const juicer = response.data.members.find(m => 
      m.character.name.toLowerCase() === 'juicerjuice'
    );
    
    if (juicer) {
      console.log('\n✓ Found Juicerjuice:');
      console.log(JSON.stringify(juicer, null, 2));
    } else {
      console.log('\n✗ Juicerjuice not found in roster');
      console.log('\nSample member:');
      console.log(JSON.stringify(response.data.members[0], null, 2));
    }
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRoster();
