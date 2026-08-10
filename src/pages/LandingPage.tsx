import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface TopicItem {
  id: string;
  name: string;
  categorySlug: string;
  badgeText: string;
  description: string;
  count: string;
}

const MVP_TOPICS: TopicItem[] = [
  {
    id: 'html',
    name: 'HTML & Accessibility',
    categorySlug: 'html',
    badgeText: 'Core Web',
    description:
      'Semantic HTML5 elements, DOM tree structure, forms, and WCAG accessibility (ARIA) standards.',
    count: 'Vetted Questions',
  },
  {
    id: 'css',
    name: 'CSS & Modern Layouts',
    categorySlug: 'css',
    badgeText: 'Styling',
    description:
      'Flexbox, CSS Grid, specificity calculation, responsive design, animations, and Tailwind CSS.',
    count: 'Vetted Questions',
  },
  {
    id: 'javascript',
    name: 'JavaScript (ES6+)',
    categorySlug: 'javascript',
    badgeText: 'Core Engine',
    description:
      'Closures, Event Loop, Promises, async/await, prototype inheritance, and scope rules.',
    count: 'Vetted Questions',
  },
  {
    id: 'react',
    name: 'React Framework',
    categorySlug: 'react',
    badgeText: 'UI Library',
    description:
      'Hooks (useState, useEffect, custom hooks), component lifecycle, state patterns, and virtual DOM.',
    count: 'Vetted Questions',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    categorySlug: 'typescript',
    badgeText: 'Type Safety',
    description:
      'Types vs. interfaces, generics, utility types, type narrowing, and strict compiler configs.',
    count: 'Vetted Questions',
  },
  {
    id: 'web-fundamentals',
    name: 'Web Fundamentals',
    categorySlug: 'web-fundamentals',
    badgeText: 'Browser & Network',
    description:
      'HTTP/HTTPS, browser rendering pipeline, CORS policies, Web Storage, and Core Web Vitals.',
    count: 'Vetted Questions',
  },
  {
    id: 'git',
    name: 'Git & Version Control',
    categorySlug: 'git',
    badgeText: 'Tooling',
    description:
      'Branching strategies, rebase vs. merge, stashing, cherry-picking, and conflict resolution.',
    count: 'Vetted Questions',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Learn',
    description:
      'Explore curated technical questions with detailed answer breakdowns, code snippets, and interview tips.',
  },
  {
    number: '02',
    title: 'Practice',
    description:
      'Test your understanding through configurable multiple-choice and true-false practice quizzes.',
  },
  {
    number: '03',
    title: 'Improve',
    description:
      'Track category performance over time, build daily habits, and pinpoint weak topics automatically.',
  },
];

