# Chapter 16: Server-Side Rendering (SSR)

## 개요

Server-Side Rendering(SSR)은 서버에서 React 컴포넌트를 HTML로 렌더링하여 클라이언트에 전송하는 기법입니다. React 19는 Streaming SSR과 Server Components를 통해 SSR을 한 단계 진화시켰습니다.

**이 장에서 다룰 내용:**
- SSR 기본 개념과 장단점
- Next.js와 React 19 통합
- Streaming SSR with Suspense
- Hydration 최적화
- SEO 최적화 전략
- 성능 측정 및 개선

**TaskFlow에서의 활용:**
검색 엔진 최적화(SEO)와 초기 로딩 속도 개선으로 사용자 경험을 극대화합니다.

## 핵심 개념

### 1. SSR vs CSR

**CSR (Client-Side Rendering):**
```
1. 서버 → 빈 HTML + JS 번들
2. 클라이언트에서 JS 다운로드
3. React 앱 실행
4. 데이터 페칭
5. UI 렌더링
```

**SSR (Server-Side Rendering):**
```
1. 서버에서 데이터 페칭
2. 서버에서 React 렌더링
3. 서버 → 완성된 HTML
4. 클라이언트에 즉시 표시
5. JS 다운로드 후 Hydration
```

**장점:**
- ✅ 빠른 First Contentful Paint (FCP)
- ✅ SEO 친화적
- ✅ 소셜 미디어 미리보기 지원
- ✅ 느린 네트워크/디바이스에서 더 나은 경험

**단점:**
- ❌ 서버 비용 증가
- ❌ 복잡한 캐싱 전략 필요
- ❌ Time To Interactive (TTI) 지연 가능
- ❌ 서버 부하

### 2. React 19 SSR 개선사항

**a) Streaming SSR**
```typescript
// React 18
import { renderToString } from 'react-dom/server';

const html = renderToString(<App />); // 전체 렌더링 대기
res.send(html);
```

```typescript
// React 19 - Streaming
import { renderToPipeableStream } from 'react-dom/server';

const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() {
    // 쉘이 준비되면 즉시 스트리밍 시작
    res.setHeader('Content-Type', 'text/html');
    pipe(res);
  }
});
```

**b) Selective Hydration**
```typescript
// 사용자가 상호작용하는 컴포넌트를 우선 hydrate
<Suspense fallback={<Spinner />}>
  <Comments /> {/* 나중에 hydrate */}
</Suspense>
```

**c) Server Components 통합**
```typescript
// 서버 컴포넌트는 클라이언트 번들에 포함되지 않음
// app/page.tsx (Server Component)
async function TaskPage() {
  const tasks = await fetchTasks(); // 서버에서만 실행
  return <TaskList tasks={tasks} />;
}
```

### 3. Hydration 이해하기

Hydration은 서버에서 렌더링된 HTML에 이벤트 리스너를 연결하는 과정입니다.

```typescript
// 서버
const html = renderToString(<Button onClick={handleClick}>Click</Button>);
// 결과: <button>Click</button> (이벤트 없음)

// 클라이언트
hydrateRoot(document.getElementById('root'), <Button onClick={handleClick}>Click</Button>);
// 이제 버튼 클릭 가능!
```

**React 19의 Selective Hydration:**
```typescript
function Page() {
  return (
    <div>
      <Header /> {/* 즉시 hydrate */}

      <Suspense fallback={<Spinner />}>
        <Sidebar /> {/* 나중에 hydrate */}
      </Suspense>

      <MainContent /> {/* 즉시 hydrate */}

      <Suspense fallback={<Spinner />}>
        <Comments /> {/* 사용자가 클릭하면 우선 hydrate */}
      </Suspense>
    </div>
  );
}
```

## 실습: Next.js 15 with React 19

### 1. 프로젝트 설정

