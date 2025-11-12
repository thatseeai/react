# Chapter 18: 실전 패턴과 아키텍처

## 개요

대규모 React 19 애플리케이션을 성공적으로 개발하고 유지보수하려면 검증된 패턴과 아키텍처를 따라야 합니다. 이 장에서는 TaskFlow 개발 경험을 바탕으로 실전에서 즉시 활용할 수 있는 패턴들을 소개합니다.

**이 장에서 다룰 내용:**
- 확장 가능한 폴더 구조
- 컴포넌트 설계 패턴
- 상태 관리 전략
- 에러 처리 패턴
- 성능 최적화 패턴
- 보안 best practices
- 코드 품질 유지

## 핵심 개념

### 1. 프로젝트 구조

**Feature-Based 구조 (추천):**
```
src/
├── features/              # 기능별로 조직
│   ├── auth/
│   │   ├── components/    # 인증 관련 컴포넌트
│   │   ├── hooks/         # 인증 관련 Hook
│   │   ├── api/           # 인증 API
│   │   ├── types.ts       # 타입 정의
│   │   └── index.ts       # Public exports
│   ├── tasks/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types.ts
│   │   └── index.ts
│   └── projects/
│       └── ...
├── shared/                # 공유 코드
│   ├── components/        # 재사용 가능한 UI
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── hooks/             # 공통 Hook
│   ├── utils/             # 유틸리티 함수
│   ├── types/             # 공통 타입
│   └── constants/         # 상수
├── lib/                   # 외부 라이브러리 설정
│   ├── api-client.ts
│   ├── db.ts
│   └── analytics.ts
├── styles/                # 전역 스타일
└── app/                   # Next.js App Router (또는 pages/)
```

**Layer-Based 구조 (전통적):**
```
src/
├── components/
│   ├── common/
│   ├── features/
│   └── layouts/
├── hooks/
├── services/
├── store/
├── types/
├── utils/
└── pages/
```

### 2. 컴포넌트 설계 패턴

**a) Compound Components**
```typescript
// 유연한 컴포넌트 API
function Select({ children, value, onChange }) {
  return (
    <SelectContext.Provider value={{ value, onChange }}>
      {children}
    </SelectContext.Provider>
  );
}

Select.Trigger = function SelectTrigger({ children }) {
  const { value } = useSelectContext();
  return <button>{children || value}</button>;
};

Select.Options = function SelectOptions({ children }) {
  return <div className="options">{children}</div>;
};

Select.Option = function SelectOption({ value, children }) {
  const { onChange } = useSelectContext();
  return <div onClick={() => onChange(value)}>{children}</div>;
};

// 사용
<Select value={status} onChange={setStatus}>
  <Select.Trigger>상태 선택</Select.Trigger>
  <Select.Options>
    <Select.Option value="todo">할 일</Select.Option>
    <Select.Option value="done">완료</Select.Option>
  </Select.Options>
</Select>
```

**b) Render Props Pattern**
```typescript
function DataFetcher<T>({
  url,
  render
}: {
  url: string;
  render: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return <>{render(data, loading, error)}</>;
}

// 사용
<DataFetcher url="/api/tasks" render={(tasks, loading, error) => {
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <TaskList tasks={tasks} />;
}} />
```

**c) Higher-Order Components (HOC)**
```typescript
// 인증 체크 HOC
function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" />;

    return <Component {...props} />;
  };
}

// 사용
const ProtectedDashboard = withAuth(Dashboard);
```

**d) Container/Presentational Pattern**
```typescript
// Container: 로직 담당
function TaskListContainer({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading } = useTasks(projectId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleToggle = (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
      updateTask.mutate({ ...task, completed: !task.completed });
    }
  };

  const handleDelete = (taskId: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteTask.mutate(taskId);
    }
  };

  if (isLoading) return <TaskListSkeleton />;

  return (
    <TaskListView
      tasks={tasks || []}
      onToggle={handleToggle}
      onDelete={handleDelete}
    />
  );
}

// Presentational: UI 담당
interface TaskListViewProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskListView({ tasks, onToggle, onDelete }: TaskListViewProps) {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id)}
          />
          <span>{task.title}</span>
          <button onClick={() => onDelete(task.id)}>삭제</button>
        </li>
      ))}
    </ul>
  );
}
```

## 실습: 확장 가능한 아키텍처 구축

### 1. Feature 모듈 구조

```typescript
// src/features/tasks/types.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: User | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
}

export interface UpdateTaskInput extends Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>> {}
```

