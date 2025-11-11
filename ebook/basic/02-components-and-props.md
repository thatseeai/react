# Chapter 2: 컴포넌트와 Props

> **학습 목표**: React 19의 ref as prop 패턴을 이해하고 재사용 가능한 컴포넌트를 만든다
> **소요 시간**: 90분
> **난이도**: 초급

## 📖 개요

React의 핵심은 컴포넌트입니다. 이 챕터에서는 React 19의 가장 큰 변화 중 하나인 **ref as prop** 패턴을 중심으로, TaskFlow의 기본 UI 컴포넌트들을 만들어봅니다. forwardRef를 사용하지 않고도 ref를 자연스럽게 전달할 수 있는 새로운 방식을 배웁니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ Button, Input 등 기본 UI 컴포넌트
- ✅ TaskCard 컴포넌트
- ✅ ProjectCard 컴포넌트
- ✅ ref를 props로 전달하기

---

## 💡 핵심 개념

### React 19의 혁명: ref를 일반 prop처럼 사용

React 19 이전에는 ref를 컴포넌트에 전달하려면 `forwardRef`라는 특별한 API를 사용해야 했습니다. React 19부터는 ref를 다른 props와 똑같이 전달할 수 있습니다!

#### React 18과의 비교

```typescript
// ❌ React 18 - forwardRef 필요
import { forwardRef, Ref } from 'react';

interface InputProps {
  label: string;
  placeholder?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, placeholder }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} placeholder={placeholder} />
      </div>
    );
  }
);

Input.displayName = 'Input'; // 디버깅을 위해 필요
```

```typescript
// ✅ React 19 - ref를 일반 prop으로
interface InputProps {
  label: string;
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>; // ref를 props에 포함
}

function Input({ label, placeholder, ref }: InputProps) {
  return (
    <div>
      <label>{label}</label>
      <input ref={ref} placeholder={placeholder} />
    </div>
  );
}
```

**장점**:
- 코드가 더 간결하고 직관적
- forwardRef의 복잡성 제거
- TypeScript 타입 정의가 더 쉬움
- displayName 설정 불필요

### 컴포넌트 설계 원칙

1. **단일 책임 원칙**: 하나의 컴포넌트는 하나의 기능만
2. **재사용성**: 다양한 상황에서 사용 가능하도록
3. **타입 안전성**: TypeScript로 명확한 인터페이스 정의
4. **접근성**: ARIA 속성 및 키보드 네비게이션 지원

---

## 🛠️ 실습: 기본 UI 컴포넌트 만들기

### Step 1: Button 컴포넌트

**src/components/common/Button.tsx**:

```typescript
import { ButtonHTMLAttributes } from 'react';

// React 19: ref를 props 인터페이스에 직접 포함
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ref, // React 19: ref를 일반 prop으로 받음
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2';

  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      ref={ref} // React 19: 바로 전달
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          로딩중...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
```

**사용 예제**:

```typescript
import { useRef } from 'react';
import { Button } from '@/components/common/Button';

function Example() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const focusButton = () => {
    buttonRef.current?.focus();
  };

  return (
    <div>
      <Button ref={buttonRef} variant="primary">
        클릭하세요
      </Button>
      <Button onClick={focusButton}>
        위 버튼 포커스
      </Button>
    </div>
  );
}
```

### Step 2: Input 컴포넌트

**src/components/common/Input.tsx**:

```typescript
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({
  label,
  error,
  helperText,
  ref,
  className = '',
  ...props
}: InputProps) {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        className={`
          px-4 py-2 border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />

      {error && (
        <span
          id={`${inputId}-error`}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </span>
      )}

      {!error && helperText && (
        <span
          id={`${inputId}-helper`}
          className="text-sm text-gray-500"
        >
          {helperText}
        </span>
      )}
    </div>
  );
}
```

**주요 특징**:
- 자동 ID 생성
- 접근성 속성 (ARIA)
- 에러 표시 및 도움말
- ref 전달 지원

### Step 3: Card 컴포넌트

**src/components/common/Card.tsx**:

```typescript
import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

export function Card({
  header,
  footer,
  children,
  ref,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      ref={ref}
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-200">
          {header}
        </div>
      )}

      <div className="px-6 py-4">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}
