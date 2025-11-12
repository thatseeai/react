# Chapter 15: Suspense와 에러 처리

## 개요

React 19에서 Suspense는 더욱 강력해졌으며, 서버 컴포넌트와 `use()` API와 완벽하게 통합됩니다. 이 장에서는 Suspense를 활용한 선언적 로딩 처리와 Error Boundary를 통한 에러 관리를 다룹니다.

**이 장에서 다룰 내용:**
- Suspense 기본 개념과 React 19 개선사항
- use() API와 Suspense 통합
- Error Boundary 패턴
- 중첩된 Suspense 경계
- 로딩 상태 조합 (병렬/순차)
- 에러 복구 전략
- 실전 로깅 및 모니터링

**TaskFlow에서의 활용:**
복잡한 데이터 로딩 시나리오에서 사용자 경험을 극대화합니다.

## 핵심 개념

### 1. Suspense의 진화

**React 18:**
```typescript
// 주로 lazy() 컴포넌트에만 사용
const LazyComponent = lazy(() => import('./Component'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <LazyComponent />
    </Suspense>
  );
}
```

**React 19:**
```typescript
// use() API와 함께 데이터 페칭에도 사용
function TaskList() {
  const tasks = use(fetchTasks()); // Promise를 직접 읽기!

  return tasks.map(task => <TaskCard key={task.id} task={task} />);
}

function App() {
  return (
    <Suspense fallback={<TaskListSkeleton />}>
      <TaskList />
    </Suspense>
  );
}
```

### 2. use() API와 Suspense

`use()` API는 Promise나 Context를 읽을 수 있습니다:

```typescript
import { use, Suspense } from 'react';

// Promise를 반환하는 함수
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

function UserProfile({ userId }: { userId: string }) {
  // use()가 Promise를 자동으로 Suspend 처리
  const user = use(fetchUser(userId));

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 사용
function App() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

### 3. Error Boundary

React 19에서도 Error Boundary는 클래스 컴포넌트로 작성합니다:

```typescript
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>문제가 발생했습니다</h2>
          <button onClick={this.reset}>다시 시도</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 4. Suspense와 Error Boundary 조합

```typescript
function DataComponent() {
  return (
    <ErrorBoundary fallback={<ErrorView />}>
      <Suspense fallback={<LoadingView />}>
        <DataFetcher />
      </Suspense>
    </ErrorBoundary>
  );
}

// 로딩 → 성공 또는 에러
// - 로딩 중: LoadingView 표시
// - 성공: DataFetcher 렌더링
// - 에러: ErrorView 표시
```

### 5. 중첩된 Suspense 경계

```typescript
function Dashboard() {
  return (
    <div>
      {/* 헤더는 빠르게 로드 */}
      <Suspense fallback={<HeaderSkeleton />}>
        <DashboardHeader />
      </Suspense>

      {/* 메인 콘텐츠는 독립적으로 로드 */}
      <Suspense fallback={<MainSkeleton />}>
        <MainContent />

        {/* 사이드바는 더 나중에 로드 가능 */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </Suspense>
    </div>
  );
}
```

**장점:**
- 세밀한 로딩 제어
- 빠른 부분은 먼저 표시
- 각 영역 독립적 에러 처리

## 실습: TaskFlow 데이터 로딩 시스템

### 1. 프로젝트 구조

```
src/
├── components/
│   ├── ErrorBoundary.tsx       # 에러 경계
│   ├── TaskBoard.tsx            # 메인 보드
│   ├── TaskList.tsx             # 태스크 리스트
│   └── skeletons/
│       ├── TaskBoardSkeleton.tsx
│       ├── TaskListSkeleton.tsx
│       └── TaskCardSkeleton.tsx
├── errors/
│   ├── AppError.ts              # 커스텀 에러
│   └── errorHandlers.ts         # 에러 핸들러
└── lib/
    ├── suspense.ts              # Suspense 유틸리티
    └── cache.ts                 # 캐싱 로직
```

### 2. ErrorBoundary 구현

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { logError } from '../lib/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 (Sentry, LogRocket 등)
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // resetKeys가 변경되면 에러 상태 초기화
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      !arraysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

