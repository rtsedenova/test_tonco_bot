import dotenv from 'dotenv';

const ENV = process.env.NODE_ENV || 'development';

// Загружаем переменные из соответствующего .env файла
dotenv.config({ path: `.env.${ENV}` });

console.log('Loaded environment:', ENV);

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
