import app from './app';
import {env} from './config/env';
import {db} from './config/database';
import {seedLocations} from './scripts/seed-locations';
import {seedDev} from './scripts/seed-dev';


async function bootstrap() {
    try {
        await db.query('SELECT 1');

        console.log('Database connection established successfully.');

        // Auto-seed in development only. Set SEED_DEV=false in .env to opt out.
        if (env.NODE_ENV === 'development' && process.env.SEED_DEV !== 'false') {
            try {
                await seedLocations();
                await seedDev();
            } catch (seedError) {
                console.warn('Dev seed skipped:', seedError);
            }
        }

        app.listen(env.PORT, () => {
            console.log(`Server is running on port ${env.PORT}`);
        });
    } catch (error) {
        console.error('Error occurred while starting the server:', error);
        process.exit(1);
    }
}

bootstrap();
