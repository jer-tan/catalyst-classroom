import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
    schema: "./db/schema.ts",
    out: "./drizzle",
    driver: "mysql2", // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
    dbCredentials: {
        host: process.env.MYSQL_HOST ?? 'default-host',
        port: Number(process.env.MYSQL_PORT),
        database: process.env.MYSQL_DATABASE ?? 'default-database',
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
    },
} satisfies Config;
