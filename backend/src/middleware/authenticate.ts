import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface AccessTokenPayload {
    sub: string;
    role: string;
}



export function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or malformed Authorization header' });
    }

    const token = header.slice('Bearer '.length);

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
        req.user = { id: payload.sub, role: payload.role };
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}