```bash
# Next.js 15 프로젝트 생성 (React 19 포함)
npx create-next-app@latest taskflow-ssr --typescript --app --tailwind

cd taskflow-ssr

# 추가 패키지
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

### 2. 프로젝트 구조

```
taskflow-ssr/
├── app/
│   ├── layout.tsx              # Root Layout (Server Component)
│   ├── page.tsx                # Home (Server Component)
│   ├── projects/
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Project Detail (Server Component)
│   │   │   └── loading.tsx     # Loading UI
│   │   └── page.tsx
│   ├── api/
│   │   └── tasks/
│   │       └── route.ts        # API Routes
│   └── components/
│       ├── TaskBoard.tsx       # Server Component
│       ├── TaskCard.client.tsx # Client Component
│       └── AddTaskForm.client.tsx
├── lib/
│   ├── db.ts                   # Database
│   └── actions.ts              # Server Actions
└── next.config.js
```

### 3. Root Layout (Server Component)

```typescript
// app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskFlow - 협업 태스크 관리',
  description: 'React 19로 만든 현대적인 태스크 관리 플랫폼',
  keywords: ['task management', 'collaboration', 'productivity'],
  authors: [{ name: 'TaskFlow Team' }],
  openGraph: {
    title: 'TaskFlow',
    description: '팀 협업을 위한 스마트한 태스크 관리',
    type: 'website',
    images: ['/og-image.png']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TaskFlow',
    description: '팀 협업을 위한 스마트한 태스크 관리',
    images: ['/og-image.png']
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        {/* Preconnect to API domain */}
        <link rel="preconnect" href="https://api.taskflow.com" />
        <link rel="dns-prefetch" href="https://api.taskflow.com" />
      </head>
      <body className={inter.className}>
        <nav className="border-b">
          <div className="container mx-auto px-4 py-3">
            <a href="/" className="text-xl font-bold">
              TaskFlow
            </a>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="border-t mt-8 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600">
            © 2024 TaskFlow. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
```

### 4. Home Page (Server Component with Streaming)

```typescript
// app/page.tsx
import { Suspense } from 'react';
import { ProjectList } from './components/ProjectList';
import { ProjectListSkeleton } from './components/ProjectListSkeleton';
import { QuickStats } from './components/QuickStats';
import { QuickStatsSkeleton } from './components/QuickStatsSkeleton';

export const dynamic = 'force-dynamic'; // 매 요청마다 재생성
// export const revalidate = 60; // ISR: 60초마다 재검증

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold mb-4">
          환영합니다, TaskFlow에!
        </h1>
        <p className="text-gray-600">
          팀의 생산성을 높이는 협업 플랫폼
        </p>
      </section>

      {/* 빠른 통계는 먼저 표시 */}
      <Suspense fallback={<QuickStatsSkeleton />}>
        <QuickStats />
      </Suspense>

      {/* 프로젝트 목록은 나중에 스트리밍 */}
      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
```

### 5. Server Component - 데이터 페칭

```typescript
// app/components/ProjectList.tsx
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import Link from 'next/link';

export async function ProjectList() {
  // 서버에서 직접 데이터베이스 쿼리
  const projectList = await db.select().from(projects).limit(10);

  // 의도적 지연 시뮬레이션 (데모용)
  // await new Promise(resolve => setTimeout(resolve, 1000));

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">최근 프로젝트</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectList.map(project => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="border rounded-lg p-4 hover:shadow-lg transition"
          >
            <h3 className="font-bold text-lg">{project.name}</h3>
            <p className="text-gray-600 text-sm mt-2">
              {project.description}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{project.taskCount} tasks</span>
              <span>{project.memberCount} members</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

### 6. Project Detail Page

```typescript
// app/projects/[id]/page.tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { projects, tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { TaskBoard } from './TaskBoard';
import { TaskBoardSkeleton } from '@/app/components/skeletons';
import type { Metadata } from 'next';

// 동적 메타데이터 생성
export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, params.id))
    .limit(1);

  if (!project[0]) {
    return {
      title: 'Project Not Found'
    };
  }

  return {
    title: `${project[0].name} - TaskFlow`,
    description: project[0].description,
    openGraph: {
      title: project[0].name,
      description: project[0].description,
      type: 'website'
    }
  };
}

export default async function ProjectPage({
  params
}: {
  params: { id: string };
}) {
  // 프로젝트 정보 먼저 로드
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, params.id))
    .limit(1);

  if (!project[0]) {
    notFound(); // 404 페이지로
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{project[0].name}</h1>
        <p className="text-gray-600 mt-2">{project[0].description}</p>
      </header>

      {/* TaskBoard는 별도로 스트리밍 */}
      <Suspense fallback={<TaskBoardSkeleton />}>
        <TaskBoard projectId={params.id} />
      </Suspense>
    </div>
  );
}

// 정적 생성할 경로 지정 (선택사항)
export async function generateStaticParams() {
  const projectList = await db.select({ id: projects.id }).from(projects);

  return projectList.map(project => ({
    id: project.id
  }));
}
```

### 7. Client Component - 인터랙티브 UI

```typescript
// app/components/AddTaskForm.client.tsx
'use client'; // Client Component 명시

import { useState, useActionState } from 'react';
import { addTaskAction } from '@/lib/actions';

export function AddTaskForm({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    addTaskAction,
    { success: false }
  );

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
      >
        + 새 태스크
      </button>

      {isOpen && (
        <dialog open className="modal">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="projectId" value={projectId} />

            <div>
              <label htmlFor="title" className="block text-sm font-medium">
                제목
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                className="input w-full"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="textarea w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary"
              >
                {isPending ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-secondary"
              >
                취소
              </button>
            </div>

            {state.error && (
              <p className="text-red-500 text-sm">{state.error}</p>
            )}
          </form>
        </dialog>
      )}
    </div>
  );
}
```

### 8. Server Actions

```typescript
// lib/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from './db';
import { tasks } from './schema';
import { z } from 'zod';

const addTaskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1, '제목을 입력하세요'),
  description: z.string().optional()
});

export async function addTaskAction(prevState: any, formData: FormData) {
  try {
    // 입력값 검증
    const data = addTaskSchema.parse({
      projectId: formData.get('projectId'),
      title: formData.get('title'),
      description: formData.get('description')
    });

    // 데이터베이스에 저장
    await db.insert(tasks).values({
      projectId: data.projectId,
      title: data.title,
      description: data.description || '',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date()
    });

    // 캐시 무효화
    revalidatePath(`/projects/${data.projectId}`);

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }

    return {
      success: false,
      error: '태스크 추가에 실패했습니다'
    };
  }
}

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: string
) {
  'use server';

  await db
    .update(tasks)
    .set({ status: newStatus })
    .where(eq(tasks.id, taskId));

  revalidatePath('/projects/[id]', 'page');
}
```

## 완성 코드: 고급 SSR 패턴

### 1. Streaming SSR with Multiple Boundaries

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="dashboard">
      {/* 1. 헤더 - 즉시 표시 (정적) */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">대시보드</h1>
      </header>

      <div className="grid grid-cols-3 gap-8">
        {/* 2. 빠른 통계 - 빠르게 로드 */}
        <div className="col-span-3">
          <Suspense fallback={<QuickStatsSkeleton />}>
            <QuickStats /> {/* ~100ms */}
          </Suspense>
        </div>

        {/* 3. 메인 콘텐츠 - 중간 속도 */}
        <div className="col-span-2">
          <Suspense fallback={<TaskBoardSkeleton />}>
            <TaskBoard /> {/* ~500ms */}
          </Suspense>
        </div>

        {/* 4. 사이드바 - 독립적으로 로드 */}
        <div className="col-span-1">
          <Suspense fallback={<SidebarSkeleton />}>
            <Sidebar /> {/* ~300ms */}
          </Suspense>
        </div>

        {/* 5. 활동 피드 - 가장 느림 */}
        <div className="col-span-3">
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <ActivityFeed /> {/* ~1000ms */}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

### 2. SEO 최적화

```typescript
// app/projects/[id]/page.tsx
import type { Metadata } from 'next';
import { getProject } from '@/lib/api';

// 동적 메타데이터
export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const project = await getProject(params.id);

  return {
    title: `${project.name} | TaskFlow`,
    description: project.description,
    keywords: ['project management', 'tasks', project.name],

    // Open Graph (Facebook, LinkedIn 등)
    openGraph: {
      title: project.name,
      description: project.description,
      type: 'website',
      url: `https://taskflow.com/projects/${params.id}`,
      images: [
        {
          url: project.thumbnailUrl || '/default-og.png',
          width: 1200,
          height: 630,
          alt: project.name
        }
      ]
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: project.name,
      description: project.description,
      images: [project.thumbnailUrl || '/default-og.png'],
      creator: '@taskflow'
    },

    // 추가 메타태그
    alternates: {
      canonical: `https://taskflow.com/projects/${params.id}`
    },

    // 로봇 설정
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large'
      }
    }
  };
}

