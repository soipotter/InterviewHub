import { chromium } from 'playwright';

export interface DiscoveredVozSource {
  id: string;
  sourceType: 'voz';
  sourceName: string;
  canonicalUrl: string;
  threadId: string;
  title: string;
  firstDiscoveredAt: string;
  lastCheckedAt?: string | null;
  lastProcessedPostId?: string | null;
  lastProcessedPage: number;
  status: 'discovered' | 'validated' | 'processing' | 'processed' | 'ignored' | 'failed';
  isActive: boolean;
  historicalComplete: boolean;
  discoveryMethod: string;
  questionsCollectedCount: number;
  lastError?: string | null;
}

export class VozDiscoveryService {
  private static knownSources: Map<string, DiscoveredVozSource> = new Map();

  static initializeDefaults() {
    if (this.knownSources.size === 0) {
      // Historical Thread 206897 pre-registered as historicalComplete
      this.knownSources.set('206897', {
        id: 'src-206897',
        sourceType: 'voz',
        sourceName: 'Voz Forum - IT Company Interview Review',
        canonicalUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
        threadId: '206897',
        title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
        firstDiscoveredAt: '2026-08-11T00:00:00.000Z',
        lastCheckedAt: new Date().toISOString(),
        lastProcessedPage: 102,
        status: 'processed',
        isActive: true,
        historicalComplete: true,
        discoveryMethod: 'historical_seed',
        questionsCollectedCount: 88,
      });
    }
  }

  static getRegisteredSources(): DiscoveredVozSource[] {
    this.initializeDefaults();
    return Array.from(this.knownSources.values());
  }

  static async discoverNewInterviewSources(): Promise<{
    checkedIndexes: string[];
    discoveredThreads: DiscoveredVozSource[];
    newSourcesCount: number;
    alreadyKnownCount: number;
    invalidCount: number;
  }> {
    this.initializeDefaults();

    const checkedIndexes: string[] = [
      'https://voz.vn/f/chuyen-dem-lap-trinh.91/',
      'https://voz.vn/f/chuyen-tro-linh-tin.17/',
    ];

    const discoveredThreads: DiscoveredVozSource[] = [];
    let newSourcesCount = 0;
    let alreadyKnownCount = 0;
    let invalidCount = 0;

    const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
    let browser;
    try {
      browser = await chromium.launch({ executablePath, headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      for (const indexUrl of checkedIndexes) {
        try {
          console.log(`[VozDiscovery] Scanning public forum index: ${indexUrl}...`);
          const res = await page.goto(indexUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
          if (!res || res.status() !== 200) {
            invalidCount++;
            continue;
          }

          const rawLinks = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a[href*="/t/"]'));
            return anchors.map((a) => ({
              title: (a.textContent || '').trim(),
              href: (a as HTMLAnchorElement).href,
            })).filter((l) => l.title.length > 5 && l.href.includes('.'));
          });

          for (const link of rawLinks) {
            const threadMatch = link.href.match(/\/t\/([^/]+)\.(\d+)/);
            if (!threadMatch) continue;

            const threadId = threadMatch[2];
            const canonicalUrl = `https://voz.vn/t/${threadMatch[1]}.${threadId}/`;
            const titleLower = link.title.toLowerCase();

            // Match interview review signals
            const isInterviewSignal =
              titleLower.includes('phỏng vấn') ||
              titleLower.includes('interview') ||
              titleLower.includes('review công ty') ||
              titleLower.includes('kinh nghiệm phỏng vấn') ||
              titleLower.includes('pv cty');

            if (!isInterviewSignal) continue;

            if (this.knownSources.has(threadId)) {
              alreadyKnownCount++;
              continue;
            }

            // Create new discovered source
            const newSource: DiscoveredVozSource = {
              id: `src-${threadId}`,
              sourceType: 'voz',
              sourceName: `Voz Forum - ${link.title}`,
              canonicalUrl,
              threadId,
              title: link.title,
              firstDiscoveredAt: new Date().toISOString(),
              lastCheckedAt: new Date().toISOString(),
              lastProcessedPage: 0,
              status: 'validated',
              isActive: true,
              historicalComplete: false,
              discoveryMethod: 'auto_keyword_search',
              questionsCollectedCount: 0,
            };

            this.knownSources.set(threadId, newSource);
            discoveredThreads.push(newSource);
            newSourcesCount++;
          }

          await page.waitForTimeout(1000);
        } catch (err) {
          console.warn(`[VozDiscovery] Error scanning index ${indexUrl}:`, (err as Error).message);
          invalidCount++;
        }
      }
    } catch (err) {
      console.error('[VozDiscovery] Playwright browser error:', (err as Error).message);
    } finally {
      if (browser) await browser.close();
    }

    return {
      checkedIndexes,
      discoveredThreads,
      newSourcesCount,
      alreadyKnownCount,
      invalidCount,
    };
  }
}
