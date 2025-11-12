# Chapter 13: 성능 최적화

> **학습 목표**: React 19의 Resource Hints API를 활용하여 프로덕션 레벨 성능 최적화를 구현한다
> **소요 시간**: 150분
> **난이도**: 고급

## 📖 개요

성능 최적화는 사용자 경험의 핵심입니다. React 19는 **Resource Hints API**(`preload`, `preinit`, `prefetchDNS` 등)를 도입하여 리소스 로딩을 세밀하게 제어할 수 있습니다. 이 챕터에서는 메모이제이션, 코드 스플리팅, 그리고 최신 API를 활용한 종합적인 성능 최적화 전략을 학습합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ **NEW**: Resource Hints API (preload, preinit)
- ✅ memo, useMemo, useCallback
- ✅ Code Splitting & Lazy Loading
- ✅ React DevTools Profiler
- ✅ 번들 크기 최적화

---

## 💡 핵심 개념

### 1. React 19 Resource Hints API

React 19는 리소스 로딩을 최적화하는 새로운 API를 제공합니다.

#### preload - 리소스 미리 로드

```typescript
import { preload } from 'react-dom';

function Component() {
  // 컴포넌트 어디서나 호출 가능
  preload('/fonts/main.woff2', { as: 'font', type: 'font/woff2' });

  return <div>Content</div>;
}
```

**사용 가능한 리소스 타입**:
- `font`: 폰트 파일
- `script`: JavaScript 파일
- `style`: CSS 파일
- `image`: 이미지 파일

#### preinit - 스크립트/스타일 미리 실행

```typescript
import { preinit } from 'react-dom';

function Component() {
  // 스크립트를 미리 다운로드하고 실행
  preinit('/analytics.js', { as: 'script' });

  // CSS를 미리 다운로드하고 적용
  preinit('/theme.css', { as: 'style' });

  return <div>Content</div>;
}
```

#### prefetchDNS - DNS 미리 조회

```typescript
import { prefetchDNS } from 'react-dom';

function Component() {
  // 도메인의 DNS를 미리 조회
  prefetchDNS('https://api.example.com');

  return <div>Content</div>;
}
```

#### preconnect - 연결 미리 수립

```typescript
import { preconnect } from 'react-dom';

function Component() {
  // 서버와의 연결을 미리 수립 (DNS + TCP + TLS)
  preconnect('https://api.example.com');

  return <div>Content</div>;
}
```

#### preloadModule / preinitModule - ES Module

```typescript
import { preloadModule, preinitModule } from 'react-dom';

// ES Module 미리 로드
preloadModule('/utils.js', { as: 'script' });

// ES Module 미리 실행
preinitModule('/app.js', { as: 'script' });
```

### 2. 메모이제이션

#### React.memo - 컴포넌트 메모이제이션

```typescript
import { memo } from 'react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

// props가 같으면 리렌더링하지 않음
export const TaskCard = memo(function TaskCard({ task, onEdit }: TaskCardProps) {
  console.log('TaskCard 렌더링:', task.id);

  return (
    <div>
      <h3>{task.title}</h3>
      <button onClick={() => onEdit(task)}>수정</button>
    </div>
  );
});

// 커스텀 비교 함수
export const TaskCard = memo(
  TaskCard,
  (prevProps, nextProps) => {
    // true를 반환하면 리렌더링 스킵
    return prevProps.task.id === nextProps.task.id &&
           prevProps.task.updatedAt === nextProps.task.updatedAt;
  }
);
```

#### useMemo - 값 메모이제이션

```typescript
import { useMemo } from 'react';

function TaskList({ tasks, filter }: Props) {
  // 비싼 계산을 메모이제이션
  const filteredTasks = useMemo(() => {
    console.log('필터링 실행');
    return tasks.filter(task => {
      // 복잡한 필터링 로직
      return task.status === filter;
    });
  }, [tasks, filter]); // tasks나 filter가 변경될 때만 재계산

  return <div>{/* ... */}</div>;
}
```

#### useCallback - 함수 메모이제이션

