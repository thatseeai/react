# Chapter 8: 스타일링

> **학습 목표**: 다양한 스타일링 방법을 익히고 다크모드와 반응형 디자인을 구현한다
> **소요 시간**: 120분
> **난이도**: 초급~중급

## 📖 개요

React 앱의 스타일링에는 여러 접근 방식이 있습니다. 이 챕터에서는 CSS Modules, Tailwind CSS, CSS-in-JS 등 다양한 방법을 살펴보고, 다크모드와 반응형 디자인을 구현합니다. TaskFlow의 UI를 완성하면서 실전 스타일링 패턴을 학습합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ CSS Modules 활용
- ✅ Tailwind CSS 통합
- ✅ 다크모드 구현
- ✅ 반응형 디자인
- ✅ 애니메이션 및 전환 효과

---

## 💡 핵심 개념

### 1. CSS Modules

CSS Modules는 CSS 클래스를 로컬 스코프로 제한하여 이름 충돌을 방지합니다.

**Button.module.css**:

```css
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.primary:hover {
  background-color: #2563eb;
}

.secondary {
  background-color: #e5e7eb;
  color: #1f2937;
}
```

**Button.tsx**:

```typescript
import styles from './Button.module.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className={`${styles.button} ${styles[variant]}`}>
      {children}
    </button>
  );
}
```

**장점**:
- 클래스 이름 자동 해싱
- 이름 충돌 방지
- 트리 쉐이킹 가능
- TypeScript 지원

### 2. Tailwind CSS

Utility-first CSS 프레임워크로 빠른 스타일링이 가능합니다.

**설치**:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**tailwind.config.js**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 또는 'media'
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
}
```

**src/styles/index.css**:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition;
  }
}
```

**사용**:

```typescript
export function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
      {children}
    </button>
  );
}
```

### 3. 다크모드

#### 방법 1: CSS Variables

**src/styles/index.css**:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1f2937;
  --color-border: #e5e7eb;
}

.dark {
  --color-bg: #1f2937;
  --color-text: #f9fafb;
  --color-border: #374151;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

#### 방법 2: Tailwind의 dark: 모디파이어

```typescript
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <h1 className="text-2xl font-bold">제목</h1>
</div>
```

**다크모드 토글**:

```typescript
import { useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### 4. 반응형 디자인

Tailwind의 반응형 브레이크포인트:

```typescript
<div className="
  grid
  grid-cols-1      /* 모바일: 1열 */
  sm:grid-cols-2   /* 640px+: 2열 */
  md:grid-cols-3   /* 768px+: 3열 */
  lg:grid-cols-4   /* 1024px+: 4열 */
  xl:grid-cols-6   /* 1280px+: 6열 */
  gap-4
">
  {/* 카드들 */}
</div>
```

**컨테이너 쿼리** (Tailwind v3.2+):

```typescript
<div className="@container">
  <div className="@lg:flex @lg:gap-4">
    {/* 컨테이너가 클 때만 flex */}
  </div>
</div>
```

---

## 🛠️ 실습: TaskFlow UI 스타일링

### Step 1: 디자인 시스템 설정

**tailwind.config.js**:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fefce8',
          500: '#eab308',
          600: '#ca8a04',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
```

### Step 2: 공통 컴포넌트 스타일링

**src/components/common/Card.tsx**:

```typescript
import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-lg shadow-soft transition-all',
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800',
        outlined: 'border-2 border-gray-200 dark:border-gray-700',
        elevated: 'shadow-lg hover:shadow-xl',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  variant,
  padding,
  className = '',
  children,
  onClick,
}: CardProps) {
  return (
    <div
      className={`${cardVariants({ variant, padding })} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

**class-variance-authority 설치**:

```bash
npm install class-variance-authority
```

### Step 3: TaskCard 스타일 개선

**src/components/task/TaskCard.tsx**:

```typescript
import { Task } from '@/types/task';
import { Card } from '@/components/common/Card';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const statusStyles = {
  'todo': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'done': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const priorityIcons = {
  'low': '🟢',
  'medium': '🟡',
  'high': '🟠',
  'urgent': '🔴',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <Card
      variant="elevated"
      className="cursor-pointer hover:scale-105 transition-transform animate-fade-in"
      onClick={onClick}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
          {task.title}
        </h3>
        <span className="text-xl ml-2 flex-shrink-0">
          {priorityIcons[task.priority]}
        </span>
      </div>

      {/* 설명 */}
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
        {task.description}
      </p>

      {/* 푸터 */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[task.status]}`}>
          {task.status}
        </span>

        {task.dueDate && (
          <time className="text-xs text-gray-500 dark:text-gray-400">
            📅 {new Date(task.dueDate).toLocaleDateString('ko-KR')}
          </time>
        )}
      </div>
    </Card>
  );
}
```

### Step 4: 레이아웃 스타일링

**src/components/layout/RootLayout.tsx**:

```typescript
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

export function RootLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              TaskFlow
            </Link>

            {/* 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                대시보드
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                프로젝트
              </NavLink>
            </nav>

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-4">
              {/* 테마 토글 */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                aria-label="테마 전환"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* 사용자 정보 */}
              {user && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* 푸터 */}
      <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © 2025 TaskFlow. React 19 + Tailwind CSS로 구동중.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### Step 5: 애니메이션

