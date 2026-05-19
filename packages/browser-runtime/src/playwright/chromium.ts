import { chromium, type Browser } from "playwright";

let sharedBrowser: Browser | null = null;
let launching: Promise<Browser> | null = null;

export async function getSharedChromiumBrowser(): Promise<Browser> {
  if (sharedBrowser) return sharedBrowser;
  if (!launching) {
    launching = chromium.launch({
      headless: true,
      channel: undefined,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    }).then((b) => {
      sharedBrowser = b;
      launching = null;
      return b;
    });
  }
  return launching;
}

export async function shutdownBrowserInfrastructure(): Promise<void> {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => undefined);
    sharedBrowser = null;
  }
}
