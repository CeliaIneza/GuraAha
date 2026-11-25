import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { randomUUID } from "crypto";

export interface AuthUserView {
    id: string;
    phone: string;
    email: string | null;
    username?: string | null;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    mustChangePassword?: boolean;
    blockerCode?: string | null;
    blockerStatus?: string | null;
    nationalId?: string | null;
    areaText?: string | null;
}

interface DbUserRow {
    id: string;
    phone: string;
    email: string | null;
    username?: string | null;
    first_name: string;
    last_name: string;
    status: string;
    must_change_password?: boolean;
    blocker_code?: string | null;
    blocker_status?: string | null;
    national_id?: string | null;
    area_text?: string | null;
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
      username: user.username ?? null,
      firstName: user.first_name,
      lastName: user.last_name,
      role,
      status: user.status,
      mustChangePassword: Boolean(user.must_change_password),
      blockerCode: user.blocker_code ?? null,
      blockerStatus: user.blocker_status ?? null,
      nationalId: user.national_id ?? null,
      areaText: user.area_text ?? null,
    };
}