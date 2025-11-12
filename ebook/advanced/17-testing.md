# Chapter 17: 테스팅

## 개요

React 19 애플리케이션의 품질을 보장하려면 체계적인 테스팅이 필수입니다. 이 장에서는 Vitest와 React Testing Library를 사용한 단위 테스트부터 Playwright를 사용한 E2E 테스트까지 전체 테스팅 전략을 다룹니다.

**이 장에서 다룰 내용:**
- Vitest 설정 및 기본 사용법
- React Testing Library로 컴포넌트 테스트
- React 19 특화 기능 테스트
- Server Component 테스팅
- MSW를 사용한 API 모킹
- E2E 테스트 with Playwright
- 테스트 커버리지 및 CI/CD 통합

**TaskFlow에서의 활용:**
견고한 테스트 스위트로 리팩토링과 기능 추가 시 자신감을 가질 수 있습니다.

## 핵심 개념

### 1. 테스팅 피라미드

```
       /\
      /E2E\          적음, 느림, 비쌈
     /------\
    /통합테스트\      중간
   /----------\
  /  단위테스트  \    많음, 빠름, 저렴
 /--------------\
```

**단위 테스트 (Unit Tests):**
- 개별 함수, Hook, 컴포넌트 테스트
- 빠르고 격리된 환경
- 70-80% 커버리지 목표

**통합 테스트 (Integration Tests):**
- 여러 컴포넌트 조합 테스트
- 실제 상호작용 시뮬레이션
- 15-20% 커버리지 목표

**E2E 테스트 (End-to-End Tests):**
- 실제 사용자 플로우 테스트
- 브라우저 환경에서 실행
- 5-10% 커버리지 목표

### 2. React Testing Library 철학

**"사용자가 보는 방식으로 테스트"**

```typescript
// ❌ 구현 세부사항 테스트
const { container } = render(<Button />);
expect(container.firstChild.className).toBe('btn-primary');

// ✅ 사용자 관점 테스트
render(<Button>클릭</Button>);
const button = screen.getByRole('button', { name: '클릭' });
expect(button).toBeInTheDocument();
```

### 3. React 19 테스팅 도전과제

**새로운 Hook 테스트:**
- `useActionState` - 비동기 상태 관리
- `useOptimistic` - 낙관적 업데이트
- `use()` - Promise/Context 읽기
- `useEffectEvent` - 비반응형 이벤트

## 실습: Vitest 설정

### 1. 패키지 설치

```bash
# Vitest 및 테스팅 라이브러리
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom happy-dom

# MSW (API 모킹)
npm install -D msw@latest

# Playwright (E2E)
npm install -D @playwright/test
npx playwright install
```

### 2. Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // 또는 'happy-dom'
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 3. 테스트 설정 파일

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// jest-dom matchers 추가
expect.extend(matchers);

// 각 테스트 후 정리
afterEach(() => {
  cleanup();
});

// 전역 모킹
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// IntersectionObserver 모킹
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
```

### 4. package.json 스크립트

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## 완성 코드: 컴포넌트 테스트

### 1. 기본 컴포넌트 테스트

```typescript
// src/components/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}

// src/components/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>클릭하세요</Button>);

    const button = screen.getByRole('button', { name: '클릭하세요' });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>클릭</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick} disabled>
        클릭
      </Button>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies correct variant class', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);

    let button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Secondary</Button>);

    button = screen.getByRole('button');
    expect(button).toHaveClass('btn-secondary');
  });
});
```

### 2. useActionState 테스트

```typescript
// src/components/AddTaskForm.tsx
'use client';

import { useActionState } from 'react';

async function addTaskAction(prevState: any, formData: FormData) {
  const title = formData.get('title') as string;

  if (!title || title.length < 3) {
    return {
      success: false,
      error: '제목은 최소 3자 이상이어야 합니다'
    };
  }

  // API 호출 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    data: { id: '1', title }
  };
}

export function AddTaskForm() {
  const [state, formAction, isPending] = useActionState(addTaskAction, {
    success: false
  });

  return (
    <form action={formAction}>
      <input
        type="text"
        name="title"
        placeholder="태스크 제목"
        aria-label="태스크 제목"
      />

      <button type="submit" disabled={isPending}>
        {isPending ? '추가 중...' : '추가'}
      </button>

      {state.error && (
        <p role="alert" className="error">
          {state.error}
        </p>
      )}

      {state.success && <p role="status">태스크가 추가되었습니다!</p>}
    </form>
  );
}