```typescript
// src/features/tasks/api/tasks-api.ts
import { apiClient } from '@/lib/api-client';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

export const tasksApi = {
  // 목록 조회
  getAll: async (projectId: string): Promise<Task[]> => {
    return apiClient.get(`/projects/${projectId}/tasks`);
  },

  // 단일 조회
  getById: async (taskId: string): Promise<Task> => {
    return apiClient.get(`/tasks/${taskId}`);
  },

  // 생성
  create: async (input: CreateTaskInput): Promise<Task> => {
    return apiClient.post('/tasks', input);
  },

  // 수정
  update: async (taskId: string, input: UpdateTaskInput): Promise<Task> => {
    return apiClient.patch(`/tasks/${taskId}`, input);
  },

  // 삭제
  delete: async (taskId: string): Promise<void> => {
    return apiClient.delete(`/tasks/${taskId}`);
  }
};
```

```typescript
// src/features/tasks/hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks-api';
import type { CreateTaskInput, UpdateTaskInput } from '../types';

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.getAll(projectId)
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: () => tasksApi.getById(taskId)
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.create,
    onSuccess: (newTask) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.projectId] });
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      tasksApi.update(taskId, input),
    onSuccess: (updatedTask) => {
      // 특정 태스크 캐시 업데이트
      queryClient.setQueryData(['tasks', updatedTask.id], updatedTask);

      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}
```

```typescript
// src/features/tasks/index.ts
// Public API - 다른 feature에서 사용 가능한 것만 export

export { TaskList } from './components/TaskList';
export { TaskCard } from './components/TaskCard';
export { AddTaskForm } from './components/AddTaskForm';

export { useTasks, useTask, useCreateTask, useUpdateTask, useDeleteTask } from './hooks/use-tasks';

export type { Task, TaskStatus, TaskPriority, CreateTaskInput, UpdateTaskInput } from './types';
```

### 2. API Client 설정

```typescript
// src/lib/api-client.ts
import { AppError, NetworkError, AuthenticationError } from '@/shared/errors';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { params, headers, ...restConfig } = config;

    // URL 생성
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // 요청
    try {
      const response = await fetch(url.toString(), {
        ...restConfig,
        headers: {
          ...this.defaultHeaders,
          ...this.getAuthHeader(),
          ...headers
        }
      });

      // 에러 처리
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof TypeError) {
        throw new NetworkError('네트워크 연결을 확인해주세요');
      }

      throw new AppError('알 수 없는 오류가 발생했습니다', 'UNKNOWN_ERROR');
    }
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      throw new AuthenticationError('인증이 만료되었습니다');
    }

    const errorData = await response.json().catch(() => ({}));

    throw new AppError(
      errorData.message || '요청 처리 중 오류가 발생했습니다',
      errorData.code || 'API_ERROR',
      response.status,
      errorData
    );
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_URL);
```

### 3. 에러 처리 패턴

```typescript
// src/shared/errors/index.ts
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
  constructor(message = '네트워크 오류가 발생했습니다') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, errors);
    this.name = 'ValidationError';
  }
}
```

```typescript
// src/shared/hooks/use-error-handler.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthenticationError, NetworkError, ValidationError } from '@/shared/errors';
import { logError } from '@/lib/logger';

export function useErrorHandler() {
  const navigate = useNavigate();

  return useCallback((error: Error) => {
    // 에러 로깅
    logError(error);

    // 타입별 처리
    if (error instanceof AuthenticationError) {
      toast.error('로그인이 필요합니다');
      navigate('/login');
      return;
    }

    if (error instanceof NetworkError) {
      toast.error('네트워크 연결을 확인해주세요');
      return;
    }

    if (error instanceof ValidationError) {
      // 첫 번째 에러 메시지 표시
      const firstError = Object.values(error.errors)[0]?.[0];
      toast.error(firstError || '입력값을 확인해주세요');
      return;
    }

    // 기본 에러
    toast.error(error.message || '오류가 발생했습니다');
  }, [navigate]);
}
```

### 4. 상태 관리 패턴

**a) Server State (React Query)**
```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});
```

**b) Client State (Context + useReducer)**
```typescript
// src/shared/contexts/theme-context.tsx
import { createContext, useContext, useReducer, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

type ThemeAction =
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'SET_RESOLVED_THEME'; payload: 'light' | 'dark' };

const ThemeContext = createContext<{
  state: ThemeState;
  setTheme: (theme: Theme) => void;
} | null>(null);

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_RESOLVED_THEME':
      return { ...state, resolvedTheme: action.payload };
    default:
      return state;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(themeReducer, {
    theme: (localStorage.getItem('theme') as Theme) || 'system',
    resolvedTheme: 'light'
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      let resolved: 'light' | 'dark';

      if (state.theme === 'system') {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      } else {
        resolved = state.theme;
      }

      dispatch({ type: 'SET_RESOLVED_THEME', payload: resolved });
      root.classList.toggle('dark', resolved === 'dark');
    };

    updateResolvedTheme();
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [state.theme]);

  const setTheme = (theme: Theme) => {
    localStorage.setItem('theme', theme);
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  return (
    <ThemeContext.Provider value={{ state, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

**c) URL State (React Router)**
```typescript
// src/features/tasks/hooks/use-task-filters.ts
import { useSearchParams } from 'react-router-dom';

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || 'all',
    search: searchParams.get('search') || ''
  };

  const setFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);

    if (value === 'all' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }

    setSearchParams(newParams);
  };

  return { filters, setFilter };
}
```

### 5. 성능 최적화 패턴

**a) 컴포넌트 메모이제이션**
```typescript
// React 19 Compiler 사용 시 자동화되지만,
// 명시적으로 최적화가 필요한 경우

