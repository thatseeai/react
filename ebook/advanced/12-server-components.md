# Chapter 12: Server Components

> **학습 목표**: React Server Components를 이해하고 cache(), Server Actions를 활용한다
> **소요 시간**: 150분
> **난이도**: 고급

## 📖 개요

**React Server Components(RSC)**는 React 19의 가장 혁신적인 기능입니다. 서버에서만 실행되는 컴포넌트를 통해 데이터베이스 직접 접근, 번들 크기 감소, 초기 로딩 속도 향상 등의 이점을 얻을 수 있습니다. **'use server'** 지시어와 **cache()** 함수로 서버 측 로직을 최적화할 수 있습니다.

이 챕터에서는 TaskFlow의 서버 컴포넌트 아키텍처를 구축합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ Server Components vs Client Components
- ✅ **NEW**: 'use server' 지시어
- ✅ **NEW**: cache() 함수
- ✅ **NEW**: Server Actions
- ✅ 데이터베이스 직접 접근

---

## 💡 핵심 개념

### 1. Server Components란?

**Server Components**는 서버에서만 렌더링되고 클라이언트로 HTML만 전송됩니다.

```typescript
// app/tasks/page.tsx
// 이 컴포넌트는 서버에서만 실행됨
async function TaskListPage() {
  // 데이터베이스 직접 접근 가능!
  const tasks = await db.tasks.findMany();

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

**장점**:
- 🚀 번들 크기 감소 (서버 코드가 클라이언트로 가지 않음)
- 🔐 안전한 데이터 접근 (API 키, 비밀번호 노출 안 됨)
- ⚡ 빠른 초기 로딩 (서버에서 완성된 HTML 전송)
- 🗄️ 데이터베이스 직접 접근

### 2. Server vs Client Components

| Server Components | Client Components |
|------------------|-------------------|
| 기본값 | 'use client' 필요 |
| 서버에서만 실행 | 브라우저에서 실행 |
| async 가능 | async 불가 |
| DB 접근 가능 | DB 접근 불가 |
| useState 불가 | useState 가능 |
| useEffect 불가 | useEffect 가능 |
| 이벤트 핸들러 불가 | 이벤트 핸들러 가능 |

**Client Component 선언**:

```typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### 3. 'use server' 지시어

**Server Actions**를 정의하는 지시어입니다.

```typescript
// app/actions/tasks.ts
'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;

  const task = await db.tasks.create({
    data: { title, status: 'todo' },
  });

  revalidatePath('/tasks');
  return task;
}
```

**사용**:

```typescript
// app/tasks/new/page.tsx
import { createTask } from '@/app/actions/tasks';

export default function NewTaskPage() {
  return (
    <form action={createTask}>
      <input name="title" required />
      <button type="submit">생성</button>
    </form>
  );
}
```

### 4. cache() 함수

요청별로 데이터를 캐싱합니다.

```typescript
import { cache } from 'react';

// cache로 감싸면 같은 요청 내에서 재사용됨
export const getTasks = cache(async () => {
  return db.tasks.findMany();
});

// 같은 요청 내에서 여러 번 호출해도 DB 쿼리는 한 번만
async function Component1() {
  const tasks = await getTasks(); // DB 쿼리
}

async function Component2() {
  const tasks = await getTasks(); // 캐시에서 반환
}
```

**React 19의 cacheSignal()**:

```typescript
import { cache, cacheSignal } from 'react';

export const getUser = cache(async (userId: string) => {
  const signal = cacheSignal();

  // cache 수명이 끝나면 signal이 abort됨
  const response = await fetch(`/api/users/${userId}`, { signal });
  return response.json();
});
```

### 5. 컴포넌트 구성 패턴

