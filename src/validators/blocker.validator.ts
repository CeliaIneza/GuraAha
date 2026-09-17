import { z } from "zod";

export const applyForBlockerSchema = z.object({
    nationalId: z.string().trim().min(1, 'National ID is required').max(50, 'National ID is too long'),
    operatingLocationId: 
})