export class BrowserPlatform {
  name = "Браузер";

  initialize() {}

  onPause(handler) {
    const listener = () => document.visibilityState === "hidden" && handler();
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  }
}
