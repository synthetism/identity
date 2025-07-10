/**
 * Test Identity integration with Credential Result pattern
 * 
 * This test verifies that when a unit learns from the credential unit,
 * it can execute credential operations through the execute method
 * and properly handle the Result pattern.
 */

import { Identity } from '../src/identity';
import { Unit, createUnitSchema, type TeachingContract } from '@synet/unit';
import type { BaseCredentialSubject, Result } from '@synet/credential';

class MockConsumerUnit extends Unit {
  constructor() {
    super(createUnitSchema({
      id: 'mock-consumer',
      version: '1.0.0'
    }));
  }

  whoami(): string {
    return 'MockConsumerUnit - Testing credential learning';
  }

  capabilities(): string[] {
    return this._getAllCapabilities();
  }

  help(): void {
    console.log('MockConsumerUnit - Testing credential learning capabilities');
  }

  teach(): TeachingContract {
    return {
      unitId: 'mock-consumer',
      capabilities: {
        test: () => 'test capability'
      }
    };
  }

  async testCredentialExecution() {
    // Test if we can execute issueCredential through the execute method
    const subject: BaseCredentialSubject = {
      holder: {
        id: 'did:example:test-consumer',
        name: 'Test Consumer'
      }
    };

    console.log('🔍 Testing credential execution through execute method...');
    
    try {
      // Try to execute issueCredential via the execute method
      // Note: capabilities are learned with namespace prefix
      const result = await this.execute(
        'credential.issueCredential',
        subject,
        'TestCredential',
        'did:example:test-consumer'
      );

      console.log('✅ Execute method succeeded');
      console.log('📋 Result type:', typeof result);
      console.log('📋 Result:', result);
      
      // Check if it's a Result object
      if (result && typeof result === 'object' && 'isSuccess' in result) {
        console.log('✅ Result follows Result pattern');
        const resultObj = result as Result<any>;
        console.log('📋 Is Success:', resultObj.isSuccess);
        
        if (resultObj.isSuccess) {
          console.log('📋 Credential ID:', resultObj.value?.id);
          console.log('📋 Credential Type:', resultObj.value?.type);
        } else {
          console.log('❌ Error:', resultObj.errorMessage);
        }
      } else {
        console.log('❌ Result does not follow Result pattern');
        console.log('📋 Actual result:', result);
      }
      
      return result;
    } catch (error) {
      console.log('❌ Execute method failed with exception:', error);
      throw error;
    }
  }
}

async function testIdentityCredentialLearning() {
  console.log('🧪 Testing Identity + Credential Learning Integration\n');

  try {
    // 1. Generate a new identity
    console.log('1️⃣ Generating new identity...');    const identityResult = await Identity.generate('test-user');
    
    if (!identityResult.isSuccess) {
      throw new Error(`Failed to generate identity: ${identityResult.errorMessage}`);
    }
    
    const identity = identityResult.value;
    console.log('✅ Identity generated successfully');
    console.log('📋 DID:', identity.getDid());
    console.log('📋 Alias:', identity.getAlias());

    // 2. Create a mock unit that will learn from credential
    console.log('\n2️⃣ Creating mock consumer unit...');
    const consumerUnit = new MockConsumerUnit();
    console.log('✅ Mock consumer unit created');
    console.log('📋 Initial capabilities:', consumerUnit.capabilities());

    // 3. Learn credential capabilities
    console.log('\n3️⃣ Learning credential capabilities...');
    const credentialUnit = identity.credential();
    const teachingContract = credentialUnit.teach();
    
    console.log('📋 Available capabilities from credential:', Object.keys(teachingContract.capabilities));
    
    consumerUnit.learn([teachingContract]);
    console.log('✅ Learned credential capabilities');
    console.log('📋 Updated capabilities:', consumerUnit.capabilities());

    // 4. Test credential execution through execute method
    console.log('\n4️⃣ Testing credential execution through execute method...');
    const executionResult = await consumerUnit.testCredentialExecution();
    
    console.log('\n🎉 Test completed successfully!');
    return {
      success: true,
      identity,
      consumerUnit,
      executionResult
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
testIdentityCredentialLearning()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All tests passed!');
   
    } else {
      console.log('\n❌ Test failed:', result.error);

    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
  
  });
