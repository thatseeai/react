# Chapter 5: Context와 전역 상태

> **학습 목표**: React 19의 간소화된 Context API를 마스터하고 use() API로 Context를 읽는다
> **소요 시간**: 120분
> **난이도**: 중급

## 📖 개요

전역 상태 관리는 React 앱에서 빼놓을 수 없는 요소입니다. React 19는 Context API를 더욱 간소화하여 `Context.Provider` 없이 직접 `<Context>` 컴포넌트를 사용할 수 있게 했습니다. 또한 새로운 `use()` API를 통해 조건부로 Context를 읽을 수 있습니다.

이 챕터에서는 TaskFlow의 인증, 테마, 앱 설정 등 전역 상태를 관리하는 시스템을 구축합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ **NEW**: `<Context>` 직접 사용 (Provider 불필요)
- ✅ **NEW**: `use()` API로 Context 읽기
- ✅ 인증 Context (로그인/로그아웃)
- ✅ 테마 Context (라이트/다크 모드)
- ✅ useReducer로 복잡한 상태 관리

---

## 💡 핵심 개념

### 1. Context API 기본

Context는 props drilling 없이 컴포넌트 트리 전체에 데이터를 전달하는 방법입니다.

```typescript
// Context 생성
const ThemeContext = createContext<'light' | 'dark'>('light');

// 값 제공
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>

// 값 사용
const theme = useContext(ThemeContext);
```

### 2. React 19의 Context 단순화

React 19부터는 `Context.Provider`를 사용하지 않고 직접 `<Context>` 컴포넌트를 사용할 수 있습니다.

#### React 18과의 비교

```typescript
import { createContext, useContext } from 'react';

const ThemeContext = createContext<string>('light');

// ❌ React 18 - Provider 필요
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
    </ThemeContext.Provider>
  );
}

// ✅ React 19 - Context 직접 사용
function App() {
  return (
    <ThemeContext value="dark">
      <Header />
    </ThemeContext>
  );
}

// 사용 방법은 동일
function Header() {
  const theme = useContext(ThemeContext);
  return <header className={theme}>Header</header>;
}
```

**장점**:
- 코드가 더 간결
- Provider라는 추가 개념 불필요
- 타입 추론이 더 명확

**하위 호환성**: `Context.Provider`도 여전히 작동합니다.

### 3. use() API로 Context 읽기

React 19의 `use()` API는 Context를 조건부로 읽을 수 있게 해줍니다.

```typescript
import { use } from 'react';

function Component({ shouldUseTheme }: { shouldUseTheme: boolean }) {
  // ✅ React 19: 조건부로 Context 읽기 가능
  if (shouldUseTheme) {
    const theme = use(ThemeContext);
    return <div className={theme}>Themed</div>;
  }

  return <div>No theme</div>;
}
```

**useContext와의 비교**:

```typescript
// ❌ useContext - 조건부 사용 불가 (Hooks 규칙)
function Component({ shouldUseTheme }: { shouldUseTheme: boolean }) {
  if (shouldUseTheme) {
    const theme = useContext(ThemeContext); // 에러!
  }
}

// ✅ use() - 조건부 사용 가능
function Component({ shouldUseTheme }: { shouldUseTheme: boolean }) {
  if (shouldUseTheme) {
    const theme = use(ThemeContext); // 작동함!
  }
}
```

**use()의 특징**:
- 조건부 호출 가능
- 루프 안에서도 호출 가능
- Promise와 Context 모두 지원
- 일반적인 Hooks 규칙에서 벗어남

### 4. useReducer로 복잡한 상태 관리

여러 개의 관련된 상태를 관리할 때는 `useReducer`가 유용합니다.

```typescript
import { useReducer } from 'react';

type State = {
  count: number;
  step: number;
};

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; step: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.step };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}
```

---

## 🛠️ 실습: 테마 Context

### Step 1: 테마 Context 생성

**src/contexts/ThemeContext.tsx**:

```typescript
import { createContext, ReactNode, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Context 생성 (기본값 제공)
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // localStorage에서 초기 테마 로드
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('taskflow-theme');
    return (saved as Theme) || 'light';
  });

  // 테마 변경 시 localStorage에 저장 및 DOM 업데이트
  useEffect(() => {
    localStorage.setItem('taskflow-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  // React 19: Context 직접 사용
  return (
    <ThemeContext value={value}>
      {children}
    </ThemeContext>
  );
}
```

**React 18 버전과 비교**:

```typescript
// React 18
return (
  <ThemeContext.Provider value={value}>
    {children}
  </ThemeContext.Provider>
);

// React 19
return (
  <ThemeContext value={value}>
    {children}
  </ThemeContext>
);
```

