import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { randomUUID } from "crypto";

export interface AuthUserView {
    id: string;
    phone: string;
    email: string | null;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
}

interface DbUserRow {
    id: string;
    phone: string;
    email: string | null;
    first_name: string;
    last_name: string;
    status: string;
}

export interface AccessTokenPayload {
    sub: string;
    role: string;
    jti: string;
    iat?: number;
    exp?: number;
}


export function signAuthToken(userId: string, role: string, jti?: string): string {
    const tokenJti = jti ?? randomUUID();
    return jwt.sign(
        { sub: userId, role, jti: tokenJti },
        env.JWT_SECRET,
        { expiresIn: (env.JWT_EXPIRES_IN ?? '15m') as any }
    );
}

export function verifyAuthToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function decodeAuthToken(token: string): AccessTokenPayload | null {
    try {
        return jwt.decode(token) as AccessTokenPayload | null;
    } catch {
        return null;
    }
}

export function toAuthUserView(user: DbUserRow, role: string): AuthUserView {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role,
      status: user.status  
    };
}