```typescript
// app/tasks/page.tsx (Server Component)
async function TaskListPage() {
  const tasks = await getTasks();

  return (
    <div>
      <h1>작업 목록</h1>
      {/* Client Component 사용 */}
      <TaskFilter />
      {/* Server Component는 children으로 Client에 전달 가능 */}
      <TaskList tasks={tasks} />
    </div>
  );
}

// components/TaskFilter.tsx (Client Component)
'use client';

export function TaskFilter() {
  const [filter, setFilter] = useState('all');
  // ...
}
```

---

## 🛠️ 실습: TaskFlow Server Components

### Step 1: 데이터베이스 설정 (Drizzle ORM)

**lib/db/schema.ts**:

```typescript
import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in-progress', 'review', 'done']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  projectId: text('project_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
```

**lib/db/index.ts**:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### Step 2: 캐싱된 데이터 접근 함수

**lib/queries/tasks.ts**:

```typescript
import { cache } from 'react';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// React 19: cache로 요청별 메모이제이션
export const getTasks = cache(async (projectId: string) => {
  return db.select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId));
});

export const getTask = cache(async (taskId: number) => {
  const result = await db.select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  return result[0] || null;
});

// 통계 계산
export const getTaskStats = cache(async (projectId: string) => {
  const allTasks = await getTasks(projectId);

  return {
    total: allTasks.length,
    todo: allTasks.filter(t => t.status === 'todo').length,
    inProgress: allTasks.filter(t => t.status === 'in-progress').length,
    done: allTasks.filter(t => t.status === 'done').length,
  };
});
```

### Step 3: Server Actions

**app/actions/tasks.ts**:

```typescript
'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const projectId = formData.get('projectId') as string;
  const priority = formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent';

  // 유효성 검사
  if (!title.trim()) {
    return { error: '제목을 입력하세요' };
  }

  // DB에 저장
  const newTask = await db.insert(tasks).values({
    title,
    description,
    projectId,
    priority,
    status: 'todo',
    updatedAt: new Date(),
  }).returning();

  // 캐시 재검증
  revalidatePath(`/projects/${projectId}`);

  // 생성된 Task 페이지로 리다이렉트
  redirect(`/tasks/${newTask[0].id}`);
}

export async function updateTask(taskId: number, updates: {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
}) {
  await db.update(tasks)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  revalidatePath('/tasks');
  return { success: true };
}

export async function deleteTask(taskId: number) {
  await db.delete(tasks)
    .where(eq(tasks.id, taskId));

  revalidatePath('/tasks');
  redirect('/tasks');
}
```

### Step 4: Server Component 페이지

**app/projects/[projectId]/page.tsx**:

```typescript
import { getTasks, getTaskStats } from '@/lib/queries/tasks';
import { TaskList } from '@/components/TaskList';
import { TaskStats } from '@/components/TaskStats';
import { CreateTaskButton } from '@/components/CreateTaskButton';

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

// Server Component - async 가능!
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = params;

  // 병렬로 데이터 로드
  const [tasks, stats] = await Promise.all([
    getTasks(projectId),
    getTaskStats(projectId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">프로젝트 작업</h1>
        {/* Client Component */}
        <CreateTaskButton projectId={projectId} />
      </div>

      {/* Server Component로 통계 표시 */}
      <TaskStats stats={stats} />

      {/* Client Component에 데이터 전달 */}
      <TaskList initialTasks={tasks} />
    </div>
  );
}
```

**app/tasks/[taskId]/page.tsx**:

```typescript
import { getTask } from '@/lib/queries/tasks';
import { notFound } from 'next/navigation';
import { TaskDetail } from '@/components/TaskDetail';

interface TaskPageProps {
  params: {
    taskId: string;
  };
}

export default async function TaskPage({ params }: TaskPageProps) {
  const task = await getTask(parseInt(params.taskId));

  if (!task) {
    notFound();
  }

  return <TaskDetail task={task} />;
}

// 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: TaskPageProps) {
  const task = await getTask(parseInt(params.taskId));

  if (!task) {
    return { title: '작업을 찾을 수 없습니다' };
  }

  return {
    title: task.title,
    description: task.description,
  };
}
```

