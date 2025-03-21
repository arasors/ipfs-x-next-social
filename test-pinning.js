// Test script for direct pinning to Pinata
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Use the provided Pinata credentials
const CONFIG = {
  pinning: {
    enabled: true,
    services: [
      {
        name: 'Pinata',
        headers: {
          'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY,
          'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          'pinata_jwt': process.env.NEXT_PUBLIC_PINATA_JWT
        }
      }
    ]
  }
};

// Test direct pinning with API key
async function testDirectPinningWithAPIKey() {
  try {
    // Create a test file
    const testContent = `Test content for IPFS pinning with API key at ${new Date().toISOString()}`;
    const contentBytes = Buffer.from(testContent);
    
    console.log('Test content:', testContent);
    
    // Prepare FormData
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('file', contentBytes, { filename: 'test-file-api-key.txt' });
    
    // Add metadata
    const metadata = JSON.stringify({
      name: 'IPFS-X Test File (API Key)',
      keyvalues: {
        method: 'api_key',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Set the options for pinning
    const pinOptions = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', pinOptions);
    
    // API key headers
    const headers = {
      'pinata_api_key': CONFIG.pinning.services[0].headers['pinata_api_key'],
      'pinata_secret_api_key': CONFIG.pinning.services[0].headers['pinata_secret_api_key']
    };
    
    console.log('Sending request to Pinata using API key...');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Successfully pinned directly to Pinata with API key:', result);
      console.log('IPFS Hash:', result.IpfsHash);
      return true;
    } else {
      const errorText = await response.text();
      console.error('Failed to pin content with API key:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('Error in API key test:', error);
    return false;
  }
}

// Test direct pinning with JWT
async function testDirectPinningWithJWT() {
  try {
    // Create a test file
    const testContent = `Test content for IPFS pinning with JWT at ${new Date().toISOString()}`;
    const contentBytes = Buffer.from(testContent);
    
    console.log('Test content:', testContent);
    
    // Prepare FormData
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('file', contentBytes, { filename: 'test-file-jwt.txt' });
    
    // Add metadata
    const metadata = JSON.stringify({
      name: 'IPFS-X Test File (JWT)',
      keyvalues: {
        method: 'jwt',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);
    
    // Set the options for pinning
    const pinOptions = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', pinOptions);
    
    // JWT header
    const headers = {
      'Authorization': `Bearer ${CONFIG.pinning.services[0].headers['pinata_jwt']}`
    };
    
    console.log('Sending request to Pinata using JWT...');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Successfully pinned directly to Pinata with JWT:', result);
      console.log('IPFS Hash:', result.IpfsHash);
      
      // Try to get the list of pins to verify
      console.log('\nTrying to list pins with JWT...');
      const listResponse = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=10', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.pinning.services[0].headers['pinata_jwt']}`
        }
      });
      
      if (listResponse.ok) {
        const listResult = await listResponse.json();
        console.log(`Found ${listResult.count} pinned items`);
        console.log('First few pins:', listResult.rows.slice(0, 3).map(row => row.ipfs_pin_hash));
      } else {
        const errorText = await listResponse.text();
        console.error('Failed to list pins:', listResponse.status, errorText);
      }
      
      return true;
    } else {
      const errorText = await response.text();
      console.error('Failed to pin content with JWT:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('Error in JWT test:', error);
    return false;
  }
}

// Run both tests
Promise.all([
  testDirectPinningWithAPIKey(),
  testDirectPinningWithJWT()
])
  .then(results => {
    const [apiKeySuccess, jwtSuccess] = results;
    console.log('\nTest Results:');
    console.log('- API Key Authentication:', apiKeySuccess ? 'SUCCESS' : 'FAILED');
    console.log('- JWT Authentication:', jwtSuccess ? 'SUCCESS' : 'FAILED');
    
    if (apiKeySuccess || jwtSuccess) {
      console.log('\nOverall test: SUCCESS - At least one authentication method works');
      process.exit(0);
    } else {
      console.log('\nOverall test: FAILED - No authentication methods work');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  }); 