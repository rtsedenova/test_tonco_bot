import { Context } from "telegraf";

export const getUserTelegramId = (ctx: Context): string => {
  if (ctx.from && ctx.from.id) {
    return ctx.from.id.toString(); 
  }
  throw new Error("Unable to retrieve Telegram ID.");
};