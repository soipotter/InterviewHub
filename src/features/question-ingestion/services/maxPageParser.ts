export interface MaxPageDiscoveryResult {
  currentPage: number;
  reportedTotalPages: number;
  lastPageHref: string | null;
  discoveredMaxPage: number;
  isInvariantValid: boolean;
}

export function parseXenForoMaxPage(htmlOrText: string): MaxPageDiscoveryResult {
  let currentPage = 1;
  let reportedTotalPages = 1;
  let lastPageHref: string | null = null;
  let discoveredMaxPage = 1;

  // 1. Textual state parser (e.g. "60 of 102" or "Page 60 of 102")
  const textMatch = htmlOrText.match(/(?:page\s*)?(\d+)\s+of\s+(\d+)/i);
  if (textMatch) {
    currentPage = parseInt(textMatch[1], 10);
    reportedTotalPages = parseInt(textMatch[2], 10);
  }

  // 2. Explicit "Last" link parser (e.g. href=".../page-102")
  const lastLinkMatch = htmlOrText.match(/href="[^"]*\/page-(\d+)"[^>]*class="[^"]*pageNav-jump--last/i) ||
    htmlOrText.match(/class="[^"]*pageNav-jump--last[^"]*"[^>]*href="[^"]*\/page-(\d+)"/i);

  if (lastLinkMatch) {
    reportedTotalPages = parseInt(lastLinkMatch[1], 10);
    lastPageHref = lastLinkMatch[0];
  }

  // 3. Collect ALL numeric page links in pagination DOM
  const pageMatches = Array.from(htmlOrText.matchAll(/\/page-(\d+)/g));
  let maxFoundInLinks = reportedTotalPages;
  pageMatches.forEach((m) => {
    const p = parseInt(m[1], 10);
    if (p > maxFoundInLinks) maxFoundInLinks = p;
  });

  discoveredMaxPage = Math.max(reportedTotalPages, maxFoundInLinks);

  const isInvariantValid = discoveredMaxPage === reportedTotalPages;

  return {
    currentPage,
    reportedTotalPages,
    lastPageHref,
    discoveredMaxPage,
    isInvariantValid,
  };
}
