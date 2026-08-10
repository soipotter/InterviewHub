import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { Radio } from '../components/ui/Radio';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { Tabs, TabList, TabTrigger, TabPanel } from '../components/ui/Tabs';
import { Progress } from '../components/ui/Progress';
import { Skeleton } from '../components/ui/Skeleton';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Tooltip } from '../components/ui/Tooltip';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const ShowcasePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [radioSelected, setRadioSelected] = useState('option-a');
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  return (
    <AppShell>
      <div className="flex flex-col gap-10 text-left pb-16">
        {/* Showcase Header Banner */}
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-6 backdrop-blur-md">
          <Badge variant="default" size="sm" className="mb-2">
            Internal Dev Tool
          </Badge>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            InterviewHub Design System Showcase
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Visual inspection page displaying all 18 UI primitives across variants, sizes, and
            states. *(Temporary development route: `/showcase`)*
          </p>
        </div>

        {/* Section 1: Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>1. Button Variants & Sizes</CardTitle>
            <CardDescription>
              Actions, sizes, loading spinners, and disabled states.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small (sm)</Button>
              <Button size="md">Medium (md)</Button>
              <Button size="lg">Large (lg)</Button>
              <Button isLoading variant="primary">
                Loading
              </Button>
              <Button disabled variant="primary">
                Disabled
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Form Controls */}
        <Card>
          <CardHeader>
            <CardTitle>2. Form Controls (Input, Textarea, Select, Checkbox, Radio)</CardTitle>
            <CardDescription>
              Form inputs, labels, validation errors, and helper texts.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Question Title"
              placeholder="e.g. What is the Virtual DOM in React?"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Enter a descriptive interview question title."
              required
            />
            <Input
              label="Question Search"
              placeholder="Search by keyword..."
              error="Minimum 3 characters required."
              leftAddon="🔍"
            />
            <Textarea
              label="Detailed Explanation"
              placeholder="Explain the concepts, code examples, and edge cases..."
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              showCount
              maxLength={200}
              helperText="Markdown syntax is supported."
            />
            <Select
              label="Target Category"
              options={[
                { value: 'react', label: 'React Framework' },
                { value: 'typescript', label: 'TypeScript' },
                { value: 'javascript', label: 'JavaScript (ES6+)' },
                { value: 'css', label: 'CSS Layouts' },
              ]}
              helperText="Select the primary category."
            />
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-300">Checkboxes</span>
              <Checkbox
                label="Bookmark this question for revision"
                description="Saves to your personal bookmarks folder."
                checked={checkboxChecked}
                onChange={(e) => setCheckboxChecked(e.target.checked)}
              />
              <Checkbox label="Disabled Checkbox" disabled />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-300">Radio Options</span>
              <Radio
                name="quiz-option"
                label="Option A: React creates an in-memory virtual tree."
                checked={radioSelected === 'option-a'}
                onChange={() => setRadioSelected('option-a')}
              />
              <Radio
                name="quiz-option"
                label="Option B: Virtual DOM replaces real DOM entirely."
                checked={radioSelected === 'option-b'}
                onChange={() => setRadioSelected('option-b')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Badges, Tooltips & Spinners */}
        <Card>
          <CardHeader>
            <CardTitle>3. Badges, Tooltips & Spinners</CardTitle>
            <CardDescription>
              Status indicators, tags, accessibility hints, and loading indicators.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="default">Beginner</Badge>
              <Badge variant="info">Junior</Badge>
              <Badge variant="warning">Intermediate</Badge>
              <Badge variant="success">Approved</Badge>
              <Badge variant="danger">Hard Topic</Badge>
              <Badge variant="secondary">Community</Badge>
            </div>
            <div className="flex items-center gap-6">
              <Tooltip content="Questions tagged with React Hooks" position="top">
                <Button variant="outline" size="sm">
                  Hover for Tooltip (Top)
                </Button>
              </Tooltip>
              <Tooltip content="Weak Topic Accuracy < 70%" position="right">
                <Badge variant="warning">Hover Tooltip (Right)</Badge>
              </Tooltip>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Spinners:</span>
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Progress & Skeletons */}
        <Card>
          <CardHeader>
            <CardTitle>4. Progress Bars & Skeleton Loaders</CardTitle>
            <CardDescription>
              Visual progress indicators and content skeleton placeholders.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <Progress value={65} showValue variant="default" />
            <Progress value={85} showValue variant="success" size="lg" />
            <Progress value={45} showValue variant="warning" size="sm" />
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-xs font-semibold text-slate-300">Skeleton Loaders:</span>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="rectangular" height={80} />
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Modal & Dropdown Overlays */}
        <Card>
          <CardHeader>
            <CardTitle>5. Overlays (Modal & Dropdown)</CardTitle>
            <CardDescription>Popups, dialogs, and contextual dropdown menus.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              Open Demo Modal
            </Button>
            <Dropdown trigger={<Button variant="secondary">Open Dropdown Menu ▾</Button>}>
              <DropdownItem onClick={() => alert('Dashboard clicked')}>Dashboard</DropdownItem>
              <DropdownItem onClick={() => alert('Progress clicked')}>
                Learning Progress
              </DropdownItem>
              <DropdownItem onClick={() => alert('Bookmarks clicked')}>Bookmarks</DropdownItem>
              <DropdownItem danger onClick={() => alert('Logout clicked')}>
                Logout
              </DropdownItem>
            </Dropdown>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Practice Quiz Complete"
              description="Review your performance before persisting attempts."
              footer={
                <>
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Close
                  </Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                    Save Result
                  </Button>
                </>
              }
            >
              <p className="text-xs text-slate-300">
                You scored <strong className="text-emerald-400">4 / 5 (80%)</strong> on the Frontend
                React Fundamentals set!
              </p>
            </Modal>
          </CardContent>
        </Card>

        {/* Section 6: Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>6. Tabs Navigation</CardTitle>
            <CardDescription>Tabbed content panel switching.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabList>
                <TabTrigger value="all">All Questions</TabTrigger>
                <TabTrigger value="react">React (12)</TabTrigger>
                <TabTrigger value="typescript">TypeScript (8)</TabTrigger>
              </TabList>
              <TabPanel
                value="all"
                className="p-4 bg-slate-900 border border-slate-800 rounded-lg mt-2 text-xs"
              >
                Displaying all frontend technical questions across HTML, CSS, JS, React, and TS.
              </TabPanel>
              <TabPanel
                value="react"
                className="p-4 bg-slate-900 border border-slate-800 rounded-lg mt-2 text-xs"
              >
                React category questions (Hooks, Virtual DOM, State, Performance).
              </TabPanel>
              <TabPanel
                value="typescript"
                className="p-4 bg-slate-900 border border-slate-800 rounded-lg mt-2 text-xs"
              >
                TypeScript category questions (Generics, Type Narrowing, Interfaces).
              </TabPanel>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section 7: Alerts, Empty State & Error State */}
        <Card>
          <CardHeader>
            <CardTitle>7. Feedback UI (Alerts, Empty State, Error State)</CardTitle>
            <CardDescription>
              System alerts, empty data views, and error boundary fallbacks.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Alert variant="info" title="Daily Challenge Ready">
              The 5-question daily challenge for today is ready to attempt.
            </Alert>
            <Alert variant="success" title="Question Saved">
              Successfully added to your bookmarks.
            </Alert>
            <Alert variant="warning" title="Weak Topic Alert">
              Your TypeScript accuracy is 62% (below the 70% threshold).
            </Alert>
            <Alert variant="error" title="Submission Rejected">
              Community submission requires official source references.
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <EmptyState
                title="No Bookmarks Saved Yet"
                description="Click the bookmark icon on any question detail page to save questions here for quick revision."
                action={<Button size="sm">Browse Questions</Button>}
              />
              <ErrorState
                title="Failed to Load Questions"
                message="Unable to connect to service. Please check your internet connection."
                onRetry={() => alert('Retrying connection...')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default ShowcasePage;