### Step 5: Client Component (상호작용)

**components/CreateTaskButton.tsx**:

```typescript
'use client';

import { useState } from 'react';
import { Modal } from './Modal';
import { CreateTaskForm } from './CreateTaskForm';

export function CreateTaskButton({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        작업 추가
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <CreateTaskForm projectId={projectId} onSuccess={() => setIsOpen(false)} />
      </Modal>
    </>
  );
}
```

**components/CreateTaskForm.tsx**:

```typescript
'use client';

import { useActionState } from 'react';
import { createTask } from '@/app/actions/tasks';
import { Input } from './Input';
import { SubmitButton } from './SubmitButton';

export function CreateTaskForm({ projectId, onSuccess }: Props) {
  const [state, formAction] = useActionState(createTask, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="projectId" value={projectId} />

      <Input
        name="title"
        label="작업 제목"
        required
        error={state.error}
      />

      <div>
        <label className="block text-sm font-medium mb-1">설명</label>
        <textarea name="description" rows={4} className="w-full border rounded-lg p-2" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">우선순위</label>
        <select name="priority" className="w-full border rounded-lg p-2">
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
          <option value="urgent">긴급</option>
        </select>
      </div>

      <SubmitButton>작업 생성</SubmitButton>
    </form>
  );
}
```

### Step 6: 하이브리드 패턴

**components/TaskList.tsx**:

```typescript
'use client';

import { useState } from 'react';
import { Task } from '@/lib/db/schema';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
  const [filter, setFilter] = useState<'all' | Task['status']>('all');

  const filteredTasks = filter === 'all'
    ? initialTasks
    : initialTasks.filter(t => t.status === filter);

  return (
    <div>
      {/* Client-side 필터링 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('all')}>전체</button>
        <button onClick={() => setFilter('todo')}>할 일</button>
        <button onClick={() => setFilter('in-progress')}>진행중</button>
        <button onClick={() => setFilter('done')}>완료</button>
      </div>

      {/* Server에서 받은 데이터 표시 */}
      <div className="grid grid-cols-3 gap-4">
        {filteredTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

### Step 7: Streaming with Suspense

**app/projects/[projectId]/page.tsx** (개선):

```typescript
import { Suspense } from 'react';
import { getTasks, getTaskStats } from '@/lib/queries/tasks';

export default async function ProjectPage({ params }: ProjectPageProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">프로젝트 작업</h1>

      {/* 통계는 즉시 로드 */}
      <Suspense fallback={<StatsSkeleton />}>
        <TaskStatsServer projectId={params.projectId} />
      </Suspense>

      {/* Task 리스트는 독립적으로 로드 */}
      <Suspense fallback={<TaskListSkeleton />}>
        <TaskListServer projectId={params.projectId} />
      </Suspense>
    </div>
  );
}

// 각각 Server Component
async function TaskStatsServer({ projectId }: { projectId: string }) {
  const stats = await getTaskStats(projectId);
  return <TaskStats stats={stats} />;
}

async function TaskListServer({ projectId }: { projectId: string }) {
  const tasks = await getTasks(projectId);
  return <TaskList initialTasks={tasks} />;
}
```

---

## ✅ 완성 코드 구조

```
app/
├── actions/
│   └── tasks.ts                  ✅ ('use server')
├── projects/
│   └── [projectId]/
│       └── page.tsx              ✅ (Server Component)
├── tasks/
│   └── [taskId]/
│       └── page.tsx              ✅ (Server Component)
├── lib/
│   ├── db/
│   │   ├── schema.ts             ✅
│   │   └── index.ts              ✅
│   └── queries/
│       └── tasks.ts              ✅ (cache)
└── components/
    ├── CreateTaskButton.tsx      ✅ ('use client')
    ├── CreateTaskForm.tsx        ✅ ('use client')
    └── TaskList.tsx              ✅ ('use client')