```typescript
import { useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);

  // ❌ 매 렌더링마다 새 함수 생성
  const handleClick = (id: string) => {
    console.log('Clicked', id);
  };

  // ✅ 함수를 메모이제이션
  const handleClick = useCallback((id: string) => {
    console.log('Clicked', id);
  }, []); // 의존성이 없으면 최초 한 번만 생성

  return <Child onClick={handleClick} />;
}
```

### 3. Code Splitting

```typescript
import { lazy, Suspense } from 'react';

// 동적 import로 코드 분할
const TaskDetail = lazy(() => import('./TaskDetail'));
const ProjectDetail = lazy(() => import('./ProjectDetail'));

function App() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <Routes>
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
      </Routes>
    </Suspense>
  );
}
```

### 4. React DevTools Profiler

```typescript
import { Profiler } from 'react';

function App() {
  const onRenderCallback = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    console.log(`${id} (${phase}) took ${actualDuration}ms`);
  };

  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <TaskList />
    </Profiler>
  );
}
```

---

## 🛠️ 실습: TaskFlow 성능 최적화

### Step 1: Resource Hints 적용

**app/layout.tsx**:

```typescript
import { preload, prefetchDNS, preconnect } from 'react-dom';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 중요한 폰트 미리 로드
  preload('/fonts/inter-var.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });

  // API 서버 DNS 미리 조회
  prefetchDNS('https://api.taskflow.com');

  // CDN 연결 미리 수립
  preconnect('https://cdn.taskflow.com');

  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

**components/TaskDetail.tsx**:

```typescript
import { preinit, preload } from 'react-dom';

export function TaskDetail({ taskId }: { taskId: string }) {
  // 상세 페이지에서만 필요한 스크립트
  preinit('/scripts/task-editor.js', { as: 'script' });

  // 이미지 미리 로드
  preload('/images/task-placeholder.jpg', { as: 'image' });

  return <div>{/* ... */}</div>;
}
```

### Step 2: 메모이제이션 적용

**components/task/TaskCard.tsx** (최적화):

```typescript
import { memo } from 'react';
import { Task } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

// React.memo로 불필요한 리렌더링 방지
export const TaskCard = memo(
  function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
    return (
      <div className="task-card">
        <h3>{task.title}</h3>
        <p>{task.description}</p>

        <div className="actions">
          {onEdit && (
            <button onClick={() => onEdit(task)}>수정</button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(task.id)}>삭제</button>
          )}
        </div>
      </div>
    );
  },
  // 커스텀 비교: updatedAt이 같으면 리렌더링 스킵
  (prevProps, nextProps) => {
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.updatedAt.getTime() === nextProps.task.updatedAt.getTime()
    );
  }
);
```

**components/task/TaskList.tsx** (최적화):

```typescript
import { useMemo, useCallback } from 'react';
import { TaskCard } from './TaskCard';

