import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../repositories/user.repository";

const userRepository = new UserRepository();

export function requireRole(...allowedRoles: string[]) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        if(!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
            });
        }

        if(!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You are not authorized to perform this action',
            });
        }

        next();
    }
}

export function requireFreshRole(...allowedRoles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const user = await userRepository.findById(req.user.id);

        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ message: 'Account is no longer active' });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        req.user.role = user.role;
        return next();
    }
}