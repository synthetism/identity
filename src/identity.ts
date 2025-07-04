import { Result, ValueObject } from '@synet/patterns';
import type { W3CVerifiableCredential,  BaseCredentialSubject} from '@synet/credential';


export interface UnitSchema {
  name: string;
  version: string;
  description: string;
  capabilities?: string[];
  children?: UnitSchema[]; // Child versions within family
}


export interface IIdentity {
  alias: string
  did: string
  kid: string
  publicKeyHex: string
  privateKeyHex?: string // Optional private key, can be used for signing
  provider: string // did:key | did:web
  credential: W3CVerifiableCredential<BaseCredentialSubject>
  metadata?: Record<string, unknown>
  createdAt: Date // Optional creation date for the vault  
  version?: string
}


interface IIdentityProps {
  alias: string;
  did: string;
  kid: string;
  publicKeyHex: string;
  privateKeyHex?: string;
  provider: string;
  credential: W3CVerifiableCredential<BaseCredentialSubject>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  version?: string;
}
  
export class Identity extends ValueObject<IIdentityProps> {
  private unitDNA: UnitSchema;
  private constructor(props: IIdentity) {

    super(props);

     this.unitDNA = {
      name: 'Identity Unit',
      description: 'I can create and manage decentralized identities. call .help() to see my capabilities.',
      version: props.version || '1.0.0',
      capabilities: ['create'],
      children: [],
    };

  }

  /**
   * Create a new VaultId with validation
   */
  public static create(props: {
    alias:string,
    did: string,
    kid: string,
    publicKeyHex: string,
    privateKeyHex?: string, // Optional private key, can be used for signing
    credential: W3CVerifiableCredential<BaseCredentialSubject>,
    provider: string, // did:key | did:web
    metadata?: Record<string, unknown>,
    createdAt?: Date, 
    version?: string 
  }

  ): Result<Identity> {

    if (!props.alias) {
      return Result.fail('Vault Alias  empty');
    }

    // Allow alphanumeric characters, numbers, dashes, and underscores
    // Removed the restrictive pattern that prevented "new" from being used
    if (!/^[a-zA-Z0-9_-]+$/.test(props.alias)) {
      return Result.fail('Only alphanumeric characters, numbers, dashes, and underscores are allowed in vault ID');
    }

    // Check for minimum and maximum length
    if (props.alias.length < 2 || props.alias.length > 32) {
      return Result.fail('Vault Alias must be between 2 and 32 characters');
    }

    const createdAt = props.createdAt ? new Date(props.createdAt) : new Date();

    return Result.success(new Identity({
      did: props.did,
      alias: props.alias,
      kid: props.kid,
      publicKeyHex: props.publicKeyHex,
      privateKeyHex: props.privateKeyHex, // Assuming publicKeyHex is used as privateKeyHex
      provider: props.provider,
      credential: props.credential,
      metadata: props.metadata || {},
      createdAt: createdAt,
      version: props.version || '1.0.0',
    }));
  }

  get whoami(): string {
    return this.unitDNA.name;
  }

  get dna(): UnitSchema {
    return this.unitDNA;
  }

  get alias(): string {
    return this.props.alias;
  }

  get did(): string {
    return this.props.did;
  }
  get kid(): string {
    return this.props.kid;
  }
  get publicKeyHex(): string {
    return this.props.publicKeyHex;
  }
  get privateKeyHex(): string | undefined {
    return this.props.privateKeyHex;
  }
  get provider(): string {
    return this.props.provider;
  }
  get credential(): W3CVerifiableCredential<BaseCredentialSubject> {
    return this.props.credential;
  }
  get metadata(): Record<string, unknown> {
    return this.props.metadata || {};
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get version(): string {
    return this.props.version || '1.0.0';
  }

  toString(): string {
    return JSON.stringify(this.props);
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
      metadata: this.props.metadata || {},
      createdAt: this.props.createdAt,
      version: this.props.version,
    };
  }

  toDomain(): IIdentity {
    return {
      alias: this.alias,
      did: this.did,
      kid: this.kid,
      publicKeyHex: this.publicKeyHex,
      privateKeyHex: this.privateKeyHex,
      provider: this.provider,
      credential: this.credential,
      metadata: this.metadata || {},
      createdAt: this.createdAt || new Date(),
      version: this.version || '1.0.0',
    };
  }
}