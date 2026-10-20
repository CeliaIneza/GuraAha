import z from "zod";
import { registry } from "../registry";
import { createAdminSchema } from "../../validators/auth.validator";
import { dataResponseSchema, errorResponseSchema } from "../common.schemas";

registry.registerPath({
  method: "post",
  path: "/admin/setup",
  tags: ["Admin"],
  description:
    "Gated by the ADMIN_SETUP_SECRET header, not a role check — there is no admin yet to gate the first one, and this stays secret-gated permanently by design",
  request: {
    headers: z.object({
      "x-admin-setup-secret": z
        .string()
        .describe("Shared secret required to mint an admin account"),
    }),
    body: { content: { "application/json": { schema: createAdminSchema } } },
  },
  responses: {
    201: {
      description: "Admin account created",
      content: { "application/json": { schema: dataResponseSchema() } },
    },
    403: {
      description:
        "Missing/invalid secret, duplicate phone/email, or ADMIN role not configured",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
