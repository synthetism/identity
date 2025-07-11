/**
 * @synet/identity - Identity Unit Operator
 * 
 * Creates and manages decentralized identities by composing multiple units:
 * - DID unit for decentralized identifier management
 * - Signer unit for cryptographic signing operations
 * - Key unit for public key operations
 * - Credential unit for verifiable credential operations
 * 
 * The Identity acts as a Unit Operator - not a learnable unit itself,
 * but a composer that creates and manages other units.
 * 
 * Usage:
 * ```typescript
 * // Generate new identity
 * const identity = await Identity.generate('alice');
 * 
 * // Create from existing data
 * const identity = Identity.create(identityData);
 * 
 * // Use composed units
 * await identity.signer().sign('hello');
 * const did = identity.did().resolve();
 * 
 * // Access data with explicit getters
 * const alias = identity.getAlias();
 * const publicKey = identity.getPublicKeyHex();
 * const did = identity.getDid();
 * ```
 * 
 * @author Synet Team
 */

import { Signer, hexToPem, hexPrivateKeyToPem, pemToHex, generateKeyPair } from '@synet/keys';
import { DID } from '@synet/did';  
import { Credential } from '@synet/credential';
import type { SynetVerifiableCredential, BaseCredentialSubject } from '@synet/credential';
import { Result } from './result';

export interface IIdentity {
  alias: string
  did: string
  kid: string
  publicKeyHex: string
  privateKeyHex?: string // Optional private key, can be used for signing
  provider: string // did:key | did:web
  credential: SynetVerifiableCredential<BaseCredentialSubject>
  metadata?: Record<string, unknown>
  createdAt: Date // Optional creation date for the vault  
}

/**
 * Identity Unit Operator
 * Composes DID, Signer, Key, and Credential units
 */
export class Identity {
  private _identity: IIdentity;
  private _didUnit: DID;
  private _signerUnit: Signer;
  private _keyUnit: ReturnType<Signer['createKey']>;
  private _credentialUnit: Credential;

  private constructor(
    identity: IIdentity,
    didUnit: DID,
    signerUnit: Signer,
    keyUnit: ReturnType<Signer['createKey']>,
    credentialUnit: Credential
  ) {
    this._identity = identity;
    this._didUnit = didUnit;
    this._signerUnit = signerUnit;
    this._keyUnit = keyUnit;
    this._credentialUnit = credentialUnit;
  }

