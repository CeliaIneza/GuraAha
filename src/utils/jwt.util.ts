import jwt from "jsonwebtoken";
import { env } from "../config/env";

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

export function signAuthToken(userId: string, role: string): string {
    return jwt.sign(
        { sub: userId, role },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN ?? '15min' }
    );
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