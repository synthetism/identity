/**
 * Simple test to verify the new Result API works
 */

import { Identity } from '../src/identity';

async function testNewAPI() {
  console.log('🧪 Testing new Result API...\n');
  
  // Test 1: Generate identity (success case)
  console.log('1. Testing successful identity generation...');
  const result = await Identity.generate('test-user');
  
  if (result.isSuccess) {
    console.log('✅ Success case works!');
    console.log('   Success:', result.isSuccess);
    console.log('   Identity alias:', result.value.getAlias());
    console.log('   Identity DID:', result.value.getDid());
    console.log('   Error field:', result.errorMessage);
  } else {
    console.log('❌ Unexpected failure');
    console.log('   Success:', result.isSuccess);
    console.log('   Error:', result.errorMessage);
  }

  console.log('\n2. Testing the old CLI pattern (now type-safe)...');
  const cliResult = await Identity.generate('cli-test');
  
  // This is what the CLI should do now - type-safe error handling
  if (!cliResult.isSuccess) {
    console.log('❌ CLI would fail with error:', cliResult.errorMessage);
    return;
  }
  
  // CLI would get here only if successful
  const identity = cliResult.value;
  console.log('✅ CLI pattern works!');
  console.log('   Alias:', identity.getAlias());
  console.log('   DID:', identity.getDid());
  
  console.log('\n🎉 New API is type-safe and ready!');
}

testNewAPI().catch(console.error);
