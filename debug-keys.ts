/**
 * Debug the private key conversion issue
 */

import { hexToPem } from '@synet/keys';
import realWorldData from './src/0en.json';

function debugKeyConversion() {
  console.log('🔍 Debugging key conversion...');
  
  const identityData = realWorldData.identity;
  
  console.log('Original private key hex:', identityData.privateKeyHex);
  console.log('Original public key hex:', identityData.publicKeyHex);
  
  // Check the hex format
  console.log('Private key hex length:', identityData.privateKeyHex.length);
  console.log('Public key hex length:', identityData.publicKeyHex.length);
  
  // Try converting to PEM
  try {
    const privateKeyPEM = hexToPem(identityData.privateKeyHex, 'ed25519');
    console.log('Private key PEM conversion successful:', !!privateKeyPEM);
    if (privateKeyPEM) {
      console.log('Private key PEM preview:', privateKeyPEM.substring(0, 100) + '...');
    }
  } catch (error) {
    console.error('Private key PEM conversion failed:', error);
  }
  
  try {
    const publicKeyPEM = hexToPem(identityData.publicKeyHex, 'ed25519');
    console.log('Public key PEM conversion successful:', !!publicKeyPEM);
    if (publicKeyPEM) {
      console.log('Public key PEM preview:', publicKeyPEM.substring(0, 100) + '...');
    }
  } catch (error) {
    console.error('Public key PEM conversion failed:', error);
  }
}

debugKeyConversion();