```

---

## 🛠️ 실습: TaskCard 컴포넌트

이제 기본 컴포넌트들을 조합하여 TaskCard를 만듭니다.

**src/components/task/TaskCard.tsx**:

```typescript
import { Task } from '@/types/task';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  ref?: React.Ref<HTMLDivElement>;
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  ref,
}: TaskCardProps) {
  const statusColors = {
    'todo': 'bg-gray-200 text-gray-800',
    'in-progress': 'bg-blue-200 text-blue-800',
    'review': 'bg-yellow-200 text-yellow-800',
    'done': 'bg-green-200 text-green-800',
  };

  const priorityIcons = {
    'low': '🟢',
    'medium': '🟡',
    'high': '🟠',
    'urgent': '🔴',
  };

  return (
    <Card
      ref={ref}
      className="hover:shadow-lg transition-shadow cursor-pointer"
      header={
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status]}`}
              >
                {task.status}
              </span>
              <span className="text-sm" title={`우선순위: ${task.priority}`}>
                {priorityIcons[task.priority]}
              </span>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex gap-2">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(task)}
            >
              수정
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onDelete(task.id)}
            >
              삭제
            </Button>
          )}
        </div>
      }
    >
      <p className="text-gray-600 text-sm whitespace-pre-wrap">
        {task.description}
      </p>

      {task.dueDate && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <span>📅</span>
          <time dateTime={task.dueDate.toISOString()}>
            {task.dueDate.toLocaleDateString('ko-KR')}
          </time>
        </div>
      )}
    </Card>
  );
}
```

**사용 예제**:

```typescript
import { useRef } from 'react';
import { TaskCard } from '@/components/task/TaskCard';

function TaskList() {
  const firstTaskRef = useRef<HTMLDivElement>(null);

  const sampleTask = {
    id: '1',
    title: 'React 19 학습하기',
    description: 'useActionState, useOptimistic 등 새로운 기능 익히기',
    projectId: 'proj-1',
    status: 'in-progress' as const,
    priority: 'high' as const,
    dueDate: new Date('2025-12-31'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="space-y-4">
      <TaskCard
        ref={firstTaskRef}
        task={sampleTask}
        onEdit={(task) => console.log('Edit:', task)}
        onDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
}
```

---

## 🛠️ 실습: ProjectCard 컴포넌트

**src/components/project/ProjectCard.tsx**:

```typescript
import { Project } from '@/types/project';
import { Card } from '@/components/common/Card';

interface ProjectCardProps {
  project: Project;
  taskCount?: number;
  onClick?: () => void;
  ref?: React.Ref<HTMLDivElement>;
}

export function ProjectCard({
  project,
  taskCount = 0,
  onClick,
  ref,
}: ProjectCardProps) {
  return (
    <Card
      ref={ref}
      onClick={onClick}
      className="hover:shadow-xl transition-all cursor-pointer"
      header={
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: project.color }}
          >
            📁
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500">
              {project.memberIds.length}명의 멤버
            </p>
          </div>
        </div>
      }
    >
      <p className="text-gray-600 line-clamp-2">
        {project.description}
      </p>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          총 {taskCount}개의 작업
        </span>
        <span className="text-gray-400">
          {project.updatedAt.toLocaleDateString('ko-KR')}
        </span>
      </div>
    </Card>
  );
}
```

---

## 🛠️ 실습: Children과 Composition 패턴

### Children을 활용한 유연한 컴포넌트

**src/components/common/Modal.tsx**:

```typescript
import { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  ref?: React.Ref<HTMLDivElement>;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  ref,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={ref}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          {footer || (
            <Button onClick={onClose} variant="secondary">
              닫기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**사용 예제**:

```typescript
import { useState, useRef } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        모달 열기
      </Button>

      <Modal
        ref={modalRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="작업 삭제"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={() => {
              console.log('삭제!');
              setIsOpen(false);
            }}>
              삭제
            </Button>
          </>
        }
      >
        <p>정말로 이 작업을 삭제하시겠습니까?</p>
        <p className="text-sm text-gray-500 mt-2">
          이 작업은 복구할 수 없습니다.
        </p>
      </Modal>
    </>
  );
}
```

---

## ✅ 완성 코드 구조

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx        ✅
│   │   ├── Input.tsx         ✅
│   │   ├── Card.tsx          ✅
│   │   └── Modal.tsx         ✅
│   ├── task/
│   │   └── TaskCard.tsx      ✅
│   └── project/
│       └── ProjectCard.tsx   ✅
```

---

## 🔍 코드 분석

### ref as prop의 내부 동작

React 19에서는 ref가 특별한 prop으로 취급되지 않습니다. 이제 일반 prop처럼 처리됩니다:

```typescript
// React가 내부적으로 처리
function Component({ ref, ...otherProps }) {
  // ref는 자동으로 DOM 요소에 연결됨
  return <div ref={ref} {...otherProps} />;
}
```

### forwardRef를 사용해야 하는 경우

React 19에서도 forwardRef가 완전히 사라진 것은 아닙니다. 다음 경우에는 여전히 유용할 수 있습니다:

```typescript
// Higher-Order Component (HOC)에서 ref 전달
import { forwardRef } from 'react';

function withLogging<T, P>(Component: React.ComponentType<P>) {
  return forwardRef<T, P>((props, ref) => {
    console.log('Rendering with props:', props);
    return <Component {...props} ref={ref} />;
  });
}
```

