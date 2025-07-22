/**
 * Unit Architecture validation test for Identity Unit
 */

import { describe, test, expect } from 'vitest';
import { Identity } from '../src/identity';

describe('Identity Unit Architecture', () => {
  test('should generate identity with Unit Architecture patterns', async () => {
    const result = await Identity.generate('test-user');
    
    expect(result.isSuccess).toBe(true);
    
    if (result.isSuccess) {
      const identity = result.value;
      
      // Test Unit Architecture compliance
      expect(identity.whoami()).toContain('Identity Unit');
      expect(identity.can).toBeDefined();
      expect(identity.teach).toBeDefined();
      expect(identity.learn).toBeDefined();
      
      // Test data access through legacy methods (props are protected)
      expect(identity.getAlias()).toBe('test-user');
      expect(identity.getDid()).toMatch(/^did:key:/);
      expect(identity.getPublicKey()).toBeDefined();
      
      // Test teaching contract
      const contract = identity.teach();
      expect(contract.unitId).toBe('identity');

      expect(contract.capabilities).toHaveProperty('sign');
      expect(contract.capabilities).toHaveProperty('getDid');
    }
  });

  test('should fail creating identity without public and private keys', () => {
    const result = Identity.create({
      alias: 'config-user',
      provider: 'did:key'
    });
    
    expect(result.isSuccess).toBe(false);

  });

  test('should support capability learning', async () => {
    const result = await Identity.generate('learner');
    
    if (result.isSuccess) {
      const identity = result.value;
      
      // Test initial capabilities
      const initialCaps = identity.capabilities();

      expect(initialCaps).toContain('signer.sign');

      
      // Test capability checking

      expect(identity.can('nonexistent.capability')).toBe(false);
      
      // Test teaching
      const contract = identity.teach();
      expect(Object.keys(contract.capabilities).length).toBeGreaterThan(0);
    }
  });

  test('should provide unit composition access', async () => {
    const result = await Identity.generate('composer');
    
    if (result.isSuccess) {
      const identity = result.value;
      
      // Test composed unit access
      expect(identity.did()).toBeDefined();
      expect(identity.signer()).toBeDefined();
      expect(identity.key()).toBeDefined();
      expect(identity.credential()).toBeDefined();
      
      // Test composed unit operations
      const didUnit = identity.did();
      expect(didUnit.whoami()).toContain('did');
      
      const signerUnit = identity.signer();
      expect(signerUnit.whoami()).toContain('Signer');
    }
  });

  test('should handle native capabilities correctly', async () => {
    const result = await Identity.generate('native-test');
    
    if (result.isSuccess) {
      const identity = result.value;
      
      // Test native capabilities
      expect(identity.getDid()).toMatch(/^did:key:/);
      expect(identity.getPublicKey()).toBeDefined();
      
      // Test signing capability (should work even without learning)
      const signature = await identity.sign('test data');
      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
      
      // Test verification
      const isValid = await identity.verify('test data', signature);
      expect(isValid).toBe(true);
    }
  });
});