const FEATURE_HIGHLIGHTS = [
  {
    title: 'Question Bank',
    badge: 'Core Feature',
    description:
      'Filter technical questions by category, topic, difficulty (Beginner, Junior, Intermediate), and question type.',
    linkText: 'Browse Bank →',
    to: '/questions',
  },
  {
    title: 'Practice Quizzes',
    badge: 'Interactive',
    description:
      'Configure practice sessions by topic, difficulty, and question count with instant score calculations.',
    linkText: 'Start Quiz →',
    to: '/practice',
  },
  {
    title: 'Daily Challenge',
    badge: 'Habit Builder',
    description:
      'Complete 5 mixed frontend questions every calendar day to maintain daily streak momentum.',
    linkText: 'Take Challenge →',
    to: '/daily-challenge',
  },
  {
    title: 'Learning Progress',
    badge: 'Analytics',
    description:
      'Visualize category mastery and automatically detect weak topics when accuracy falls below 70%.',
    linkText: 'View Progress →',
    to: '/progress',
  },
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header Layout */}
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative py-16 md:py-24 border-b border-slate-800/60 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
          <Container size="xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Hero Text Column */}
              <div className="lg:col-span-7 flex flex-col gap-6 text-left">
                <div>
                  <Badge variant="default" size="md" className="mb-4">
                    Frontend Interview Preparation
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                    Prepare smarter for your{' '}
                    <span className="text-indigo-400">frontend interview</span>.
                  </h1>
                </div>
                <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Practice technical interview questions across HTML, CSS, JavaScript, React,
                  TypeScript, Web Fundamentals, and Git. Tailored for IT students, fresh graduates,
                  and junior software developers.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link to="/questions">
                    <Button variant="primary" size="lg">
                      Explore Questions
                    </Button>
                  </Link>
                  <Link to="/practice">
                    <Button variant="outline" size="lg">
                      Start Practice
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Hero Code Visual Card */}
              <div className="lg:col-span-5">
                <Card className="border-slate-800 bg-slate-950/80 shadow-2xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </span>
                    <span>question.ts</span>
                  </div>
                  <div className="p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto text-left space-y-2">
                    <p className="text-slate-500">// React Hooks & State Concept</p>
                    <p>
                      <span className="text-purple-400">interface</span>{' '}
                      <span className="text-amber-300">Question</span> &#123;
                    </p>
                    <p className="pl-4">
                      category: <span className="text-emerald-300">'React'</span>;
                    </p>
                    <p className="pl-4">
                      topic: <span className="text-emerald-300">'useEffect Cleanup'</span>;
                    </p>
                    <p className="pl-4">
                      difficulty: <span className="text-indigo-300">'Junior'</span>;
                    </p>
                    <p className="pl-4">
                      question:{' '}
                      <span className="text-emerald-300">
                        'When does useEffect cleanup execute?'
                      </span>
                      ;
                    </p>
                    <p>&#125;</p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold">
                        ✓ Vetted Explanation & Tips
                      </span>
                      <span className="text-slate-400">3 Level Scale</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* MVP TOPICS SECTION */}
        <section className="py-16 md:py-20 border-b border-slate-800/60 bg-slate-900">
          <Container size="xl">
            <div className="flex flex-col gap-3 text-left mb-12">
              <Badge variant="info" size="sm" className="w-fit">
                Curated Taxonomy
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Frontend Technical Categories
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                Master essential interview domains across 7 core frontend engineering topics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MVP_TOPICS.map((topic) => (
                <Card key={topic.id} hoverable className="flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="secondary" size="sm">
                        {topic.badgeText}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-400">{topic.count}</span>
                    </div>
                    <CardTitle className="text-base text-white">{topic.name}</CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {topic.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link
                      to={`/questions?category=${topic.categorySlug}`}
                      className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Browse {topic.name} Questions →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-16 md:py-20 border-b border-slate-800/60 bg-slate-950">
          <Container size="xl">
            <div className="flex flex-col gap-3 text-left mb-12">
              <Badge variant="default" size="sm" className="w-fit">
                Structured Approach
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                How InterviewHub Works
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                A simple 3-step workflow designed to transform interview anxiety into confident
                technical execution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col gap-3 p-6 rounded-xl border border-slate-800 bg-slate-900/50 text-left"
                >
                  <span className="text-2xl font-mono font-bold text-indigo-400">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* FEATURE HIGHLIGHTS SECTION */}
        <section className="py-16 md:py-20 border-b border-slate-800/60 bg-slate-900">
          <Container size="xl">
            <div className="flex flex-col gap-3 text-left mb-12">
              <Badge variant="warning" size="sm" className="w-fit">
                Platform Features
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Everything You Need to Prepare
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                Core preparation tools built specifically for entry-level and junior frontend
                developers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {FEATURE_HIGHLIGHTS.map((feat) => (
                <Card key={feat.title} hoverable>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="default" size="sm">
                        {feat.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-white">{feat.title}</CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {feat.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link
                      to={feat.to}
                      className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {feat.linkText}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="py-16 md:py-20 bg-slate-950 text-center">
          <Container size="md">
            <div className="flex flex-col items-center gap-6 p-8 md:p-12 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 backdrop-blur-sm">
              <Badge variant="default" size="md">
                Start Preparing Today
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight max-w-xl">
                Ready to master your frontend technical interview?
              </h2>
              <p className="text-xs md:text-sm text-slate-300 max-w-md leading-relaxed">
                Explore curated questions or start a targeted practice quiz now. No account required
                to get started.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link to="/practice">
                  <Button variant="primary" size="lg">
                    Start Practice
                  </Button>
                </Link>
                <Link to="/questions">
                  <Button variant="outline" size="lg">
                    Explore Questions
                  </Button>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {/* Footer Layout */}
      <Footer />
    </div>
  );
};

export default LandingPage;