// src/components/__tests__/AddTaskForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { AddTaskForm } from '../AddTaskForm';

describe('AddTaskForm', () => {
  it('submits form successfully with valid input', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);

    const input = screen.getByLabelText('태스크 제목');
    const submitButton = screen.getByRole('button', { name: '추가' });

    // 입력
    await user.type(input, '새 태스크');

    // 제출
    await user.click(submitButton);

    // 로딩 상태 확인
    expect(screen.getByText('추가 중...')).toBeInTheDocument();

    // 성공 메시지 확인
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        '태스크가 추가되었습니다!'
      );
    });
  });

  it('shows error for invalid input', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);

    const input = screen.getByLabelText('태스크 제목');
    const submitButton = screen.getByRole('button');

    // 짧은 입력
    await user.type(input, 'ab');
    await user.click(submitButton);

    // 에러 메시지 확인
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        '제목은 최소 3자 이상이어야 합니다'
      );
    });
  });

  it('disables submit button while pending', async () => {
    const user = userEvent.setup();
    render(<AddTaskForm />);

    const input = screen.getByLabelText('태스크 제목');
    const submitButton = screen.getByRole('button');

    await user.type(input, '새 태스크');
    await user.click(submitButton);

    // 버튼이 비활성화되어야 함
    expect(submitButton).toBeDisabled();

    // 완료 후 다시 활성화
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
```

### 3. useOptimistic 테스트

```typescript
// src/components/TaskList.tsx
'use client';

import { useOptimistic, startTransition } from 'react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskListProps {
  initialTasks: Task[];
  onToggle: (id: string) => Promise<void>;
}

export function TaskList({ initialTasks, onToggle }: TaskListProps) {
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    initialTasks,
    (state, updatedTask: Task) =>
      state.map(task => (task.id === updatedTask.id ? updatedTask : task))
  );

  const handleToggle = async (task: Task) => {
    startTransition(() => {
      addOptimisticTask({ ...task, completed: !task.completed });
    });

    await onToggle(task.id);
  };

  return (
    <ul>
      {optimisticTasks.map(task => (
        <li key={task.id}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => handleToggle(task)}
            aria-label={`Toggle ${task.title}`}
          />
          <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
            {task.title}
          </span>
        </li>
      ))}
    </ul>
  );
}

// src/components/__tests__/TaskList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../TaskList';

describe('TaskList with useOptimistic', () => {
  const mockTasks = [
    { id: '1', title: 'Task 1', completed: false },
    { id: '2', title: 'Task 2', completed: true }
  ];

  it('shows optimistic update immediately', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<TaskList initialTasks={mockTasks} onToggle={onToggle} />);

    const checkbox = screen.getByLabelText('Toggle Task 1');
    const taskText = screen.getByText('Task 1');

    // 초기 상태
    expect(checkbox).not.toBeChecked();
    expect(taskText).not.toHaveStyle({ textDecoration: 'line-through' });

    // 클릭
    await user.click(checkbox);

    // 즉시 업데이트 (낙관적)
    expect(checkbox).toBeChecked();
    expect(taskText).toHaveStyle({ textDecoration: 'line-through' });

    // API 호출 확인
    expect(onToggle).toHaveBeenCalledWith('1');

    // 완료 대기
    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  it('handles multiple rapid clicks', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<TaskList initialTasks={mockTasks} onToggle={onToggle} />);

    const checkbox = screen.getByLabelText('Toggle Task 1');

    // 연속 클릭
    await user.click(checkbox);
    await user.click(checkbox);
    await user.click(checkbox);

    // 마지막 상태 확인
    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledTimes(3);
    });
  });
});
```

### 4. use() API 테스트

```typescript
// src/components/UserProfile.tsx
import { use } from 'react';

async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

export function UserProfile({ userId }: { userId: string }) {
  const user = use(fetchUser(userId));

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// src/components/__tests__/UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { UserProfile } from '../UserProfile';

const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe',
      email: 'john@example.com'
    });
  })
);

beforeEach(() => server.listen());
afterEach(() => server.close());

