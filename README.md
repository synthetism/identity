# @synet/identity v1.0.2

**Identity Unit for Decentralized Identity Management**

A complete Unit Architecture implementation for creating and managing decentralized identities through composition of DID, Signer, Key, and Credential units.

## Features ⭐

- 🎯 **Unit Architecture** - Props-based construction with teaching/learning contracts
- 🔐 **Complete Identity Management** - DID generation, signing, and verifiable credentials
- 🧩 **Unit Composition** - Composes DID, Signer, Key, and Credential units
- 📋 **Result Pattern** - Type-safe error handling for all operations
- 🔄 **Capability Learning** - Learn capabilities from other units
- 🛡️ **Security First** - Secure cryptographic operations with ed25519

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
    alias: identity.props.alias,
    did: identity.props.did,
    publicKey: identity.props.publicKeyHex
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
identity.whoami()           // Get unit identity
identity.capabilities()     // List all capabilities
identity.help()            // Show help information
identity.teach()           // Get teaching contract

// Learning capabilities
identity.learn([contract]) // Learn from other units
identity.can('capability') // Check capability availability
identity.execute('cmd')    // Execute learned capabilities
```

### Native Capabilities

```typescript
// Identity operations
await identity.generateIdentity('alias')
await identity.issueCredential(subject, 'CredentialType', issuer)
await identity.sign('data to sign')
await identity.verify('data', 'signature')
identity.getDid()          // Get DID string
identity.getPublicKey()    // Get public key hex
```

## Composed Units Access 🧩

```typescript
// Access composed units for direct operations
const didUnit = identity.did()
const signerUnit = identity.signer()
const keyUnit = identity.key()
const credentialUnit = identity.credential()

// Use composed unit capabilities
const signature = await signerUnit.sign('hello world')
const publicKey = keyUnit.getPublicKeyHex()
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

// Legacy compatibility methods still available
identity.getAlias()
identity.getDid()
identity.getPublicKeyHex()
```

## Teaching & Learning 🎓

### Teaching Capabilities

```typescript
const teachingContract = identity.teach()
console.log('Available capabilities:', Object.keys(teachingContract.capabilities))

// Share with another unit
otherUnit.learn([identity.teach()])
```

### Learning from Others

```typescript
// Learn from a signer unit
const signer = Signer.create({ /* config */ })
identity.learn([signer.teach()])

// Now can execute signer capabilities
if (identity.can('signer.sign')) {
  const signature = await identity.execute('signer.sign', 'data')
}
```

## Result Pattern 🎯

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

## Real-World Example 📱

```typescript
import { Identity, type IdentityConfig } from '@synet/identity'
import { Credential } from '@synet/credential'

async function createUserIdentity(userData: {
  name: string
  email: string
}) {
  // 1. Generate new identity
  const identityResult = await Identity.generate(userData.name)
  if (!identityResult.isSuccess) {
    throw new Error(identityResult.error)
  }
  
  const identity = identityResult.value
  
  // 2. Create additional credential unit for custom credentials
  const customCredential = Credential.create()
  identity.learn([customCredential.teach()])
  
  // 3. Issue user credential
  const credentialResult = await identity.issueCredential(
    {
      holder: {
        id: identity.props.did,
        name: userData.name,
        email: userData.email
      }
    },
    'UserCredential',
    identity.props.did
  )
  
  if (!credentialResult.isSuccess) {
    throw new Error(credentialResult.error)
  }
  
  // 4. Export identity data
  return {
    identity: identity.toDomain(),
    credential: credentialResult.value,
    publicProfile: identity.public() // No private key
  }
}

// Usage
const user = await createUserIdentity({
  name: 'Alice Smith',
  email: 'alice@example.com'
})

console.log('User identity created:', user.identity.alias)
console.log('DID:', user.identity.did)
```

## Error Handling Strategy 🛡️

### Simple Operations (Exception-based)
```typescript
try {
  const identity = Identity.create(config)
  if (!identity.isSuccess) {
    throw new Error(identity.error)
  }
  // Use identity
} catch (error) {
  console.error('Identity creation failed:', error.message)
}
```

### Complex Operations (Result Pattern)
```typescript
const result = await Identity.generate('alice')

if (result.isSuccess) {
  const identity = result.value
  // Success path
} else {
  // Detailed error handling
  console.error('Generation failed:', {
    error: result.error,
    cause: result.cause,
    suggestions: 'Check cryptographic dependencies'
  })
}
```

## Migration from v1.0.x 🔄

### Old API (Identity Operator)
```typescript
// Old: Operator pattern
const identity = await Identity.generate('alice')
const alias = identity.getAlias()
const signer = identity.signer()
```

### New API (Unit Architecture)
```typescript
// New: Unit Architecture with props
const result = await Identity.generate('alice')
const identity = result.value
const alias = identity.props.alias        // Props-based access
const signer = identity.signer()         // Still available
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
