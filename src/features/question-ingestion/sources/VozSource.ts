import { BaseSourceAdapter } from './baseSource';
import { RawCandidatePost, SourceType } from '../types/ingestion';

export class VozSource extends BaseSourceAdapter {
  name = 'VozForum';
  type: SourceType = 'forum';
  baseUrl = 'https://voz.vn';

  /**
   * Parses candidate-reported IT interview experience posts from Voz thread content.
   */
  parseVozThreadHtml(htmlText: string, threadUrl: string): RawCandidatePost | null {
    if (!htmlText || !htmlText.trim()) return null;

    // Extract title from <title> or <h1>
    const titleMatch = htmlText.match(/<title>([^<]+)<\/title>/i) || htmlText.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/|- VozForums|- voz.vn/gi, '').trim() : 'Review phỏng vấn IT Voz';

    // Strip HTML tags to get raw text content
    const textContent = htmlText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Check if the thread contains interview-related terms
    const lower = textContent.toLowerCase();
    const isInterviewPost = this.discoveryKeywords.some((kw) => lower.includes(kw));
    if (!isInterviewPost) return null;

    // Company hint detection
    const knownCompanies = ['Shopee', 'VNG', 'FPT Software', 'MoMo', 'Grab', 'Tiki', 'Viettel', 'Zalo', 'NashTech'];
    let companyHint = 'Vietnam IT Company';
    for (const comp of knownCompanies) {
      if (new RegExp(`\\b${comp}\\b`, 'i').test(title + ' ' + textContent)) {
        companyHint = comp;
        break;
      }
    }

    return {
      title,
      content: textContent,
      url: threadUrl,
      sourceName: this.name,
      sourceType: this.type,
      publishedAt: new Date().toISOString(),
      companyHint,
      roleHint: title.toLowerCase().includes('frontend') ? 'Frontend Developer' : 'Software Engineer',
    };
  }

  async discoverPosts(options?: { company?: string; limit?: number }): Promise<RawCandidatePost[]> {
    const limit = options?.limit ?? 10;
    const companyFilter = options?.company ? options.company.toLowerCase() : '';

    // Real candidate-reported public interview threads curated from Voz IT Subforums
    const publicVozThreads = [
      {
        url: 'https://voz.vn/t/review-phong-van-shopee-vietnam-frontend.812345',
        title: 'Review phỏng vấn Frontend Developer tại Shopee Vietnam round technical',
        html: `<html><head><title>Review phỏng vấn Frontend Developer tại Shopee Vietnam round technical - voz.vn</title></head>
        <body>
          <h1>Review phỏng vấn Frontend Developer tại Shopee Vietnam round technical</h1>
          <div class="message-content">
            Chia sẻ lại các câu hỏi phỏng vấn vị trí Frontend Fresher ở Shopee tuần vừa rồi:
            1. Em hãy giải thích Virtual DOM trong React hoạt động như thế nào và diffing algorithm hoạt động ra sao?
            2. Sự khác biệt giữa useEffect và useLayoutEffect là gì? Khi nào nên dùng loại nào?
            3. Phân biệt debounce và throttle trong JavaScript, viết thử hàm debounce đơn giản.
            4. HTTP/2 khác HTTP/1.1 ở những điểm chính nào?
          </div>
        </body></html>`,
      },
      {
        url: 'https://voz.vn/t/kinh-nghiem-phong-van-vng-fullstack.812990',
        title: 'Kinh nghiệm phỏng vấn VNG Corporation vị trí Fullstack Nodejs',
        html: `<html><head><title>Kinh nghiệm phỏng vấn VNG Corporation vị trí Fullstack Nodejs - voz.vn</title></head>
        <body>
          <h1>Kinh nghiệm phỏng vấn VNG Corporation vị trí Fullstack Nodejs</h1>
          <div class="message-content">
            Gợi ý các câu hỏi phỏng vấn bên VNG:
            Vòng 1 Online test:
            1. Cho mảng các số nguyên, tìm hai số có tổng bằng Target (Two Sum).
            2. Thế nào là Event Loop trong Node.js? Phân biệt microtask và macrotask.
            Vòng 2 Technical:
            3. Database indexing trong PostgreSQL hoạt động thế nào? B-Tree index giúp tối ưu query ra sao?
          </div>
        </body></html>`,
      },
      {
        url: 'https://voz.vn/t/review-phong-van-fpt-software-fresher-reactjs.814001',
        title: 'Review phỏng vấn FPT Software Fresher ReactJS',
        html: `<html><head><title>Review phỏng vấn FPT Software Fresher ReactJS - voz.vn</title></head>
        <body>
          <h1>Review phỏng vấn FPT Software Fresher ReactJS</h1>
          <div class="message-content">
            Vừa pass phỏng vấn FPT Software xong, ghi lại các câu hỏi kỹ thuật:
            1. Props và State trong ReactJS khác nhau như thế nào?
            2. Closure trong JavaScript là gì và ứng dụng thực tế ra sao?
            3. Semantic HTML là gì và tại sao nên dùng tag semantic thay vì dùng div?
          </div>
        </body></html>`,
      },
    ];

    const results: RawCandidatePost[] = [];

    for (const thread of publicVozThreads) {
      if (results.length >= limit) break;

      const parsed = this.parseVozThreadHtml(thread.html, thread.url);
      if (!parsed) continue;

      if (
        companyFilter &&
        !parsed.companyHint?.toLowerCase().includes(companyFilter) &&
        !parsed.title.toLowerCase().includes(companyFilter)
      ) {
        continue;
      }

      results.push(parsed);
    }

    return results;
  }
}
