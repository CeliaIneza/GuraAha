import runMigrations from "./config/migrations";
import { db } from "./config/database";

async function main() {
    try {
        await runMigrations();

        console.log("Migrations completed successfully.");
    } catch (error) {
        console.error("Error running migrations:", error);
    } finally {
        await db.end();
    }
}

main();