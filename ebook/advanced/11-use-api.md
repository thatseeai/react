# Chapter 11: use() API 활용

> **학습 목표**: React 19의 use() API를 마스터하여 선언적 데이터 페칭을 구현한다
> **소요 시간**: 120분
> **난이도**: 고급

## 📖 개요

React 19의 `use()` API는 Promise와 Context를 읽을 수 있는 혁신적인 Hook입니다. 일반적인 Hooks의 규칙에서 벗어나 **조건부로 호출 가능**하며, **루프 안에서도 사용**할 수 있습니다. 이를 통해 더 유연하고 선언적인 코드를 작성할 수 있습니다.

이 챕터에서는 use() API의 모든 기능을 깊이 탐구하고, TaskFlow에서 데이터 페칭을 최적화합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ **NEW**: use()로 Promise 읽기
- ✅ use()로 Context 읽기 (복습)
- ✅ 조건부 데이터 페칭
- ✅ Suspense와 통합
- ✅ 에러 바운더리 처리

---

## 💡 핵심 개념

### 1. use() API란?

`use()`는 React 19에서 추가된 특별한 API로, Promise나 Context의 값을 읽을 수 있습니다.

```typescript
import { use } from 'react';

function Component() {
  // Promise 읽기
  const data = use(fetchDataPromise());

  // Context 읽기
  const theme = use(ThemeContext);

  return <div>{data.title}</div>;
}
```

**일반 Hooks와의 차이**:

| 일반 Hooks | use() API |
|-----------|-----------|
| 조건부 호출 불가 | 조건부 호출 가능 ✅ |
| 루프 안 사용 불가 | 루프 안 사용 가능 ✅ |
| 컴포넌트 최상위만 | 어디서나 호출 가능 ✅ |
| `use`로 시작 필수 | `use` 이름 고정 |

### 2. use()로 Promise 읽기

```typescript
import { use, Suspense } from 'react';

// Promise를 반환하는 함수
function fetchUser(userId: string): Promise<User> {
  return fetch(`/api/users/${userId}`).then(r => r.json());
}

function UserProfile({ userId }: { userId: string }) {
  // use()로 Promise 읽기
  const user = use(fetchUser(userId));

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// Suspense로 감싸야 함
function App() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

**작동 원리**:
1. `use(promise)`가 호출되면 Promise가 pending 상태
2. React가 렌더링을 중단하고 Suspense fallback 표시
3. Promise가 resolve되면 컴포넌트 재렌더링
4. `use()`가 resolved 값 반환

### 3. 조건부 호출

일반 Hooks와 달리 use()는 조건부로 호출할 수 있습니다!

```typescript
function Component({ shouldFetch, userId }: Props) {
  // ✅ use() - 조건부 가능
  if (shouldFetch) {
    const user = use(fetchUser(userId));
    return <div>{user.name}</div>;
  }

  return <div>데이터를 가져오지 않음</div>;
}

// ❌ useEffect - 조건부 불가
function Component({ shouldFetch }: Props) {
  if (shouldFetch) {
    useEffect(() => {}, []); // 에러!
  }
}
```

### 4. 루프에서 사용

```typescript
function TaskList({ taskIds }: { taskIds: string[] }) {
  return (
    <div>
      {taskIds.map(id => {
        // ✅ use() - 루프 안에서 가능
        const task = use(fetchTask(id));
        return <div key={id}>{task.title}</div>;
      })}
    </div>
  );
}
```

### 5. Context 읽기 (복습)

Chapter 5에서 배운 내용을 복습합니다.

```typescript
import { use, createContext } from 'react';

const ThemeContext = createContext('light');

