import { BaseSourceAdapter } from './baseSource';
import { RawCandidatePost, SourceType } from '../types/ingestion';

export class GenericArticleSource extends BaseSourceAdapter {
  name = 'TechBlogVietnam';
  type: SourceType = 'generic_article';
  baseUrl = 'https://viblo.asia';

  async discoverPosts(options?: { company?: string; limit?: number }): Promise<RawCandidatePost[]> {
    const limit = options?.limit ?? 10;
    const company = options?.company ? options.company.toLowerCase() : '';

    const mockPosts: RawCandidatePost[] = [
      {
        title: 'Tổng hợp câu hỏi phỏng vấn TypeScript thực tế tại các công ty IT Việt Nam',
        content: `Các câu hỏi thường gặp khi đi phỏng vấn vị trí TypeScript:
        1. Phân biệt type alias và interface trong TypeScript. Khi nào nên dùng loại nào?
        2. Generics trong TypeScript là gì? Viết một hàm Generic Utility Type đơn giản.
        3. Phân biệt unknown và any trong TypeScript. Tại sao nên dùng unknown thay vì any?`,
        url: 'https://viblo.asia/p/tong-hop-cau-hoi-phong-van-typescript-thuc-te-ab12cd34',
        sourceName: this.name,
        sourceType: this.type,
        publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        companyHint: 'General IT Vietnam',
        roleHint: 'TypeScript Developer',
      },
    ];

    let filtered = mockPosts;
    if (company) {
      filtered = filtered.filter(
        (p) =>
          p.companyHint?.toLowerCase().includes(company) ||
          p.title.toLowerCase().includes(company)
      );
    }

    return filtered.slice(0, limit);
  }
}
