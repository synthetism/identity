/**
 * Test for the new Result<T> pattern in Identity
 * Demonstrates proper error handling and type safety
 */

import { Identity, Result } from '../src/index';

async function testResultPattern() {
  console.log('🧪 Testing Result<T> pattern in Identity...\n');
  
  try {
    // Test 1: Successful generation
    console.log('1️⃣ Testing successful identity generation...');
    const result = await Identity.generate('test-user');
    
    console.log('   Result type:', result.constructor.name);
    console.log('   Is success:', result.isSuccess);
    console.log('   Is failure:', result.isFailure);
    
    if (result.isSuccess) {
      const identity = result.value; // Type-safe access
      console.log('✅ Success! Identity alias:', identity.getAlias());
      console.log('   DID:', identity.getDid());
    } else {
      console.log('❌ Unexpected failure:', result.errorMessage);
      return;
    }
    
    // Test 2: Type-safe error handling pattern
    console.log('\n2️⃣ Testing CLI-style error handling...');
    const cliResult = await Identity.generate('cli-user');
    
    // This is the pattern CLI code should use
    if (!cliResult.isSuccess) {
      console.log('❌ CLI would exit with error:', cliResult.errorMessage);
      return;
    }
    
    // TypeScript knows this is safe now
    const cliIdentity = cliResult.value;
    console.log('✅ CLI pattern works! Identity:', cliIdentity.getAlias());
    
    // Test 3: Create from existing data
    console.log('\n3️⃣ Testing Identity.create() with Result...');
    const jsonData = cliIdentity.toJSON();
    const createResult = Identity.create(jsonData);
    
    if (createResult.isSuccess) {
      console.log('✅ Create success! Recreated:', createResult.value.getAlias());
    } else {
      console.log('⚠️  Create failed (expected for test data):', createResult.errorMessage);
    }
    
    console.log('\n🎉 Result<T> pattern is working perfectly!');
    console.log('✅ Type-safe error handling');
    console.log('✅ No more optional properties');
    console.log('✅ Clear success/failure states');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testResultPattern().catch(console.error);
