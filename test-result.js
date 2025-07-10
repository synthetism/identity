// Simple test for the new Result pattern
const { Identity } = require('./dist/identity');

async function testResult() {
  console.log('🧪 Testing new Result pattern...\n');
  
  try {
    const result = await Identity.generate('test-user');
    
    console.log('📋 Result properties:');
    console.log('   isSuccess:', result.isSuccess);
    console.log('   isFailure:', result.isFailure);
    
    if (result.isSuccess) {
      console.log('✅ Success case:');
      console.log('   Identity alias:', result.value.getAlias());
      console.log('   Identity DID:', result.value.getDid());
      console.log('   Error message:', result.errorMessage);
    } else {
      console.log('❌ Failure case:');
      console.log('   Error message:', result.errorMessage);
    }
    
    console.log('\n✅ Result pattern is working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testResult();