// JSON-LD 구조화 데이터
export async function generateJsonLd(projectId: string) {
  const project = await getProject(projectId);

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.name,
    description: project.description,
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };
}

export default async function ProjectPage({
  params
}: {
  params: { id: string };
}) {
  const jsonLd = await generateJsonLd(params.id);

  return (
    <>
      {/* JSON-LD 스크립트 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 페이지 콘텐츠 */}
      <ProjectContent projectId={params.id} />
    </>
  );
}
```

### 3. Incremental Static Regeneration (ISR)

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 3600; // 1시간마다 재검증

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();

  return posts.map(post => ({
    slug: post.slug
  }));
}

export default async function BlogPost({
  params
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  return (
    <article>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### 4. 데이터 캐싱 전략

```typescript
// lib/cache.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// React cache - 단일 요청 내에서만 캐싱
export const getProject = cache(async (id: string) => {
  const project = await db.select().from(projects).where(eq(projects.id, id));
  return project[0];
});

// Next.js unstable_cache - 여러 요청에 걸쳐 캐싱
export const getProjectWithCache = unstable_cache(
  async (id: string) => {
    const project = await db.select().from(projects).where(eq(projects.id, id));
    return project[0];
  },
  ['project'], // cache key
  {
    revalidate: 60, // 60초 후 재검증
    tags: ['project'] // 태그로 캐시 무효화 가능
  }
);

