import { Injectable } from '@nestjs/common'
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const HASH_ALGORITHM = 'scrypt'
const HASH_VERSION = 'v1'
const SALT_SIZE = 16
const DERIVED_KEY_SIZE = 64
const scryptAsync = promisify(scryptCallback)

@Injectable()
export class PasswordHashService {
  /**
   * 生成可持久化的密码哈希串，格式：
   * scrypt$v1$<salt-base64url>$<hash-base64url>
   */
  async hashPassword(password: string) {
    if (!password) {
      throw new Error('Password cannot be empty')
    }

    const salt = randomBytes(SALT_SIZE)
    const derivedKey = (await scryptAsync(password, salt, DERIVED_KEY_SIZE)) as Buffer

    return [
      HASH_ALGORITHM,
      HASH_VERSION,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$')
  }

  /**
   * 校验明文密码与已保存哈希是否匹配。
   */
  async verifyPassword(password: string, persistedHash: string) {
    if (!password || !persistedHash) {
      return false
    }

    const [algorithm, version, saltBase64Url, hashBase64Url] = persistedHash.split('$')

    if (
      algorithm !== HASH_ALGORITHM ||
      version !== HASH_VERSION ||
      !saltBase64Url ||
      !hashBase64Url
    ) {
      return false
    }

    try {
      const salt = Buffer.from(saltBase64Url, 'base64url')
      const expectedHash = Buffer.from(hashBase64Url, 'base64url')
      const actualHash = (await scryptAsync(password, salt, expectedHash.length)) as Buffer

      if (actualHash.length !== expectedHash.length) {
        return false
      }

      return timingSafeEqual(actualHash, expectedHash)
    } catch {
      return false
    }
  }
}
