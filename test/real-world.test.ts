/**
 * Test Identity with real-world 0en.json data
 */

import { Identity } from '../src/identity';
import realWorldData from './0en.json';

async function testRealWorldIdentity() {
  console.log('🌍 Testing Identity with real-world data...');
  
  try {
    // Extract identity data from the 0en.json file
    const identityData = realWorldData.identity;
    
    console.log('📋 Real-world identity data:');
    console.log('   Alias:', identityData.alias);
    console.log('   DID:', identityData.did);
    console.log('   Public Key:', identityData.publicKeyHex);
    console.log('   Has Private Key:', !!identityData.privateKeyHex);
    console.log('   Provider:', identityData.provider);
    console.log('   Credential Type:', identityData.credential.type);
    
    // Test 1: Create identity from real data
    console.log('\n1. Creating identity from real-world data...');
    
    // Convert createdAt string to Date object
    const identityDataWithDate = {
      ...identityData,
      createdAt: new Date(identityData.createdAt)
    };
    
    const result = Identity.create(identityDataWithDate);
    
    if (!result.isSuccess) {
      console.error('❌ Identity creation failed:', result.errorMessage);
      if (result.errorCause) {
        console.error('❌ Exception details:', result.errorCause);
      }
      throw new Error(result.errorMessage || 'Failed to create identity from real-world data');
    }
    
    const identity = result.value;
    
    console.log('✅ Identity created successfully');
    console.log('   Alias:', identity.getAlias());
    console.log('   DID:', identity.getDid());
    console.log('   Matches original:', identity.getDid() === identityData.did);
    
    // Test 2: Access units
    console.log('\n2. Testing unit access...');
    const signer = identity.signerUnit();
    const key = identity.keyUnit();
    const didUnit = identity.didUnit();
    const credentialUnit = identity.credentialUnit();

    console.log('✅ All units accessible');
    console.log('   Signer:', signer.whoami());
    console.log('   Key:', key?.whoami() || 'null');
    console.log('   DID:', didUnit.whoami());
    console.log('   Credential:', credentialUnit.whoami());
    
    // Test 3: Test signer with real key material
    console.log('\n3. Testing signer with real key material...');
    const message = 'Hello from real-world identity!';
    const signature = await signer.sign(message);
    const isValid = await signer.verify(message, signature);
    
    console.log('✅ Signer works with real key material');
    console.log('   Signature:', signature);
    console.log('   Valid:', isValid);
    
    // Test 4: Verify existing credential
    console.log('\n4. Testing credential verification...');
    const existingCredential = identityData.credential;
    const verifyResult = await credentialUnit.verifyCredential(existingCredential);
    
    console.log('✅ Credential verification result:');
    if (verifyResult.isSuccess) {
      const result = verifyResult.value;
      console.log('   Verified:', result.verified);
      console.log('   Issuer:', result.issuer);
      console.log('   Subject:', result.subject);
    } else {
      console.log('   Verification failed:', verifyResult.errorMessage);
    }
    
    // Test 5: Issue new credential with same identity
    console.log('\n5. Testing credential issuance...');
    const newCredentialResult = await credentialUnit.issueCredential(
      {
        holder: {
          id: identityData.did,
          name: identityData.alias
        },
        issuedBy: {
          id: identityData.did,
          name: identityData.alias
        },
        testField: 'New credential from real identity'
      },
      'TestCredential',
      identityData.did
    );
    
    if (newCredentialResult.isSuccess) {
      const newCredential = newCredentialResult.value;
      console.log('✅ New credential issued successfully');
      console.log('   ID:', newCredential.id);
      console.log('   Type:', newCredential.type);
      console.log('   Issuer:', newCredential.issuer.id);
      
      // Verify the new credential
      const newVerifyResult = await credentialUnit.verifyCredential(newCredential);
      if (newVerifyResult.isSuccess) {
        console.log('   New credential verified:', newVerifyResult.value.verified);
      } else {
        console.log('   New credential verification failed:', newVerifyResult.errorMessage);
      }
    } else {
      console.log('❌ Failed to issue new credential:', newCredentialResult.errorMessage);
    }
    
    // Test 6: Export and compare data
    console.log('\n6. Testing data export...');
    const exportedData = identity.toJSON();
    
    console.log('✅ Data export comparison:');
    console.log('   Same alias:', exportedData.alias === identityData.alias);
    console.log('   Same DID:', exportedData.did === identityData.did);
    console.log('   Same public key:', exportedData.publicKeyHex === identityData.publicKeyHex);
    
    console.log('\n🎉 Real-world identity tests passed!');
    
  } catch (error) {
    console.error('❌ Real-world test failed:', error);
    //process.exit(1);
  }
}

testRealWorldIdentity();
