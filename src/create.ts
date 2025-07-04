import {createDIDKey} from '@synet/did';
import { generateKeyPair } from '@synet/keys';
import { Result, ValueObject } from '@synet/patterns';
import type { W3CVerifiableCredential, SynetVerifiableCredential, BaseCredentialSubject } from '@synet/credential';
import  { type IIdentity, Identity } from './identity';
import { issueVC, Key, IdentitySubject } from '@synet/credential';

export async function createIdentity  (alias: string, provider: string): Promise<Identity> {
  try {
    // Generate a new key pair
    const keyPair = generateKeyPair('ed25519');

    const did = createDIDKey(keyPair.publicKey,'Ed25519');

    const key = Key.create({
      publicKeyHex: keyPair.publicKey,
      privateKeyHex: keyPair.privateKey,
      type: 'Ed25519',
      meta: {
        created: new Date().toISOString(),
        source: '@synet/keys',
      },
    });

     const credentialSubject: IdentitySubject = {
        holder: {
          id: did,
          name: alias,
        },
        issuedBy: {
          id: did,
          name: alias,
        },
      };

    const createdAt = new Date();
    const vc = await issueVC(key,credentialSubject, alias, did);

    if (!vc.success) {
      throw new Error(vc.error);
    }

    const identityResult =   Identity.create({
      alias,
      did: did,
      kid: keyPair.publicKey,
      publicKeyHex: keyPair.publicKey,
      privateKeyHex: keyPair.privateKey,
      provider,
      credential: vc as W3CVerifiableCredential,
    });

    if( identityResult.isFailure) {

      throw new Error(identityResult.errorMessage);
    }
    
    return identityResult.value;
    
  } catch (error) {
    console.error('Error creating identity:', error);
    throw new Error('Failed to create identity');
  }
};