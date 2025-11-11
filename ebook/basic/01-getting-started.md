# Chapter 1: React 19 시작하기

> **학습 목표**: React 19 개발 환경을 설정하고 TaskFlow 프로젝트의 기본 구조를 만든다
> **소요 시간**: 60분
> **난이도**: 초급

## 📖 개요

React 19는 2024년 12월에 정식 출시된 최신 버전으로, 개발자 경험과 성능을 크게 개선한 혁신적인 기능들을 포함하고 있습니다. 이 챕터에서는 React 19의 주요 변경사항을 살펴보고, 협업 작업 관리 플랫폼 "TaskFlow"를 만들기 위한 개발 환경을 구축합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ React 19 개발 환경 설정
- ✅ TypeScript + Vite 프로젝트 초기화
- ✅ TaskFlow 프로젝트 구조 설계
- ✅ 기본 라우팅 및 레이아웃 설정

---

## 💡 React 19의 혁신적인 변화

### 🆕 주요 새로운 기능

#### 1. **Actions와 Transitions**
비동기 작업을 더 쉽게 처리할 수 있는 새로운 패턴입니다.

```typescript
// React 19
const [isPending, startTransition] = useTransition();

startTransition(async () => {
  // 이제 async 함수 지원!
  await updateData();
  setData(newData);
});
```

#### 2. **새로운 Hooks**

| Hook | 용도 | 이전 버전 |
|------|------|----------|
| `useActionState` | Form Actions 상태 관리 | `useFormState` (deprecated) |
| `useOptimistic` | 낙관적 UI 업데이트 | 수동 구현 필요 |
| `use()` | Promise/Context 읽기 | `useContext`, async 처리 복잡 |
| `useEffectEvent` | 비반응형 Effect 로직 | 패턴으로만 존재 |

#### 3. **ref를 props로 직접 사용**

```typescript
// React 18 - forwardRef 필요
const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// React 19 - ref를 일반 prop처럼 사용
function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

#### 4. **Context 단순화**

```typescript
// React 18
<ThemeContext.Provider value={theme}>
  <App />
</ThemeContext.Provider>

// React 19
<ThemeContext value={theme}>
  <App />
</ThemeContext>
```

#### 5. **Server Components와 Actions**

```typescript
// Server Component
async function ProjectList() {
  const projects = await fetchProjects(); // 서버에서 직접 데이터 페칭
  return <ul>{projects.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}

// Server Action
async function createProject(formData: FormData) {
  'use server';
  const name = formData.get('name');
  await db.projects.create({ name });
}
```

### ⚠️ Breaking Changes

React 19로 업그레이드 시 주의해야 할 변경사항:

1. **제거된 API**
   - `propTypes` (TypeScript 사용 권장)
   - `defaultProps` (함수 컴포넌트)
   - String refs (`ref="myRef"`)
   - `ReactDOM.render` (→ `createRoot`)

2. **변경된 동작**
   - `useId` 형식 변경: `:r123:` → `r123`
   - Errors는 `window.reportError`로 보고
   - JSX Transform 필수

---

## 🛠️ 실습: TaskFlow 프로젝트 설정

### Step 1: 프로젝트 초기화

```bash
# Vite로 React + TypeScript 프로젝트 생성
npm create vite@latest taskflow -- --template react-ts

cd taskflow
```

### Step 2: React 19 설치

`package.json`을 열어 React 19를 설치합니다.

```bash
# React 19 및 필수 패키지 설치
npm install react@19 react-dom@19

# 개발 의존성
npm install -D @types/react@19 @types/react-dom@19
npm install -D @vitejs/plugin-react
npm install -D typescript
```

**package.json** (주요 부분):

```json
{
  "name": "taskflow",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0"
  }
}
```

### Step 3: TypeScript 설정

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**설명**:
- `jsx: "react-jsx"`: React 19의 자동 JSX 변환 사용
- `strict: true`: 엄격한 타입 체크
- `paths`: 절대 경로 import를 위한 alias 설정

### Step 4: Vite 설정

**vite.config.ts**:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // React Compiler 활성화 (Chapter 14에서 자세히 다룸)
      babel: {
        plugins: [
          // ['babel-plugin-react-compiler', {}]
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### Step 5: 프로젝트 구조 설계

TaskFlow의 폴더 구조를 다음과 같이 설계합니다:

```
taskflow/
├── public/
│   └── vite.svg
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── common/          # 공통 컴포넌트 (Button, Input 등)
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   ├── project/         # 프로젝트 관련 컴포넌트
│   │   └── task/            # Task 관련 컴포넌트
│   │
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Dashboard.tsx
│   │   ├── ProjectList.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── TaskDetail.tsx
│   │   └── Login.tsx
│   │
│   ├── hooks/               # Custom Hooks
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   └── useAuth.ts
│   │
│   ├── contexts/            # Context Providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── types/               # TypeScript 타입 정의
│   │   ├── project.ts
│   │   ├── task.ts
│   │   └── user.ts
│   │
│   ├── utils/               # 유틸리티 함수
│   │   ├── date.ts
│   │   └── validation.ts
│   │
│   ├── styles/              # 전역 스타일
│   │   └── index.css
│   │
│   ├── App.tsx              # 루트 컴포넌트
│   ├── main.tsx             # 엔트리 포인트
│   └── vite-env.d.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

