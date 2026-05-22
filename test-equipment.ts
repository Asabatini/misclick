// Test script for character equipment API
import dotenv from 'dotenv';
import { getBlizzardAccessToken, fetchCharacterEquipment } from './server/services/blizzard.js';

dotenv.config();

async function testEquipment() {
  try {
    console.log('Testing character equipment fetch...');
    
    const realm = process.env.WOW_REALM || 'Sargeras';
    const testChar = 'Juicerjuice';
    
    console.log(`\nFetching equipment for ${testChar} on ${realm}...`);
    const ilvl = await fetchCharacterEquipment(realm, testChar);
    
    console.log(`\n✓ Success!`);
    console.log(`Average item level: ${ilvl}`);
    
  } catch (error: any) {
    console.error('\n✗ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testEquipment();
