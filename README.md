# @synet/identity

```bash
 .d8888b.                             888                          
d88P  Y88b                            888                          
Y88b.                                 888                          
 "Y888b.   888  888 88888b.   .d88b.  888888                       
    "Y88b. 888  888 888 "88b d8P  Y8b 888                          
      "888 888  888 888  888 88888888 888                          
Y88b  d88P Y88b 888 888  888 Y8b.     Y88b.                        
 "Y8888P"   "Y88888 888  888  "Y8888   "Y888                       
                888                                                
           Y8b d88P                                                
            "Y88P"                                                 
      8888888     888                   888    d8b 888             
        888       888                   888    Y8P 888             
        888       888                   888        888             
        888   .d88888  .d88b.  88888b.  888888 888 888888 888  888 
        888  d88" 888 d8P  Y8b 888 "88b 888    888 888    888  888 
        888  888  888 88888888 888  888 888    888 888    888  888 
        888  Y88b 888 Y8b.     888  888 Y88b.  888 Y88b.  Y88b 888 
      8888888 "Y88888  "Y8888  888  888  "Y888 888  "Y888  "Y88888 
                                                               888 
                                                          Y8b d88P 
                                                           "Y88P"                              
version: 1.0.1   
```

**Self-Sovreign Identity**

A complete implementation for creating and managing decentralized identities through composition of DID, Signer, Key, and Credential units.

## Features 

- **Unit Architecture** - Props-based construction with teaching/learning pattern
- **Complete Identity Management** - DID generation, signing, and verifiable credentials
- **Unit Composition** - Composes DID, Signer, Key, and Credential units
- **Result Pattern** - Type-safe error handling for all operations
- **Security First** - Secure cryptographic operations with ed25519

## Installation

```bash
npm install @synet/identity
```

## Quick Start 🚀

### Generate New Identity

```typescript
import { Identity } from '@synet/identity';

// Generate a new identity with fresh cryptographic material
const result = await Identity.generate('alice');

if (result.isSuccess) {
  const identity = result.value;
  
  console.log('Identity created:', {
    alias: identity.alias,
    did: identity.did,
    publicKey: identity.publicKeyHex
  });
}
```

### Create from Configuration

```typescript
const identity = Identity.create({
  alias: 'bob',
  publicKeyHex: '...',
  privateKeyHex: '...',
  did: 'did:key:...',
  provider: 'did:key'
});

if (identity.isSuccess) {
  console.log('Identity loaded:', identity.value.props.alias);
}
```

## Unit Architecture API 🏗️

### Core Methods

```typescript
// Required Unit methods
identity.whoami()          // Get unit identity
identity.capabilities()    // List all capabilities
identity.help()            // Show help information

```

### Native Capabilities

```typescript
// Identity operations
await identity.generate('alias')
identity.public(); // public identity data
identity.present(); // type of IdentityPresent { did, alias, publicKey, credential}
identity.toJSON();  // JSON object for storage
identity.toDomain(); // IIdentity domain type.

```

## Composed Units Access 

```typescript
// Access composed units for direct operations
const did = identity.didUnit()
const signer = identity.signerUnit()
const key = identity.keyUnit()
const credential = identity.credentialUnit()

// Use composed unit capabilities
const signature = await signer.sign('hello world')
const publicKey = key.getPublicKeyHex()
const vc = await credential.issueCredential<CredentialSubject>()

// Docs and usage
key.help();
signer.help();
vc.help();
```

## Props-Based Data Access 📊

```typescript
// All data accessible through props (single source of truth)
const {
  alias,
  did,
  publicKeyHex,
  privateKeyHex,
  provider,
  credential,
  metadata,
  createdAt
} = identity.props

// Getters to access public properties
identity.alias
identity.did
identity.publicKeyHex
identity.credential
identity.metadata

```

## Types

```typescript

// identity.create() input signature
export interface IdentityConfig {
  alias?: string;
  did?: string;
  kid?: string;
  publicKeyHex?: string;
  privateKeyHex?: string;
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

// Domain interface identity.toDomain()
export interface IIdentity {
  alias: string
  did: string
  kid: string
  publicKeyHex: string
  privateKeyHex?: string 
  provider: string // did:key | did:web
  credential: SynetVerifiableCredential<BaseCredentialSubject>
  metadata?: Record<string, unknown>
  createdAt: Date 
}

// Presentation interface identity.present(); 
export interface IdentityPresent {
  did: string
  publicKeyHex: string
  credential: SynetVerifiableCredential<BaseCredentialSubject>  
}

```

## Error handling 

All async operations return `Result<T>` for type-safe error handling:

```typescript
const result = await Identity.generate('alice')

if (result.isSuccess) {
  const identity = result.value
  // Use identity safely
} else {
  console.error('Failed:', result.error)
  console.log('Cause:', result.cause)
}
```

## Persistance



```typescript
import { IIdentity } from "@synet/identity"
import { FS } from "@synet/fs"
import { Vault } from "@synet/vault"

// Node filesystem, S3 or Github
const fs = FS.async.node();
const fs = FS.async.S3(options);

// Create anywhere
const vault = Vault.create<IIdentity>({
        path: path.join(config.vaultPath, "identity"),
        fs: fs,
        name: "Identity Vault",
});

// Run on startup 
await vault.init();

// Generate new identity
const identity = Identity.generate('neo');

// Save to vault with id = did
await vault.save(
  identity.did,
  identity.toDomain()
);

// reconstitute
const storedIdentity = vault.get(identity.did);
const result = Identity.create(identityData);

if (result.isSuccess) {
  // Use identity safely, domain object
  const identity = result.value

} else {
  console.error('Failed:', result.errorMessage)
  console.log('Cause:', result.errorCause)
}

```

## Dependencies 📦

- `@synet/unit` - Unit Architecture foundation
- `@synet/keys` - Cryptographic key operations
- `@synet/did` - DID generation and management
- `@synet/credential` - Verifiable credential operations

## License

MIT License - see LICENSE file for details.

---

**Part of SYNET Unit Architecture Ecosystem** 🌐

Built with Unit Architecture Doctrine v1.0.5 - Consciousness-based software architecture where units are self-aware, can teach capabilities to other units, learn from others, and evolve while maintaining identity.