### Step 2: 테마 사용하기

**src/components/common/ThemeToggle.tsx**:

```typescript
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { Button } from './Button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      aria-label="테마 전환"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
```

**use() API 활용 버전**:

```typescript
import { use } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

export function ThemeToggle({ conditional }: { conditional?: boolean }) {
  // React 19: 조건부로 Context 읽기
  if (conditional) {
    const { theme, toggleTheme } = use(ThemeContext);
    return <button onClick={toggleTheme}>{theme}</button>;
  }

  return <button>Default Theme</button>;
}
```

### Step 3: Custom Hook으로 추상화

**src/hooks/useTheme.ts**:

```typescript
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
```

**사용**:

```typescript
import { useTheme } from '@/hooks/useTheme';

function Component() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={theme}>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}
```

---

## 🛠️ 실습: 인증 Context

### Step 1: 인증 상태 정의

**src/contexts/AuthContext.tsx**:

```typescript
import { createContext, ReactNode, useReducer, useEffect } from 'react';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: User }
  | { type: 'LOGIN_FAILURE'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; user: User };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Context 생성
export const AuthContext = createContext<AuthContextType | null>(null);

// Reducer 함수
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        user: action.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.error,
      };

    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.user,
      };

    default:
      return state;
  }
}

// Provider 컴포넌트
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // 앱 시작 시 저장된 사용자 정보 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('taskflow-user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          dispatch({ type: 'LOGIN_SUCCESS', user });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkAuth();
  }, []);

  // 로그인 함수
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 임시 사용자 데이터
      const user: User = {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
        createdAt: new Date(),
      };

      // localStorage에 저장
      localStorage.setItem('taskflow-user', JSON.stringify(user));

      dispatch({ type: 'LOGIN_SUCCESS', user });
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        error: '로그인에 실패했습니다',
      });
    }
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('taskflow-user');
    dispatch({ type: 'LOGOUT' });
  };

  // 사용자 정보 업데이트
  const updateUser = (user: User) => {
    localStorage.setItem('taskflow-user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateUser,
  };

  // React 19: Context 직접 사용
  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
}
```

### Step 2: Custom Hook

**src/hooks/useAuth.ts**:

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
```

### Step 3: 로그인 폼

**src/components/auth/LoginForm.tsx**:

```typescript
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">로그인</h2>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <Input
        type="email"
        label="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />

      <Input
        type="password"
        label="비밀번호"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />

      <Button type="submit" isLoading={isLoading} className="w-full">
        {isLoading ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
}
```

### Step 4: 보호된 라우트

**src/components/auth/ProtectedRoute.tsx**:

```typescript
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

**사용**:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🛠️ 실습: 복합 Context Provider

여러 Context를 조합하는 패턴:

**src/contexts/AppProviders.tsx**:

```typescript
import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**src/main.tsx**:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './contexts/AppProviders';
import App from './App';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);
```

---

## 🛠️ 실습: use() API 실전 활용

조건부로 Context를 읽는 고급 패턴:

**src/components/common/ConditionalTheme.tsx**:

```typescript
import { use } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

interface ConditionalThemeProps {
  useTheme: boolean;
  children: (theme?: string) => React.ReactNode;
}

export function ConditionalTheme({ useTheme, children }: ConditionalThemeProps) {
  // React 19: 조건부로 Context 읽기
  let theme: string | undefined;

  if (useTheme) {
    const themeContext = use(ThemeContext);
    theme = themeContext.theme;
  }

  return <>{children(theme)}</>;
}
```

**사용**:

```typescript
<ConditionalTheme useTheme={true}>
  {(theme) => (
    <div className={theme}>
      Current theme: {theme || 'none'}
    </div>
  )}
</ConditionalTheme>
```

---

## 🛠️ 실습: 앱 설정 Context

**src/contexts/SettingsContext.tsx**:

