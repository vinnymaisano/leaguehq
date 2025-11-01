import crypto from 'crypto'

export function generate_token() {
    return crypto.randomBytes(32).toString('hex')
}