**src/components/common/FadeIn.tsx**:

```typescript
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
}

export function FadeIn({ children, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}
```

**framer-motion 설치**:

```bash
npm install framer-motion
```

**사용**:

```typescript
import { FadeIn } from '@/components/common/FadeIn';

function ProjectList() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map((project, index) => (
        <FadeIn key={project.id} delay={index * 0.1}>
          <ProjectCard project={project} />
        </FadeIn>
      ))}
    </div>
  );
}
```

### Step 6: 로딩 스켈레톤

**src/components/common/Skeleton.tsx**:

```typescript
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
```

---

## ✅ 완성 코드 구조

```
src/
├── styles/
│   └── index.css                 ✅
├── components/
│   ├── common/
│   │   ├── Card.tsx              ✅
│   │   ├── FadeIn.tsx            ✅
│   │   └── Skeleton.tsx          ✅
│   ├── task/
│   │   └── TaskCard.tsx          ✅ (스타일 개선)
│   └── layout/
│       └── RootLayout.tsx        ✅ (스타일 개선)
├── tailwind.config.js            ✅
└── postcss.config.js             ✅
```

---

## 🔍 코드 분석

### Tailwind vs CSS Modules

| Tailwind CSS | CSS Modules |
|--------------|-------------|
| Utility-first | 전통적 CSS |
| 빠른 개발 | 더 많은 제어 |
| 작은 번들 크기 | 별도 CSS 파일 |
| 클래스 이름 많음 | 깔끔한 마크업 |
| 디자인 시스템 일관성 | 자유도 높음 |

### CSS-in-JS (styled-components)

```typescript
import styled from 'styled-components';

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: ${props =>
    props.variant === 'primary' ? '#3b82f6' : '#e5e7eb'};
  color: ${props =>
    props.variant === 'primary' ? 'white' : '#1f2937'};

  &:hover {
    opacity: 0.9;
  }
`;
```

**장점**:
- 동적 스타일링
- TypeScript 완벽 지원
- 테마 관리 쉬움

**단점**:
- 런타임 오버헤드
- 번들 크기 증가
- SSR 복잡도

---

## ⚠️ 주의사항

### 1. Tailwind의 프로덕션 빌드

```javascript
// tailwind.config.js
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // 사용되지 않는 클래스 제거
}
```

### 2. 다크모드 플리커 방지

```html
<!-- index.html -->
<script>
  // 페이지 로드 전에 테마 적용
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
</script>
```

### 3. 접근성 고려

```typescript
<button
  className="..."
  aria-label="테마 전환"
  aria-pressed={theme === 'dark'}
>
  {theme === 'light' ? '🌙' : '☀️'}
</button>
```

---

## 💪 실전 팁

### 1. 커스텀 유틸리티

```typescript
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 사용
<div className={cn(
  'base-styles',
  isActive && 'active-styles',
  className
)} />
```

### 2. 반응형 테스트

```typescript
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// 사용
const isMobile = useMediaQuery('(max-width: 768px)');
```

### 3. 시스템 테마 감지

```typescript
function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return systemTheme;
}
```

---

## 🧪 테스트

```typescript
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  it('renders with dark mode', () => {
    const { container } = render(
      <ThemeProvider>
        <TaskCard task={mockTask} />
      </ThemeProvider>
    );

    // 다크모드 클래스 확인
    expect(container.querySelector('.dark')).toBeInTheDocument();
  });
});
```

---

## 📚 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [CSS Modules](https://github.com/css-modules/css-modules)

---

## 🎓 연습 문제

### 기본

1. **버튼 컴포넌트**에 다양한 크기와 variant를 추가하세요.

2. **토스트 알림** 컴포넌트를 애니메이션과 함께 만드세요.

3. **프로그레스 바** 컴포넌트를 만드세요.

### 도전

4. **테마 선택기**를 만들어서 여러 색상 테마를 지원하세요.

5. **스켈레톤 로더**를 모든 리스트에 적용하세요.

6. **페이지 전환 애니메이션**을 구현하세요.

---

## 🎉 기본편 완료!

**축하합니다!** 🎊 React 19 기본편 8개 챕터를 모두 완료했습니다!

### 지금까지 배운 내용:

1. ✅ React 19 시작하기
2. ✅ 컴포넌트와 Props (ref as prop)
3. ✅ State와 기본 Hooks (useEffectEvent)
4. ✅ 폼과 사용자 입력 (Form Actions, useActionState)
5. ✅ Context와 전역 상태 (use() API)
6. ✅ 리스트와 조건부 렌더링
7. ✅ 라우팅 (React Router v7)
8. ✅ 스타일링 (Tailwind, 다크모드)

### 다음 단계: 고급편

고급편에서는 더 깊이 있는 주제들을 다룹니다:

- Chapter 9: Transitions와 비동기 처리
- Chapter 10: Optimistic Updates
- Chapter 11: use() API 활용
- Chapter 12: Server Components
- Chapter 13: 성능 최적화
- Chapter 14: React Compiler
- Chapter 15: Suspense와 에러 처리
- Chapter 16: Server-Side Rendering
- Chapter 17: 테스팅
- Chapter 18: 실전 패턴과 아키텍처
- Chapter 19: 실험적 기능
- Chapter 20: 마이그레이션 가이드

---

**준비되셨나요? 고급편으로 계속 진행하세요!** 🚀
