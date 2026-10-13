import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET не задан в .env");
const SECRET: string = process.env.JWT_SECRET;

export interface AuthTokenPayload {
  userId: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as unknown as AuthTokenPayload;
  } catch {
    return null;
  }
}