function ThemedButton() {
  // use()로 Context 읽기
  const theme = use(ThemeContext);

  return <button className={theme}>버튼</button>;
}
```

### 6. useEffect vs use()

```typescript
// ❌ useEffect - 복잡함
function Component({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div>로딩 중...</div>;
  if (!user) return null;

  return <div>{user.name}</div>;
}

// ✅ use() - 간단명료
function Component({ userId }: { userId: string }) {
  const user = use(fetchUser(userId));
  return <div>{user.name}</div>;
}
```

---

## 🛠️ 실습: Task 데이터 페칭

### Step 1: 기본 use() 활용

**src/api/tasks.ts**:

```typescript
import { Task } from '@/types/task';

// Promise를 반환하는 API 함수
export function fetchTask(taskId: string): Promise<Task> {
  return fetch(`/api/tasks/${taskId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Task not found');
      }
      return response.json();
    });
}

export function fetchTasks(projectId: string): Promise<Task[]> {
  return fetch(`/api/projects/${projectId}/tasks`)
    .then(response => response.json());
}
```

**src/components/task/TaskDetail.tsx**:

```typescript
import { use, Suspense } from 'react';
import { fetchTask } from '@/api/tasks';

interface TaskDetailProps {
  taskId: string;
}

function TaskDetailContent({ taskId }: TaskDetailProps) {
  // React 19: use()로 Promise 읽기
  const task = use(fetchTask(taskId));

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-4">{task.title}</h1>
      <p className="text-gray-600 mb-4">{task.description}</p>

      <div className="flex gap-4">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
          {task.status}
        </span>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded">
          {task.priority}
        </span>
      </div>

      {task.dueDate && (
        <p className="mt-4 text-sm text-gray-500">
          마감일: {new Date(task.dueDate).toLocaleDateString('ko-KR')}
        </p>
      )}
    </div>
  );
}

// Suspense로 감싸기
export function TaskDetail({ taskId }: TaskDetailProps) {
  return (
    <Suspense fallback={<TaskDetailSkeleton />}>
      <TaskDetailContent taskId={taskId} />
    </Suspense>
  );
}

function TaskDetailSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
    </div>
  );
}
```

### Step 2: 조건부 데이터 페칭

**src/components/task/ConditionalTaskLoader.tsx**:

```typescript
import { use, Suspense } from 'react';
import { fetchTask } from '@/api/tasks';

interface ConditionalTaskLoaderProps {
  taskId: string | null;
  shouldLoad: boolean;
}

function TaskContent({ taskId, shouldLoad }: ConditionalTaskLoaderProps) {
  // React 19: 조건부로 use() 호출 가능!
  if (!shouldLoad || !taskId) {
    return <div className="text-gray-500">작업을 선택하세요</div>;
  }

  // use()를 조건문 안에서 호출
  const task = use(fetchTask(taskId));

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{task.title}</h3>
      <p className="text-sm text-gray-600">{task.description}</p>
    </div>
  );
}

export function ConditionalTaskLoader(props: ConditionalTaskLoaderProps) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <TaskContent {...props} />
    </Suspense>
  );
}
```

**사용**:

```typescript
function TaskSidebar() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        사이드바 열기
      </button>

      <ConditionalTaskLoader
        taskId={selectedTaskId}
        shouldLoad={isOpen}
      />
    </div>
  );
}
```

### Step 3: 병렬 데이터 로딩

**src/components/task/TaskListParallel.tsx**:

```typescript
import { use, Suspense } from 'react';
import { fetchTask } from '@/api/tasks';

interface TaskListParallelProps {
  taskIds: string[];
}

function TaskItem({ taskId }: { taskId: string }) {
  // 각 Task를 병렬로 로드
  const task = use(fetchTask(taskId));

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{task.title}</h3>
    </div>
  );
}

function TaskListContent({ taskIds }: TaskListParallelProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {taskIds.map(taskId => (
        // 각 항목마다 Suspense
        <Suspense key={taskId} fallback={<div className="animate-pulse bg-gray-200 h-24 rounded" />}>
          <TaskItem taskId={taskId} />
        </Suspense>
      ))}
    </div>
  );
}

export function TaskListParallel({ taskIds }: TaskListParallelProps) {
  return (
    <Suspense fallback={<div>전체 로딩 중...</div>}>
      <TaskListContent taskIds={taskIds} />
    </Suspense>
  );
}
```

### Step 4: Promise 캐싱

**src/utils/promiseCache.ts**:

```typescript
// Promise를 캐싱하여 중복 요청 방지
const cache = new Map<string, Promise<any>>();

export function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const promise = fetcher();
  cache.set(key, promise);

  // 실패 시 캐시에서 제거
  promise.catch(() => {
    cache.delete(key);
  });

  return promise;
}

export function invalidateCache(key: string) {
  cache.delete(key);
}

export function clearCache() {
  cache.clear();
}
```

**src/api/tasks.ts** (캐싱 적용):

```typescript
import { cachedFetch } from '@/utils/promiseCache';

export function fetchTask(taskId: string): Promise<Task> {
  return cachedFetch(`task-${taskId}`, () =>
    fetch(`/api/tasks/${taskId}`).then(r => r.json())
  );
}

export function fetchTasks(projectId: string): Promise<Task[]> {
  return cachedFetch(`project-${projectId}-tasks`, () =>
    fetch(`/api/projects/${projectId}/tasks`).then(r => r.json())
  );
}
```

### Step 5: 에러 처리

**src/components/common/ErrorBoundary.tsx**:

```typescript
import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            오류가 발생했습니다
          </h2>
          <p className="text-sm text-red-600 mb-4">
            {this.state.error.message}
          </p>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**사용**:

```typescript
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { TaskDetail } from '@/components/task/TaskDetail';

function TaskPage({ taskId }: { taskId: string }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="p-6 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-800">로딩 실패</h3>
          <p className="text-sm text-red-600">{error.message}</p>
          <button onClick={reset} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
            재시도
          </button>
        </div>
      )}
    >
      <Suspense fallback={<div>로딩 중...</div>}>
        <TaskDetail taskId={taskId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

### Step 6: Context와 Promise 함께 사용

**src/components/task/TaskWithContext.tsx**:

```typescript
import { use, createContext, Suspense } from 'react';
import { fetchTask } from '@/api/tasks';

// Context 생성
const TaskIdContext = createContext<string | null>(null);

function TaskContent() {
  // Context에서 taskId 읽기
  const taskId = use(TaskIdContext);

  if (!taskId) {
    return <div>Task ID가 없습니다</div>;
  }

  // Promise 읽기
  const task = use(fetchTask(taskId));

  return (
    <div>
      <h2>{task.title}</h2>
      <p>{task.description}</p>
    </div>
  );
}

export function TaskWithContext({ taskId }: { taskId: string }) {
  return (
    <TaskIdContext value={taskId}>
      <Suspense fallback={<div>로딩 중...</div>}>
        <TaskContent />
      </Suspense>
    </TaskIdContext>
  );
}
```

### Step 7: 폴백 값과 함께 사용

**src/components/task/TaskWithFallback.tsx**:

```typescript
import { use, Suspense } from 'react';
import { fetchTask } from '@/api/tasks';

function TaskContent({ taskId, fallbackTask }: { taskId: string; fallbackTask: Task }) {
  let task: Task;

  try {
    // Promise 읽기 시도
    task = use(fetchTask(taskId));
  } catch (error) {
    // 실패 시 폴백 사용
    if (error instanceof Promise) {
      throw error; // Suspense로 전달
    }
    task = fallbackTask;
  }

  return (
    <div>
      <h2>{task.title}</h2>
      {task.id === fallbackTask.id && (
        <span className="text-yellow-600">오프라인 모드</span>
      )}
    </div>
  );
}

export function TaskWithFallback({ taskId, fallbackTask }: Props) {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <TaskContent taskId={taskId} fallbackTask={fallbackTask} />
    </Suspense>
  );
}
```

---

## ✅ 완성 코드 구조

```
src/
├── api/
│   └── tasks.ts                      ✅
├── utils/
│   └── promiseCache.ts               ✅
├── components/
│   ├── common/
│   │   └── ErrorBoundary.tsx         ✅
│   └── task/
│       ├── TaskDetail.tsx            ✅
│       ├── ConditionalTaskLoader.tsx ✅
│       ├── TaskListParallel.tsx      ✅
│       ├── TaskWithContext.tsx       ✅
│       └── TaskWithFallback.tsx      ✅
```

---

## 🔍 코드 분석

### use()의 작동 원리

```typescript
function use<T>(promise: Promise<T>): T {
  // 내부적으로:
  // 1. Promise가 pending이면 throw promise (Suspense가 catch)
  // 2. Promise가 resolved면 값 반환
  // 3. Promise가 rejected면 throw error (ErrorBoundary가 catch)
}
```

### Suspense의 역할

```typescript
<Suspense fallback={<Loading />}>
  <Component /> {/* use()가 Promise throw */}
</Suspense>

// React가 내부적으로:
// 1. Component 렌더링 시작
// 2. use()가 pending Promise throw
// 3. Suspense가 catch하고 fallback 표시
// 4. Promise resolve 후 Component 재렌더링
```

### 캐싱 전략

```typescript
// 1. 메모리 캐시 (간단하지만 새로고침 시 사라짐)
const cache = new Map();

// 2. localStorage 캐시 (영구적)
function cachedFetch(key: string, fetcher: () => Promise<any>) {
  const cached = localStorage.getItem(key);
  if (cached) {
    return Promise.resolve(JSON.parse(cached));
  }

  return fetcher().then(data => {
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  });
}

// 3. SWR 패턴 (Stale-While-Revalidate)
// 캐시된 데이터를 먼저 반환하고, 백그라운드에서 재검증
```

---

## ⚠️ 주의사항

### 1. Suspense 필수

```typescript
// ❌ Suspense 없이 use() 사용
function Component() {
  const data = use(promise); // 에러!
  return <div>{data}</div>;
}

// ✅ Suspense로 감싸기
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}
```

### 2. Promise는 컴포넌트 외부에서 생성

```typescript
// ❌ 렌더링마다 새 Promise
function Component() {
  const data = use(fetch('/api/data')); // 무한 루프!
}

// ✅ 외부에서 생성하거나 캐싱
const dataPromise = fetch('/api/data');
function Component() {
  const data = use(dataPromise);
}

// ✅ 또는 캐싱 사용
function Component() {
  const data = use(cachedFetch('data', () => fetch('/api/data')));
}
```

### 3. ErrorBoundary 추가

```typescript
<ErrorBoundary>
  <Suspense fallback={<Loading />}>
    <Component /> {/* use()가 에러 throw 가능 */}
  </Suspense>
</ErrorBoundary>
```

---

## 💪 실전 팁

### 1. 미리 데이터 로딩 (Prefetching)

```typescript
function ProjectList() {
  const projects = use(fetchProjects());

  return (
    <div>
      {projects.map(project => (
        <Link
          key={project.id}
          to={`/projects/${project.id}`}
          onMouseEnter={() => {
            // 마우스 오버 시 미리 로드
            fetchProject(project.id);
          }}
        >
          {project.name}
        </Link>
      ))}
    </div>
  );
}
```

### 2. Waterfall 방지

```typescript
// ❌ Waterfall - 순차적 로딩 (느림)
function Dashboard() {
  const user = use(fetchUser());
  const projects = use(fetchProjects(user.id)); // user 완료 후 시작
  const tasks = use(fetchTasks(user.id)); // projects 완료 후 시작
}

// ✅ 병렬 로딩 (빠름)
const userPromise = fetchUser();
const projectsPromise = userPromise.then(u => fetchProjects(u.id));
const tasksPromise = userPromise.then(u => fetchTasks(u.id));

function Dashboard() {
  const user = use(userPromise);
  const projects = use(projectsPromise);
  const tasks = use(tasksPromise);
}
```

### 3. Loading 상태 세분화

```typescript
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<SidebarSkeleton />}>
    <Sidebar />
  </Suspense>
  <Suspense fallback={<ContentSkeleton />}>
    <Content />
  </Suspense>
</Suspense>
```

---

## 📚 참고 자료

- [React 19 - use() API](https://react.dev/reference/react/use)
- [Suspense for Data Fetching](https://react.dev/reference/react/Suspense)
- [Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

## 🎓 연습 문제

### 기본

1. **사용자 프로필**을 use()로 로드하세요.

2. **댓글 목록**을 병렬로 로드하세요.

3. **조건부 데이터 로딩**을 구현하세요 (탭 전환 시).

### 도전

4. **무한 스크롤**을 use()와 Suspense로 구현하세요.

5. **오프라인 모드**를 구현하세요 (캐시 활용).

6. **Prefetching 시스템**을 만드세요 (Link hover 시 미리 로드).

---

## 💡 다음 챕터 예고

다음 챕터에서는 **Server Components**를 다룹니다:

- React Server Components (RSC) 개념
- 'use server' 지시어
- cache() 함수
- Server Actions
- Client vs Server 컴포넌트

**[Chapter 12: Server Components →](12-server-components.md)**

---

**축하합니다!** 🎉 use() API를 마스터했습니다!
