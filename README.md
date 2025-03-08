# Telegram NFT Price Tracker Bot

This project is a **Telegram bot** built with **Node.js**, **Express.js**, and **TypeScript**.  
The bot monitors the price of **NFTs** from the **TONCO** marketplace and notifies users if the price goes beyond a specified range.

## Functionality

- Accepts an **NFT address** from the **TONCO** marketplace.
- Retrieves **telegram_id** from `initData`.
- Accepts **price_range** (price range).
- Stores the **isInTheRange** state.
- Monitors **price changes**.
- Notifies **users** when the price exceeds the set boundaries.

## Technologies

- **Node.js** — server environment.
- **Express.js** — web framework for API.
- **TypeScript** — static type checking.
- **Telegraf** — library for interacting with the Telegram Bot API.
- **AWS S3** — data storage.
