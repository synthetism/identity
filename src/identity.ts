/**
 * @synet/identity - Identity Unit
 *
 * Creates and manages decentralized identities by composing multiple units:
 * - DID unit for decentralized identifier management
 * - Signer unit for cryptographic signing operations
 * - Key unit for public key operations
 * - Credential unit for verifiable credential operations
 *
 * The Identity follows Unit Architecture with props-based construction
 * and teaching/learning contracts for capability sharing.
 *
 *
 * @author Synet Team
 */

import {
  Signer,
  hexToPem,
  hexPrivateKeyToPem,
  generateKeyPair,
} from "@synet/keys";
import { DID } from "@synet/did";
import { Credential } from "@synet/credential";
import type {
  SynetVerifiableCredential,
  BaseCredentialSubject,
  IdentitySubject,
} from "@synet/credential";
import { Result } from "./result";
import {
  Unit,
  type UnitProps,
  createUnitSchema,
  type UnitSchema,
  type TeachingContract,
} from "@synet/unit";


// External input to static create()
export interface IdentityConfig {
  alias: string;
  did: string;
  publicKeyHex: string;
  privateKeyHex: string;
  kid?: string;
  provider?: string;
  credential?: SynetVerifiableCredential<BaseCredentialSubject>;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

// Internal state after validation
export interface IdentityProps extends UnitProps {
  dna: UnitSchema;
  alias: string;
  did: string;
  kid: string;
  publicKeyHex: string;
  privateKeyHex?: string;
  provider: string;
  credential: SynetVerifiableCredential<BaseCredentialSubject>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  // Composed units for internal operations
  didUnit: DID;
  signerUnit: Signer;
  keyUnit: ReturnType<Signer["createKey"]>;
  credentialUnit: Credential;
}

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

export interface IdentityPresent {
  did: string
  publicKeyHex: string
  credential: SynetVerifiableCredential<BaseCredentialSubject>  
}


const VERSION = "1.0.1";
/**
 * Identity Unit - Unit Architecture implementation
 * Composes DID, Signer, Key, and Credential units
 */
export class Identity extends Unit<IdentityProps> {
  // MUST be protected (enables evolution)
  protected constructor(props: IdentityProps) {
    super(props);
  }

