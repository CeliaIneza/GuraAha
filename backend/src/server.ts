import app from './app';
import {env} from './config/env';
import {db} from './config/database';


async function bootstrap() {
    try {
        await db.query('SELECT 1');

        console.log('Database connection established successfully.');

        app.listen(env.PORT, () => {
            console.log(`Server is running on port ${env.PORT}`);
        });
    } catch (error) {
        console.error('Error occurred while starting the server:', error);
        process.exit(1);
    }
}

bootstrap();