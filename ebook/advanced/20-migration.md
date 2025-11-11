# Chapter 20: React 18에서 19로 마이그레이션

## 개요

React 19는 많은 개선사항을 제공하지만, 일부 Breaking Changes도 포함되어 있습니다. 이 장에서는 기존 React 18 프로젝트를 React 19로 안전하게 마이그레이션하는 전체 과정을 단계별로 안내합니다.

**이 장에서 다룰 내용:**
- 마이그레이션 준비 체크리스트
- Breaking Changes 상세 분석
- 단계별 업그레이드 가이드
- 코드 변경 패턴
- 테스트 및 검증 전략
- 롤백 계획

## Breaking Changes 요약

### 1. 주요 변경사항

| 항목 | React 18 | React 19 | 영향도 |
|------|----------|----------|--------|
| ref prop | `forwardRef` 필요 | 일반 prop처럼 사용 | 🟢 낮음 |
| Context | `<Context.Provider>` | `<Context>` | 🟡 중간 |
| useFormStatus | ❌ 없음 | ✅ 추가 | 🟢 낮음 |
| useOptimistic | ❌ 없음 | ✅ 추가 | 🟢 낮음 |
| use() API | ❌ 없음 | ✅ 추가 | 🟡 중간 |
| Suspense | lazy 전용 | 데이터 페칭 지원 | 🟡 중간 |
| Server Components | 초기 지원 | 안정화 | 🔴 높음 |

### 2. 더 이상 사용되지 않는 API

```typescript
// ❌ React 18
import { renderToString } from 'react-dom/server';
const html = renderToString(<App />);

// ✅ React 19 (권장)
import { renderToPipeableStream } from 'react-dom/server';
const { pipe } = renderToPipeableStream(<App />, options);
```

## 마이그레이션 준비

### 1. 사전 체크리스트

```markdown
## 업그레이드 전 확인사항

### 기술 스택
- [ ] Node.js 18.17.0 이상
- [ ] TypeScript 5.0 이상
- [ ] 빌드 도구 (Vite 5.0+, Next.js 15+)
- [ ] 테스팅 도구 호환성

### 코드베이스 상태
- [ ] 모든 테스트 통과
- [ ] TypeScript 에러 없음
- [ ] ESLint 경고 최소화
- [ ] 의존성 최신 상태

### 백업
- [ ] Git 브랜치 생성 (migration/react-19)
- [ ] package-lock.json 백업
- [ ] 프로덕션 데이터베이스 백업 (필요시)

### 팀 준비
- [ ] 팀원들에게 공지
- [ ] 마이그레이션 일정 확정
- [ ] 롤백 계획 수립
```

### 2. 의존성 검사

```bash
# 현재 React 버전 확인
npm list react react-dom

# React 19 호환 패키지 확인
npx npm-check-updates -f react
```

**주요 의존성 호환성:**

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "next": "^15.0.0",
    "typescript": "^5.5.0"
  }
}
```

## 단계별 마이그레이션

### Phase 1: 의존성 업데이트

```bash
# 1. React 19 설치
npm install react@rc react-dom@rc

# 2. 타입 정의 업데이트
npm install -D @types/react@rc @types/react-dom@rc

# 3. 빌드 도구 업데이트
npm install -D @vitejs/plugin-react@latest

# 4. 호환 패키지 업데이트
npm update
```

**package.json 업데이트:**
```json
{
  "dependencies": {
    "react": "19.0.0-rc",
    "react-dom": "19.0.0-rc"
  },
  "devDependencies": {
    "@types/react": "19.0.0-rc",
    "@types/react-dom": "19.0.0-rc",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0"
  }
}
```

### Phase 2: 코드 변경

#### 1. forwardRef 제거

**Before (React 18):**
```typescript
import { forwardRef } from 'react';

interface InputProps {
  label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} />
      </div>
    );
  }
);

Input.displayName = 'Input';
```

**After (React 19):**
```typescript
interface InputProps {
  label: string;
  ref?: React.Ref<HTMLInputElement>; // ref를 일반 prop으로
}

function Input({ label, ref }: InputProps) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} />
    </div>
  );
}
```

**자동 변환 스크립트:**
```typescript
// scripts/remove-forward-ref.ts
import * as ts from 'typescript';
import * as fs from 'fs';

// TypeScript AST를 순회하며 forwardRef 제거
function removeForwardRef(sourceFile: ts.SourceFile) {
  // 구현...
}

// 프로젝트 모든 파일 처리
```

#### 2. Context API 업데이트

**Before (React 18):**
```typescript
const ThemeContext = React.createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Component />
    </ThemeContext.Provider>
  );
}
```

**After (React 19):**
```typescript
const ThemeContext = React.createContext('light');

function App() {
  return (
    <ThemeContext value="dark">
      <Component />
    </ThemeContext>
  );
}
```

**자동 변환:**
```bash
# codemod 사용 (React 팀 제공)
npx @react-codemod/cli 19.0.0 src/
```

#### 3. useFormState → useActionState

**Before (React 18/Experimental):**
```typescript
import { useFormState } from 'react-dom';