하지만 대부분의 일반적인 사용 사례에서는 더 이상 필요하지 않습니다.

### Props의 타입 안전성

TypeScript를 사용할 때 extends를 활용하여 HTML 속성을 상속받으면 편리합니다:

```typescript
// ✅ 좋은 예
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  ref?: React.Ref<HTMLButtonElement>;
}

// ❌ 나쁜 예 - 모든 속성을 수동으로 정의
interface ButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  // ... 너무 많은 prop 정의
}
```

---

## ⚠️ 주의사항

### 1. ref 전달 시 타입 정의

ref의 타입을 명확히 정의해야 합니다:

```typescript
// ✅ 올바른 타입
ref?: React.Ref<HTMLInputElement>

// ❌ 잘못된 타입
ref?: any
```

### 2. ref는 선택적 prop

ref는 항상 선택적(optional)이어야 합니다:

```typescript
// ✅
interface InputProps {
  label: string;
  ref?: React.Ref<HTMLInputElement>; // optional
}

// ❌
interface InputProps {
  label: string;
  ref: React.Ref<HTMLInputElement>; // required - 좋지 않음
}
```

### 3. ref를 다시 전달할 때

컴포넌트 내부에서 ref를 다시 전달할 때 주의:

```typescript
function Input({ ref, ...props }: InputProps) {
  // ✅ 직접 전달
  return <input ref={ref} {...props} />;

  // ❌ 스프레드로 전달하면 작동하지 않음
  // return <input {...props} />; // ref가 누락됨
}
```

---

## 💪 실전 팁

### 1. Compound Components 패턴

관련 컴포넌트를 하나로 묶기:

```typescript
// Select.tsx
export function Select({ children, ...props }: SelectProps) {
  return <select {...props}>{children}</select>;
}

Select.Option = function Option({ children, ...props }: OptionProps) {
  return <option {...props}>{children}</option>;
};

// 사용
<Select>
  <Select.Option value="1">옵션 1</Select.Option>
  <Select.Option value="2">옵션 2</Select.Option>
</Select>
```

### 2. 조건부 ref 전달

ref가 제공되지 않았을 때의 처리:

```typescript
function Input({ ref, ...props }: InputProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = ref || internalRef;

  // 이제 inputRef는 항상 유효함
  return <input ref={inputRef} {...props} />;
}
```

### 3. ref와 useImperativeHandle

특정 메서드만 노출하기:

```typescript
import { useImperativeHandle, useRef } from 'react';

interface InputHandle {
  focus: () => void;
  clear: () => void;
}

interface InputProps {
  ref?: React.Ref<InputHandle>;
}

function Input({ ref, ...props }: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
    clear() {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
  }));

  return <input ref={inputRef} {...props} />;
}

// 사용
const inputRef = useRef<InputHandle>(null);
inputRef.current?.focus();
inputRef.current?.clear();
```

---

## 🧪 테스트

**Button.test.tsx**:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';
import { useRef } from 'react';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('forwards ref correctly', () => {
    function TestComponent() {
      const ref = useRef<HTMLButtonElement>(null);

      return (
        <>
          <Button ref={ref}>Button</Button>
          <button onClick={() => ref.current?.focus()}>
            Focus
          </button>
        </>
      );
    }

    render(<TestComponent />);
    const focusButton = screen.getByText('Focus');
    const targetButton = screen.getByText('Button');

    userEvent.click(focusButton);
    expect(targetButton).toHaveFocus();
  });
});
```

---

## 📚 참고 자료

- [React 19 - ref as prop](https://react.dev/blog/2024/04/25/react-19#ref-as-a-prop)
- [Component Patterns in React](https://react.dev/learn/passing-props-to-a-component)
- [TypeScript with React](https://react-typescript-cheatsheet.netlify.app/)

---

## 🎓 연습 문제

### 기본

1. **Badge 컴포넌트**를 만들어서 TaskCard의 상태 표시에 사용하세요.

2. **Avatar 컴포넌트**를 만들어서 사용자 프로필 이미지를 표시하세요.

3. **Textarea 컴포넌트**를 만들고 ref를 지원하도록 하세요.

### 도전

4. **Select 컴포넌트**를 Compound Components 패턴으로 만드세요.

5. **Accordion 컴포넌트**를 만들어서 TaskCard를 접었다 펼 수 있게 하세요.

6. **Tooltip 컴포넌트**를 만들어서 버튼에 마우스를 올리면 도움말이 표시되도록 하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **State와 기본 Hooks**를 다룹니다:

- useState로 상태 관리
- useEffect의 올바른 사용법
- **NEW**: useEffectEvent로 Effect 최적화
- Custom Hooks 작성
- Task 목록 관리 구현

**[Chapter 3: State와 기본 Hooks →](03-state-and-hooks.md)**

---

**축하합니다!** 🎉 React 19의 ref as prop 패턴을 마스터했습니다!
