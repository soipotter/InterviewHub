# Content & Editorial Guidelines — InterviewHub

## 1. Goal & Content Quality Standards
InterviewHub maintains strict editorial standards to ensure all interview preparation content is accurate, authoritative, well-structured, and directly beneficial for junior developer interviews.

---

## 2. Question Model Specification

Every question entry in InterviewHub must adhere to the following schema:

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique identifier (UUID or slug) |
| `category` | `string` | Major technical category (`html`, `css`, `javascript`, `react`, `typescript`, `web-fundamentals`, `git`) |
| `topic` | `string` | Sub-topic (e.g., `hooks`, `closures`, `flexbox`, `generics`) |
| `question` | `string` | Clear, concise interview question statement |
| `question_type` | `enum` | Question type: `'multiple_choice'` or `'true_false'` |
| `difficulty` | `enum` | Difficulty level: `'beginner'`, `'junior'`, `'intermediate'` |
| `options` | `string[]` | Options array (required for multiple choice; `['True', 'False']` for true/false) |
| `correct_answer` | `string` | Exact option matching the correct answer |
| `explanation` | `string` | Detailed Markdown answer breakdown covering concepts and edge cases |
| `interview_tip` | `string` | Practical advice on how to communicate this answer in an interview |
| `code_example` | `string?` | Optional syntax-highlighted code sample demonstrating the concept |
| `tags` | `string[]` | 2–4 lowercase search tags (e.g. `['react', 'hooks', 'performance']`) |
| `sources` | `Source[]` | Array of authoritative reference URLs (e.g. MDN, React Docs) |
| `status` | `enum` | Publication status: `'published'`, `'pending'`, `'rejected'` |

---

## 3. Difficulty Scale (MVP)

InterviewHub limits difficulty levels during MVP to three beginner/junior-focused tiers:

1. **Beginner**: Foundational definitions, syntax, and basic usage (e.g., *"What does HTML stand for?"*, *"What is a CSS selector?"*).
2. **Junior**: Essential concepts expected in entry-level engineering interviews (e.g., *"How does the JavaScript event loop work?"*, *"Difference between props and state in React"*).
3. **Intermediate**: Applied logic, performance considerations, and edge cases (e.g., *"Custom hook optimization with `useCallback`"*, *"TypeScript conditional types & generics"*).

> [!NOTE]
> Senior, Staff, and Lead level difficulties are explicitly excluded from the MVP scope.

---

## 4. Content Verifiability & Authoritative Sources

Technical accuracy is non-negotiable. Every technical explanation must be verifiable against official documentation.

### Preferred Authoritative Sources
- **MDN Web Docs** (JavaScript, HTML, CSS, Web APIs)
- **React Official Documentation** (react.dev)
- **TypeScript Official Handbook** (typescriptlang.org)
- **Official Git Documentation** (git-scm.com)
- **W3C Standards & WHATWG Specifications**

### Copywriting & Claim Policy
- **NEVER** claim: *"This question is guaranteed to be asked in your interview."*
- **ALWAYS** prefer phrasing:
  - *"Frequently reported interview question"* (for verified core technical questions)
  - *"Community-reported interview question"* (for user-submitted interview experiences)

Community-contributed questions must be clearly tagged and visually labeled as **"Community-Contributed Experience"** to distinguish them from core vetted question sets.