function Form() {
  const [state, formAction] = useFormState(action, initialState);
  // ...
}
```

**After (React 19):**
```typescript
import { useActionState } from 'react';

function Form() {
  const [state, formAction] = useActionState(action, initialState);
  // ...
}
```

#### 4. SSR 렌더링 API 업데이트

**Before (React 18):**
```typescript
import { renderToString } from 'react-dom/server';

app.get('/', (req, res) => {
  const html = renderToString(<App />);
  res.send(`<!DOCTYPE html><html><body>${html}</body></html>`);
});
```

**After (React 19 - Streaming 권장):**
```typescript
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady() {
      res.setHeader('Content-Type', 'text/html');
      pipe(res);
    },
    onShellError(error) {
      res.status(500).send('Server error');
    }
  });
});
```

### Phase 3: TypeScript 타입 업데이트

**1. 컴포넌트 타입:**
```typescript
// Before (React 18)
import { FC } from 'react';

const Button: FC<{ label: string }> = ({ label }) => {
  return <button>{label}</button>;
};

// After (React 19) - FC 사용 지양
interface ButtonProps {
  label: string;
}

function Button({ label }: ButtonProps) {
  return <button>{label}</button>;
}
```

**2. ref 타입:**
```typescript
// Before
import { ForwardedRef } from 'react';

function Input({ ref }: { ref: ForwardedRef<HTMLInputElement> }) {}

// After
import { Ref } from 'react';

function Input({ ref }: { ref?: Ref<HTMLInputElement> }) {}
```

### Phase 4: 테스트 업데이트

#### 1. React Testing Library

```bash
# 최신 버전으로 업데이트
npm install -D @testing-library/react@latest @testing-library/jest-dom@latest
```

#### 2. 테스트 수정

**Before:**
```typescript
import { render } from '@testing-library/react';

test('renders component', () => {
  const { container } = render(<App />);
  expect(container.firstChild).toHaveClass('app');
});
```

**After (더 나은 패턴):**
```typescript
import { render, screen } from '@testing-library/react';

test('renders component', () => {
  render(<App />);
  expect(screen.getByRole('main')).toBeInTheDocument();
});
```

#### 3. Suspense 테스트

```typescript
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';

test('shows fallback while loading', async () => {
  render(
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>
  );

  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // 데이터 로드 대기
  expect(await screen.findByText('Data loaded')).toBeInTheDocument();
});
```

## 일반적인 마이그레이션 패턴

### 1. Form 처리 현대화

**Before (React 18):**
```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} />
      <button disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

**After (React 19):**
```typescript
import { useActionState } from 'react';

async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await login(email, password);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, {
    success: false
  });

  return (
    <form action={formAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```

### 2. 낙관적 업데이트

**Before (React 18 - 수동):**
```typescript
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const toggleTodo = async (id: string) => {
    // 낙관적 업데이트
    setTodos(prev => prev.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));

    try {
      await api.toggleTodo(id);
    } catch (error) {
      // 롤백
      setTodos(prev => prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      ));
    }
  };
}
```

**After (React 19 - useOptimistic):**
```typescript
import { useOptimistic } from 'react';

function TodoList({ todos: serverTodos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    serverTodos,
    (state, updatedTodo: Todo) =>
      state.map(todo => (todo.id === updatedTodo.id ? updatedTodo : todo))
  );

  const toggleTodo = async (todo: Todo) => {
    addOptimisticTodo({ ...todo, completed: !todo.completed });
    await api.toggleTodo(todo.id);
  };
}
```

### 3. 데이터 페칭 with use()

**Before (React 18 - useEffect):**
```typescript
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <Error error={error} />;
  if (!user) return null;

  return <div>{user.name}</div>;
}
```

**After (React 19 - use() + Suspense):**
```typescript
import { use } from 'react';

function UserProfile({ userId }: { userId: string }) {
  const user = use(fetchUser(userId));
  return <div>{user.name}</div>;
}

// 사용처
function Page() {
  return (
    <ErrorBoundary fallback={<Error />}>
      <Suspense fallback={<Spinner />}>
        <UserProfile userId="123" />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## 점진적 마이그레이션 전략

### 전략 1: Feature Flag

```typescript
// lib/feature-flags.ts
export const useReact19Features = process.env.REACT_19_FEATURES === 'true';

// 조건부 사용
function MyComponent() {
  if (useReact19Features) {
    return <NewComponent />; // React 19 기능 사용
  }
  return <LegacyComponent />; // React 18 호환
}
```

### 전략 2: 모듈별 마이그레이션

```
1주차: auth 모듈
2주차: tasks 모듈
3주차: projects 모듈
4주차: analytics 모듈
5주차: 통합 테스트 및 배포
```

### 전략 3: Canary 배포

```typescript
// 1% 트래픽만 React 19로
if (Math.random() < 0.01) {
  // React 19 버전
} else {
  // React 18 버전
}
```

## 테스트 및 검증

### 1. 자동화된 테스트

```bash
# 모든 단위 테스트
npm test