// 기본 에러 UI
function DefaultErrorFallback({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="error-fallback">
      <div className="error-content">
        <h2>문제가 발생했습니다</h2>
        <p className="error-message">{error.message}</p>
        <div className="error-actions">
          <button onClick={reset} className="retry-button">
            다시 시도
          </button>
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    </div>
  );
}

function arraysEqual(a: any[] = [], b: any[] = []) {
  return a.length === b.length && a.every((val, idx) => val === b[idx]);
}
```

### 3. 커스텀 에러 타입

```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message = '네트워크 오류가 발생했습니다', details?: any) {
    super(message, 'NETWORK_ERROR', 0, details);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = '인증이 필요합니다', details?: any) {
    super(message, 'AUTH_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다', details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message = '입력값이 올바르지 않습니다', details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}
```

### 4. 에러별 UI 처리

```typescript
// src/components/ErrorFallback.tsx
import {
  NetworkError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  AppError
} from '../errors/AppError';

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  // 에러 타입별 UI
  if (error instanceof NetworkError) {
    return (
      <div className="error-fallback network-error">
        <svg className="error-icon" />
        <h2>인터넷 연결을 확인해주세요</h2>
        <p>네트워크 연결이 불안정합니다</p>
        <button onClick={reset}>다시 시도</button>
      </div>
    );
  }

  if (error instanceof AuthenticationError) {
    return (
      <div className="error-fallback auth-error">
        <svg className="error-icon" />
        <h2>로그인이 필요합니다</h2>
        <p>계속하려면 다시 로그인해주세요</p>
        <button onClick={() => (window.location.href = '/login')}>
          로그인
        </button>
      </div>
    );
  }

  if (error instanceof NotFoundError) {
    return (
      <div className="error-fallback not-found-error">
        <svg className="error-icon" />
        <h2>페이지를 찾을 수 없습니다</h2>
        <p>{error.message}</p>
        <button onClick={() => (window.location.href = '/')}>
          홈으로
        </button>
      </div>
    );
  }

  if (error instanceof ValidationError) {
    return (
      <div className="error-fallback validation-error">
        <svg className="error-icon" />
        <h2>입력값 오류</h2>
        <p>{error.message}</p>
        <button onClick={reset}>다시 시도</button>
      </div>
    );
  }

  // 기본 에러 UI
  return (
    <div className="error-fallback generic-error">
      <svg className="error-icon" />
      <h2>문제가 발생했습니다</h2>
      <p>{error.message || '알 수 없는 오류가 발생했습니다'}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

### 5. Suspense 유틸리티

```typescript
// src/lib/suspense.ts
type SuspenseCache<T> = {
  status: 'pending' | 'fulfilled' | 'rejected';
  value?: T;
  error?: Error;
  promise?: Promise<T>;
};

const cache = new Map<string, SuspenseCache<any>>();

/**
 * Promise를 Suspense-friendly하게 만드는 래퍼
 */
export function wrapPromise<T>(
  promise: Promise<T>,
  cacheKey?: string
): () => T {
  // 캐시 확인
  if (cacheKey && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (cached.status === 'fulfilled') return () => cached.value!;
    if (cached.status === 'rejected') throw cached.error;
    throw cached.promise; // 여전히 pending
  }

  const resource: SuspenseCache<T> = {
    status: 'pending',
    promise
  };

  promise.then(
    (value) => {
      resource.status = 'fulfilled';
      resource.value = value;
      if (cacheKey) cache.set(cacheKey, resource);
    },
    (error) => {
      resource.status = 'rejected';
      resource.error = error;
      if (cacheKey) cache.set(cacheKey, resource);
    }
  );

  return () => {
    if (resource.status === 'fulfilled') {
      return resource.value!;
    }
    if (resource.status === 'rejected') {
      throw resource.error;
    }
    throw resource.promise; // Suspend!
  };
}

/**
 * 캐시 무효화
 */
export function invalidateCache(key: string) {
  cache.delete(key);
}

export function invalidateAllCache() {
  cache.clear();
}

/**
 * 여러 Promise를 병렬로 처리
 */
export function suspenseAll<T extends readonly unknown[]>(
  promises: readonly [...T]
): () => { [K in keyof T]: Awaited<T[K]> } {
  const allPromise = Promise.all(promises) as Promise<
    { [K in keyof T]: Awaited<T[K]> }
  >;

  return wrapPromise(allPromise);
}
```

### 6. TaskBoard with Suspense

```typescript
// src/components/TaskBoard.tsx
import { use, Suspense } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { TaskBoardSkeleton } from './skeletons/TaskBoardSkeleton';
import { fetchProject, fetchTasks, fetchTeamMembers } from '../api';
import type { Project, Task, User } from '../types';

interface TaskBoardProps {
  projectId: string;
}

export default function TaskBoard({ projectId }: TaskBoardProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ErrorFallback error={error} reset={reset} projectId={projectId} />
      )}
      resetKeys={[projectId]} // projectId 변경 시 에러 리셋
    >
      <Suspense fallback={<TaskBoardSkeleton />}>
        <TaskBoardContent projectId={projectId} />
      </Suspense>
    </ErrorBoundary>
  );
}

function TaskBoardContent({ projectId }: { projectId: string }) {
  // 병렬 데이터 페칭
  const project = use(fetchProject(projectId));
  const tasks = use(fetchTasks(projectId));
  const members = use(fetchTeamMembers(projectId));

  return (
    <div className="task-board">
      <BoardHeader project={project} members={members} />

      {/* 각 컬럼을 독립적으로 Suspend */}
      <div className="board-columns">
        <Suspense fallback={<ColumnSkeleton />}>
          <TaskColumn
            title="할 일"
            tasks={tasks.filter(t => t.status === 'todo')}
          />
        </Suspense>

        <Suspense fallback={<ColumnSkeleton />}>
          <TaskColumn
            title="진행 중"
            tasks={tasks.filter(t => t.status === 'in-progress')}
          />
        </Suspense>

        <Suspense fallback={<ColumnSkeleton />}>
          <TaskColumn
            title="완료"
            tasks={tasks.filter(t => t.status === 'done')}
          />
        </Suspense>
      </div>
    </div>
  );
}
```

### 7. 점진적 로딩 전략

```typescript
// src/components/DashboardProgressive.tsx
import { Suspense } from 'react';

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* 1. 헤더는 즉시 표시 (정적 콘텐츠) */}
      <header className="dashboard-header">
        <h1>TaskFlow</h1>
        <nav>{/* 네비게이션 */}</nav>
      </header>

      {/* 2. 중요한 콘텐츠 먼저 (빠른 API) */}
      <ErrorBoundary>
        <Suspense fallback={<QuickStatsSkeleton />}>
          <QuickStats /> {/* ~100ms */}
        </Suspense>
      </ErrorBoundary>

      {/* 3. 메인 콘텐츠 (중간 속도) */}
      <ErrorBoundary>
        <Suspense fallback={<TaskBoardSkeleton />}>
          <TaskBoard /> {/* ~500ms */}
        </Suspense>
      </ErrorBoundary>

      {/* 4. 덜 중요한 콘텐츠는 나중에 (느린 API) */}
      <ErrorBoundary>
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <ActivityFeed /> {/* ~1000ms */}
        </Suspense>
      </ErrorBoundary>

      {/* 5. 부가 정보는 가장 나중에 */}
      <ErrorBoundary>
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsWidget /> {/* ~2000ms */}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
```

## 완성 코드: 종합 예제

### 1. 스켈레톤 컴포넌트

```typescript
// src/components/skeletons/TaskBoardSkeleton.tsx
export function TaskBoardSkeleton() {
  return (
    <div className="task-board-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title h-8 w-48" />
        <div className="skeleton-actions">
          <div className="skeleton-button h-10 w-24" />
          <div className="skeleton-button h-10 w-24" />
        </div>
      </div>

      <div className="skeleton-columns">
        <ColumnSkeleton />
        <ColumnSkeleton />
        <ColumnSkeleton />
      </div>
    </div>
  );
}

export function ColumnSkeleton() {
  return (
    <div className="column-skeleton">
      <div className="skeleton-column-header">
        <div className="skeleton-text h-6 w-20" />
        <div className="skeleton-badge h-5 w-8" />
      </div>
      <div className="skeleton-cards">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="task-card-skeleton">
      <div className="skeleton-text h-5 w-3/4" />
      <div className="skeleton-text h-4 w-full mt-2" />
      <div className="skeleton-text h-4 w-5/6 mt-1" />
      <div className="skeleton-footer mt-4 flex justify-between">
        <div className="skeleton-badge h-5 w-16" />
        <div className="skeleton-avatar h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}
```

### 2. API 함수 with 에러 처리

```typescript
// src/api/tasks.ts
import {
  NetworkError,
  AuthenticationError,
  NotFoundError,
  AppError
} from '../errors/AppError';

async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthenticationError();
      }
      if (response.status === 404) {
        throw new NotFoundError();
      }
      if (response.status >= 500) {
        throw new AppError(
          '서버 오류가 발생했습니다',
          'SERVER_ERROR',
          response.status
        );
      }

      const errorData = await response.json().catch(() => ({}));
      throw new AppError(
        errorData.message || '요청 처리 중 오류가 발생했습니다',
        'API_ERROR',
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError();
    }

    throw new AppError(
      error instanceof Error ? error.message : '알 수 없는 오류',
      'UNKNOWN_ERROR'
    );
  }
}

// Suspense-friendly API 함수들
const taskCache = new Map<string, Promise<any>>();

export function fetchProject(projectId: string) {
  const cacheKey = `project-${projectId}`;

  if (!taskCache.has(cacheKey)) {
    const promise = fetchWithErrorHandling<Project>(
      `/api/projects/${projectId}`
    );
    taskCache.set(cacheKey, promise);
  }

  return taskCache.get(cacheKey)!;
}

export function fetchTasks(projectId: string) {
  const cacheKey = `tasks-${projectId}`;

  if (!taskCache.has(cacheKey)) {
    const promise = fetchWithErrorHandling<Task[]>(
      `/api/projects/${projectId}/tasks`
    );
    taskCache.set(cacheKey, promise);
  }

  return taskCache.get(cacheKey)!;
}

export function fetchTeamMembers(projectId: string) {
  const cacheKey = `members-${projectId}`;

  if (!taskCache.has(cacheKey)) {
    const promise = fetchWithErrorHandling<User[]>(
      `/api/projects/${projectId}/members`
    );
    taskCache.set(cacheKey, promise);
  }

  return taskCache.get(cacheKey)!;
}

export function invalidateProjectCache(projectId: string) {
  taskCache.delete(`project-${projectId}`);
  taskCache.delete(`tasks-${projectId}`);
  taskCache.delete(`members-${projectId}`);
}
```

### 3. 에러 로깅 서비스

```typescript
// src/lib/errorLogger.ts
interface ErrorContext {
  componentStack?: string;
  errorBoundary?: boolean;
  [key: string]: any;
}

class ErrorLogger {
  private static instance: ErrorLogger;

  private constructor() {}

  static getInstance() {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(error: Error, context?: ErrorContext) {
    // 콘솔 로깅
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }

    // 개발 환경에서는 여기까지
    if (import.meta.env.DEV) {
      return;
    }

    // 프로덕션: Sentry, LogRocket 등으로 전송
    this.sendToSentry(error, context);
    this.sendToAnalytics(error, context);
  }

  private sendToSentry(error: Error, context?: ErrorContext) {
    // Sentry.captureException(error, { extra: context });
  }

  private sendToAnalytics(error: Error, context?: ErrorContext) {
    // analytics.track('error', {
    //   message: error.message,
    //   stack: error.stack,
    //   ...context
    // });
  }

  // 특정 에러는 무시
  shouldIgnore(error: Error): boolean {
    const ignoredErrors = [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured'
    ];

    return ignoredErrors.some(msg => error.message.includes(msg));
  }
}

export const logError = (error: Error, context?: ErrorContext) => {
  const logger = ErrorLogger.getInstance();

  if (logger.shouldIgnore(error)) {
    return;
  }

  logger.log(error, context);
};
```

### 4. 재시도 로직

```typescript
// src/lib/retry.ts
interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      onRetry?.(attempt, lastError);

      const waitTime =
        backoff === 'exponential'
          ? delay * Math.pow(2, attempt - 1)
          : delay * attempt;

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

// 사용 예
export function fetchTasksWithRetry(projectId: string) {
  return withRetry(
    () => fetch(`/api/projects/${projectId}/tasks`).then(r => r.json()),
    {
      maxAttempts: 3,
      delay: 1000,
      backoff: 'exponential',
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}:`, error.message);
      }
    }
  );
}
```

## 코드 분석

### 1. Suspense의 작동 원리

```typescript
// React가 내부적으로 하는 일
function Suspense({ children, fallback }) {
  try {
    return children;
  } catch (promise) {
    // Promise가 throw되면 fallback 표시
    if (promise instanceof Promise) {
      // Promise가 resolve되면 children 다시 렌더링
      promise.then(() => {
        forceUpdate();
      });
      return fallback;
    }
    throw promise; // Promise가 아니면 에러로 처리
  }
}
```

### 2. use() API의 작동 원리

```typescript
// use()의 간소화된 구현
function use<T>(promise: Promise<T>): T {
  if (promise.status === 'fulfilled') {
    return promise.value;
  }

  if (promise.status === 'rejected') {
    throw promise.reason;
  }

  // pending 상태면 Promise를 throw (Suspend!)
  throw promise;
}
```

### 3. 병렬 vs 순차 로딩

**병렬 로딩 (빠름):**
```typescript
function ParallelLoading() {
  // 모든 fetch가 동시에 시작
  const data1 = use(fetchData1());
  const data2 = use(fetchData2());
  const data3 = use(fetchData3());

  // 가장 느린 것이 완료되면 렌더링
  return <div>{data1} {data2} {data3}</div>;
}
```

**순차 로딩 (느림):**
```typescript
function SequentialLoading() {
  return (
    <Suspense fallback={<Loading1 />}>
      <Data1>
        <Suspense fallback={<Loading2 />}>
          <Data2>
            <Suspense fallback={<Loading3 />}>
              <Data3 />
            </Suspense>
          </Data2>
        </Suspense>
      </Data1>
    </Suspense>
  );
}
// Data1 → Data2 → Data3 순서로 로드
```

## 주의사항

### 1. Suspense는 Effect를 기다리지 않음

```typescript
// ❌ 작동하지 않음
function BadExample() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  // Suspense가 Effect를 기다리지 않음!
  return <div>{data.title}</div>;
}

