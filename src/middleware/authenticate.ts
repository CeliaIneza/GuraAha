import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface JwtPayload {
    sub: string;
    role: string;
}

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authorization = req.headers.authorization;

    if(!authorization) {
        return res.status(401).json({
            message: 'Authentication required',
        });
    }

    const [scheme, token] = authorization.split(' ');

    if(scheme !== 'Bearer' || !token) {
        return res.status(401).json({
            message: 'Invalid authorization header',
        });
    }

    try {
        const payload = jwt.verify(
            token,
            env.JWT_SECRET
        ) as JwtPayload;

        if (!payload.sub || !payload.role) {
            return res.status(401).json({
                message: 'Invalid authentication token',
            });
        }

        req.user = {
            id: payload.sub,
            role: payload.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token',
        });
    }
}