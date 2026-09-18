import { BrowserPlatform } from "./browser/BrowserPlatform.js";
import { TelegramPlatform } from "./telegram/TelegramPlatform.js";

export function createPlatform(scope = window) {
  const webApp = scope.Telegram?.WebApp;
  return webApp?.initData ? new TelegramPlatform(webApp) : new BrowserPlatform();
}