// 캐시 무효화
import { revalidateTag } from 'next/cache';

export async function updateProject(id: string, data: any) {
  await db.update(projects).set(data).where(eq(projects.id, id));

  // 캐시 무효화
  revalidateTag('project');
  revalidatePath(`/projects/${id}`);
}
```

### 5. 서버 전용 코드 보호

```typescript
// lib/server-only-utils.ts
import 'server-only'; // 이 파일은 서버에서만 import 가능

export async function getSecretData() {
  const apiKey = process.env.SECRET_API_KEY; // 안전!
  const response = await fetch('https://api.example.com/secret', {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return response.json();
}

// 클라이언트 컴포넌트에서 import 시도하면 빌드 에러!
```

### 6. Partial Prerendering (실험적)

```typescript
// next.config.js
module.exports = {
  experimental: {
    ppr: true // Partial Prerendering 활성화
  }
};

// app/page.tsx
export const experimental_ppr = true;

export default function HomePage() {
  return (
    <div>
      {/* 정적 부분 - 빌드 타임에 생성 */}
      <header>
        <h1>Welcome to TaskFlow</h1>
      </header>

      {/* 동적 부분 - 요청 시 생성 */}
      <Suspense fallback={<Skeleton />}>
        <UserGreeting /> {/* 사용자별 다른 내용 */}
      </Suspense>

      {/* 정적 부분 */}
      <section>
        <h2>Features</h2>
        <FeatureList />
      </section>

      {/* 동적 부분 */}
      <Suspense fallback={<Skeleton />}>
        <RecentProjects /> {/* 사용자별 프로젝트 */}
      </Suspense>
    </div>
  );
}
```

## 코드 분석

### 1. Streaming SSR 흐름

```
클라이언트 요청
   ↓
서버: Shell HTML 생성 (Layout + 정적 부분)
   ↓
클라이언트: Shell 즉시 표시 (FCP)
   ↓
서버: 각 Suspense 경계별로 컴포넌트 렌더링
   ↓
클라이언트: 스트리밍으로 받은 HTML 삽입
   ↓
모든 컴포넌트 렌더링 완료
   ↓
클라이언트: JS 로드 및 Hydration
   ↓
인터랙티브 완료 (TTI)
```

### 2. Server vs Client Component 결정

**Server Component로 유지:**
- ✅ 데이터 페칭만 하는 컴포넌트
- ✅ 정적 콘텐츠
- ✅ 큰 의존성 라이브러리 사용 (번들 크기 감소)
- ✅ 민감한 정보 접근 (API 키 등)

**Client Component로 전환:**
- ✅ 상태 관리 (useState, useReducer)
- ✅ 이벤트 리스너 (onClick, onChange 등)
- ✅ useEffect, useLayoutEffect
- ✅ 브라우저 전용 API (localStorage, window 등)
- ✅ 커스텀 Hook 사용

### 3. Hydration Mismatch 방지

```typescript
// ❌ Hydration mismatch - 서버와 클라이언트 결과 다름
function CurrentTime() {
  return <div>{new Date().toISOString()}</div>;
}

// ✅ 클라이언트에서만 렌더링
'use client';
import { useState, useEffect } from 'react';

function CurrentTime() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setTime(new Date().toISOString());
  }, []);

  return <div>{time || <span>&nbsp;</span>}</div>;
}

