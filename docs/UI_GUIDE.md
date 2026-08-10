# Design System & UI/UX Guidelines — InterviewHub

## 1. Design Philosophy
InterviewHub is a professional developer education platform. The design system emphasizes:
- **High Readability & Scannability**: Strong typography contrast, clear element boundaries, and clean hierarchy for reading code and technical explanations.
- **Developer-Centric Aesthetic**: Clean dark neutral surfaces (`slate-900`/`slate-800`) paired with vibrant brand highlights (`indigo-600`/`indigo-500`).
- **Restraint Over Clutter**: Avoids excessive glassmorphism, decorative floating gradients, oversized typography, or unnecessary animations.
- **Accessibility First**: Built to comply with **WCAG 2.1 Level AA** standards (high-contrast focus rings, semantic HTML elements, screen reader ARIA roles).

---

## 2. Color Palette & Token System

All color tokens map directly to standard Tailwind CSS palettes:

| Palette Role | Tailwind Token | Hex / Value | Application |
|---|---|---|---|
| **Primary Brand** | `indigo-600` / `indigo-500` | `#4f46e5` / `#6366f1` | Main CTA buttons, active tab indicators, brand highlights |
| **Neutral Surface** | `slate-900` / `slate-800` | `#0f172a` / `#1e293b` | Page background, cards, input backgrounds, modal surfaces |
| **Neutral Text** | `slate-100` / `slate-300` / `slate-400` | `#f8fafc` / `#cbd5e1` | Primary headings, body text, secondary captions |
| **Success / Easy** | `emerald-500` / `emerald-400` | `#10b981` / `#34d399` | Correct quiz answers, Easy difficulty, success alerts |
| **Warning / Medium** | `amber-500` / `amber-400` | `#f59e0b` / `#fbbf24` | Medium difficulty, weak topic warnings (< 70% threshold) |
| **Danger / Hard** | `rose-600` / `rose-500` | `#e11d48` / `#f43f5e` | Incorrect answers, Hard difficulty, error banners, destructive actions |
| **Info / Secondary** | `cyan-500` / `cyan-400` | `#06b6d4` / `#22d3ee` | Junior badges, informational callouts |

> [!NOTE]
> Do NOT introduce arbitrary custom hex values in inline styles. Always rely on predefined Tailwind design tokens.

---

## 3. Typography Scale

InterviewHub utilizes two primary Google Fonts:
- **Body & Interface**: `Inter`, system-ui, sans-serif
- **Code & Technical Snippets**: `Fira Code`, `JetBrains Mono`, monospace

### Typography Hierarchy Scale
- **Display / Hero**: `text-3xl` / `text-4xl` (`font-bold`, `tracking-tight`)
- **Page Heading**: `text-2xl` (`font-bold`, `tracking-tight`)
- **Section Heading**: `text-lg` (`font-bold`, `leading-tight`)
- **Card Heading**: `text-base` / `text-sm` (`font-semibold`)
- **Body Text**: `text-sm` (`leading-relaxed`, `text-slate-300`)
- **Body Small / Captions**: `text-xs` (`text-slate-400`)
- **Labels & Badges**: `text-xs` / `text-[10px]` (`font-semibold`, `uppercase`)

---

## 4. Spacing Scale

Rely strictly on the 4px Tailwind spacing grid (`px-4`, `py-2`, `gap-3`, `gap-6`):
- **Component Padding**: `p-3` (small cards/inputs), `p-6` (standard cards/sections).
- **Layout Margins**: `gap-4` (form controls), `gap-8` / `gap-10` (page sections).
- **Container Boundaries**: `px-4 sm:px-6 lg:px-8` (responsive padding across viewports).

---

## 5. Border Radius System

To prevent inconsistent, messy rounded borders, the system enforces 5 strict radius tiers:
- **Small (`rounded-sm` / `rounded` - 4px)**: Checkboxes, small badges, inline code tags.
- **Medium (`rounded-md` - 6px)**: Buttons, inputs, textareas, selects, tab triggers.
- **Large (`rounded-lg` - 8px)**: Alert banners, dropdown menus, tab lists.
- **Extra Large (`rounded-xl` - 12px)**: Cards, modals, empty/error containers.
- **Full (`rounded-full` - 9999px)**: Avatars, circular indicators, pills.

