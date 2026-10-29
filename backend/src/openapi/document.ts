import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";



import './paths/auth.paths';
import './paths/admin.paths';
import './paths/blocker.paths';
import './paths/location.paths';
import './paths/listing.paths';
import './paths/contact-unlock.paths';
import './paths/payment.paths';
import './paths/subscription.paths';
import './paths/lotto.paths';


export function generateOpenApiDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);
 
    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'Guraaha API',
            version: '1.0.0',
            description:
                'Generated from the same Zod schemas used for request validation — not hand-written. Regenerates automatically as those schemas change.',
        },
        servers: [{ url: `http://localhost:${process.env.PORT || '3000'}/api/v1` }],

    });
}