import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    env: process.env.APP_ENV,
    name: process.env.APP_NAME,
    url: process.env.APP_URL,
    port: process.env.APP_PORT,
    mysql: {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        username: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expirationTime: process.env.JWT_EXPIRATION_TIME,
    },
    redis: {
        db: process.env.REDIS_DB,
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
    }
}))
