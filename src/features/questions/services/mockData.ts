import { Question } from '../types/question';

export const MOCK_QUESTIONS: Question[] = [
  // HTML (5 questions)
  {
    id: 'q-html-01',
    title: 'What is semantic HTML and why is it important for accessibility?',
    slug: 'semantic-html-accessibility',
    category: 'HTML',
    topic: 'Semantic HTML',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'Semantic HTML uses tags that convey the meaning of their content to browsers and screen readers rather than just visual presentation.',
    tags: ['html5', 'semantic', 'accessibility', 'a11y'],
    estimatedMinutes: 3,
    options: [
      'Using elements like <header>, <article>, and <nav> to structure documents based on content meaning.',
      'Using <div> and <span> tags with inline CSS styles for faster rendering.',
      'Writing HTML code without any CSS or JavaScript attributes.',
      'Using capitalized tags like <MAIN> and <SECTION> to improve SEO.',
    ],
    correctAnswer:
      'Using elements like <header>, <article>, and <nav> to structure documents based on content meaning.',
    explanationMarkdown:
      'Semantic HTML elements clearly describe their meaning in a human- and machine-readable way. Elements such as `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, and `<footer>` tell the browser, search engines, and assistive technologies (like screen readers) what type of content is contained within them.\n\n### Benefits of Semantic HTML:\n1. **Accessibility (a11y)**: Screen readers use landmark elements to navigate pages quickly.\n2. **SEO**: Search engines assign higher weighting to structured content.\n3. **Maintainability**: Clearer, self-documenting code structure for engineering teams.',
    interviewTip:
      'In an interview, emphasize that semantic HTML is the foundation of web accessibility (a11y). Mention landmarks like <main> and <nav> and explain that screen readers rely on them.',
    codeSnippet: `<!-- Good: Semantic Structure -->
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>
<main>
  <article>
    <h1>Understanding Semantic HTML</h1>
  </article>
</main>`,
    sources: [
      {
        name: 'MDN Web Docs — Semantics',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Semantics',
      },
      { name: 'W3C HTML5 Specification', url: 'https://www.w3.org/TR/html52/' },
    ],
  },
  {
    id: 'q-html-02',
    title: 'What is the purpose of the alt attribute on img tags?',
    slug: 'purpose-of-img-alt-attribute',
    category: 'HTML',
    topic: 'Accessibility',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'The alt attribute provides text alternatives for images when they fail to load or are read by screen readers for visually impaired users.',
    tags: ['html', 'images', 'accessibility', 'attributes'],
    estimatedMinutes: 2,
    options: [
      'It displays a hover tooltip text over the image.',
      'It provides text alternatives for screen readers and when images fail to load.',
      'It resizes the image automatically to fit the screen.',
      'It specifies the alignment of the image within text.',
    ],
    correctAnswer: 'It provides text alternatives for screen readers and when images fail to load.',
    explanationMarkdown:
      'The `alt` (alternative text) attribute is required on HTML `<img>` tags for accessibility. When an image cannot be rendered (e.g. broken link or slow network), the browser displays the `alt` text. More importantly, screen readers read this text aloud to visually impaired users.',
    interviewTip:
      'Always mention that decorative images should have an empty alt attribute (alt="") so screen readers skip them instead of reading out filename paths.',
    codeSnippet: `<!-- Accessible Image -->
<img src="company-logo.png" alt="InterviewHub Official Logo" />

<!-- Decorative Image (Skipped by Screen Readers) -->
<img src="divider-line.svg" alt="" role="presentation" />`,
    sources: [
      {
        name: 'MDN Web Docs — <img> alt attribute',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-alt',
      },
    ],
  },
  {
    id: 'q-html-03',
    title: 'True or False: The section tag should be used purely as a styling container like div.',
    slug: 'section-vs-div-usage',
    category: 'HTML',
    topic: 'Document Structure',
    difficulty: 'Junior',
    type: 'True/False',
    shortSummary:
      'False. The section element represents a standalone thematic grouping of content, whereas div is a non-semantic layout wrapper.',
    tags: ['html5', 'semantic', 'dom', 'structure'],
    estimatedMinutes: 2,
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanationMarkdown:
      '**False.** The `<section>` tag is a semantic element representing a generic standalone section of a document. It should typically include a heading (`<h2>`-`<h6>`). If you only need a container for styling or layout positioning, use `<div>`.',
    interviewTip:
      'Remember rule of thumb: If you need CSS styling or JS positioning without semantic meaning, use div. If content forms a distinct thematic group with a heading, use section.',
    codeSnippet: `<section aria-labelledby="features-heading">
  <h2 id="features-heading font-bold">Platform Features</h2>
  <p>Overview of features...</p>
</section>`,
    sources: [
      {
        name: 'MDN Web Docs — <section>',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/section',
      },
    ],
  },
  {
    id: 'q-html-04',
    title: 'How do data- attributes work in HTML5?',
    slug: 'html5-data-attributes-usage',
    category: 'HTML',
    topic: 'HTML5 APIs',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Custom data- attributes allow embedding custom dataset values directly on HTML elements, readable via dataset API in JavaScript.',
    tags: ['html5', 'dataset', 'attributes', 'dom'],
    estimatedMinutes: 3,
    options: [
      'They allow storing custom data private to the page on any HTML element.',
      'They send background HTTP requests whenever the element is clicked.',
      'They encrypt element content before rendering.',
      'They define database table columns for client-side storage.',
    ],
    correctAnswer: 'They allow storing custom data private to the page on any HTML element.',
    explanationMarkdown:
      'HTML5 `data-*` attributes let you store extra information on standard, semantic HTML elements without using non-standard attributes. In JS, you access them via `element.dataset`.',
    interviewTip:
      'Highlight that while data- attributes are convenient for UI state markers, sensitive security data should never be exposed in public HTML DOM attributes.',
    codeSnippet: `<!-- HTML -->
<button id="user-btn" data-user-id="1024" data-role="admin">
  User Profile
</button>

<!-- JavaScript -->
<script>
  const btn = document.getElementById('user-btn');
  console.log(btn.dataset.userId); // "1024"
  console.log(btn.dataset.role);   // "admin"
</script>`,
    sources: [
      {
        name: 'MDN Web Docs — Using data attributes',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes',
      },
    ],
  },
  {
    id: 'q-html-05',
    title: 'What is the difference between inline and block-level HTML elements?',
    slug: 'inline-vs-block-elements',
    category: 'HTML',
    topic: 'DOM Layout',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'Block elements start on a new line and stretch to full container width, whereas inline elements take up only as much width as necessary.',
    tags: ['html', 'block', 'inline', 'dom'],
    estimatedMinutes: 3,
    options: [
      'Block elements start on a new line and span full width; inline elements take only necessary content width.',
      'Inline elements can contain block elements, but block elements cannot contain inline elements.',
      'Block elements can only be styled with inline CSS.',
      'Inline elements automatically add top and bottom margins.',
    ],
    correctAnswer:
      'Block elements start on a new line and span full width; inline elements take only necessary content width.',
    explanationMarkdown:
      'By default, block-level elements (e.g. `<div>`, `<p>`, `<h1>`) begin on a new line and occupy the entire width of their parent container. Inline elements (e.g. `<span>`, `<a>`, `<strong>`) do not break onto a new line and only take up the width of their inner content.',
    interviewTip:
      'Note that top/bottom margins and height properties do not apply to inline elements. To apply top/bottom padding/margin, set display: inline-block or block.',
    codeSnippet: `<!-- Block Example -->
<div style="background: red;">Full Width Row</div>

<!-- Inline Example -->
<span>Word 1</span> <span>Word 2</span>`,
    sources: [
      {
        name: 'MDN Web Docs — Block-level elements',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Block-level_content',
      },
    ],
  },

  // CSS (5 questions)
  {
    id: 'q-css-01',
    title: 'How does CSS Specificity get calculated when conflicting styles occur?',
    slug: 'css-specificity-calculation',
    category: 'CSS',
    topic: 'Specificity & Cascade',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'CSS specificity is calculated using a 4-number tuple (inline, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements).',
    tags: ['css', 'specificity', 'cascade', 'selectors'],
    estimatedMinutes: 4,
    options: [
      'Tuple score: (Inline, ID, Class/Attribute/Pseudo-class, Element/Pseudo-element).',
      'The rule defined at the very top of the CSS file always wins.',
      'Random priority based on browser load speed.',
      'Class selectors always override ID selectors.',
    ],
    correctAnswer:
      'Tuple score: (Inline, ID, Class/Attribute/Pseudo-class, Element/Pseudo-element).',
    explanationMarkdown:
      'Specificity is the algorithm used by browsers to determine which CSS rule applies to an element when multiple rules conflict. \n\n### Specificity Weights:\n- **Inline styles**: (1, 0, 0, 0)\n- **IDs**: (0, 1, 0, 0)\n- **Classes, attributes, pseudo-classes**: (0, 0, 1, 0)\n- **Elements & pseudo-elements**: (0, 0, 0, 1)\n\n`!important` overrides normal specificity calculations.',
    interviewTip:
      'Avoid overusing !important. Explain that writing low-specificity, modular classes (like BEM or Utility-first CSS) is cleaner than fighting specificity wars.',
    codeSnippet: `/* Specificity: (0, 1, 0, 0) - WINNER */
#header { color: blue; }

/* Specificity: (0, 0, 2, 0) */
.nav .item { color: red; }`,
    sources: [
      {
        name: 'MDN Web Docs — Specificity',
        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity',
      },
    ],
  },
  {
    id: 'q-css-02',
    title: 'What is the difference between Flexbox and CSS Grid layout systems?',
    slug: 'flexbox-vs-css-grid',
    category: 'CSS',
    topic: 'Layout Systems',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Flexbox is designed for 1-dimensional layouts (rows OR columns), whereas CSS Grid is designed for 2-dimensional layouts (rows AND columns).',
    tags: ['css', 'flexbox', 'grid', 'responsive'],
    estimatedMinutes: 4,
    options: [
      'Flexbox is 1-dimensional (content-first); CSS Grid is 2-dimensional (layout-first).',
      'Flexbox only works on mobile devices.',
      'CSS Grid cannot align items vertically.',
      'Flexbox cannot handle wrap lines.',
    ],
    correctAnswer:
      'Flexbox is 1-dimensional (content-first); CSS Grid is 2-dimensional (layout-first).',
    explanationMarkdown:
      'Flexbox is optimized for one-dimensional layouts along a single axis (either horizontal row or vertical column). CSS Grid is built for two-dimensional layouts, controlling rows and columns simultaneously.',
    interviewTip:
      'State clearly: Flexbox is content-out (items dictate space), while Grid is layout-in (grid tracks dictate item placement). They complement each other.',
    codeSnippet: `/* Flexbox: 1D Alignment */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* CSS Grid: 2D Matrix */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}`,
    sources: [
      {
        name: 'MDN Web Docs — Relationship of Grid Layout to other layout methods',
        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Relationship_of_Grid_Layout',
      },
    ],
  },
  {
    id: 'q-css-03',
    title:
      'True or False: Setting box-sizing: border-box includes padding and border in the element width.',
    slug: 'box-sizing-border-box-behavior',
    category: 'CSS',
    topic: 'Box Model',
    difficulty: 'Beginner',
    type: 'True/False',
    shortSummary:
      'True. border-box tells the browser to account for any border and padding in the values specified for width and height.',
    tags: ['css', 'box-model', 'border-box', 'layout'],
    estimatedMinutes: 2,
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanationMarkdown:
      '**True.** Under `box-sizing: content-box` (browser default), padding and border are added outside the width. Under `border-box`, declared width includes content, padding, and border, preventing unexpected layout overflows.',
    interviewTip:
      'Mention that modern CSS resets universally apply `*, ::before, ::after { box-sizing: border-box; }` to simplify sizing calculations.',
    codeSnippet: `*, ::before, ::after {
  box-sizing: border-box;
}`,
    sources: [
      {
        name: 'MDN Web Docs — box-sizing',
        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing',
      },
    ],
  },
  {
    id: 'q-css-04',
    title: 'What is the difference between display: none and visibility: hidden?',
    slug: 'display-none-vs-visibility-hidden',
    category: 'CSS',
    topic: 'Display & Visibility',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'display: none removes the element entirely from document flow, while visibility: hidden hides it but preserves its space in the layout.',
    tags: ['css', 'display', 'visibility', 'dom'],
    estimatedMinutes: 3,
    options: [
      'display: none removes element from DOM flow; visibility: hidden hides it while preserving layout space.',
      'visibility: hidden deletes the HTML tag permanently.',
      'display: none only works on text nodes.',
      'There is no difference between them.',
    ],
    correctAnswer:
      'display: none removes element from DOM flow; visibility: hidden hides it while preserving layout space.',
    explanationMarkdown:
      '- `display: none`: The element is hidden and completely removed from document flow. Surrounding elements fill the empty space.\n- `visibility: hidden`: The element is invisible, but still occupies its exact width and height space in the page layout.',
    interviewTip:
      'Also note that screen readers ignore elements with display: none or visibility: hidden. To visually hide an element while keeping it accessible for screen readers, use sr-only / visually-hidden utility classes.',
    codeSnippet: `.hidden-layout {
  display: none; /* No space reserved */
}

.hidden-visual {
  visibility: hidden; /* Space reserved */
}`,
    sources: [
      {
        name: 'MDN Web Docs — display',
        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/display',
      },
    ],
  },
  {
    id: 'q-css-05',
    title: 'How does container queries differ from traditional media queries in modern CSS?',
    slug: 'container-queries-vs-media-queries',
    category: 'CSS',
    topic: 'Responsive Design',
    difficulty: 'Intermediate',
    type: 'Multiple Choice',
    shortSummary:
      'Media queries respond to the viewport width, while Container queries respond to the size of a specific parent container.',
    tags: ['css', 'container-queries', 'responsive', 'modern-css'],
    estimatedMinutes: 5,
    options: [
      'Media queries check viewport width; Container queries check parent container width.',
      'Container queries require JavaScript to function.',
      'Media queries only work on desktop screens.',
      'Container queries replace flexbox completely.',
    ],
    correctAnswer:
      'Media queries check viewport width; Container queries check parent container width.',
    explanationMarkdown:
      'Container queries enable components to adapt based on the size of their parent container rather than the overall browser viewport. This makes components truly modular when placed in sidebars versus main content areas.',
    interviewTip:
      'Explain that container queries solve the "reusable component problem" where a component card needs to look different depending on whether it sits in a narrow sidebar or wide main grid.',
    codeSnippet: `@container (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }
}`,
    sources: [
      {
        name: 'MDN Web Docs — CSS Container Queries',
        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries',
      },
    ],
  },

  // JavaScript (5 questions)
  {
    id: 'q-js-01',
    title: 'What is a closure in JavaScript and what is a common practical use case?',
    slug: 'javascript-closures-explained',
    category: 'JavaScript',
    topic: 'Closures & Scope',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'A closure is a function bundled with references to its surrounding state, allowing inner functions to access outer scope variables.',
    tags: ['javascript', 'closures', 'scope', 'es6'],
    estimatedMinutes: 4,
    options: [
      'A function combined with its lexical environment, preserving outer variables after outer function execution.',
      'A method used to close database connections in Node.js.',
      'A syntax error when a function lacks a return statement.',
      'An event listener attached to the window object.',
    ],
    correctAnswer:
      'A function combined with its lexical environment, preserving outer variables after outer function execution.',
    explanationMarkdown:
      'A closure gives an inner function access to an outer function’s scope variables even after the outer function has finished executing.\n\n### Common Use Cases:\n1. Data privacy / encapsulation (emulating private variables).\n2. Function currying and partial application.\n3. Custom hooks in React (`useState` relies on closures under the hood).',
    interviewTip:
      'When asked about closures, give a simple counter example. Explain that the count variable is hidden from global scope and only modified through returned inner methods.',
    codeSnippet: `function createCounter() {
  let count = 0; // Private variable via closure
  return {
    increment: () => ++count,
    getCount: () => count,
  };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.getCount());  // 1`,
    sources: [
      {
        name: 'MDN Web Docs — Closures',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures',
      },
    ],
  },
  {
    id: 'q-js-02',
    title: 'How does the JavaScript Event Loop process Call Stack and Microtask Queue?',
    slug: 'javascript-event-loop-microtasks',
    category: 'JavaScript',
    topic: 'Asynchronous JS',
    difficulty: 'Intermediate',
    type: 'Multiple Choice',
    shortSummary:
      'The Event Loop executes all synchronous code on the call stack first, then drains the entire Microtask Queue before task queues.',
    tags: ['javascript', 'event-loop', 'async', 'promises'],
    estimatedMinutes: 5,
    options: [
      'Drains call stack, drains microtasks (Promises/queueMicrotask), then processes single macrotask (setTimeout).',
      'Executes setTimeout before Promise handlers.',
      'Processes microtasks and macrotasks in random order.',
      'Runs async functions on separate multi-threaded CPU threads.',
    ],
    correctAnswer:
      'Drains call stack, drains microtasks (Promises/queueMicrotask), then processes single macrotask (setTimeout).',
    explanationMarkdown:
      'JavaScript is single-threaded. The Event Loop orchestrates async execution:\n1. **Call Stack**: Executes synchronous code.\n2. **Microtask Queue**: Promises (`.then`), `queueMicrotask`, `MutationObserver`. Entire queue is drained before next rendering.\n3. **Macrotask Queue**: `setTimeout`, `setInterval`, `requestAnimationFrame`.',
    interviewTip:
      'Walk through output order questions line-by-line: Synchronous logs print first, Promise.then callbacks run second, and setTimeout callbacks run last.',
    codeSnippet: `console.log('1'); // Sync

setTimeout(() => console.log('2'), 0); // Macrotask

Promise.resolve().then(() => console.log('3')); // Microtask

console.log('4'); // Sync

// Output Order: 1 -> 4 -> 3 -> 2`,
    sources: [
      {
        name: 'MDN Web Docs — In-depth guide to Event Loop',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop',
      },
    ],
  },
  {
    id: 'q-js-03',
    title:
      'True or False: Promises created with Promise.all() resolve even if one promise rejects.',
    slug: 'promise-all-rejection-behavior',
    category: 'JavaScript',
    topic: 'Promises',
    difficulty: 'Junior',
    type: 'True/False',
    shortSummary:
      'False. Promise.all() fails fast and immediately rejects as soon as any single input promise rejects.',
    tags: ['javascript', 'promises', 'async', 'es6'],
    estimatedMinutes: 3,
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanationMarkdown:
      '**False.** `Promise.all()` rejects immediately if any promise in the array fails (short-circuiting). If you want all promises to settle regardless of outcome (rejections or fulfillments), use `Promise.allSettled()`.',
    interviewTip:
      'Differentiate Promise.all() (all or nothing) from Promise.allSettled() (get status report of all promises regardless of failure).',
    codeSnippet: `// Rejects immediately on first failure
Promise.all([fetchUser(), fetchFailedApi()])
  .catch(err => console.error('Fails fast:', err));`,
    sources: [
      {
        name: 'MDN Web Docs — Promise.all()',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all',
      },
    ],
  },
  {
    id: 'q-js-04',
    title: 'What is the key difference between == and === operators in JavaScript?',
    slug: 'loose-vs-strict-equality-operators',
    category: 'JavaScript',
    topic: 'Coercion & Equality',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      '== performs implicit type coercion before comparing values, whereas === checks both value equality and strict type equality.',
    tags: ['javascript', 'operators', 'equality', 'types'],
    estimatedMinutes: 2,
    options: [
      '== performs type coercion before comparison; === compares both value and type without coercion.',
      '=== is for numbers and == is for strings.',
      '== is faster than ===.',
      '=== converts objects to booleans automatically.',
    ],
    correctAnswer:
      '== performs type coercion before comparison; === compares both value and type without coercion.',
    explanationMarkdown:
      "`==` (loose equality) converts operands to a common type before evaluation, leading to confusing results like `'0' == 0` (true) or `[] == false` (true). `===` (strict equality) checks value and type without coercion.",
    interviewTip:
      'Always recommend using === in production code to avoid subtle bugs caused by implicit JavaScript type coercion.',
    codeSnippet: `console.log(5 == '5');  // true (type coercion)
console.log(5 === '5'); // false (strict type check)`,
    sources: [
      {
        name: 'MDN Web Docs — Equality comparisons',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness',
      },
    ],
  },
  {
    id: 'q-js-05',
    title: 'How does keyword "this" get determined in regular functions versus arrow functions?',
    slug: 'this-keyword-regular-vs-arrow-functions',
    category: 'JavaScript',
    topic: 'Functions & Execution Context',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Regular functions bind "this" dynamically based on invocation, while arrow functions capture "this" lexically from surrounding scope.',
    tags: ['javascript', 'this', 'arrow-functions', 'functions'],
    estimatedMinutes: 4,
    options: [
      'Regular functions bind "this" dynamically at call-time; arrow functions capture "this" lexically from enclosing scope.',
      'Arrow functions create a new "this" context every time they are called.',
      'Regular functions cannot be called as object methods.',
      'There is no difference in "this" behavior.',
    ],
    correctAnswer:
      'Regular functions bind "this" dynamically at call-time; arrow functions capture "this" lexically from enclosing scope.',
    explanationMarkdown:
      'In regular functions, `this` depends on how the function is invoked (e.g. method call, standalone call, call/apply/bind). Arrow functions do NOT have their own `this` binding; they inherit `this` lexically from their enclosing parent scope.',
    interviewTip:
      'Remember: Arrow functions cannot be used as constructors (with `new`) and do not have an `arguments` object.',
    codeSnippet: `const obj = {
  name: 'InterviewHub',
  regular: function() { console.log(this.name); },
  arrow: () => { console.log(this.name); },
};

obj.regular(); // "InterviewHub"
obj.arrow();   // undefined (global scope)`,
    sources: [
      {
        name: 'MDN Web Docs — Arrow function expressions',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions',
      },
    ],
  },

  // React (6 questions)
  {
    id: 'q-react-01',
    title: 'What is the Virtual DOM in React and how does reconciliation work?',
    slug: 'virtual-dom-reconciliation-react',
    category: 'React',
    topic: 'Virtual DOM',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'The Virtual DOM is a lightweight in-memory representation of real DOM. React diffs it against previous state to apply minimal updates.',
    tags: ['react', 'virtual-dom', 'reconciliation', 'core'],
    estimatedMinutes: 3,
    options: [
      'An in-memory object tree diffed against previous state to batch minimal real DOM updates.',
      'A direct copy of browser HTML saved on local disk.',
      'A browser plugin required to run React applications.',
      'A CSS preprocessor built into React compiler.',
    ],
    correctAnswer:
      'An in-memory object tree diffed against previous state to batch minimal real DOM updates.',
    explanationMarkdown:
      'Direct DOM manipulation is slow. React creates a lightweight Virtual DOM (tree of JavaScript objects). When state changes:\n1. React renders a new Virtual DOM tree.\n2. **Diffing Algorithm**: Compares new VDOM with previous VDOM.\n3. **Reconciliation**: Batches and applies only the changed elements to the real browser DOM.',
    interviewTip:
      'Highlight that Virtual DOM provides developer productivity and consistent declarative rendering across platforms (React Native, Web).',
    codeSnippet: `// React Element (Virtual DOM Node representation)
const element = {
  type: 'h1',
  props: { className: 'title', children: 'Hello React' }
};`,
    sources: [
      {
        name: 'React Docs — Preserving and Resetting State',
        url: 'https://react.dev/learn/preserving-and-resetting-state',
      },
    ],
  },
  {
    id: 'q-react-02',
    title: 'When and why should you pass a cleanup function inside useEffect?',
    slug: 'useeffect-cleanup-function-use-cases',
    category: 'React',
    topic: 'React Hooks',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Cleanup functions run before component unmount or re-render to cancel subscriptions, clear timers, and prevent memory leaks.',
    tags: ['react', 'useeffect', 'hooks', 'lifecycle'],
    estimatedMinutes: 4,
    options: [
      'To unsubscribe from events, clear timers, or abort fetch requests before unmounting/re-rendering.',
      'To reset component state back to initial default props.',
      'To force synchronous DOM reflows.',
      'To clear local browser cache automatically.',
    ],
    correctAnswer:
      'To unsubscribe from events, clear timers, or abort fetch requests before unmounting/re-rendering.',
    explanationMarkdown:
      'The cleanup function returned by `useEffect` runs before the component unmounts or before the effect re-runs on dependency changes.\n\n### Common Use Cases:\n- `removeEventListener` for window scroll/resize events\n- `clearInterval` / `clearTimeout`\n- `controller.abort()` for AbortController fetch requests.',
    interviewTip:
      'Emphasize memory leak prevention. Give an example of removing event listeners so unmounted components do not keep background listeners active.',
    codeSnippet: `useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);

  // Cleanup function
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);`,
    sources: [
      {
        name: 'React Docs — Synchronizing with Effects',
        url: 'https://react.dev/learn/synchronizing-with-effects',
      },
    ],
  },
  {
    id: 'q-react-03',
    title:
      'True or False: React state updates made via useState setter functions are asynchronous and batched.',
    slug: 'react-state-batching-behavior',
    category: 'React',
    topic: 'State Management',
    difficulty: 'Junior',
    type: 'True/False',
    shortSummary:
      'True. React batches multiple state updates inside event handlers into a single re-render for performance optimization.',
    tags: ['react', 'usestate', 'batching', 'rendering'],
    estimatedMinutes: 3,
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanationMarkdown:
      '**True.** React batches state updates to prevent multiple expensive re-renders within a single event loop tick. To compute new state based on previous state reliably, use the functional update form: `setCount(prev => prev + 1)`.',
    interviewTip:
      'Show functional state updater syntax `setCount(prev => prev + 1)` when multiple state calls happen consecutively.',
    codeSnippet: `// Functional updater ensures correct calculation
setCount(prev => prev + 1);
setCount(prev => prev + 1);`,
    sources: [
      {
        name: 'React Docs — Queueing a Series of State Updates',
        url: 'https://react.dev/learn/queueing-a-series-of-state-updates',
      },
    ],
  },
  {
    id: 'q-react-04',
    title: 'What is the primary difference between useMemo and useCallback hooks?',
    slug: 'usememo-vs-usecallback-difference',
    category: 'React',
    topic: 'Performance Optimization',
    difficulty: 'Intermediate',
    type: 'Multiple Choice',
    shortSummary:
      'useMemo memoizes the result of a computed calculation, whereas useCallback memoizes a function instance reference between renders.',
    tags: ['react', 'usememo', 'usecallback', 'performance'],
    estimatedMinutes: 4,
    options: [
      'useMemo caches calculated return values; useCallback caches function instance references.',
      'useMemo is for API fetching; useCallback is for styling.',
      'useCallback runs before render; useMemo runs after render.',
      'They are aliases for the exact same underlying hook.',
    ],
    correctAnswer:
      'useMemo caches calculated return values; useCallback caches function instance references.',
    explanationMarkdown:
      '- `useMemo(() => computeExpensiveValue(a, b), [a, b])`: Memoizes calculated data value.\n- `useCallback(() => fn(a), [a])`: Memoizes function definition to prevent child component re-renders when passed as callback prop (`React.memo`).',
    interviewTip:
      'Mention premature optimization warning: Don’t wrap every function in useCallback/useMemo unless passing to memoized children or computing heavy arrays.',
    codeSnippet: `// Caches calculation value
const memoizedValue = useMemo(() => calculateTotal(items), [items]);

// Caches function reference
const handleClick = useCallback(() => console.log('Clicked'), []);`,
    sources: [
      { name: 'React Docs — useMemo', url: 'https://react.dev/reference/react/useMemo' },
      { name: 'React Docs — useCallback', url: 'https://react.dev/reference/react/useCallback' },
    ],
  },
  {
    id: 'q-react-05',
    title: 'Why are keys important when rendering lists in React components?',
    slug: 'importance-of-keys-in-react-lists',
    category: 'React',
    topic: 'Lists & Keys',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'Keys give array elements stable identities so React can efficiently track insertions, deletions, and re-orders during reconciliation.',
    tags: ['react', 'keys', 'lists', 'rendering'],
    estimatedMinutes: 3,
    options: [
      'They provide stable identities for list items during virtual DOM diffing.',
      'They encrypt list items before sending to server.',
      'They are required for CSS flexbox styling.',
      'They automatically sort array items alphabetically.',
    ],
    correctAnswer: 'They provide stable identities for list items during virtual DOM diffing.',
    explanationMarkdown:
      'Keys help React identify which items have changed, been added, or been removed. Unique keys (like database IDs) allow React to reuse existing DOM nodes rather than recreating entire lists on re-order.',
    interviewTip:
      'Warn against using array index as key when list order can change, as it can cause state bugs in child inputs.',
    codeSnippet: `// Good: Unique database ID as key
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}`,
    sources: [
      { name: 'React Docs — Rendering Lists', url: 'https://react.dev/learn/rendering-lists' },
    ],
  },
  {
    id: 'q-react-06',
    title: 'What is the purpose of React.memo higher-order component?',
    slug: 'react-memo-higher-order-component',
    category: 'React',
    topic: 'Performance Optimization',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'React.memo skips re-rendering a component if its incoming props have not shallowly changed between renders.',
    tags: ['react', 'react-memo', 'hoc', 'performance'],
    estimatedMinutes: 3,
    options: [
      'It memoizes a component render output, skipping re-renders when props remain unchanged.',
      'It creates global state accessible by all components.',
      'It converts class components into functional components.',
      'It automatically handles API error boundaries.',
    ],
    correctAnswer:
      'It memoizes a component render output, skipping re-renders when props remain unchanged.',
    explanationMarkdown:
      '`React.memo` is a Higher-Order Component that wraps a functional component. It performs a shallow comparison of current props versus next props and skips re-rendering if props are equal.',
    interviewTip:
      'Explain shallow comparison: Object/function props will recreate reference on parent render unless wrapped in useMemo/useCallback.',
    codeSnippet: `const MyComponent = React.memo(function MyComponent(props) {
  return <div>{props.title}</div>;
});`,
    sources: [{ name: 'React Docs — memo', url: 'https://react.dev/reference/react/memo' }],
  },

  // TypeScript (5 questions)
  {
    id: 'q-ts-01',
    title: 'What is the key difference between Interface and Type alias in TypeScript?',
    slug: 'typescript-interface-vs-type-alias',
    category: 'TypeScript',
    topic: 'Type Systems',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Interfaces are extendable via declaration merging and inheritance, while Type aliases can represent unions, primitives, and tuples.',
    tags: ['typescript', 'interface', 'type-alias', 'types'],
    estimatedMinutes: 4,
    options: [
      'Interfaces support declaration merging and OOP extends; Types support unions, primitives, and intersections.',
      'Type aliases are compiled to JavaScript objects; Interfaces are deleted.',
      'Interfaces cannot define object shapes.',
      'Types only work with numbers and booleans.',
    ],
    correctAnswer:
      'Interfaces support declaration merging and OOP extends; Types support unions, primitives, and intersections.',
    explanationMarkdown:
      '- **Interface**: Best for object shapes and OOP inheritance (`extends`). Supports declaration merging (multiple `interface User` declarations merge).\n- **Type**: Best for unions (`type Status = "pending" | "approved"`), primitives, tuples, and mapped types.',
    interviewTip:
      'State your team rule of thumb: Use interface for component props and object shapes; use type for unions and utility aliases.',
    codeSnippet: `// Type Union
type Status = 'loading' | 'success' | 'error';

// Interface Object Shape
interface User {
  id: string;
  name: string;
}`,
    sources: [
      {
        name: 'TypeScript Handbook — Differences Between Type Aliases and Interfaces',
        url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces',
      },
    ],
  },
  {
    id: 'q-ts-02',
    title: 'How does type narrowing work with discriminant unions in TypeScript?',
    slug: 'typescript-discriminant-unions-narrowing',
    category: 'TypeScript',
    topic: 'Type Narrowing',
    difficulty: 'Intermediate',
    type: 'Multiple Choice',
    shortSummary:
      'Discriminant unions use a shared literal property (like type or status) to allow the compiler to narrow complex object branches.',
    tags: ['typescript', 'narrowing', 'unions', 'type-safety'],
    estimatedMinutes: 5,
    options: [
      'Using a common literal discriminator property (e.g. status) to narrow object types in switch statements.',
      'Using try/catch blocks around every TypeScript function.',
      'Converting all types to any before calling properties.',
      'Disabling strict null checks in tsconfig.json.',
    ],
    correctAnswer:
      'Using a common literal discriminator property (e.g. status) to narrow object types in switch statements.',
    explanationMarkdown:
      'A discriminated union is a pattern where every object in a union contains a common property with literal types (the "discriminant"). Checking this property inside a `switch` or `if` narrows the object type automatically.',
    interviewTip:
      'Mention that discriminant unions make state machines (like Redux or async state handling) completely type-safe.',
    codeSnippet: `type Response =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string };

function handle(res: Response) {
  if (res.status === 'success') {
    console.log(res.data); // Narrowed safely!
  } else {
    console.error(res.message);
  }
}`,
    sources: [
      {
        name: 'TypeScript Handbook — Discriminated Unions',
        url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions',
      },
    ],
  },
  {
    id: 'q-ts-03',
    title:
      'True or False: The unknown type is safer than the any type because operations on unknown require type checking.',
    slug: 'typescript-unknown-vs-any-safety',
    category: 'TypeScript',
    topic: 'Type Safety',
    difficulty: 'Beginner',
    type: 'True/False',
    shortSummary:
      'True. unknown forces developers to perform type checks or assertions before invoking methods or performing arithmetic.',
    tags: ['typescript', 'unknown', 'any', 'strict-mode'],
    estimatedMinutes: 2,
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanationMarkdown:
      '**True.** `any` disables all type checking. `unknown` represents any value, but TypeScript blocks method invocation or property access until type guard narrowing (e.g. `typeof x === "string"`) is performed.',
    interviewTip:
      'Recommend using unknown over any for external dynamic data (like JSON.parse or unknown API responses).',
    codeSnippet: `let val: unknown = 'Hello';
// val.toUpperCase(); // Error: Type is unknown

if (typeof val === 'string') {
  console.log(val.toUpperCase()); // Safe!
}`,
    sources: [
      {
        name: 'TypeScript Handbook — Unknown',
        url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown',
      },
    ],
  },
  {
    id: 'q-ts-04',
    title: 'What is the purpose of TypeScript Generics in reusable components?',
    slug: 'typescript-generics-reusable-components',
    category: 'TypeScript',
    topic: 'Generics',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Generics allow functions and classes to capture type variables, enforcing type safety without locking logic to a single data type.',
    tags: ['typescript', 'generics', 'reusability', 'type-safety'],
    estimatedMinutes: 4,
    options: [
      'They allow passing type variables to functions/interfaces to enforce type safety across varying data types.',
      'They automatically generate database schemas at compile time.',
      'They allow writing TypeScript without type annotations.',
      'They convert asynchronous code to synchronous code.',
    ],
    correctAnswer:
      'They allow passing type variables to functions/interfaces to enforce type safety across varying data types.',
    explanationMarkdown:
      'Generics allow creating components or utility functions that work over a variety of types rather than a single one, while retaining type safety.',
    interviewTip: 'Give example of generic ApiResponse<T> where T represents payload data model.',
    codeSnippet: `interface ApiResponse<T> {
  data: T;
  status: number;
}

const userRes: ApiResponse<{ name: string }> = {
  data: { name: 'Alex' },
  status: 200,
};`,
    sources: [
      {
        name: 'TypeScript Handbook — Generics',
        url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
      },
    ],
  },
  {
    id: 'q-ts-05',
    title: 'What do built-in utility types Partial<T> and Readonly<T> accomplish?',
    slug: 'typescript-utility-types-partial-readonly',
    category: 'TypeScript',
    topic: 'Utility Types',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Partial<T> makes all properties optional, whereas Readonly<T> marks all properties immutably read-only after assignment.',
    tags: ['typescript', 'utility-types', 'partial', 'readonly'],
    estimatedMinutes: 3,
    options: [
      'Partial<T> sets all properties to optional; Readonly<T> prevents property mutations.',
      'Partial<T> deletes properties; Readonly<T> converts properties to strings.',
      'Readonly<T> makes objects private to local scope.',
      'They perform runtime Object.freeze calls.',
    ],
    correctAnswer:
      'Partial<T> sets all properties to optional; Readonly<T> prevents property mutations.',
    explanationMarkdown:
      '- `Partial<T>`: Constructs a type with all properties of T set to optional (`?`). Great for update form payloads.\n- `Readonly<T>`: Constructs a type with all properties of T set to `readonly`. Modifying properties triggers compiler errors.',
    interviewTip:
      'Mention other common utility types like Pick<T, K>, Omit<T, K>, and Record<K, T>.',
    codeSnippet: `interface User { id: string; name: string; }

type UpdateUserDto = Partial<User>; // { id?: string; name?: string; }
type ImmutableUser = Readonly<User>;`,
    sources: [
      {
        name: 'TypeScript Handbook — Utility Types',
        url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html',
      },
    ],
  },

  // Web Fundamentals (5 questions)
  {
    id: 'q-wf-01',
    title: 'What happens step-by-step when you type a URL into the browser address bar?',
    slug: 'browser-url-request-lifecycle',
    category: 'Web Fundamentals',
    topic: 'Browser Architecture',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'DNS lookup resolves IP, TCP handshake establishes connection, TLS handshake secures it, HTTP request sent, HTML parsed into DOM.',
    tags: ['web-fundamentals', 'browser', 'dns', 'http'],
    estimatedMinutes: 5,
    options: [
      'DNS resolution -> TCP 3-way handshake -> TLS handshake -> HTTP GET request -> Server Response -> DOM/CSSOM parsing & rendering.',
      'Browser downloads JavaScript engine first, then contacts server.',
      'Server compiles HTML to C++ binary before sending to client.',
      'DNS sends HTML file directly to user CPU.',
    ],
    correctAnswer:
      'DNS resolution -> TCP 3-way handshake -> TLS handshake -> HTTP GET request -> Server Response -> DOM/CSSOM parsing & rendering.',
    explanationMarkdown:
      '1. **DNS Lookup**: Resolves domain name into IP address.\n2. **TCP Handshake**: SYN, SYN-ACK, ACK to connect.\n3. **TLS Handshake**: Negotiates encryption keys for HTTPS.\n4. **HTTP Request/Response**: Server returns HTML payload.\n5. **Rendering Engine**: Parses HTML into DOM, CSS into CSSOM, calculates layout, paints pixels.',
    interviewTip:
      'Walk through stages sequentially: Network resolution -> Transport security -> HTTP payload -> Browser Critical Rendering Path.',
    codeSnippet: `DNS -> TCP -> TLS -> HTTP GET -> DOM Parsing -> Layout -> Paint`,
    sources: [
      {
        name: 'MDN Web Docs — Populating the page: how browsers work',
        url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work',
      },
    ],
  },
  {
    id: 'q-wf-02',
    title: 'What is CORS (Cross-Origin Resource Sharing) and why does the browser enforce it?',
    slug: 'cors-cross-origin-resource-sharing',
    category: 'Web Fundamentals',
    topic: 'Web Security',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'CORS is a browser security mechanism that uses HTTP headers to restrict cross-origin HTTP requests initiated from scripts.',
    tags: ['web-fundamentals', 'cors', 'security', 'http'],
    estimatedMinutes: 4,
    options: [
      'A browser security mechanism using HTTP headers to allow or block cross-origin requests.',
      'A server firewall that blocks requests from mobile phones.',
      'A database query optimization protocol.',
      'An authentication token standard replacing JWT.',
    ],
    correctAnswer:
      'A browser security mechanism using HTTP headers to allow or block cross-origin requests.',
    explanationMarkdown:
      'Browsers enforce the **Same-Origin Policy** (SOP) by default (matching protocol, domain, port). CORS allows servers to specify which external origins are allowed to read responses via `Access-Control-Allow-Origin` headers.',
    interviewTip:
      'Clarify: CORS is enforced by the BROWSER, not the server. The server still processes the request, but browser blocks JS from reading the response if CORS headers fail.',
    codeSnippet: `/* Server Response Header */
Access-Control-Allow-Origin: https://interviewhub.dev
Access-Control-Allow-Methods: GET, POST, OPTIONS`,
    sources: [
      {
        name: 'MDN Web Docs — Cross-Origin Resource Sharing (CORS)',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
      },
    ],
  },
  {
    id: 'q-wf-03',
    title:
      'True or False: HTTP/2 allows multiplexing multiple requests over a single TCP connection.',
    slug: 'http2-multiplexing-feature',
    category: 'Web Fundamentals',
    topic: 'HTTP Protocols',
    difficulty: 'Intermediate',
    type: 'True/False',
    shortSummary:
      'True. HTTP/2 multiplexing eliminates head-of-line blocking by sending concurrent request frames interleaved over one TCP pipe.',
    tags: ['web-fundamentals', 'http2', 'networking', 'performance'],
    estimatedMinutes: 3,
    options: ['True', 'False'],
    correctAnswer: 'True',
    explanationMarkdown:
      '**True.** HTTP/1.1 required separate TCP connections or serial head-of-line blocking. HTTP/2 splits messages into binary frames and interleaves them concurrently over a single TCP connection.',
    interviewTip: 'Mention that HTTP/2 also supports Server Push and Header Compression (HPACK).',
    codeSnippet: `HTTP/1.1: Request 1 -> Wait -> Request 2 -> Wait
HTTP/2:   Stream 1 & Stream 2 & Stream 3 (Concurrent Multiplexing)`,
    sources: [
      {
        name: 'MDN Web Docs — Introduction to HTTP/2',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/HTTP_2',
      },
    ],
  },
  {
    id: 'q-wf-04',
    title: 'What is the key difference between localStorage, sessionStorage, and Cookies?',
    slug: 'localstorage-sessionstorage-cookies-comparison',
    category: 'Web Fundamentals',
    topic: 'Browser Storage',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'localStorage persists until cleared, sessionStorage clears on tab close, and Cookies send storage data with every HTTP request.',
    tags: ['web-fundamentals', 'storage', 'cookies', 'browser'],
    estimatedMinutes: 3,
    options: [
      'localStorage persists across sessions; sessionStorage clears on tab close; Cookies attach to HTTP requests.',
      'Cookies hold 5MB data; localStorage holds 4KB data.',
      'sessionStorage saves data permanently on server hard drive.',
      'localStorage data is automatically sent in HTTP header.',
    ],
    correctAnswer:
      'localStorage persists across sessions; sessionStorage clears on tab close; Cookies attach to HTTP requests.',
    explanationMarkdown:
      '- **localStorage**: 5MB+, persists permanently until explicitly deleted.\n- **sessionStorage**: 5MB+, scope tied to current browser tab.\n- **Cookies**: ~4KB, sent automatically in HTTP headers (`Cookie`), supports `HttpOnly` security flag.',
    interviewTip:
      'Highlight HttpOnly cookies for sensitive auth tokens to prevent XSS script theft.',
    codeSnippet: `// Local Storage
localStorage.setItem('theme', 'dark');

// Session Storage
sessionStorage.setItem('tempKey', '12345');`,
    sources: [
      {
        name: 'MDN Web Docs — Window.localStorage',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage',
      },
    ],
  },
  {
    id: 'q-wf-05',
    title: 'What are Core Web Vitals (LCP, FID/INP, CLS) and why do they matter?',
    slug: 'core-web-vitals-performance-metrics',
    category: 'Web Fundamentals',
    topic: 'Web Performance',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'Core Web Vitals measure user experience metrics: LCP (loading speed), INP (interactivity responsiveness), and CLS (visual stability).',
    tags: ['web-fundamentals', 'performance', 'web-vitals', 'seo'],
    estimatedMinutes: 4,
    options: [
      'Google metrics measuring loading (LCP), responsiveness (INP/FID), and layout stability (CLS).',
      'Security protocols for checking SSL certificates.',
      'Database indexing rules for faster SQL joins.',
      'HTML validator tests run by W3C.',
    ],
    correctAnswer:
      'Google metrics measuring loading (LCP), responsiveness (INP/FID), and layout stability (CLS).',
    explanationMarkdown:
      '1. **LCP (Largest Contentful Paint)**: Measures loading performance (< 2.5s).\n2. **INP (Interaction to Next Paint)**: Measures page responsiveness to clicks (< 200ms).\n3. **CLS (Cumulative Layout Shift)**: Measures visual layout shifts during page render (< 0.1).',
    interviewTip:
      'Mention that images without set width/height cause bad CLS scores because layout shifts when image downloads finish.',
    codeSnippet: `<!-- Set width/height on images to prevent CLS layout shifts -->
<img src="banner.webp" width="800" height="400" alt="Banner" />`,
    sources: [{ name: 'web.dev — Core Web Vitals Overview', url: 'https://web.dev/vitals/' }],
  },

  // Git (5 questions)
  {
    id: 'q-git-01',
    title: 'What is the primary difference between git merge and git rebase?',
    slug: 'git-merge-vs-git-rebase',
    category: 'Git',
    topic: 'Branching Workflows',
    difficulty: 'Junior',
    type: 'Multiple Choice',
    shortSummary:
      'git merge creates a new merge commit combining history, while git rebase rewrites linear commit history on top of base branch.',
    tags: ['git', 'merge', 'rebase', 'version-control'],
    estimatedMinutes: 4,
    options: [
      'git merge preserves true chronological history via merge commit; git rebase rewrites linear history onto target branch.',
      'git rebase deletes your branch commits permanently.',
      'git merge can only be run by repository owners.',
      'There is no difference in commit history.',
    ],
    correctAnswer:
      'git merge preserves true chronological history via merge commit; git rebase rewrites linear history onto target branch.',
    explanationMarkdown:
      '- `git merge feature`: Creates a non-destructive merge commit, preserving exact historical commit timestamps.\n- `git rebase main`: Moves feature branch commits onto top of latest main branch, creating a clean linear project history.',
    interviewTip:
      'Golden Rule of Rebase: Never rebase commits that have already been pushed to a public/shared branch.',
    codeSnippet: `# Merge approach
git checkout main
git merge feature-auth

# Rebase approach
git checkout feature-auth
git rebase main`,
    sources: [
      {
        name: 'Git Official Docs — Merging vs Rebasing',
        url: 'https://git-scm.com/book/en/v2/Git-Branching-Rebasing',
      },
    ],
  },
  {
    id: 'q-git-02',
    title: 'How does git stash help during context switching in working directories?',
    slug: 'git-stash-command-usage',
    category: 'Git',
    topic: 'Worktree Management',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'git stash temporarily shelves uncommitted modifications so you can switch branches cleanly without committing incomplete work.',
    tags: ['git', 'stash', 'workflow', 'command-line'],
    estimatedMinutes: 3,
    options: [
      'Temporarily saves modified tracked files on a stack without committing.',
      'Deletes uncommitted files permanently.',
      'Pushes uncommitted code directly to remote origin.',
      'Creates a new git repository.',
    ],
    correctAnswer: 'Temporarily saves modified tracked files on a stack without committing.',
    explanationMarkdown:
      '`git stash` takes your uncommitted dirty working directory changes, saves them on a stack, and reverts your working directory back to HEAD commit.',
    interviewTip:
      'Know the main commands: git stash, git stash pop (apply and remove from stack), git stash list.',
    codeSnippet: `git stash             # Save uncommitted changes
git checkout hotfix   # Switch branch cleanly
# ... fix bug ...
git checkout feature
git stash pop         # Re-apply stashed changes`,
    sources: [{ name: 'Git Official Docs — git-stash', url: 'https://git-scm.com/docs/git-stash' }],
  },
  {
    id: 'q-git-03',
    title: 'True or False: git reset --hard preserves local changes in your working directory.',
    slug: 'git-reset-hard-destructive-nature',
    category: 'Git',
    topic: 'Undo & Reset',
    difficulty: 'Junior',
    type: 'True/False',
    shortSummary:
      'False. git reset --hard destructively discards all uncommitted modifications and resets staging and working tree to target commit.',
    tags: ['git', 'reset', 'destructive', 'history'],
    estimatedMinutes: 2,
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanationMarkdown:
      '**False.** `git reset --hard` is a destructive operation. It resets the index and working directory, discarding all uncommitted changes since target commit.',
    interviewTip:
      'Differentiate reset modes: --soft (keeps changes staged), --mixed (keeps changes in working directory unstaged), --hard (discards changes entirely).',
    codeSnippet: `git reset --hard HEAD~1 # Destructively removes last commit & changes`,
    sources: [{ name: 'Git Official Docs — git-reset', url: 'https://git-scm.com/docs/git-reset' }],
  },
  {
    id: 'q-git-04',
    title: 'What does git cherry-pick accomplish in multi-branch repositories?',
    slug: 'git-cherry-pick-single-commit',
    category: 'Git',
    topic: 'Advanced Git',
    difficulty: 'Intermediate',
    type: 'Multiple Choice',
    shortSummary:
      'git cherry-pick applies the exact changes introduced by a specific existing commit from another branch onto your current branch.',
    tags: ['git', 'cherry-pick', 'commits', 'branches'],
    estimatedMinutes: 4,
    options: [
      'Applies the change introduced by a specific existing commit from another branch to the current branch.',
      'Deletes specified commit from remote repository.',
      'Selects best commit based on code style.',
      'Creates a pull request automatically.',
    ],
    correctAnswer:
      'Applies the change introduced by a specific existing commit from another branch to the current branch.',
    explanationMarkdown:
      '`git cherry-pick <commit-hash>` picks a single commit from any branch and applies its patch onto your current active branch.',
    interviewTip:
      'Use case: Porting a urgent hotfix commit from main branch back into an ongoing release branch.',
    codeSnippet: `git checkout release-v1.2
git cherry-pick a1b2c3d4 # Apply single hotfix commit`,
    sources: [
      {
        name: 'Git Official Docs — git-cherry-pick',
        url: 'https://git-scm.com/docs/git-cherry-pick',
      },
    ],
  },
  {
    id: 'q-git-05',
    title: 'How do merge conflicts occur and how are they resolved in Git?',
    slug: 'git-merge-conflict-resolution',
    category: 'Git',
    topic: 'Conflict Resolution',
    difficulty: 'Beginner',
    type: 'Multiple Choice',
    shortSummary:
      'Merge conflicts occur when competing edits are made to the same line. Developers resolve conflict markers manually and commit.',
    tags: ['git', 'merge-conflict', 'resolution', 'workflow'],
    estimatedMinutes: 3,
    options: [
      'When competing edits occur on same lines. Resolved by editing conflict markers (<<<<<<< / >>>>>>>) and staging.',
      'When two developers use different OS versions.',
      'When git repository runs out of disk storage space.',
      'When commit messages contain special characters.',
    ],
    correctAnswer:
      'When competing edits occur on same lines. Resolved by editing conflict markers (<<<<<<< / >>>>>>>) and staging.',
    explanationMarkdown:
      'Git inserts conflict markers:\n`<<<<<<< HEAD` (current branch)\n`=======` (separator)\n`>>>>>>> branch` (incoming branch)\nDevelopers resolve conflicts manually, remove markers, stage via `git add`, and run `git commit`.',
    interviewTip:
      'Emphasize communication: If unsure about conflicting code, talk to the teammate who wrote the competing lines before resolving.',
    codeSnippet: `<<<<<<< HEAD
const apiUrl = 'https://api.v1.dev';
=======
const apiUrl = 'https://api.v2.dev';
>>>>>>> feature-api-v2`,
    sources: [
      {
        name: 'Git Official Docs — Basic Merge Conflicts',
        url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging#_basic_merge_conflicts',
      },
    ],
  },
];