export function TaskList({ tasks }: { tasks: Task[] }) {
  // 정렬된 tasks를 메모이제이션
  const sortedTasks = useMemo(() => {
    console.log('정렬 실행');
    return [...tasks].sort((a, b) =>
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }, [tasks]);

  // 콜백 함수를 메모이제이션
  const handleEdit = useCallback((task: Task) => {
    console.log('Edit:', task.id);
    // 실제 수정 로직
  }, []);

  const handleDelete = useCallback((taskId: string) => {
    console.log('Delete:', taskId);
    // 실제 삭제 로직
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {sortedTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

### Step 3: 가상화 (Virtualization)

**components/task/VirtualizedTaskList.tsx**:

```typescript
import { useRef, useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

const ITEM_HEIGHT = 200;
const BUFFER = 3;

interface VirtualizedTaskListProps {
  tasks: Task[];
  containerHeight: number;
}

export function VirtualizedTaskList({ tasks, containerHeight }: VirtualizedTaskListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIndex = Math.min(tasks.length, startIndex + visibleCount + BUFFER * 2);
  const visibleTasks = tasks.slice(startIndex, endIndex);

  const totalHeight = tasks.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight }} />

      <div
        style={{
          position: 'absolute',
          top: offsetY,
          left: 0,
          right: 0,
        }}
      >
        {visibleTasks.map((task, index) => (
          <div key={task.id} style={{ height: ITEM_HEIGHT }}>
            <TaskCard task={task} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Code Splitting

**app/routes.tsx**:

```typescript
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// 코드 스플리팅: 각 페이지를 별도 번들로
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const TaskDetail = lazy(() => import('./pages/TaskDetail'));
const Settings = lazy(() => import('./pages/Settings'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    ),
  },
  {
    path: '/projects',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <ProjectList />
      </Suspense>
    ),
  },
  {
    path: '/projects/:projectId',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <ProjectDetail />
      </Suspense>
    ),
  },
  {
    path: '/tasks/:taskId',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <TaskDetail />
      </Suspense>
    ),
  },
  {
    path: '/settings',
    element: (
      <Suspense fallback={<PageSkeleton />}>
        <Settings />
      </Suspense>
    ),
  },
]);
```

### Step 5: 이미지 최적화

**components/common/OptimizedImage.tsx**:

```typescript
import { useState, useEffect } from 'react';
import { preload } from 'react-dom';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (priority) {
      // 우선순위 높은 이미지는 미리 로드
      preload(src, { as: 'image' });
    }
  }, [src, priority]);

  return (
    <div className="relative">
      {/* 로딩 플레이스홀더 */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* 실제 이미지 */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        className={loaded ? 'opacity-100' : 'opacity-0'}
        style={{ transition: 'opacity 0.3s' }}
      />
    </div>
  );
}
```

### Step 6: Profiler로 성능 측정

**utils/profiler.tsx**:

```typescript
import { Profiler, ProfilerOnRenderCallback } from 'react';

const isDevelopment = process.env.NODE_ENV === 'development';

export function PerformanceProfiler({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const onRenderCallback: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    if (isDevelopment) {
      console.log(`[Profiler] ${id}`, {
        phase,
        actualDuration: `${actualDuration.toFixed(2)}ms`,
        baseDuration: `${baseDuration.toFixed(2)}ms`,
      });

      // 느린 렌더링 경고
      if (actualDuration > 16) {
        console.warn(`⚠️ ${id}: 느린 렌더링 (${actualDuration.toFixed(2)}ms)`);
      }
    }
  };

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}
```

**사용**:

```typescript
import { PerformanceProfiler } from '@/utils/profiler';

function TaskListPage() {
  return (
    <PerformanceProfiler id="TaskList">
      <TaskList tasks={tasks} />
    </PerformanceProfiler>
  );
}
```

### Step 7: 번들 크기 분석

**vite.config.ts**:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    // 번들 분석
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // 청크 분할 전략
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': ['framer-motion', 'date-fns'],
        },
      },
    },
  },
});
```

### Step 8: Web Vitals 모니터링

**utils/webVitals.ts**:

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

export function reportWebVitals() {
  onCLS(metric => {
    console.log('CLS:', metric.value);
    // 분석 서비스로 전송
    sendToAnalytics('CLS', metric.value);
  });

  onFID(metric => {
    console.log('FID:', metric.value);
    sendToAnalytics('FID', metric.value);
  });

  onFCP(metric => {
    console.log('FCP:', metric.value);
    sendToAnalytics('FCP', metric.value);
  });

  onLCP(metric => {
    console.log('LCP:', metric.value);
    sendToAnalytics('LCP', metric.value);
  });

  onTTFB(metric => {
    console.log('TTFB:', metric.value);
    sendToAnalytics('TTFB', metric.value);
  });
}

function sendToAnalytics(metric: string, value: number) {
  // Google Analytics, Sentry 등으로 전송
  if (window.gtag) {
    window.gtag('event', metric, {
      value: Math.round(metric === 'CLS' ? value * 1000 : value),
      metric_id: metric,
    });
  }
}
```

**main.tsx**:

```typescript
import { reportWebVitals } from './utils/webVitals';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Web Vitals 모니터링 시작
reportWebVitals();
```

---

## ✅ 완성 코드 구조

```
src/
├── components/
│   ├── common/
│   │   └── OptimizedImage.tsx        ✅
│   └── task/
│       ├── TaskCard.tsx              ✅ (memo 적용)
│       ├── TaskList.tsx              ✅ (useMemo, useCallback)
│       └── VirtualizedTaskList.tsx   ✅
├── utils/
│   ├── profiler.tsx                  ✅
│   └── webVitals.ts                  ✅
├── app/
│   ├── layout.tsx                    ✅ (Resource Hints)
│   └── routes.tsx                    ✅ (Code Splitting)
└── vite.config.ts                    ✅ (번들 분석)
```

---

## 🔍 코드 분석

### Resource Hints 우선순위

```typescript
// 1. DNS Prefetch (가장 빠름, 가장 적은 비용)
prefetchDNS('https://api.example.com');