**폴더 구조 설명**:

- **components/**: 기능별로 분리된 재사용 가능한 컴포넌트
  - `common/`: 버튼, 입력 필드 등 범용 UI 컴포넌트
  - `layout/`: 헤더, 사이드바 등 레이아웃
  - `project/`, `task/`: 도메인별 컴포넌트

- **pages/**: 라우트와 1:1로 매칭되는 페이지 컴포넌트

- **hooks/**: 비즈니스 로직을 캡슐화한 커스텀 훅

- **contexts/**: 전역 상태 관리를 위한 Context

- **types/**: TypeScript 타입 및 인터페이스

### Step 6: 기본 타입 정의

**src/types/user.ts**:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**src/types/project.ts**:

```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'active' | 'archived' | 'completed';
```

**src/types/task.ts**:

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
```

### Step 7: 엔트리 포인트 설정

**src/main.tsx**:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// React 19: createRoot 사용 (ReactDOM.render는 제거됨)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**주요 변경사항**:
- ❌ `ReactDOM.render()` (React 18 이전)
- ✅ `createRoot()` (React 18+, React 19에서 필수)

**React 18과의 비교**:

```typescript
// React 18 이전
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));

// React 18+
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')!).render(<App />);
```

### Step 8: 루트 컴포넌트

**src/App.tsx**:

```typescript
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header>
        <h1>TaskFlow</h1>
        <p>협업 작업 관리 플랫폼</p>
      </header>

      <main>
        <section>
          <h2>React 19로 시작하기</h2>
          <p>현재 카운트: {count}</p>
          <button onClick={() => setCount(count + 1)}>
            증가
          </button>
        </section>
      </main>

      <footer>
        <p>React 19.0.0으로 구동중</p>
      </footer>
    </div>
  );
}

export default App;
```

### Step 9: 기본 스타일

**src/styles/index.css**:

```css
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  button {
    background-color: #f9f9f9;
  }
}
```

### Step 10: 프로젝트 실행

```bash
# 개발 서버 시작
npm run dev

# 브라우저가 자동으로 열리고 http://localhost:3000 접속
```

---

## ✅ 완성 코드 확인

이제 다음과 같은 구조가 완성되었습니다:

```
taskflow/
├── src/
│   ├── types/
│   │   ├── user.ts          ✅
│   │   ├── project.ts       ✅
│   │   └── task.ts          ✅
│   ├── styles/
│   │   └── index.css        ✅
│   ├── App.tsx              ✅
│   └── main.tsx             ✅
├── package.json             ✅
├── tsconfig.json            ✅
└── vite.config.ts           ✅
```

브라우저에서 http://localhost:3000을 열면 "TaskFlow" 제목과 카운터가 표시됩니다.

---

## 🔍 코드 분석

### createRoot의 내부 동작

React 19의 `createRoot`는 다음과 같은 이점을 제공합니다:

1. **Concurrent Rendering**: 동시성 렌더링 자동 활성화
2. **Automatic Batching**: 모든 업데이트 자동 배칭
3. **Transitions**: `useTransition`, `useDeferredValue` 사용 가능
4. **Improved Hydration**: SSR 시 더 나은 hydration

```typescript
createRoot(container, {
  // React 19의 새로운 옵션들
  onUncaughtError: (error, errorInfo) => {
    console.error('Uncaught error:', error);
  },
  onCaughtError: (error, errorInfo) => {
    console.log('Caught error:', error);
  },
  onRecoverableError: (error, errorInfo) => {
    console.warn('Recoverable error:', error);
  },
});
```

### TypeScript 설정 주요 옵션

```json
{
  "jsx": "react-jsx",           // 자동 JSX 변환 (import React 불필요)
  "strict": true,               // 모든 엄격 모드 활성화
  "moduleResolution": "bundler", // Vite의 모듈 해석 방식
  "isolatedModules": true,      // 각 파일을 독립 모듈로 취급
}
```

---

## ⚠️ 주의사항

### 1. React 19 호환성 확인

일부 라이브러리는 React 19와 아직 완전히 호환되지 않을 수 있습니다. 주요 라이브러리의 호환성을 확인하세요:

```bash
# 라이브러리 호환성 확인
npm info react-router-dom peerDependencies
npm info @tanstack/react-query peerDependencies
```

### 2. StrictMode 경고

React 19의 StrictMode는 더 많은 검증을 수행합니다:

```typescript
// 개발 중에는 컴포넌트가 2번 렌더링됨
<StrictMode>
  <App />
</StrictMode>
```

이는 버그가 아니라 잠재적 문제를 찾기 위한 의도적인 동작입니다.

### 3. 자동 JSX 변환

React 19에서는 JSX 파일에서 `import React from 'react'`를 생략할 수 있습니다:

```typescript
// ❌ 불필요 (하지만 에러는 아님)
import React from 'react';

// ✅ 권장
import { useState } from 'react';
```

---

## 💪 실전 팁

### 1. Vite 환경변수 활용

**.env.local**:

```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=TaskFlow
```

**사용**:

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
console.log(import.meta.env.VITE_APP_NAME);
```

### 2. 절대 경로 import

`tsconfig.json`과 `vite.config.ts`에 path alias를 설정했으므로:

```typescript
// ❌ 상대 경로
import { Button } from '../../../components/common/Button';

// ✅ 절대 경로
import { Button } from '@/components/common/Button';
```

### 3. TypeScript 타입 체크 자동화

**package.json**에 스크립트 추가:

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

---

## 🧪 초기 설정 검증

다음 명령어로 설정이 올바른지 확인하세요:

```bash
# 타입 체크
npm run type-check

# 빌드 테스트
npm run build

# 프리뷰
npm run preview
```

모든 명령어가 에러 없이 실행되면 성공입니다!

---

## 📚 참고 자료

- [React 19 공식 문서](https://react.dev)
- [Vite 공식 문서](https://vitejs.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org)
- [React 19 릴리스 블로그](https://react.dev/blog/2024/12/05/react-19)

---

## 🎓 연습 문제

### 기본

1. **.env** 파일을 만들고 `VITE_APP_VERSION` 변수를 추가한 후 App.tsx에서 표시하세요.

2. **src/components/common/** 폴더를 만들고 간단한 `Button.tsx` 컴포넌트를 작성하세요.

3. **package.json**에 `lint` 스크립트를 추가하고 ESLint를 설정하세요.

### 도전

4. **다크모드 토글 버튼**을 만들어서 localStorage에 저장하세요.

5. **Error Boundary** 컴포넌트를 만들어서 App을 감싸세요.

6. **React DevTools**를 설치하고 컴포넌트 트리를 탐색하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **컴포넌트와 Props**를 다룹니다:

- React 19의 ref as prop 패턴
- TaskCard, ProjectCard 컴포넌트 구현
- forwardRef 없이 ref 전달하기
- 컴포넌트 합성 패턴

**[Chapter 2: 컴포넌트와 Props →](02-components-and-props.md)**

---

**축하합니다!** 🎉 React 19 개발 환경 설정을 완료했습니다!
