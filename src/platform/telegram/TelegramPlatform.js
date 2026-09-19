import { BrowserPlatform } from "../browser/BrowserPlatform.js";

export class TelegramPlatform extends BrowserPlatform {
  name = "Telegram Mini App";

  constructor(webApp) {
    super();
    this.webApp = webApp;
  }

  initialize() {
    this.webApp.ready();
    this.webApp.expand();
    this.webApp.disableVerticalSwipes?.();
  }

  onPause(handler) {
    const removeBrowserListener = super.onPause(handler);
    this.webApp.onEvent("viewportChanged", handler);
    return () => {
      removeBrowserListener();
      this.webApp.offEvent("viewportChanged", handler);
    };
  }
}