```typescript
import { createContext, ReactNode, useReducer } from 'react';

interface Settings {
  language: 'ko' | 'en';
  notifications: boolean;
  compactMode: boolean;
  defaultProjectView: 'grid' | 'list';
}

type SettingsAction =
  | { type: 'SET_LANGUAGE'; language: Settings['language'] }
  | { type: 'TOGGLE_NOTIFICATIONS' }
  | { type: 'TOGGLE_COMPACT_MODE' }
  | { type: 'SET_PROJECT_VIEW'; view: Settings['defaultProjectView'] }
  | { type: 'RESET_SETTINGS' };

interface SettingsContextType {
  settings: Settings;
  dispatch: React.Dispatch<SettingsAction>;
  setLanguage: (language: Settings['language']) => void;
  toggleNotifications: () => void;
  toggleCompactMode: () => void;
  setProjectView: (view: Settings['defaultProjectView']) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  language: 'ko',
  notifications: true,
  compactMode: false,
  defaultProjectView: 'grid',
};

export const SettingsContext = createContext<SettingsContextType | null>(null);

function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.language };

    case 'TOGGLE_NOTIFICATIONS':
      return { ...state, notifications: !state.notifications };

    case 'TOGGLE_COMPACT_MODE':
      return { ...state, compactMode: !state.compactMode };

    case 'SET_PROJECT_VIEW':
      return { ...state, defaultProjectView: action.view };

    case 'RESET_SETTINGS':
      return defaultSettings;

    default:
      return state;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, defaultSettings);

  // 헬퍼 함수들
  const setLanguage = (language: Settings['language']) => {
    dispatch({ type: 'SET_LANGUAGE', language });
  };

  const toggleNotifications = () => {
    dispatch({ type: 'TOGGLE_NOTIFICATIONS' });
  };

  const toggleCompactMode = () => {
    dispatch({ type: 'TOGGLE_COMPACT_MODE' });
  };

  const setProjectView = (view: Settings['defaultProjectView']) => {
    dispatch({ type: 'SET_PROJECT_VIEW', view });
  };

  const resetSettings = () => {
    dispatch({ type: 'RESET_SETTINGS' });
  };

  const value: SettingsContextType = {
    settings,
    dispatch,
    setLanguage,
    toggleNotifications,
    toggleCompactMode,
    setProjectView,
    resetSettings,
  };

  return (
    <SettingsContext value={value}>
      {children}
    </SettingsContext>
  );
}
```

**src/hooks/useSettings.ts**:

```typescript
import { useContext } from 'react';
import { SettingsContext } from '@/contexts/SettingsContext';

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }

  return context;
}
```

---

## ✅ 완성 코드 구조

```
src/
├── contexts/
│   ├── ThemeContext.tsx         ✅
│   ├── AuthContext.tsx          ✅
│   ├── SettingsContext.tsx      ✅
│   └── AppProviders.tsx         ✅
├── hooks/
│   ├── useTheme.ts              ✅
│   ├── useAuth.ts               ✅
│   └── useSettings.ts           ✅
└── components/
    ├── auth/
    │   ├── LoginForm.tsx        ✅
    │   └── ProtectedRoute.tsx   ✅
    └── common/
        └── ThemeToggle.tsx      ✅
```

---

## 🔍 코드 분석

### Context vs Redux

| Context API | Redux |
|-------------|-------|
| React 내장 | 외부 라이브러리 |
| 간단한 상태에 적합 | 복잡한 상태에 적합 |
| 작은 앱에 충분 | 큰 앱에 유리 |
| DevTools 제한적 | 강력한 DevTools |
| 미들웨어 없음 | 미들웨어 지원 |

**사용 기준**:
- 테마, 인증 → Context API
- 복잡한 비즈니스 로직 → Redux/Zustand

### useReducer vs useState

```typescript
// useState - 간단한 상태
const [count, setCount] = useState(0);
setCount(count + 1);

// useReducer - 복잡한 상태
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'INCREMENT' });
```

**useReducer 사용 시기**:
- 다음 상태가 이전 상태에 의존
- 여러 하위 값을 포함하는 복잡한 상태
- 상태 업데이트 로직이 복잡

### Context의 성능 최적화

```typescript
// ❌ 매 렌더링마다 새 객체 생성 (모든 소비자 리렌더링)
function Provider({ children }) {
  const [value, setValue] = useState(0);

  return (
    <Context value={{ value, setValue }}>
      {children}
    </Context>
  );
}

// ✅ useMemo로 메모이제이션
function Provider({ children }) {
  const [value, setValue] = useState(0);

  const contextValue = useMemo(() => ({
    value,
    setValue,
  }), [value]);

  return (
    <Context value={contextValue}>
      {children}
    </Context>
  );
}
```

---

## ⚠️ 주의사항

### 1. Context를 과도하게 사용하지 않기

```typescript
// ❌ 모든 상태를 Context로
<UserContext>
  <ThemeContext>
    <SettingsContext>
      <NotificationContext>
        <AnalyticsContext>
          <App />
        </AnalyticsContext>
      </NotificationContext>
    </SettingsContext>
  </ThemeContext>
</UserContext>

// ✅ 필요한 것만 Context로
<AppProviders> {/* Theme, Auth만 */}
  <App /> {/* 나머지는 props나 local state */}
</AppProviders>
```

