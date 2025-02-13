import dotenv from 'dotenv';

const ENV = process.env.NODE_ENV;

// Загружаем переменные из соответствующего .env файла
dotenv.config({ path: `.env.${ENV}` });

console.log('Loaded environment:', ENV);

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
export const AWS_REGION = process.env.AWS_REGION || '';
