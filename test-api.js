const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function testAPI() {
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
    
    // Test equipment endpoint
    const realm = 'sargeras';
    const character = 'juicerjuice';
    const url = `https://us.api.blizzard.com/profile/wow/character/${realm}/${character}/equipment`;
    
    console.log(`\nTesting URL: ${url}`);
    
    const response = await axios.get(url, {
      params: {
        namespace: 'profile-us',
        locale: 'en_US',
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('\n✓ API Response Status:', response.status);
    console.log('\nEquipped Items Count:', response.data.equipped_items?.length);
    
    if (response.data.equipped_items && response.data.equipped_items.length > 0) {
      const items = response.data.equipped_items;
      const totalIlvl = items.reduce((sum, item) => sum + (item.level?.value || 0), 0);
      const avgIlvl = Math.round(totalIlvl / items.length);
      
      console.log('\n✓ Average Item Level:', avgIlvl);
      console.log('\nSample item structure:');
      console.log(JSON.stringify(items[0], null, 2));
    } else {
      console.log('\n✗ No equipped items found');
      console.log('\nFull response:');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPI();
