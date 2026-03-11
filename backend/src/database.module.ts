import { Module, Global } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Global()
@Module({
    providers: [
        {
            provide: 'DATABASE_CONNECTION',
            useFactory: () => {
                const connection = mysql.createPool({
                    host: process.env.DB_HOST,
                    port: parseInt(process.env.DB_PORT as string),
                    user: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_DATABASE,
                    ssl: {
                        minVersion: 'TLSv1.2',
                        rejectUnauthorized: true,
                    },
                    waitForConnections: true,
                    connectionLimit: 10,
                    queueLimit: 0,
                });
                return connection
            }
        }
    ],
    exports: ['DATABASE_CONNECTION'],
})
export class DatabaseModule {}