  /**
   * Create identity from existing data or config
   */
  static create(config: IdentityConfig): Result<Identity> {
    try {
  
      if (!config.privateKeyHex || !config.publicKeyHex || !config.did || !config.alias) {
        return Result.fail("Required fields: alias, publicKeyHex, privateKeyHex, did");
      }

      // 1. Prepare cryptographic material 

      const privateKeyPEM = hexPrivateKeyToPem(config.privateKeyHex);
      const publicKeyPEM = hexToPem(config.publicKeyHex, "ed25519");

      if (!privateKeyPEM || !publicKeyPEM) {
        throw new Error("Failed to convert keys to PEM format");
      }

      // 2. Create signer

      const signer = Signer.create({
        privateKeyPEM,
        publicKeyPEM,
        keyType: "ed25519",
        metadata: {
          name: `${config.alias || "unknown"}-signer`,
        },
      });

      if (!signer) {
        return Result.fail("Failed to create signer from key material");
      }

      // 3. Create key from signer
      const key = signer.createKey();
      if (!key) {
        return Result.fail("Failed to create key from signer");
      }

      // 4. Create DID unit from public key
      const didUnit = DID.create({
        publicKeyHex: config.publicKeyHex,
        keyType: "Ed25519",
        metadata: {
          alias: config.alias || "unknown",
        },
      });

      if (!didUnit) {
        return Result.fail("Failed to reconstruct DID");
      }

      // 5. Create credential unit and learn from key. Key already knows how to sign from signer.
      const credentialUnit = Credential.create();
      credentialUnit.learn([key.teach()]);

      const props: IdentityProps = {
        dna: createUnitSchema({ id: "identity", version: "1.0.0" }),
        alias: config.alias || "unknown",
        did: config.did || "did:key:unknown",
        kid: config.kid || config.publicKeyHex,
        publicKeyHex: config.publicKeyHex,
        privateKeyHex: config.privateKeyHex,
        provider: config.provider || "did:key",
        credential:
          config.credential ||
          ({} as SynetVerifiableCredential<BaseCredentialSubject>),
        metadata: config.metadata || {},
        createdAt: config.createdAt || new Date(),
        didUnit,
        signerUnit: signer,
        keyUnit: key,
        credentialUnit,
      };

      return Result.success(new Identity(props));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
        error instanceof Error ? error : undefined,
      );
    }
  }
  /**
   * Generate a new identity with fresh cryptographic material
   */
  static async generate(alias: string): Promise<Result<Identity>> {
    try {
      // 1. Generate cryptographic material in hex format
      const keyPair = generateKeyPair("ed25519", { format: "hex" });
      if (!keyPair) {
        throw new Error("Failed to generate key pair");
      }

      // 2. Convert hex keys to PEM for signer creation
      const publicKeyPEM = hexToPem(keyPair.publicKey, "ed25519");
      const privateKeyPEM = hexPrivateKeyToPem(keyPair.privateKey);

      if (!publicKeyPEM || !privateKeyPEM) {
        throw new Error("Failed to convert keys to PEM format");
      }

      // 3. Create signer from the PEM keys
      const signer = Signer.create({
        privateKeyPEM,
        publicKeyPEM,
        keyType: "ed25519",
        secure: true,
        metadata: {
          name: `${alias}-signer`,
        },
      });

      if (!signer) {
        throw new Error("Failed to create signer from key pair");
      }

      const key = signer.createKey();
      if (!key) {
        throw new Error("Failed to create key from signer");
      }

      // 4. Get public key in hex format (should match our generated key)
      const publicKeyHex = signer.getPublicKeyHex();
      if (!publicKeyHex) {
        throw new Error("Failed to get public key hex");
      }

      // 5. Use the hex private key we generated
      const privateKeyHex = keyPair.privateKey;

      // 6. Create DID from public key (reuse the PEM we already have)
      const didUnit = DID.create({
        publicKeyHex,
        keyType: "Ed25519",
        metadata: { alias }
      });
      if (!didUnit) {
        throw new Error("Failed to create DID from public key");
      }
  
      // 7. Generate  DID from publicKey

      const didString =  didUnit.generateKey();
      if (!didString) {
        throw new Error("Failed to generate DID string");
      }

      // 8. Create credential unit and learn from key
      const credentialUnit = Credential.create();
      credentialUnit.learn([key.teach()]);

      // 9. Create self-signed verifiable credential

      const subject: IdentitySubject = {
        holder: {
          id: didString,
          name: alias,
        },
        issuedBy: {
          id: didString,
          name: alias,
        },
      };

      const credentialResult = await credentialUnit.issueCredential(
        subject,
        "IdentityCredential",
        didString,
      );

      if (!credentialResult.isSuccess) {
        return Result.fail(
          `Failed to issue identity credential: ${credentialResult.errorMessage}`,
        );
      }

      const credential = credentialResult.value;

      // 9. Build identity props
      const props: IdentityProps = {
        dna: createUnitSchema({ id: "identity", version: VERSION }),
        alias,
        did: didString,
        kid: publicKeyHex,
        publicKeyHex,
        privateKeyHex,
        provider: "did:key",
        credential:
          credential as SynetVerifiableCredential<BaseCredentialSubject>,
        metadata: {},
        createdAt: new Date(),
        didUnit,
        signerUnit: signer,
        keyUnit: key,
        credentialUnit,
      };

      const identity = new Identity(props);
      
      // 10. Teach identity how to generate keys, sign and create verifiable credentials

      identity.learn([signer.teach(), key.teach(), credentialUnit.teach()]);

      // 11. Full SSI Identity that can issue VCs and sign, while preserving its secrets. 

      return Result.success(identity);
    } catch (error) {
      console.error("Failed to generate identity:", error);
      return Result.fail(
        error instanceof Error ? error.message : "Unknown error occurred",
        error instanceof Error ? error : undefined,
      );
    }
  }

