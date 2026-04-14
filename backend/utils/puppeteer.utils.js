import puppeteer from 'puppeteer';

/**
 * Launches a Puppeteer browser instance with environment-aware configuration.
 * - On Linux (production VPS): uses system Chromium with required sandbox flags.
 * - On local (Windows/Mac): uses bundled Chromium with minimal flags.
 * @returns {Promise<Browser>} Puppeteer browser instance.
 */
export const launchBrowser = async () => {
    const isLinux = process.platform === 'linux';

    // Base args safe for all platforms
    const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
    ];

    // Linux-only flags (--single-process and --no-zygote crash Chromium on Windows/Mac)
    if (isLinux) {
        args.push('--no-zygote');
        args.push('--single-process');
    }

    const launchOptions = {
        headless: 'new',
        args,
    };

    // On Linux VPS, try to use the system-installed Chromium
    if (isLinux) {
        const fs = await import('fs');
        const systemChromePaths = [
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
        ];

        const executablePath = systemChromePaths.find(p => {
            try { return fs.existsSync(p); } catch { return false; }
        });

        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }
    }

    return puppeteer.launch(launchOptions);
};

/**
 * Safely closes a Puppeteer browser instance.
 * @param {Browser} browser 
 */
export const closeBrowser = async (browser) => {
    if (browser) {
        try {
            await browser.close();
        } catch (err) {
            console.error('[Puppeteer] Failed to close browser:', err.message);
        }
    }
};
