import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../utils/jwt.util";
import { RevokedTokenRepository } from "../repositories/revoked-token.repository";

const revokedTokenRepository = new RevokedTokenRepository();

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or malformed Authorization header' });
    }

    const token = header.slice('Bearer '.length).trim();

    try {
        const payload = verifyAuthToken(token);

        if (payload.jti) {
            const isRevoked = await revokedTokenRepository.isRevoked(payload.jti);
            if (isRevoked) {
                return res.status(401).json({ message: 'Token has been revoked' });
            }
        }

        req.user = {
            id: payload.sub,
            role: payload.role,
            jti: payload.jti,
            exp: payload.exp,
        };
        return next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next();
    }

    const token = header.slice('Bearer '.length).trim();
    try {
        const payload = verifyAuthToken(token);
        if (payload.jti) {
            const isRevoked = await revokedTokenRepository.isRevoked(payload.jti);
            if (isRevoked) {
                return next();
            }
        }
        req.user = {
            id: payload.sub,
            role: payload.role,
            jti: payload.jti,
            exp: payload.exp,
        };
    } catch {
        // Ignore invalid token on optional auth routes
    }
    return next();
}