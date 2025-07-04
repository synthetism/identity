
export type RequireOnly<T, K extends keyof T> = Required<Pick<T, K>> & Partial<T>

export type TKeyType = 'Ed25519' | 'Secp256k1' | 'Secp256r1' | 'X25519' | 'Bls12381G1' | 'Bls12381G2' 

export interface IIdentifier {
  /**
   * Decentralized identifier
   */
  did: string

  /**
   * Optional. Identifier alias. Can be used to reference an object in an external system
   */
  alias?: string

  /**
   * Identifier provider name
   */
  provider: string

  /**
   * Controller key id
   */
  controllerKeyId?: string

  /**
   * Array of managed keys
   */
  keys: IKey[]

  /**
   * Array of services
   */
  services: IService[]
}

export interface IKey {

  kid: string
  kms: string
  type: TKeyType
  publicKeyHex: string
  privateKeyHex?: string
  meta?: KeyMetadata | null
}

export interface IWGKey {
    
  kid: string

  /**
   * Key Management System
   */
  kms: string

  /**
   * Key type
   */
  type: 'Curve25519'

  /**
   * Public key
   */
  publicKeyHex: string

  /**
   * Optional. Private key
   */
  privateKeyHex?: string

  /**
   * Optional. Key metadata. This should be used to determine which algorithms are supported.
   */
  meta?: KeyMetadata | null
}

export interface IService {
  /**
   * ID
   */
  id: string

  /**
   * Service type
   */
  type: string

  /**
   * Endpoint URL
   */
  serviceEndpoint: IServiceEndpoint | IServiceEndpoint[]

  /**
   * Optional. Description
   */
  description?: string
}

export interface KeyMetadata {
  algorithms?: TAlg[]

  [x: string]: unknown
}

export type TAlg = 'ES256K' | 'ES256K-R' | 'ES256' | 'EdDSA' | 'ECDH' | 'ECDH-ES' | 'ECDH-1PU' | string

export type IServiceEndpoint = string | Record<string, unknown>

export interface ManagedPrivateKey {
  alias: string
  privateKeyHex: string
  type: TKeyType
}
export type ImportablePrivateKey = RequireOnly<ManagedPrivateKey, 'privateKeyHex' | 'type'>

export type ManagedKeyInfo = Omit<IKey, 'privateKeyHex'>

export type MinimalImportableKey = RequireOnly<IKey, 'privateKeyHex' | 'type' | 'kms'>