---

## 6. Minimal Shadow System

Shadows are applied sparingly to enhance hierarchy without creating floating clutter:
- `shadow-subtle`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Buttons, active tabs)
- `shadow-card`: `0 4px 6px -1px rgba(0, 0, 0, 0.1)` (Cards, content containers)
- `shadow-dropdown`: `0 10px 15px -3px rgba(0, 0, 0, 0.3)` (Modals, dropdown overlays)

---

## 7. Responsive Breakpoints

Mobile-first design principles apply to all components:
- **Mobile (< 640px)**: 1-column stacked layouts, full-width buttons, compact padding (`p-4`).
- **Tablet (`sm:` 640px – `lg:` 1024px)**: 2-column grid view, responsive headers.
- **Desktop (`lg:` > 1024px / `xl:` 1280px)**: Full multi-column dashboard, max container width `max-w-screen-xl`.

---

## 8. Accessibility Standards (WCAG 2.1 Level AA)

1. **Visible Focus Indicators**: Interactive controls (`button`, `input`, `select`, `a`) use a high-contrast focus ring (`focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900`).
2. **Keyboard Navigation**: Modals close on `Escape`; dropdowns and tabs support full arrow key / tab navigation.
3. **Form Accessibility**: All input fields pair explicit `<label>` tags via `htmlFor`/`id`, and expose `aria-invalid` and `aria-describedby` when errors occur.
4. **Non-Color Reliance**: Status alerts and difficulty badges pair distinct colors with icons (`✓`, `⚠`, `✕`, `ℹ`) or text labels.

---

## 9. Global UI Components Registry (`src/components/ui/`)

| Component | File Path | Primary Props / Variants |
|---|---|---|
| **Button** | `src/components/ui/Button.tsx` | `variant` (`primary`, `secondary`, `outline`, `ghost`, `danger`), `size` (`sm`, `md`, `lg`), `isLoading` |
| **Input** | `src/components/ui/Input.tsx` | `label`, `error`, `helperText`, `leftAddon`, `rightAddon`, `disabled` |
| **Textarea** | `src/components/ui/Textarea.tsx` | `label`, `error`, `helperText`, `showCount`, `maxLength` |
| **Select** | `src/components/ui/Select.tsx` | `label`, `options`, `error`, `helperText`, `disabled` |
| **Checkbox** | `src/components/ui/Checkbox.tsx` | `label`, `description`, `error`, `disabled` |
| **Radio** | `src/components/ui/Radio.tsx` | `label`, `description`, `disabled` |
| **Badge** | `src/components/ui/Badge.tsx` | `variant` (`default`, `success`, `warning`, `danger`, `info`, `secondary`), `size` (`sm`, `md`) |
| **Card** | `src/components/ui/Card.tsx` | `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `hoverable` |
| **Modal** | `src/components/ui/Modal.tsx` | `isOpen`, `onClose`, `title`, `description`, `children`, `footer`, `maxWidth` |
| **Dropdown** | `src/components/ui/Dropdown.tsx` | `trigger`, `children`, `align` (`left`, `right`), `DropdownItem` |
| **Tabs** | `src/components/ui/Tabs.tsx` | `Tabs`, `TabList`, `TabTrigger`, `TabPanel`, `defaultValue` |
| **Progress** | `src/components/ui/Progress.tsx` | `value` (0-100), `showValue`, `variant` (`default`, `success`, `warning`, `danger`), `size` |
| **Skeleton** | `src/components/ui/Skeleton.tsx` | `variant` (`text`, `circular`, `rectangular`), `width`, `height` |
| **Spinner** | `src/components/ui/Spinner.tsx` | `size` (`sm`, `md`, `lg`) |
| **Alert** | `src/components/ui/Alert.tsx` | `variant` (`info`, `success`, `warning`, `error`), `title`, `onDismiss` |
| **Tooltip** | `src/components/ui/Tooltip.tsx` | `content`, `position` (`top`, `bottom`, `left`, `right`) |
| **EmptyState** | `src/components/ui/EmptyState.tsx` | `icon`, `title`, `description`, `action` |
| **ErrorState** | `src/components/ui/ErrorState.tsx` | `title`, `message`, `onRetry` |
