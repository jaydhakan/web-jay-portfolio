/**
 * Visual verification helper (dev-only, not shipped).
 * Usage: node scripts/screenshot.mjs <url> <outPrefix> [fullPage] [theme]
 * Writes <outPrefix>-desktop.png (1440x900) and <outPrefix>-mobile.png (375x812).
 */
import puppeteer from "puppeteer-core";

const [, , url = "http://localhost:3000", prefix = "/tmp/shot", fullPage = "0", theme = ""] =
  process.argv;

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--force-color-profile=srgb",
  ],
});

async function shoot(width, height, suffix) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
  if (theme === "light") {
    await page.evaluate(() => {
      localStorage.setItem("theme", "light");
    });
    await page.reload({ waitUntil: "networkidle0" });
  }
  // Let entrance choreography and the shader settle.
  await new Promise((r) => setTimeout(r, 2600));
  if (fullPage === "1") {
    // Walk the page so in-view reveals fire before a full-page capture.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 220));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 800));
  }
  await page.screenshot({ path: `${prefix}-${suffix}.png`, fullPage: fullPage === "1" });
  await page.close();
}

await shoot(1440, 900, "desktop");
await shoot(375, 812, "mobile");
await browser.close();
console.log(`written: ${prefix}-desktop.png, ${prefix}-mobile.png`);