### 2. Context 분리하기

```typescript
// ❌ 하나의 거대한 Context
const AppContext = createContext({
  user, theme, settings, notifications, ...
});

// ✅ 관심사별로 분리
const AuthContext = createContext({ user });
const ThemeContext = createContext({ theme });
const SettingsContext = createContext({ settings });
```

### 3. 기본값 제공하기

```typescript
// ❌ undefined 기본값
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ✅ 의미있는 기본값
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});
```

### 4. use() API는 Promise도 지원

```typescript
import { use } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // React 19: Promise를 직접 읽기
  const user = use(userPromise);

  return <div>{user.name}</div>;
}
```

---

## 💪 실전 팁

### 1. Context + LocalStorage 동기화

```typescript
function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 초기값: localStorage에서 로드
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  useEffect(() => {
    // 변경 시 localStorage에 저장
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ...
}
```

### 2. Context Selector 패턴

특정 값만 구독하여 불필요한 리렌더링 방지:

```typescript
import { createContext, useContext, useSyncExternalStore } from 'react';

// Context Store
class Store {
  private state = { count: 0, name: 'John' };
  private listeners = new Set<() => void>();

  getState = () => this.state;

  setState = (updates: Partial<typeof this.state>) => {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener());
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

const store = new Store();
const StoreContext = createContext(store);

// Selector Hook
function useStoreSelector<T>(selector: (state: ReturnType<typeof store.getState>) => T) {
  const store = useContext(StoreContext);

  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState())
  );
}

// 사용
function CountDisplay() {
  // count만 구독 (name 변경 시 리렌더링 안 됨)
  const count = useStoreSelector(state => state.count);
  return <div>{count}</div>;
}
```

### 3. DevTools 통합

```typescript
function useReducerWithDevTools<S, A>(
  reducer: React.Reducer<S, A>,
  initialState: S,
  name: string
) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
      const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({ name });
      devTools.init(initialState);

      const enhancedDispatch = (action: A) => {
        dispatch(action);
        devTools.send(action, state);
      };

      return () => devTools.disconnect();
    }
  }, []);

  return [state, dispatch] as const;
}
```

### 4. 여러 Context를 한 번에 사용

```typescript
// Compound Hook
function useApp() {
  const auth = useAuth();
  const theme = useTheme();
  const settings = useSettings();

  return { auth, theme, settings };
}

// 사용
function Component() {
  const { auth, theme, settings } = useApp();
  // ...
}
```

---

## 🧪 테스트

**ThemeContext.test.tsx**:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, ThemeContext } from './ThemeContext';
import { useContext } from 'react';

function TestComponent() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  it('provides theme value', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('toggles theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const button = screen.getByText('Toggle');

    await userEvent.click(button);

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    await userEvent.click(button);

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('persists theme to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByText('Toggle'));

    await waitFor(() => {
      expect(localStorage.getItem('taskflow-theme')).toBe('dark');
    });
  });
});
```

---

## 📚 참고 자료

- [React 19 - Context](https://react.dev/reference/react/createContext)
- [React 19 - use() API](https://react.dev/reference/react/use)
- [useReducer 완벽 가이드](https://react.dev/reference/react/useReducer)
- [Context API 성능 최적화](https://kentcdodds.com/blog/how-to-optimize-your-context-value)

---

## 🎓 연습 문제

### 기본

1. **언어 Context**를 만들어서 다국어 지원을 구현하세요.

2. **Notification Context**를 만들어서 토스트 알림을 관리하세요.

3. **Modal Context**를 만들어서 전역 모달을 관리하세요.

### 도전

4. **Undo/Redo Context**를 만들어서 작업 취소/재실행을 구현하세요.

5. **WebSocket Context**를 만들어서 실시간 통신을 관리하세요.

6. **use() API**를 활용하여 조건부로 여러 Context를 읽는 컴포넌트를 만드세요.

### 고급

7. **Context Selector 패턴**을 구현하여 성능을 최적화하세요.

8. **Redux DevTools**와 통합하여 Context 상태를 디버깅하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **리스트와 조건부 렌더링**을 다룹니다:

- 리스트 렌더링 최적화
- Key 속성의 중요성
- 조건부 렌더링 패턴
- React.memo로 리렌더링 방지
- Task 리스트 성능 최적화

**[Chapter 6: 리스트와 조건부 렌더링 →](06-lists-and-conditional.md)**

---

**축하합니다!** 🎉 React 19의 Context API와 전역 상태 관리를 마스터했습니다!