// ✅ 또는 suppressHydrationWarning 사용
function CurrentTime() {
  return (
    <div suppressHydrationWarning>
      {typeof window !== 'undefined' && new Date().toISOString()}
    </div>
  );
}
```

## 주의사항

### 1. Server Component의 제약사항

```typescript
// ❌ Server Component에서 불가능
async function ServerComponent() {
  const [state, setState] = useState(); // ❌ State 불가
  useEffect(() => {}); // ❌ Effect 불가
  const handleClick = () => {}; // ❌ 이벤트 핸들러 불가

  return <button onClick={handleClick}>Click</button>; // ❌
}

// ✅ 올바른 방법
async function ServerComponent() {
  const data = await fetchData(); // ✅ 서버에서 데이터 페칭

  return <ClientButton data={data} />; // ✅ 클라이언트로 전달
}

'use client';
function ClientButton({ data }) {
  const [count, setCount] = useState(0); // ✅
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 2. Props는 직렬화 가능해야 함

```typescript
// ❌ 함수는 Server → Client로 전달 불가
<ClientComponent onSave={() => console.log('save')} />

// ✅ Server Action 사용
async function saveAction() {
  'use server';
  // ...
}

<ClientComponent onSave={saveAction} />

// ❌ Date 객체 직접 전달 불가
<ClientComponent date={new Date()} />

// ✅ ISO 문자열로 변환
<ClientComponent date={new Date().toISOString()} />
```

### 3. 클라이언트 경계 최소화

```typescript
// ❌ 전체를 Client Component로
'use client';
function Page() {
  const [filter, setFilter] = useState('all');
  const data = useData(); // 클라이언트에서 페칭

  return (
    <div>
      <Header />
      <FilterBar filter={filter} onChange={setFilter} />
      <DataList data={data} />
    </div>
  );
}

// ✅ 필요한 부분만 Client Component
async function Page() {
  const data = await fetchData(); // 서버에서 페칭

  return (
    <div>
      <Header /> {/* Server Component */}
      <ClientFilterBar /> {/* Client Component */}
      <DataList data={data} /> {/* Server Component */}
    </div>
  );
}
```

## 실전 팁

### 1. 로딩 상태 최적화

```typescript
// app/projects/[id]/loading.tsx
export default function Loading() {
  return <ProjectPageSkeleton />;
}

// 자동으로 Suspense fallback으로 사용됨
```

### 2. 에러 처리

```typescript
// app/projects/[id]/error.tsx
'use client';

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>문제가 발생했습니다</h2>
      <p>{error.message}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

### 3. 404 페이지

```typescript
// app/projects/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h2>프로젝트를 찾을 수 없습니다</h2>
      <p>존재하지 않는 프로젝트입니다.</p>
      <a href="/projects">프로젝트 목록으로</a>
    </div>
  );
}

// 사용
import { notFound } from 'next/navigation';