// 2. Preconnect (DNS + TCP + TLS)
preconnect('https://api.example.com');

// 3. Preload (리소스 다운로드, 실행 안 함)
preload('/script.js', { as: 'script' });

// 4. Preinit (리소스 다운로드 + 실행)
preinit('/script.js', { as: 'script' });
```

### 메모이제이션 비용

```typescript
// ❌ 과도한 메모이제이션 (오히려 느림)
const simpleValue = useMemo(() => a + b, [a, b]); // 단순 계산은 불필요

// ✅ 적절한 메모이제이션 (성능 향상)
const expensiveValue = useMemo(() => {
  // 복잡한 계산, 필터링, 정렬 등
  return tasks.filter(...).sort(...).map(...);
}, [tasks]);
```

---

## ⚠️ 주의사항

### 1. 조기 최적화 금지

```typescript
// ❌ 모든 것을 memo로 감싸기
export const Button = memo(function Button({ onClick }) {
  return <button onClick={onClick}>Click</button>;
});

// ✅ 필요한 곳만 최적화 (측정 후)
export function Button({ onClick }) {
  return <button onClick={onClick}>Click</button>;
}
```

### 2. 의존성 배열 올바르게

```typescript
// ❌ 의존성 누락 (ESLint 경고 무시 금지)
useMemo(() => tasks.filter(t => t.status === status), [tasks]); // status 누락!

// ✅ 모든 의존성 포함
useMemo(() => tasks.filter(t => t.status === status), [tasks, status]);
```

### 3. 번들 크기 주의

```typescript
// ❌ 전체 라이브러리 import
import _ from 'lodash'; // 70KB!

// ✅ 필요한 것만 import
import debounce from 'lodash/debounce'; // 2KB
```

---

## 💪 실전 팁

### 1. 성능 체크리스트

- [ ] React DevTools Profiler로 느린 컴포넌트 식별
- [ ] 불필요한 리렌더링 제거 (memo, useMemo)
- [ ] 큰 리스트는 가상화 적용
- [ ] Code Splitting으로 초기 번들 크기 감소
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] Resource Hints로 중요 리소스 미리 로드
- [ ] Web Vitals 모니터링

### 2. 성능 측정 도구

```bash
# Lighthouse
npm install -g lighthouse
lighthouse https://your-app.com

# Bundle Analyzer
npm run build
npm run analyze

# React DevTools
# Chrome 확장 프로그램 설치
```

### 3. 프로덕션 빌드 최적화

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log 제거
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
});
```

---

## 📚 참고 자료

- [React 19 - Resource Hints](https://react.dev/reference/react-dom#resource-preloading-apis)
- [Web Vitals](https://web.dev/vitals/)
- [React DevTools Profiler](https://react.dev/reference/react/Profiler)

---

## 🎓 연습 문제

### 기본

1. **TaskCard**에 React.memo를 적용하세요.

2. **이미지 lazy loading**을 구현하세요.

3. **번들 분석**을 실행하고 큰 의존성을 찾으세요.

### 도전

4. **무한 스크롤**을 가상화로 구현하세요.

5. **Service Worker**로 오프라인 지원을 추가하세요.

6. **Performance API**로 커스텀 메트릭을 수집하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **React Compiler**를 다룹니다:

- React Compiler 소개
- 자동 메모이제이션
- Rules of React 검증
- Compiler 설정 및 디버깅

**[Chapter 14: React Compiler →](14-react-compiler.md)**

---

**축하합니다!** 🎉 성능 최적화를 마스터했습니다!