  /**
   * Generate a new identity with fresh cryptographic material
   */
  static async generate(alias: string): Promise<Result<Identity>> {
    try {
      // 1. Generate cryptographic material in hex format
      const keyPair = generateKeyPair('ed25519', { format: 'hex' });
      if (!keyPair) {
        throw new Error('Failed to generate key pair');
      }

      // 2. Convert hex keys to PEM for signer creation
      const publicKeyPEM = hexToPem(keyPair.publicKey, 'ed25519');
      const privateKeyPEM = hexPrivateKeyToPem(keyPair.privateKey);

      if (!publicKeyPEM || !privateKeyPEM) {
        throw new Error('Failed to convert keys to PEM format');
      }

      // 3. Create signer from the PEM keys
      const signer = Signer.create(privateKeyPEM, publicKeyPEM, 'ed25519', { 
        name: `${alias}-signer` 
      });
      if (!signer) {
        throw new Error('Failed to create signer from key pair');
      }

      const key = signer.createKey();
      if (!key) {
        throw new Error('Failed to create key from signer');
      }

      // 4. Get public key in hex format (should match our generated key)
      const publicKeyHex = signer.getPublicKeyHex();
      if (!publicKeyHex) {
        throw new Error('Failed to get public key hex');
      }

      // 5. Use the hex private key we generated
      const privateKeyHex = keyPair.privateKey;

      // 6. Create DID from public key (reuse the PEM we already have)
      const didUnit = DID.createFromKey(publicKeyPEM, 'ed25519', { alias });
      if (!didUnit) {
        throw new Error('Failed to create DID from public key');
      }

      // Learn key capabilities to generate DID
      didUnit.learn([key.teach()]);
      
      // Generate the DID string
      const didString = await didUnit.generateKey();
      if (!didString) {
        throw new Error('Failed to generate DID string');
      }

      // 5. Create credential unit and learn from key
      const credentialUnit = Credential.create();
      credentialUnit.learn([key.teach()]);

      // 6. Create identity credential
      const subject: BaseCredentialSubject = {
        holder: {
          id: didString,
          name: alias
        },
        issuedBy: {
          id: didString,
          name: alias
        }
      };

      const credentialResult = await credentialUnit.issueCredential(
        subject,
        'IdentityCredential',
        didString
      );

      if (!credentialResult.isSuccess) {
        throw new Error('Failed to issue identity credential');
      }

      const credential = credentialResult.value;

      // 7. Build identity data
      const identityData: IIdentity = {
        alias,
        did: didString,
        kid: publicKeyHex,
        publicKeyHex,
        privateKeyHex,
        provider: 'did:key',
        credential: credential as SynetVerifiableCredential<BaseCredentialSubject>,
        metadata: {},
        createdAt: new Date()
      };

      const identity = new Identity(identityData, didUnit, signer, key, credentialUnit);
      
      return Result.success(identity);
    } catch (error) {
      console.error('Failed to generate identity:', error);
      return Result.fail(
        error instanceof Error ? error.message : 'Unknown error occurred',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create identity from existing data
   */
  static create(identityData: IIdentity): Result<Identity> {
    try {
      // For now, if no private key is provided, we'll create a new signer
      // This is a temporary solution - in practice, we need proper key storage
      if (!identityData.privateKeyHex) {
        console.warn('No private key provided - creating identity with limited functionality');
        
        // Create a new signer (this won't match the original, but allows testing)
        const signer = Signer.generate('ed25519', { 
          name: `${identityData.alias}-recreated-signer` 
        });
        
        if (!signer) {
          throw new Error('Failed to create signer');
        }
        
        const key = signer.createKey();
        if (!key) {
          throw new Error('Failed to create key from signer');
        }
        
        const publicKeyPEM = hexToPem(identityData.publicKeyHex, 'ed25519');
        if (!publicKeyPEM) {
          throw new Error('Failed to convert public key to PEM');
        }
        
        const didUnit = DID.createFromKey(publicKeyPEM, 'ed25519', {
          alias: identityData.alias
        });
        
        if (!didUnit) {
          throw new Error('Failed to create DID unit');
        }

        const credentialUnit = Credential.create();
        credentialUnit.learn([key.teach()]);
        
        return Result.success(new Identity(identityData, didUnit, signer, key, credentialUnit));
      }

      // 1. Reconstruct signer from private key
      const privateKeyPEM = hexPrivateKeyToPem(identityData.privateKeyHex);
      const publicKeyPEM = hexToPem(identityData.publicKeyHex, 'ed25519');

      if (!privateKeyPEM || !publicKeyPEM) {
        throw new Error('Failed to convert keys to PEM format');
      }

      const signer = Signer.create(privateKeyPEM, publicKeyPEM, 'ed25519', {
        name: `${identityData.alias}-signer`
      });

      if (!signer) {
        throw new Error('Failed to create signer from key material');
      }

      // 2. Create key from signer
      const key = signer.createKey();
      if (!key) {
        throw new Error('Failed to create key from signer');
      }

      // 3. Reconstruct DID unit from public key
      const didUnit = DID.createFromKey(publicKeyPEM, 'ed25519', {
        alias: identityData.alias
      });
      
      if (!didUnit) {
        throw new Error('Failed to reconstruct DID');
      }

      // 4. Create credential unit and learn from key
      const credentialUnit = Credential.create();
      credentialUnit.learn([key.teach()]);

      return Result.success(new Identity(identityData, didUnit, signer, key, credentialUnit));
    } catch (error) {
      console.error('Failed to create identity:', error);
      return Result.fail(
        error instanceof Error ? error.message : 'Unknown error occurred',
        error instanceof Error ? error : undefined
      );
    }
  }

  // ==========================================
  // UNIT ACCESS (for operations)
  // ==========================================

  /**
   * Get DID unit for identifier operations
   */
  did(): DID {
    return this._didUnit;
  }

  /**
   * Get Key unit for public key operations
   */
  key(): ReturnType<Signer['createKey']> {
    return this._keyUnit;
  }

  /**
   * Get Signer unit for signing operations
   */
  signer(): Signer {
    return this._signerUnit;
  }

  /**
   * Get Credential unit for verifiable credential operations
   */
  credential(): Credential {
    return this._credentialUnit;
  }

  // ==========================================
  // DATA ACCESS
  // ==========================================

  /**
   * Get identity alias
   */
  getAlias(): string {
    return this._identity.alias;
  }

  /**
   * Get DID string
   */
  getDid(): string {
    return this._identity.did;
  }

  /**
   * Get key identifier
   */
  getKid(): string {
    return this._identity.kid;
  }

  /**
   * Get public key in hex format
   */
  getPublicKeyHex(): string {
    return this._identity.publicKeyHex;
  }

  /**
   * Get private key in hex format (if available)
   */
  getPrivateKeyHex(): string | undefined {
    return this._identity.privateKeyHex;
  }

  /**
   * Get identity provider
   */
  getProvider(): string {
    return this._identity.provider;
  }

  /**
   * Get verifiable credential
   */
  getCredential(): SynetVerifiableCredential<BaseCredentialSubject> {
    return this._identity.credential;
  }

  /**
   * Get metadata
   */
  getMetadata(): Record<string, unknown> | undefined {
    return this._identity.metadata;
  }

  /**
   * Get creation date
   */
  getCreatedAt(): Date {
    return this._identity.createdAt;
  }

  toJSON() {
    return {
      alias: this._identity.alias,
      did: this._identity.did,
      kid: this._identity.kid,
      publicKeyHex: this._identity.publicKeyHex,
      privateKeyHex: this._identity.privateKeyHex,
      provider: this._identity.provider,
      credential: this._identity.credential,
      metadata: this._identity.metadata || {},
      createdAt: this._identity.createdAt,
    };
  }

  toDomain():IIdentity {
    return {
      alias: this._identity.alias,
      did: this._identity.did,
      kid: this._identity.kid,
      publicKeyHex: this._identity.publicKeyHex,
      privateKeyHex: this._identity.privateKeyHex,
      provider: this._identity.provider,
      credential: this._identity.credential,
      metadata: this._identity.metadata || {},
      createdAt: this._identity.createdAt // Convert to ISO string for consistency
    };
  }

  /**
   * Export public identity data (no private key)
   */
  public(): Omit<IIdentity, 'privateKeyHex'> {
    const { privateKeyHex, ...publicData } = this._identity;
    return publicData;
  }
}