import { memo } from 'react';

export const TaskCard = memo(function TaskCard({ task }: { task: Task }) {
  // 복잡한 렌더링 로직...
  return <div>{task.title}</div>;
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.updatedAt === nextProps.task.updatedAt;
});
```

**b) 지연 로딩**
```typescript
// src/app/routes.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('@/features/dashboard/pages/Dashboard'));
const Projects = lazy(() => import('@/features/projects/pages/Projects'));
const TaskDetail = lazy(() => import('@/features/tasks/pages/TaskDetail'));

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Dashboard />
          </Suspense>
        }
      />
      <Route
        path="/projects"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <Projects />
          </Suspense>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <Suspense fallback={<PageSkeleton />}>
            <TaskDetail />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

**c) 가상화**
```typescript
// src/features/tasks/components/VirtualTaskList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export function VirtualTaskList({ tasks }: { tasks: Task[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 예상 높이
    overscan: 5 // 버퍼 아이템 수
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '600px',
        overflow: 'auto'
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          >
            <TaskCard task={tasks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6. 보안 Best Practices

**a) XSS 방지**
```typescript
// ❌ 위험 - XSS 취약
function DangerousComponent({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ✅ 안전 - sanitize 후 사용
import DOMPurify from 'isomorphic-dompurify';

function SafeComponent({ html }: { html: string }) {
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />;
}
```

**b) CSRF 방지**
```typescript
// API 클라이언트에 CSRF 토큰 추가
class ApiClient {
  private getCsrfToken(): string | null {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const csrfToken = this.getCsrfToken();

    const response = await fetch(url, {
      ...config,
      headers: {
        ...config.headers,
        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
      }
    });

    return response.json();
  }
}
```

**c) 민감한 데이터 보호**
```typescript
// ❌ 로컬 스토리지에 민감한 데이터 저장
localStorage.setItem('api_key', apiKey); // XSS 공격에 취약

// ✅ HttpOnly 쿠키 사용 (서버 설정)
// Set-Cookie: auth_token=xxx; HttpOnly; Secure; SameSite=Strict

// 클라이언트는 쿠키에 접근 불가, fetch 자동 전송
```

**d) 입력 검증**
```typescript
// src/shared/utils/validation.ts
import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string()
    .min(3, '제목은 최소 3자 이상이어야 합니다')
    .max(100, '제목은 최대 100자까지 가능합니다')
    .regex(/^[a-zA-Z0-9가-힣\s]+$/, '제목에 특수문자를 사용할 수 없습니다'),

  description: z.string()
    .max(1000, '설명은 최대 1000자까지 가능합니다')
    .optional(),

  dueDate: z.coerce.date()
    .min(new Date(), '마감일은 현재 시간 이후여야 합니다')
    .optional()
});

// 사용
function AddTaskForm() {
  const handleSubmit = (data: unknown) => {
    try {
      const validatedData = taskSchema.parse(data);
      // API 호출
    } catch (error) {
      if (error instanceof z.ZodError) {
        // 에러 표시
      }
    }
  };
}
```

## 코드 품질 유지

### 1. ESLint 설정

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  rules: {
    // React 19
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',

    // Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',

    // 접근성
    'jsx-a11y/anchor-is-valid': 'warn',

    // Best practices
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error'
  }
};
```

### 2. TypeScript 엄격 모드

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true
  }
}
```

### 3. Pre-commit Hooks

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npm run lint-staged
npm run type-check
npm run test -- --run --changed
```

## 연습 문제

### 기초
1. Feature 기반 폴더 구조로 프로젝트 재구성
2. API Client 클래스 구현
3. 에러 처리 시스템 구축

### 중급
4. Compound Components 패턴 구현
5. Context + Reducer로 상태 관리
6. React Query로 서버 상태 관리

### 고급
7. 대규모 애플리케이션 아키텍처 설계
8. 성능 최적화 종합 적용
9. 보안 취약점 분석 및 대응

## 다음 단계

다음 장에서는 **실험적 기능**을 다룹니다:
- React Server Components Deep Dive
- Streaming SSR 고급 기법
- Partial Prerendering
- React Cache API

---

**핵심 요약:**
- Feature 기반 구조로 확장 가능하게 조직합니다
- 검증된 디자인 패턴을 활용합니다
- 계층별 상태 관리 전략을 수립합니다
- 성능 최적화는 측정 후 적용합니다
- 보안을 최우선으로 고려합니다
- 코드 품질 도구를 적극 활용합니다
