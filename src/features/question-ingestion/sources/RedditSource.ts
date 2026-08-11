import { BaseSourceAdapter } from './baseSource';
import { RawCandidatePost, SourceType } from '../types/ingestion';

export class RedditSource extends BaseSourceAdapter {
  name = 'RedditITVietnam';
  type: SourceType = 'reddit';
  baseUrl = 'https://www.reddit.com/r/vozforums';

  async discoverPosts(options?: { company?: string; limit?: number }): Promise<RawCandidatePost[]> {
    const limit = options?.limit ?? 10;
    const company = options?.company ? options.company.toLowerCase() : '';

    const mockPosts: RawCandidatePost[] = [
      {
        title: '[Interview Experience] Senior Frontend interview at MoMo E-Wallet',
        content: `Sharing my technical round questions at MoMo Vietnam:
        1. How does React 18 Concurrent Rendering work with useTransition?
        2. How do you optimize web vital metrics (LCP, CLS, INP) in a large SPA application?
        3. Explain CSS specificity calculation rules and how Tailwind avoids specificity conflicts.`,
        url: 'https://www.reddit.com/r/vozforums/comments/1a2b3c/momo_frontend_interview/',
        sourceName: this.name,
        sourceType: this.type,
        publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        companyHint: 'MoMo',
        roleHint: 'Senior Frontend Developer',
      },
      {
        title: 'Kinh nghiệm phỏng vấn Grab Vietnam Backend Engineer',
        content: `Gợi ý các câu hỏi bên Grab phỏng vấn vị trí Backend:
        1. Phân biệt RESTful API và gRPC khi giao tiếp giữa các Microservices.
        2. Làm thế nào để chống Race Condition khi cập nhật số dư tài khoản người dùng?
        3. Redis Cache Eviction Policy (LRU, LFU) hoạt động như thế nào?`,
        url: 'https://www.reddit.com/r/vozforums/comments/1d4e5f/grab_backend_interview_experience/',
        sourceName: this.name,
        sourceType: this.type,
        publishedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        companyHint: 'Grab',
        roleHint: 'Backend Engineer',
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