  // ==========================================
  // UNIT ARCHITECTURE REQUIRED METHODS
  // ==========================================

  whoami(): string {
    return `Identity Unit - ${this.props.alias} (${this.props.dna.id}@${this.props.dna.version})`;
  }

  capabilities(): string[] {
    return Array.from(this._capabilities.keys());
  }

  help(): void {
    console.log(`
[👤] Identity Unit - Decentralized Identity Management

Native Capabilities:
  • issueCredential() - Issue verifiable credentials  
  • sign(data) - Sign data with private key
  • verify(data, signature) - Verify signatures  
  • getDid() - Get DID string
  • getPublicKey() - Get public key
  • public() - Get public identity data, without private key
  • present() - Present identity 
  • toJSON() - export indentity for persistence
  • toDomain() - convert indentity to domain type IIdentity

Getters:
 • alias 
 • did
 • metadata
 • provider
 • publicKeyHex
 • privateKeyHex

Composed Units:
  • DID Unit: ${this.props.didUnit.whoami()}
  • Signer Unit: ${this.props.signerUnit.whoami()}
  • Key Unit: ${this.props.keyUnit?.whoami() || "Key Unit (not available)"}
  • Credential Unit: ${this.props.credentialUnit.whoami()}

Current State:
  • Alias: ${this.props.alias}
  • DID: ${this.props.did}
  • Provider: ${this.props.provider}
  • Created: ${this.props.createdAt.toISOString()}

Learned Capabilities: ${this._capabilities.size} total
${Array.from(this._capabilities.keys())
  .map((cap) => `  • ${cap}`)
  .join("\n")}
    `);
  }

  teach(): TeachingContract {
    return {
      unitId: this.props.dna.id,
      capabilities: {        
        issueCredential: ((...args: unknown[]) =>
          this.issueCredential(
            args[0] as BaseCredentialSubject,
            args[1] as string,
            args[2] as string | undefined,
          )) as (...args: unknown[]) => unknown,
        sign: ((...args: unknown[]) => this.sign(args[0] as string)) as (
          ...args: unknown[]
        ) => unknown,
        verify: ((...args: unknown[]) =>
          this.verify(args[0] as string, args[1] as string)) as (
          ...args: unknown[]
        ) => unknown,
        getDid: ((...args: unknown[]) => this.getDid()) as (
          ...args: unknown[]
        ) => unknown,
        getPublicKey: ((...args: unknown[]) => this.getPublicKey()) as (
          ...args: unknown[]
        ) => unknown,
      },
    };
  }

  // ==========================================
  // NATIVE CAPABILITIES
  // ==========================================
 
  /** 
   * @depricated, use generate() instead.
  */

  async generateIdentity(alias: string): Promise<Result<Identity>> {
    return Identity.generate(alias);
  }

  /**
   * Issue and sign Verifable Credential. 
   * @param subject 
   * @param type 
   * @param issuer 
   * @returns 
   */

  async issueCredential(
    subject: BaseCredentialSubject,
    type: string,
    issuer?: string,
  ): Promise<Result<SynetVerifiableCredential<BaseCredentialSubject>>> {
    if (this.can("credential.issueCredential")) {
      return this.execute(
        "credential.issueCredential",
        subject,
        type,
        issuer || this.props.did,
      );
    }

    // Graceful fallback to native capability
    const result = await this.props.credentialUnit.issueCredential(
      subject,
      type,
      issuer || this.props.did,
    );

    // Convert the result type
    if (!result.isSuccess) {
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error?.message || "Failed to issue credential";
      return Result.fail(errorMessage);
    }

    return Result.success(
      result.value as SynetVerifiableCredential<BaseCredentialSubject>,
    );
  }

  async sign(data: string): Promise<string> {
    if (this.can("signer.sign")) {
      return this.execute("signer.sign", data);
    }

    // Graceful fallback to native capability
    if (this.props.privateKeyHex) {
      return this.props.signerUnit.sign(data);
    }

    throw new Error(
      `[${this.props.dna.id}] Cannot sign - missing 'signer.sign' capability. Learn from: Signer.create().teach()`,
    );
  }

