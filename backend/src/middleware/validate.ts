import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

export function validate(schema: ZodType) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const result = schema.safeParse(req.body);

        if(!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const firstMsg = Object.entries(fieldErrors)
                .map(([field, msgs]) => Array.isArray(msgs) && msgs.length ? `${field}: ${msgs[0]}` : null)
                .filter(Boolean)[0];
            return res.status(400).json({
                message: firstMsg ? `Validation failed (${firstMsg})` : 'Validation failed',
                errors: fieldErrors,
            });
        }

        req.body = result.data;

        next();
    };
}