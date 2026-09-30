
import fs from 'node:fs';
import path from 'node:path';
import { generateOpenApiDocument } from '../openapi/document';

const outputPath = path.resolve(__dirname, '../../openapi.json');

fs.writeFileSync(outputPath, JSON.stringify(generateOpenApiDocument(), null, 2));
console.log(`OpenAPI spec written to ${outputPath}`);