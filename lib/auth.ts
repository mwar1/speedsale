import { JwtPayload } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'supersecret';

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as JwtPayload & { id: string };
  } catch {
    return null;
  }
}
