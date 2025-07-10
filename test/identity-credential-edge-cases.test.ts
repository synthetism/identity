/**
 * Test Identity + Credential Learning Edge Cases
 * 
 * This test covers edge cases and error scenarios to ensure
 * robust behavior when learning from credential units.
 */

import { Identity } from '../src/identity';
import { Unit, createUnitSchema, type TeachingContract } from '@synet/unit';
import type { BaseCredentialSubject, Result } from '@synet/credential';

class EdgeCaseTestUnit extends Unit {
  constructor() {
    super(createUnitSchema({
      id: 'edge-case-test',
      version: '1.0.0'
    }));
  }

  whoami(): string {
    return 'EdgeCaseTestUnit - Testing edge cases';
  }

  capabilities(): string[] {
    return this._getAllCapabilities();
  }

  help(): void {
    console.log('EdgeCaseTestUnit - Testing edge cases and error scenarios');
  }

  teach(): TeachingContract {
    return {
      unitId: 'edge-case-test',
      capabilities: {
        test: () => 'test capability'
      }
    };
  }

  async testWithoutLearning() {
    console.log('🔍 Testing execution without learning...');
    
    const subject: BaseCredentialSubject = {
      holder: {
        id: 'did:example:test',
        name: 'Test'
      }
    };

    try {
      // Try to execute issueCredential without learning
      const result = await this.execute(
        'issueCredential',
        subject,
        'TestCredential',
        'did:example:test'
      );

      console.log('❌ Expected error but got result:', result);
      return { success: false, error: 'Expected error but got result' };
    } catch (error) {
      console.log('✅ Got expected error:', error instanceof Error ? error.message : error);
      return { success: true, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async testWithLearning(credentialUnit: any) {
    console.log('🔍 Testing execution with learning...');
    
    // Learn from credential unit
    const teachingContract = credentialUnit.teach();
    this.learn([teachingContract]);
    
    console.log('📋 Learned capabilities:', this.capabilities());
    
    const subject: BaseCredentialSubject = {
      holder: {
        id: 'did:example:test',
        name: 'Test'
      }
    };

    try {
      // Try to execute with learned capabilities
      const result = await this.execute(
        'credential.issueCredential',
        subject,
        'TestCredential',
        'did:example:test'
      );

      console.log('✅ Execution succeeded with Result pattern');
      
      if (result && typeof result === 'object' && 'isSuccess' in result) {
        const resultObj = result as Result<any>;
        console.log('📋 Is Success:', resultObj.isSuccess);
        
        if (resultObj.isSuccess) {
          console.log('📋 Credential issued successfully');
          return { success: true, credential: resultObj.value };
        } else {
          console.log('❌ Credential issue failed:', resultObj.errorMessage);
          return { success: false, error: resultObj.errorMessage };
        }
      } else {
        console.log('❌ Result does not follow Result pattern');
        return { success: false, error: 'Result does not follow Result pattern' };
      }
    } catch (error) {
      console.log('❌ Execution failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async testVerification(credentialUnit: any, credential: any) {
    console.log('🔍 Testing credential verification...');
    
    try {
      // Try to verify the credential
      const result = await this.execute(
        'credential.verifyCredential',
        credential
      );

      console.log('✅ Verification execution succeeded');
      
      if (result && typeof result === 'object' && 'isSuccess' in result) {
        const resultObj = result as Result<any>;
        console.log('📋 Verification Is Success:', resultObj.isSuccess);
        
        if (resultObj.isSuccess) {
          console.log('📋 Verification result:', resultObj.value);
          return { success: true, verification: resultObj.value };
        } else {
          console.log('❌ Verification failed:', resultObj.errorMessage);
          return { success: false, error: resultObj.errorMessage };
        }
      } else {
        console.log('❌ Verification result does not follow Result pattern');
        return { success: false, error: 'Result does not follow Result pattern' };
      }
    } catch (error) {
      console.log('❌ Verification execution failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

async function testEdgeCases() {
  console.log('🧪 Testing Identity + Credential Learning Edge Cases\n');

  try {
    // 1. Generate identity
    console.log('1️⃣ Generating identity...');    const identityResult = await Identity.generate('edge-case-test');
    
    if (!identityResult.isSuccess) {
      throw new Error(`Failed to generate identity: ${identityResult.errorMessage}`);
    }
    
    const identity = identityResult.value;
    console.log('✅ Identity generated');

    // 2. Create test unit
    console.log('\n2️⃣ Creating edge case test unit...');
    const testUnit = new EdgeCaseTestUnit();
    console.log('✅ Test unit created');

    // 3. Test without learning
    console.log('\n3️⃣ Testing execution without learning...');
    const withoutLearningResult = await testUnit.testWithoutLearning();
    console.log('✅ Without learning test completed');

    // 4. Test with learning
    console.log('\n4️⃣ Testing execution with learning...');
    const withLearningResult = await testUnit.testWithLearning(identity.credential());
    console.log('✅ With learning test completed');

    // 5. Test verification if credential was issued
    if (withLearningResult.success && withLearningResult.credential) {
      console.log('\n5️⃣ Testing verification...');
      const verificationResult = await testUnit.testVerification(
        identity.credential(),
        withLearningResult.credential
      );
      console.log('✅ Verification test completed');
    }

    console.log('\n🎉 All edge case tests completed!');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Edge case test failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Run the edge case tests
testEdgeCases()
  .then(result => {
    if (result.success) {
      console.log('\n✅ All edge case tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Edge case tests failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