describe('UserProfile with use()', () => {
  it('fetches and displays user data', async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <UserProfile userId="123" />
      </Suspense>
    );

    // 로딩 확인
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // 데이터 로드 대기
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('handles fetch errors', async () => {
    server.use(
      http.get('/api/users/:id', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // ErrorBoundary 없으면 에러 throw
    expect(() =>
      render(
        <Suspense fallback={<div>Loading...</div>}>
          <UserProfile userId="123" />
        </Suspense>
      )
    ).rejects.toThrow();
  });
});
```

### 5. Custom Hook 테스트

```typescript
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// src/hooks/__tests__/useDebounce.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 }
      }
    );

    expect(result.current).toBe('initial');

    // 값 변경
    rerender({ value: 'updated', delay: 500 });

    // 즉시는 변경 안 됨
    expect(result.current).toBe('initial');

    // delay 후 변경됨
    await waitFor(
      () => {
        expect(result.current).toBe('updated');
      },
      { timeout: 600 }
    );
  });

  it('cancels previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    rerender({ value: 'c' });
    rerender({ value: 'd' });

    // 마지막 값만 적용되어야 함
    await waitFor(
      () => {
        expect(result.current).toBe('d');
      },
      { timeout: 600 }
    );
  });
});
```

### 6. MSW를 사용한 API 모킹

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Tasks API
  http.get('/api/tasks', () => {
    return HttpResponse.json([
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: true }
    ]);
  }),

  http.post('/api/tasks', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json(
      { id: '3', ...data },
      { status: 201 }
    );
  }),

  http.patch('/api/tasks/:id', async ({ params, request }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: params.id,
      ...data
    });
  }),

  http.delete('/api/tasks/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Error simulation
  http.get('/api/error', () => {
    return new HttpResponse(null, { status: 500 });
  })
];

// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/test/setup.ts에 추가
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## E2E 테스트 with Playwright

### 1. Playwright 설정

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

### 2. 기본 E2E 테스트

```typescript
// e2e/task-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add a new task', async ({ page }) => {
    // "새 태스크" 버튼 클릭
    await page.getByRole('button', { name: '새 태스크' }).click();

    // 모달이 열렸는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();

    // 폼 작성
    await page.getByLabel('제목').fill('E2E 테스트 태스크');
    await page.getByLabel('설명').fill('Playwright로 작성한 태스크');

    // 제출
    await page.getByRole('button', { name: '저장' }).click();

    // 태스크가 목록에 나타나는지 확인
    await expect(
      page.getByText('E2E 테스트 태스크')
    ).toBeVisible();
  });

  test('should toggle task completion', async ({ page }) => {
    // 첫 번째 태스크의 체크박스 클릭
    const firstTask = page.locator('[data-testid="task-item"]').first();
    const checkbox = firstTask.getByRole('checkbox');

    await checkbox.click();

    // 완료 상태 확인
    await expect(checkbox).toBeChecked();
    await expect(firstTask).toHaveClass(/completed/);
  });

  test('should filter tasks by status', async ({ page }) => {
    // "완료됨" 필터 선택
    await page.getByRole('combobox', { name: '필터' }).selectOption('done');

    // 완료된 태스크만 표시되는지 확인
    const tasks = page.locator('[data-testid="task-item"]');
    await expect(tasks).toHaveCount(3); // 예상 개수

    for (const task of await tasks.all()) {
      await expect(task.getByRole('checkbox')).toBeChecked();
    }
  });

  test('should search tasks', async ({ page }) => {
    // 검색어 입력
    await page.getByPlaceholder('태스크 검색...').fill('디자인');

    // 검색 결과 확인
    await expect(page.getByText('디자인')).toBeVisible();
    await expect(page.getByText('개발')).not.toBeVisible();
  });

  test('should delete task', async ({ page }) => {
    const firstTask = page.locator('[data-testid="task-item"]').first();
    const taskTitle = await firstTask.getByRole('heading').textContent();

    // 삭제 버튼 클릭
    await firstTask.getByRole('button', { name: '삭제' }).click();

    // 확인 다이얼로그
    await page.getByRole('button', { name: '확인' }).click();

    // 태스크가 사라졌는지 확인
    await expect(page.getByText(taskTitle!)).not.toBeVisible();
  });
});
```

### 3. 인증 플로우 테스트

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    // 로그인 폼 작성
    await page.getByLabel('이메일').fill('test@example.com');
    await page.getByLabel('비밀번호').fill('password123');

    // 제출
    await page.getByRole('button', { name: '로그인' }).click();

    // 대시보드로 리다이렉트 확인
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('환영합니다')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('이메일').fill('wrong@example.com');
    await page.getByLabel('비밀번호').fill('wrongpass');

    await page.getByRole('button', { name: '로그인' }).click();

    // 에러 메시지 확인
    await expect(page.getByText('이메일 또는 비밀번호가 올바르지 않습니다')).toBeVisible();
  });

  test('should logout', async ({ page, context }) => {
    // 로그인된 상태로 시작
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'fake_token',
        domain: 'localhost',
        path: '/'
      }
    ]);

    await page.goto('/dashboard');

    // 로그아웃
    await page.getByRole('button', { name: '로그아웃' }).click();

    // 로그인 페이지로 리다이렉트
    await expect(page).toHaveURL('/login');
  });
});
```

