import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { join } from 'path'

config()

export default new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT),
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    entities: [join(__dirname, '..', '..', '**', '*.entity.js')],
    migrations: [join(__dirname, '..', '..', 'migrations', '*.js')],
    synchronize: false,
    logging: true,
})