  async verify(data: string, signature: string): Promise<boolean> {
    if (this.can("signer.verify")) {
      return this.execute("signer.verify", data, signature);
    }

    // Graceful fallback to native capability
    return this.props.signerUnit.verify(data, signature);
  }
  

  get publicKeyHex():string {  
    return this.props.publicKeyHex;
  }

  get privateKeyHex():string | undefined {
    
    return this.props.privateKeyHex;
  }

  get alias():string {

    return this.props.alias;
  }

  get did():string {
    
    return this.props.did;
  }

  get credential():SynetVerifiableCredential<BaseCredentialSubject> {
 
    return this.props.credential;
  }

  get metadata():Record<string, unknown> {
 
    return this.props.metadata;
  }

   /**
   * Get identity provider
   */
  get provider(): string {
    return this.props.provider;
  }

  getDid(): string {
    return this.props.did;
  }

  getPublicKey(): string {
    return this.props.publicKeyHex;
  }

  /**
   * @deprecated Use getPublicKey() instead
   */
  getPublicKeyHex(): string {
    return this.props.publicKeyHex;
  }


  // ==========================================
  // UNIT ACCESS (for operations)
  // ==========================================

  
  didUnit(): DID {
    return this.props.didUnit;
  }
  /**
   * Get Key unit for public key operations
   */
  keyUnit(): ReturnType<Signer["createKey"]> {
    return this.props.keyUnit;
  }

  /**
   * Get Signer unit for signing operations
   */
  signerUnit(): Signer {
    return this.props.signerUnit;
  }

  /**
   * Get Credential unit for verifiable credential operations
   */
  credentialUnit(): Credential {
    return this.props.credentialUnit;
  }

  // ==========================================
  // LEGACY COMPATIBILITY METHODS
  // ==========================================

  /**
   * Get identity alias
   */
  getAlias(): string {
    return this.props.alias;
  }

  /**
   * Get key identifier
   */
  getKid(): string {
    return this.props.kid;
  }

  /**
   * Get private key in hex format (if available)
   */
  getPrivateKeyHex(): string | undefined {
    return this.props.privateKeyHex;
  }

  /**
   * Get identity provider
   */
  getProvider(): string {
    return this.props.provider;
  }

  /**
   * Get verifiable credential
   */
  getCredential(): SynetVerifiableCredential<BaseCredentialSubject> {
    return this.props.credential;
  }

  /**
   * Get metadata
   */
  getMetadata(): Record<string, unknown> {
    return this.props.metadata;
  }

  /**
   * Get creation date
   */
  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  toJSON() {
    return {
      alias: this.props.alias,
      did: this.props.did,
      kid: this.props.kid,
      publicKeyHex: this.props.publicKeyHex,
      privateKeyHex: this.props.privateKeyHex,
      provider: this.props.provider,
      credential: this.props.credential,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt,
    };
  }

  /**
   * Convert Identity props to domain entity IIdentity
   * @returns 
   * 
   */

  toDomain(): IIdentity {
    return {
      alias: this.props.alias,
      did: this.props.did,
      kid: this.props.kid,
      publicKeyHex: this.props.publicKeyHex,
      privateKeyHex: this.props.privateKeyHex,
      provider: this.props.provider,
      credential: this.props.credential,
      metadata: this.props.metadata,
      createdAt: this.props.createdAt,
    };
  }

  /**
   * Export public identity data (no private key)
   */
  public(): Omit<IIdentity, "privateKeyHex"> {
    const { privateKeyHex, ...publicData } = this.props;
    return publicData;
  }

  /**
   * Presents identity 
   * @returns IdentityPresent { did, publicKeyHex, credential }
   */

  present(): IdentityPresent {
    return {
      did: this.props.did,
      publicKeyHex: this.props.publicKeyHex,
      credential: this.props.credential,
    };
  }
}
