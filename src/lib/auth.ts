import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SALT_ROUNDS = 10;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev_secret_key_change_in_prod'
);

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const generateToken = async (payload: any, expiresIn: string = '1d'): Promise<string> => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
};

export const verifyToken = async (token: string): Promise<any> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
};