### 4. Visual Regression Testing

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('dashboard should match screenshot', async ({ page }) => {
    await page.goto('/dashboard');

    // 전체 페이지 스크린샷
    await expect(page).toHaveScreenshot('dashboard.png');
  });

  test('task card should match screenshot', async ({ page }) => {
    await page.goto('/tasks/123');

    const taskCard = page.locator('[data-testid="task-card"]');

    // 특정 요소 스크린샷
    await expect(taskCard).toHaveScreenshot('task-card.png');
  });

  test('mobile view should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page).toHaveScreenshot('mobile-home.png');
  });
});
```

## 실전 팁

### 1. 테스트 유틸리티 작성

```typescript
// src/test/utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/', ...options }: CustomRenderOptions = {}
) {
  window.history.pushState({}, 'Test page', initialRoute);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// 재사용 가능한 유틸리티
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
```

### 2. 테스트 데이터 팩토리

```typescript
// src/test/factories.ts
import { faker } from '@faker-js/faker';
import type { Task, User, Project } from '@/types';

export function createTask(overrides?: Partial<Task>): Task {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    status: 'todo',
    priority: 'medium',
    createdAt: faker.date.past(),
    dueDate: faker.date.future(),
    assignee: null,
    tags: [],
    ...overrides
  };
}

export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    avatar: faker.image.avatar(),
    ...overrides
  };
}

export function createProject(overrides?: Partial<Project>): Project {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    tasks: [],
    members: [],
    ...overrides
  };
}

// 사용 예
const mockTasks = [
  createTask({ title: 'Test Task 1', status: 'done' }),
  createTask({ title: 'Test Task 2', status: 'in-progress' })
];
```

### 3. 커버리지 목표 설정

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/main.tsx'
      ]
    }
  }
});
```

### 4. CI/CD 통합

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 연습 문제

### 기초

1. **컴포넌트 테스트**
   - Button 컴포넌트 작성 및 테스트
   - Input 컴포넌트 작성 및 테스트
   - 모든 props 조합 테스트

2. **Hook 테스트**
   - useToggle Hook 작성
   - useLocalStorage Hook 작성
   - 테스트 작성

3. **Form 테스트**
   - 로그인 폼 테스트
   - 입력 검증 테스트
   - 제출 핸들러 테스트

### 중급

4. **비동기 테스트**
   - 데이터 페칭 컴포넌트 테스트
   - 로딩 상태 테스트
   - 에러 처리 테스트

5. **MSW 활용**
   - API 모킹 설정
   - 다양한 응답 시나리오 테스트
   - 에러 시나리오 테스트

6. **통합 테스트**
   - 여러 컴포넌트 조합 테스트
   - 사용자 플로우 테스트
   - 상태 공유 테스트

### 고급

7. **E2E 테스트**
   - 전체 사용자 플로우 테스트
   - 인증 플로우 테스트
   - 멀티 페이지 시나리오

8. **성능 테스트**
   - 렌더링 성능 측정
   - 메모리 누수 감지
   - 번들 크기 테스트

9. **접근성 테스트**
   - axe-core 통합
   - 키보드 네비게이션 테스트
   - 스크린 리더 호환성

## 다음 단계

다음 장에서는 **실전 패턴과 아키텍처**를 다룹니다:
- 폴더 구조 및 코드 조직
- 상태 관리 패턴
- 성능 최적화 패턴
- 보안 best practices

테스트는 애플리케이션의 품질을 보장하는 핵심입니다!

---

**핵심 요약:**
- Vitest로 빠른 단위 테스트를 작성합니다
- React Testing Library로 사용자 관점 테스트를 작성합니다
- MSW로 API를 모킹하여 통합 테스트를 수행합니다
- Playwright로 E2E 테스트를 자동화합니다
- 테스트 커버리지 80% 이상을 목표로 합니다
- CI/CD 파이프라인에 테스트를 통합합니다
