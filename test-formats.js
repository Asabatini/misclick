const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function testDifferentFormats() {
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
    
    // Try different URL formats
    const formats = [
      'https://us.api.blizzard.com/data/wow/guild/sargeras/misclick/roster',
      'https://us.api.blizzard.com/data/wow/guild/Sargeras/Misclick/roster',
      'https://us.api.blizzard.com/profile/wow/guild/sargeras/misclick',
    ];
    
    for (const url of formats) {
      console.log(`\nTrying: ${url}`);
      try {
        const response = await axios.get(url, {
          params: {
            namespace: 'profile-us',
            locale: 'en_US',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(`✓ SUCCESS! Status: ${response.status}`);
        console.log(`Members: ${response.data.members?.length || response.data.member_count || 'N/A'}`);
        return; // Stop on first success
      } catch (error) {
        console.log(`✗ Failed: ${error.response?.status || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n✗ Error getting token:', error.message);
  }
}

testDifferentFormats();
