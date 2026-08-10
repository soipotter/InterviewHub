# InterviewHub — AI Agent Development Rules

This document outlines the mandatory development rules and architectural constraints for AI coding agents working on **InterviewHub**.

## Core Development Rules

1. **Feature Implementation Scope**: Do NOT start implementing application features until explicitly requested in the corresponding phase.
2. **Backend & Integration**: Do NOT connect Supabase or any external backend service until Phase 5 (Authentication & User Data) or explicitly requested.
3. **Dependencies**: Do NOT install unnecessary or heavy dependencies. Keep package footprint minimal and clean.
4. **Abstractions**: Do NOT create unnecessary abstractions or speculative generalizations. Prefer simple, clean, and explicit implementations.
5. **State Management**: Do NOT use Redux unless explicitly requested later. Use standard React state (`useState`, `useReducer`, `useContext`) or simple local/feature-level state.
6. **HTTP Client**: Do NOT use Axios unless explicitly requested later. Use native `fetch` or SDK clients.
7. **Custom Backend**: Do NOT create a custom backend (Node/Express API server) unless explicitly requested. The platform relies on serverless/BaaS (Supabase) in later phases.
8. **File Modification Scope**: Do NOT modify files that are unrelated to the current task. Keep diffs focused and minimal.
9. **Incremental Code Generation**: Do NOT generate huge amounts of unverified code in one single step. Work incrementally and verify.
10. **Codebase Inspection**: Inspect the existing codebase before making significant changes.
11. **Component Design**: Prefer small, focused, reusable components adhering to the Single Responsibility Principle.
12. **Type Safety**: Strictly use TypeScript. No implicit `any`. Define precise interfaces/types for all data models and component props.
13. **Architecture**: Follow a feature-based directory structure (`src/features/<feature-name>`).
14. **Logic Separation**: Keep business logic separate from presentation/UI components (use custom hooks, utility functions, or services).
15. **Data Layer Isolation**: Keep database and external-service logic isolated in `src/services/`, separate from UI components.
16. **Component States**: Every UI feature must gracefully handle **loading**, **empty**, **error**, and **success** states where applicable.
17. **Responsiveness**: Every implementation must be fully responsive across mobile, tablet, and desktop viewports using standard Tailwind CSS breakpoints.
18. **Accessibility**: Accessibility (a11y) must be considered from the beginning (semantic HTML, proper ARIA attributes, keyboard navigation, high-contrast states).
19. **Secrets Security**: NEVER hardcode secrets, private keys, or API tokens in source code.
20. **Environment Variables**: Environment variables must use `.env` files and be documented in `.env.example`.
21. **Key Exposure**: NEVER expose private keys, service-role keys, or database administrative credentials to the frontend.
22. **Requirement Fidelity**: Do NOT invent requirements that are not documented in the product specifications.

---

## Architectural Stack Standards

- **Core**: React 18+, Vite, TypeScript
- **Styling**: Tailwind CSS v3/v4 (Vanilla CSS + Tailwind directives)
- **Formatting & Linting**: Prettier + ESLint
- **Database (Phase 5+)**: Supabase (BaaS)
- **Version Control**: Git (Conventional Commits)