async function ProjectPage({ params }) {
  const project = await getProject(params.id);

  if (!project) {
    notFound(); // not-found.tsx 표시
  }

  return <div>{project.name}</div>;
}
```

### 4. 데이터 프리페칭

```typescript
// app/components/ProjectLink.tsx
'use client';
import { useRouter } from 'next/navigation';
import { prefetchProject } from '@/lib/prefetch';

export function ProjectLink({ projectId }: { projectId: string }) {
  const router = useRouter();

  return (
    <a
      href={`/projects/${projectId}`}
      onMouseEnter={() => {
        // 호버 시 프리페치
        router.prefetch(`/projects/${projectId}`);
        prefetchProject(projectId); // 데이터도 프리페치
      }}
    >
      프로젝트 보기
    </a>
  );
}
```

## 테스트

### 1. SSR 테스트

```typescript
// __tests__/ssr.test.tsx
import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import ProjectPage from '@/app/projects/[id]/page';

describe('SSR', () => {
  it('should render on server', async () => {
    const html = renderToString(
      <ProjectPage params={{ id: '1' }} />
    );

    expect(html).toContain('프로젝트');
  });

  it('should hydrate without mismatch', () => {
    const serverHTML = renderToString(<App />);
    const container = document.createElement('div');
    container.innerHTML = serverHTML;

    // Hydration
    const { container: clientContainer } = render(<App />, { container });

    expect(clientContainer.innerHTML).toBe(serverHTML);
  });
});
```

### 2. 성능 측정

```typescript
// lib/performance.ts
export function measureSSRPerformance() {
  if (typeof window === 'undefined') return;

  // Time to First Byte
  const ttfb = performance.timing.responseStart - performance.timing.requestStart;

  // First Contentful Paint
  const fcp = performance.getEntriesByName('first-contentful-paint')[0];

  // Time to Interactive
  const tti = performance.timing.loadEventEnd - performance.timing.navigationStart;

  console.log('SSR Performance:', {
    ttfb: `${ttfb}ms`,
    fcp: fcp ? `${fcp.startTime}ms` : 'N/A',
    tti: `${tti}ms`
  });
}
```

## 연습 문제

### 기초

1. **Next.js SSR 프로젝트 설정**
   - Next.js 15 프로젝트 생성
   - Server/Client Component 구분
   - 간단한 페이지 작성

2. **SEO 최적화**
   - 메타데이터 추가
   - Open Graph 설정
   - JSON-LD 구조화 데이터

3. **Streaming SSR**
   - 여러 Suspense 경계 설정
   - 스켈레톤 UI 작성
   - 로딩 순서 최적화

### 중급

4. **Server Actions**
   - 폼 제출 처리
   - 데이터 재검증
   - 에러 처리

5. **ISR 구현**
   - 블로그 페이지 생성
   - revalidate 설정
   - 캐시 무효화 전략

6. **Hybrid 렌더링**
   - 정적 + 동적 콘텐츠 조합
   - 사용자별 개인화
   - 성능 최적화

### 고급

7. **Partial Prerendering**
   - PPR 활성화
   - 정적/동적 영역 구분
   - 성능 측정

8. **복잡한 데이터 페칭**
   - 병렬 데이터 로딩
   - 폭포수 방지
   - 캐싱 전략

9. **프로덕션 최적화**
   - 번들 크기 최적화
   - 이미지 최적화
   - CDN 통합
   - 성능 모니터링

## 다음 단계

다음 장에서는 **테스팅**을 다룹니다:
- Vitest를 사용한 단위 테스트
- React Testing Library
- E2E 테스트 with Playwright
- Server Component 테스팅

SSR 애플리케이션의 신뢰성을 위해서는 철저한 테스트가 필수입니다!

---

**핵심 요약:**
- SSR은 빠른 초기 로딩과 SEO 개선을 제공합니다
- Next.js는 Server/Client Component를 자동으로 관리합니다
- Streaming SSR로 점진적 로딩이 가능합니다
- Server Actions로 서버 로직을 간단히 처리합니다
- 캐싱 전략으로 성능을 최적화합니다
- SEO 최적화로 검색 엔진 노출을 향상시킵니다