// ✅ use() 사용
function GoodExample() {
  const data = use(fetchData());
  return <div>{data.title}</div>;
}
```

### 2. 캐싱 필수

```typescript
// ❌ 매번 새로운 Promise 생성 (무한 루프!)
function BadCaching({ id }) {
  const data = use(fetchData(id)); // 매번 새로운 Promise!
  return <div>{data}</div>;
}

// ✅ Promise 캐싱
const cache = new Map();

function GoodCaching({ id }) {
  if (!cache.has(id)) {
    cache.set(id, fetchData(id));
  }
  const data = use(cache.get(id));
  return <div>{data}</div>;
}
```

### 3. Error Boundary는 비동기 에러만 catch

```typescript
// ❌ 동기 에러는 catch 안 됨
function Component() {
  throw new Error('Sync error'); // Error Boundary가 catch
}

// ❌ Effect 내 에러는 catch 안 됨
function Component() {
  useEffect(() => {
    throw new Error('Effect error'); // catch 안 됨!
  }, []);
}

// ✅ use() 또는 render 중 에러
function Component() {
  const data = use(fetchData()); // 이 에러는 catch됨
}
```

## 실전 팁

### 1. Suspense 경계 배치 전략

```typescript
// 페이지 레벨 - 전체 페이지 로딩
<Suspense fallback={<PageLoader />}>
  <ProjectPage />