# E2E 테스트
npm run test:e2e

# 시각적 회귀 테스트
npm run test:visual
```

### 2. 성능 벤치마크

```typescript
// scripts/benchmark.ts
import { performance } from 'perf_hooks';

async function benchmark() {
  // React 18
  const react18Start = performance.now();
  // 렌더링...
  const react18Time = performance.now() - react18Start;

  // React 19
  const react19Start = performance.now();
  // 렌더링...
  const react19Time = performance.now() - react19Start;

  console.log({
    react18: `${react18Time}ms`,
    react19: `${react19Time}ms`,
    improvement: `${((1 - react19Time / react18Time) * 100).toFixed(1)}%`
  });
}
```

### 3. 프로덕션 모니터링

```typescript
// lib/monitoring.ts
export function trackReactVersion() {
  const version = React.version;

  analytics.track('react_version', {
    version,
    timestamp: Date.now()
  });
}

// 에러 추적
export function trackMigrationError(error: Error) {
  Sentry.captureException(error, {
    tags: {
      migration: 'react-19',
      phase: 'production'
    }
  });
}
```

## 롤백 계획

### 1. 즉시 롤백 (긴급)

```bash
# package.json 복원
git checkout main -- package.json package-lock.json

# 의존성 재설치
npm ci

# 재배포
npm run build
npm run deploy
```

### 2. 부분 롤백 (특정 기능)

```typescript
// Feature Flag로 비활성화
export const enableReact19Feature = false;

// 또는 런타임 토글
if (remoteConfig.get('use_react_19') === false) {
  return <LegacyComponent />;
}
```

## 마이그레이션 체크리스트

```markdown
## 마이그레이션 완료 체크리스트

### 코드 변경
- [ ] forwardRef 모두 제거
- [ ] Context.Provider → Context 변경
- [ ] useFormState → useActionState 변경
- [ ] SSR 렌더링 API 업데이트

### 테스트
- [ ] 모든 단위 테스트 통과
- [ ] 통합 테스트 통과
- [ ] E2E 테스트 통과
- [ ] 시각적 회귀 테스트 통과

### 성능
- [ ] 번들 크기 확인 (증가하지 않았는지)
- [ ] 렌더링 성능 측정
- [ ] Lighthouse 점수 비교
- [ ] Core Web Vitals 확인

### 배포
- [ ] 스테이징 환경 배포 및 테스트
- [ ] Canary 배포 (5% 트래픽)
- [ ] 모니터링 확인 (에러율, 성능)
- [ ] 전체 배포

### 문서
- [ ] 마이그레이션 노트 작성
- [ ] 팀원 교육 완료
- [ ] README 업데이트
- [ ] CHANGELOG 작성
```

## 일반적인 문제 해결

### 문제 1: 타입 에러

```typescript
// 에러: Property 'ref' does not exist on type 'IntrinsicAttributes'
<Input ref={inputRef} />

// 해결: ref를 props 타입에 추가
interface InputProps {
  ref?: React.Ref<HTMLInputElement>;
}
```

### 문제 2: Hydration Mismatch

```typescript
// 에러: Hydration failed because the initial UI does not match

// 원인: 서버/클라이언트 불일치
function Component() {
  return <div>{new Date().toString()}</div>; // 매번 다른 값!
}

// 해결: useEffect 사용
function Component() {
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(new Date().toString());
  }, []);

  return <div>{date}</div>;
}
```

### 문제 3: use() with Conditional

```typescript
// 에러: Rendered more hooks than during the previous render

// 원인: 조건부 use() 호출 (올바른 사용법)
function Component({ shouldFetch }) {
  if (shouldFetch) {
    const data = use(fetchData()); // ✅ OK in React 19
  }
}

// 하지만 일관성을 위해 항상 호출 권장
function Component({ shouldFetch }) {
  const promise = shouldFetch ? fetchData() : Promise.resolve(null);
  const data = use(promise); // ✅ 더 나은 패턴
}
```

## 결론

React 19 마이그레이션은 체계적으로 접근하면 안전하게 완료할 수 있습니다.

**핵심 포인트:**
1. **준비**: 충분한 테스트와 백업
2. **점진적**: 단계별, 모듈별 마이그레이션
3. **검증**: 철저한 테스트와 모니터링
4. **롤백**: 언제든 되돌릴 수 있는 계획

**추가 리소스:**
- [React 19 공식 문서](https://react.dev)
- [React 19 블로그 포스트](https://react.dev/blog)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)

---

**React 19로의 여정을 축하합니다! 🎉**

이 ebook을 통해 React 19의 모든 기능을 마스터했습니다. 이제 실전에서 TaskFlow와 같은 현대적인 React 애플리케이션을 구축할 준비가 되었습니다!

**다음 단계:**
- 실제 프로젝트에 적용
- 커뮤니티에 기여
- 최신 React 소식 팔로우

Happy Coding! 🚀