```

---

## 🔍 코드 분석

### Server Components의 장점

```typescript
// 번들 크기 비교

// Client Component
'use client';
import { format } from 'date-fns'; // 200KB가 클라이언트로 전송됨
export function DateDisplay({ date }: { date: Date }) {
  return <div>{format(date, 'PPP')}</div>;
}

// Server Component
import { format } from 'date-fns'; // 서버에서만 실행, 클라이언트에 0KB 전송
export async function DateDisplay({ date }: { date: Date }) {
  return <div>{format(date, 'PPP')}</div>;
}
```

### cache()의 범위

```typescript
// 요청 A에서:
const tasks1 = await getTasks('proj-1'); // DB 쿼리
const tasks2 = await getTasks('proj-1'); // 캐시에서 반환

// 요청 B에서:
const tasks3 = await getTasks('proj-1'); // 새로운 DB 쿼리 (요청이 다름)
```

---

## ⚠️ 주의사항

### 1. Client Component 경계

```typescript
// ❌ Server Component가 Client Component를 import
// Client Component의 모든 children도 Client가 됨
'use client';
export function Layout({ children }) {
  return <div>{children}</div>; // children도 Client Component됨
}

// ✅ Props로 Server Component 전달
'use client';
export function Layout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>; // children은 Server Component 유지 가능
}
```

### 2. 환경 변수 주의

```typescript
// Server Component
export async function Page() {
  // ✅ 서버 환경 변수 접근 가능
  const apiKey = process.env.SECRET_API_KEY;
}

// Client Component
'use client';
export function Component() {
  // ❌ 서버 환경 변수 접근 불가
  // ✅ NEXT_PUBLIC_*로 시작하는 변수만 가능
  const publicKey = process.env.NEXT_PUBLIC_API_KEY;
}
```

### 3. 직렬화 가능한 Props만

```typescript
// ❌ 함수는 전달 불가
<ClientComponent onClick={() => {}} />

// ✅ 데이터만 전달
<ClientComponent data={data} />
```

---

## 💪 실전 팁

### 1. 점진적 채택

```typescript
// 1단계: 모든 페이지를 Server Component로
// 2단계: 상호작용이 필요한 부분만 Client Component로
// 3단계: 성능 모니터링 및 최적화
```

### 2. 데이터 프리페칭

```typescript
import { preload } from 'react-dom';

function ProjectLink({ projectId }: { projectId: string }) {
  return (
    <Link
      href={`/projects/${projectId}`}
      onMouseEnter={() => {
        // 마우스 오버 시 데이터 미리 로드
        preload(getTasks(projectId));
      }}
    >
      프로젝트 보기
    </Link>
  );
}
```

### 3. Error Handling

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>오류 발생!</h2>
      <button onClick={reset}>재시도</button>
    </div>
  );
}
```

---

## 📚 참고 자료

- [React Server Components](https://react.dev/reference/rsc/server-components)
- [cache()](https://react.dev/reference/react/cache)
- [Server Actions](https://react.dev/reference/rsc/server-actions)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## 🎓 연습 문제

### 기본

1. **프로젝트 목록 페이지**를 Server Component로 만드세요.

2. **댓글 시스템**을 Server Actions로 구현하세요.

3. **검색 페이지**를 하이브리드 패턴으로 만드세요.

### 도전

4. **실시간 대시보드**를 구현하세요 (Server Component + Streaming).

5. **이미지 업로드**를 Server Action으로 처리하세요.

6. **페이지네이션**을 Server Component로 최적화하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **성능 최적화**를 다룹니다:

- React 19의 Resource Hints API
- preload, preinit, prefetchDNS
- Code Splitting
- React DevTools Profiler

**[Chapter 13: 성능 최적화 →](13-performance.md)**

---

**축하합니다!** 🎉 Server Components를 마스터했습니다!