</Suspense>

// 섹션 레벨 - 각 섹션 독립적
<Suspense fallback={<HeaderSkeleton />}>
  <Header />
</Suspense>
<Suspense fallback={<ContentSkeleton />}>
  <Content />
</Suspense>

// 컴포넌트 레벨 - 세밀한 제어
<Suspense fallback={<TaskCardSkeleton />}>
  <TaskCard />
</Suspense>
```

### 2. 스켈레톤 UI 디자인

```typescript
// 실제 컴포넌트와 비슷한 구조
function TaskCard({ task }) {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <span>{task.status}</span>
    </div>
  );
}

function TaskCardSkeleton() {
  return (
    <div className="task-card skeleton">
      <div className="skeleton-text h-6 w-3/4" /> {/* title */}
      <div className="skeleton-text h-4 w-full mt-2" /> {/* description */}
      <div className="skeleton-badge h-5 w-16 mt-4" /> {/* status */}
    </div>
  );
}
```

### 3. 에러 복구 전략

```typescript
function TaskBoardWithRecovery({ projectId }: { projectId: string }) {
  const [retryCount, setRetryCount] = useState(0);

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h3>오류: {error.message}</h3>
          <button
            onClick={() => {
              setRetryCount(c => c + 1);
              reset();
            }}
          >
            다시 시도 ({retryCount}/3)
          </button>

          {retryCount >= 3 && (
            <button onClick={() => window.location.reload()}>
              페이지 새로고침
            </button>
          )}
        </div>
      )}
      resetKeys={[projectId, retryCount]}
    >
      <Suspense fallback={<TaskBoardSkeleton />}>
        <TaskBoard projectId={projectId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### 4. 프리로딩

```typescript
// 링크 호버 시 데이터 프리로드
function ProjectLink({ projectId }: { projectId: string }) {
  const handleMouseEnter = () => {
    // 캐시에 데이터 미리 로드
    fetchProject(projectId);
    fetchTasks(projectId);
  };

  return (
    <Link to={`/projects/${projectId}`} onMouseEnter={handleMouseEnter}>
      프로젝트 보기
    </Link>
  );
}
```

## 테스트

### 1. Suspense 테스트

```typescript
// src/__tests__/suspense.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

describe('Suspense', () => {
  it('should show fallback while loading', async () => {
    function AsyncComponent() {
      const data = use(
        new Promise(resolve => setTimeout(() => resolve('Data'), 100))
      );
      return <div>{data}</div>;
    }

    render(
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncComponent />
      </Suspense>
    );

    // 처음에는 fallback 표시
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // 로딩 완료 후 데이터 표시
    await waitFor(() => {
      expect(screen.getByText('Data')).toBeInTheDocument();
    });
  });
});
```

### 2. Error Boundary 테스트

```typescript
// src/__tests__/error-boundary.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('should catch errors and show fallback', () => {
    function ThrowError() {
      throw new Error('Test error');
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should reset error on button click', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) {
        throw new Error('Error');
      }
      return <div>Success</div>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();

    shouldThrow = false;
    const resetButton = screen.getByText('다시 시도');
    await user.click(resetButton);

    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

## 연습 문제

### 기초

1. **기본 Suspense**
   - use() API로 데이터 페칭
   - Suspense fallback 추가
   - 스켈레톤 UI 작성

2. **Error Boundary**
   - ErrorBoundary 클래스 작성
   - 에러 UI 구현
   - 재시도 기능 추가

3. **커스텀 에러**
   - 여러 에러 타입 정의
   - 에러별 UI 처리
   - 에러 로깅

### 중급

4. **중첩 Suspense**
   - 페이지를 여러 섹션으로 분리
   - 각 섹션에 독립적인 Suspense
   - 점진적 로딩 구현

5. **병렬 데이터 로딩**
   - 여러 API 동시 호출
   - 모든 데이터 로드 후 렌더링
   - 부분 에러 처리

6. **캐싱 전략**
   - Promise 캐싱 구현
   - 캐시 무효화 로직
   - TTL(Time To Live) 추가

### 고급

7. **프리로딩**
   - 링크 호버 시 데이터 프리로드
   - 라우트 변경 전 데이터 준비
   - 프리로드 취소

8. **에러 복구**
   - 자동 재시도 로직
   - 지수 백오프
   - 재시도 횟수 제한

9. **종합 실습**
   - 대시보드 페이지 구현
   - 여러 데이터 소스
   - Suspense + Error Boundary 조합
   - 스켈레톤 UI 디자인
   - 성능 최적화

## 다음 단계

다음 장에서는 **Server-Side Rendering (SSR)**을 다룹니다:
- Next.js와 React 19
- Streaming SSR
- Server Components with SSR
- SEO 최적화

Suspense는 SSR과 함께 사용할 때 더욱 강력합니다!

---

**핵심 요약:**
- Suspense는 선언적 로딩 처리를 가능하게 합니다
- use() API로 Promise를 직접 읽을 수 있습니다
- Error Boundary로 에러를 격리하고 처리합니다
- 중첩 Suspense로 점진적 로딩을 구현합니다
- 스켈레톤 UI로 더 나은 사용자 경험을 제공합니다
- 캐싱과 재시도로 안정성을 높입니다
