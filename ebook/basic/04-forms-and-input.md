# Chapter 4: 폼과 사용자 입력

> **학습 목표**: React 19의 Form Actions와 useActionState를 마스터하여 현대적인 폼을 구현한다
> **소요 시간**: 120분
> **난이도**: 중급

## 📖 개요

React 19는 폼 처리 방식을 혁신적으로 개선했습니다. **Form Actions**, **useActionState**, **useFormStatus** 등 새로운 API를 통해 비동기 폼 제출, 로딩 상태 관리, Progressive Enhancement를 쉽게 구현할 수 있습니다.

이 챕터에서는 TaskFlow의 Task 생성/수정 폼을 만들면서 React 19의 최신 폼 처리 패턴을 배웁니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ **NEW**: Form Actions로 폼 제출
- ✅ **NEW**: useActionState로 상태 관리
- ✅ **NEW**: useFormStatus로 제출 상태 표시
- ✅ Task 생성/수정 폼
- ✅ 폼 유효성 검사
- ✅ Progressive Enhancement

---

## 💡 핵심 개념

### 1. Form Actions - React 19의 혁신

React 19부터 `<form>` 요소의 `action` prop에 함수를 전달할 수 있습니다.

```typescript
// React 19: action prop에 함수 전달
function CreateTaskForm() {
  async function createTask(formData: FormData) {
    'use server'; // Server Action (선택적)

    const title = formData.get('title');
    await saveToDatabase({ title });
  }

  return (
    <form action={createTask}>
      <input name="title" />
      <button type="submit">생성</button>
    </form>
  );
}
```

**기존 방식과의 비교**:

```typescript
// ❌ React 18 - 수동 이벤트 처리
function CreateTaskForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title');

    try {
      await saveToDatabase({ title });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? '생성 중...' : '생성'}
      </button>
    </form>
  );
}

// ✅ React 19 - 간결한 Form Action
function CreateTaskForm() {
  async function createTask(formData: FormData) {
    const title = formData.get('title');
    await saveToDatabase({ title });
  }

  return (
    <form action={createTask}>
      <input name="title" />
      <SubmitButton />
    </form>
  );
}
```

**장점**:
- 로딩 상태 자동 관리
- Progressive Enhancement (JS 없이도 작동)
- 더 간결한 코드
- 서버 액션과의 자연스러운 통합

### 2. useActionState - 폼 상태 관리

`useActionState`는 폼 액션의 결과를 상태로 관리합니다.

```typescript
import { useActionState } from 'react';

function Form() {
  const [state, formAction, isPending] = useActionState(
    async (previousState, formData) => {
      // 액션 로직
      const result = await submitForm(formData);
      return result; // 새로운 state
    },
    initialState // 초기 state
  );

  return (
    <form action={formAction}>
      {/* 폼 요소 */}
      {isPending && <p>제출 중...</p>}
      {state.error && <p>에러: {state.error}</p>}
    </form>
  );
}
```

**주요 특징**:
- 첫 번째 인자: 이전 상태
- 두 번째 인자: FormData
- 반환값: `[state, formAction, isPending]`

**이전 이름**: React 19 이전 버전에서는 `useFormState`로 불렸으나 deprecated됨

### 3. useFormStatus - 제출 상태 확인

`useFormStatus`는 부모 `<form>`의 제출 상태를 확인합니다.

```typescript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending, data, method, action } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? '제출 중...' : '제출'}
    </button>
  );
}

function Form() {
  return (
    <form action={handleSubmit}>
      <input name="title" />
      <SubmitButton /> {/* 부모 form의 상태 접근 */}
    </form>
  );
}
```

**반환 값**:
- `pending`: 폼 제출 중 여부
- `data`: FormData 객체
- `method`: HTTP 메서드 (GET/POST)
- `action`: 액션 함수 또는 URL

**주의**: `useFormStatus`는 `<form>` 내부의 **자식 컴포넌트**에서만 사용 가능

---

## 🛠️ 실습: Task 생성 폼

### Step 1: 기본 Form Action

**src/components/task/CreateTaskForm.tsx**:

```typescript
import { useActionState } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Task } from '@/types/task';

interface FormState {
  error?: string;
  success?: boolean;
  task?: Task;
}

interface CreateTaskFormProps {
  projectId: string;
  onTaskCreated?: (task: Task) => void;
}

export function CreateTaskForm({ projectId, onTaskCreated }: CreateTaskFormProps) {
  // React 19: useActionState로 폼 상태 관리
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (previousState, formData) => {
      try {
        // FormData에서 값 추출
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const priority = formData.get('priority') as Task['priority'];

        // 유효성 검사
        if (!title.trim()) {
          return { error: '제목을 입력하세요' };
        }

        if (title.length > 100) {
          return { error: '제목은 100자 이하여야 합니다' };
        }

        // Task 생성
        const newTask: Task = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: description.trim(),
          projectId,
          status: 'todo',
          priority: priority || 'medium',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // 서버에 저장 (시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 콜백 호출
        onTaskCreated?.(newTask);

        return { success: true, task: newTask };
      } catch (error) {
        return { error: '작업 생성에 실패했습니다' };
      }
    },
    { success: false } // 초기 상태
  );

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="title"
        label="작업 제목"
        placeholder="무엇을 해야 하나요?"
        required
        error={state.error}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <textarea
          name="description"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="작업에 대한 자세한 설명..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          우선순위
        </label>
        <select
          name="priority"
          defaultValue="medium"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
          <option value="urgent">긴급</option>
        </select>
      </div>

      <SubmitButton isPending={isPending} />

      {state.success && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          ✅ 작업이 생성되었습니다!
        </div>
      )}
    </form>
  );
}

// 제출 버튼 컴포넌트
function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      type="submit"
      isLoading={isPending}
      className="w-full"
    >
      {isPending ? '생성 중...' : '작업 생성'}
    </Button>
  );
}
```

### Step 2: useFormStatus 활용

더 나은 방법은 `useFormStatus`를 사용하는 것입니다:

**src/components/task/SubmitButton.tsx**:

```typescript
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/common/Button';

export function SubmitButton({
  children = '제출',
  loadingText = '제출 중...',
}: {
  children?: React.ReactNode;
  loadingText?: string;
}) {
  // React 19: 부모 form의 상태 자동 추적
  const { pending } = useFormStatus();

  return (
    <Button type="submit" isLoading={pending} className="w-full">
      {pending ? loadingText : children}
    </Button>
  );
}
```

이제 CreateTaskForm에서 사용:

```typescript
import { SubmitButton } from './SubmitButton';

export function CreateTaskForm({ projectId, onTaskCreated }: CreateTaskFormProps) {
  const [state, formAction] = useActionState(/* ... */);

  return (
    <form action={formAction} className="space-y-4">
      {/* 폼 요소들 */}

      {/* useFormStatus를 사용하는 버튼 - isPending 전달 불필요 */}
      <SubmitButton loadingText="작업 생성 중...">
        작업 생성
      </SubmitButton>
    </form>
  );
}
```

### Step 3: 고급 유효성 검사

**src/utils/validation.ts**:

```typescript
export interface ValidationError {
  field: string;
  message: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  dueDate?: string;
}

export function validateTaskForm(data: TaskFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // 제목 검증
  if (!data.title.trim()) {
    errors.push({ field: 'title', message: '제목을 입력하세요' });
  } else if (data.title.length > 100) {
    errors.push({ field: 'title', message: '제목은 100자 이하여야 합니다' });
  }

  // 설명 검증
  if (data.description.length > 1000) {
    errors.push({ field: 'description', message: '설명은 1000자 이하여야 합니다' });
  }

  // 우선순위 검증
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (!validPriorities.includes(data.priority)) {
    errors.push({ field: 'priority', message: '유효하지 않은 우선순위입니다' });
  }

  // 마감일 검증
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      errors.push({ field: 'dueDate', message: '마감일은 오늘 이후여야 합니다' });
    }
  }

  return errors;
}
```

**유효성 검사 적용**:

```typescript
const [state, formAction] = useActionState<FormState, FormData>(
  async (previousState, formData) => {
    const formValues: TaskFormData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as string,
      dueDate: formData.get('dueDate') as string,
    };

    // 유효성 검사
    const errors = validateTaskForm(formValues);
    if (errors.length > 0) {
      return {
        errors,
        values: formValues, // 폼 값 유지
      };
    }

    // Task 생성 로직...
  },
  { errors: [], values: {} }
);

// 폼에서 에러 표시
<Input
  name="title"
  label="작업 제목"
  defaultValue={state.values?.title}
  error={state.errors?.find(e => e.field === 'title')?.message}
/>
```

### Step 4: Task 수정 폼

**src/components/task/EditTaskForm.tsx**:

```typescript
import { useActionState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Input } from '@/components/common/Input';
import { SubmitButton } from './SubmitButton';

interface EditTaskFormProps {
  task: Task;
  onTaskUpdated?: (task: Task) => void;
  onCancel?: () => void;
}

interface FormState {
  error?: string;
  success?: boolean;
  task?: Task;
}

export function EditTaskForm({ task, onTaskUpdated, onCancel }: EditTaskFormProps) {
  const [state, formAction] = useActionState<FormState, FormData>(
    async (previousState, formData) => {
      try {
        const updates: Partial<Task> = {
          title: (formData.get('title') as string).trim(),
          description: (formData.get('description') as string).trim(),
          status: formData.get('status') as TaskStatus,
          priority: formData.get('priority') as TaskPriority,
        };

        const dueDateStr = formData.get('dueDate') as string;
        if (dueDateStr) {
          updates.dueDate = new Date(dueDateStr);
        }

        // 유효성 검사
        if (!updates.title) {
          return { error: '제목을 입력하세요' };
        }

        // Task 업데이트
        const updatedTask: Task = {
          ...task,
          ...updates,
          updatedAt: new Date(),
        };

        // 서버에 저장 (시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, 1000));

        onTaskUpdated?.(updatedTask);

        return { success: true, task: updatedTask };
      } catch (error) {
        return { error: '작업 수정에 실패했습니다' };
      }
    },
    { success: false }
  );

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="title"
        label="작업 제목"
        defaultValue={task.title}
        required
        error={state.error}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <textarea
          name="description"
          defaultValue={task.description}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상태
          </label>
          <select
            name="status"
            defaultValue={task.status}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="todo">할 일</option>
            <option value="in-progress">진행중</option>
            <option value="review">검토중</option>
            <option value="done">완료</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            우선순위
          </label>
          <select
            name="priority"
            defaultValue={task.priority}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
            <option value="urgent">긴급</option>
          </select>
        </div>
      </div>

      <Input
        type="date"
        name="dueDate"
        label="마감일"
        defaultValue={task.dueDate?.toISOString().split('T')[0]}
      />

      <div className="flex gap-2">
        <SubmitButton loadingText="저장 중...">
          저장
        </SubmitButton>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            취소
          </Button>
        )}
      </div>

      {state.success && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          ✅ 작업이 수정되었습니다!
        </div>
      )}
    </form>
  );
}
```

### Step 5: Server Actions (고급)

Server Components와 함께 사용하는 Server Actions:

```typescript
// app/actions/tasks.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;

  // 서버에서 직접 DB 접근
  const task = await db.tasks.create({
    data: {
      title,
      description,
      status: 'todo',
      priority: 'medium',
    },
  });

  // 캐시 재검증
  revalidatePath('/tasks');

  return { success: true, task };
}

// app/tasks/new/page.tsx
import { createTask } from '../actions/tasks';

export default function NewTaskPage() {
  return (
    <form action={createTask}>
      <input name="title" required />
      <textarea name="description" />
      <button type="submit">생성</button>
    </form>
  );
}
```

---

## 🛠️ 실습: Progressive Enhancement

JavaScript가 비활성화되어도 작동하는 폼:

**src/components/task/ProgressiveTaskForm.tsx**:

```typescript
import { useActionState } from 'react';

export function ProgressiveTaskForm() {
  const [state, formAction] = useActionState(async (prev, formData) => {
    // JavaScript 활성화 시: 클라이언트 측 처리
    const title = formData.get('title') as string;

    if (!title) {
      return { error: '제목을 입력하세요' };
    }

    // 비동기 처리
    await fetch('/api/tasks', {
      method: 'POST',
      body: formData,
    });

    return { success: true };
  }, {});

  return (
    <form
      action={formAction} // JS 활성화 시
      method="POST" // JS 비활성화 시 폴백
    >
      <input
        name="title"
        required
        aria-invalid={!!state.error}
      />

      {state.error && (
        <div role="alert">{state.error}</div>
      )}

      <button type="submit">생성</button>
    </form>
  );
}
```

---

## ✅ 완성 코드 구조

```
src/
├── components/
│   └── task/
│       ├── CreateTaskForm.tsx     ✅
│       ├── EditTaskForm.tsx       ✅
│       └── SubmitButton.tsx       ✅
├── utils/
│   └── validation.ts              ✅
└── actions/
    └── tasks.ts                   ✅ (Server Actions)
```

---

## 🔍 코드 분석

### useActionState의 작동 원리

```typescript
const [state, formAction, isPending] = useActionState(actionFn, initialState);

// 1. 폼 제출 시 actionFn 호출
// 2. actionFn의 반환값이 새로운 state가 됨
// 3. 제출 중에는 isPending이 true
// 4. formAction을 <form action={}>에 전달
```

### FormData API 활용

```typescript
const formData = new FormData(formElement);

// 값 가져오기
formData.get('name'); // string | null
formData.getAll('hobbies'); // string[]

// 값 설정
formData.set('name', 'John');
formData.append('hobby', 'coding');

// 모든 값 순회
for (const [key, value] of formData.entries()) {
  console.log(key, value);
}

// 객체로 변환
const data = Object.fromEntries(formData);
```

### 제어 컴포넌트 vs 비제어 컴포넌트

```typescript
// 제어 컴포넌트 - React state로 관리
function ControlledForm() {
  const [title, setTitle] = useState('');

  return (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />
  );
}

// 비제어 컴포넌트 - DOM이 직접 관리
function UncontrolledForm() {
  return (
    <form action={handleSubmit}>
      <input name="title" defaultValue="초기값" />
    </form>
  );
}
```

**Form Actions에서는 비제어 컴포넌트 권장**

---

## ⚠️ 주의사항

### 1. useFormStatus는 자식에서만 사용 가능

```typescript
// ❌ 작동하지 않음
function Form() {
  const { pending } = useFormStatus(); // 부모 form이 없음

  return <form>...</form>;
}

// ✅ 올바른 사용
function Form() {
  return (
    <form>
      <SubmitButton /> {/* 자식에서 useFormStatus 사용 */}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus(); // 작동함
  return <button disabled={pending}>제출</button>;
}
```

### 2. action과 onSubmit 함께 사용하지 않기

```typescript
// ❌ 혼란스러움
<form action={formAction} onSubmit={handleSubmit}>

// ✅ 둘 중 하나만 사용
<form action={formAction}>
// 또는
<form onSubmit={handleSubmit}>
```

### 3. FormData의 타입 체크

```typescript
// ❌ 타입 안전하지 않음
const title = formData.get('title'); // string | File | null

// ✅ 타입 단언
const title = formData.get('title') as string;

// ✅ 또는 검증
const titleValue = formData.get('title');
if (typeof titleValue === 'string') {
  // titleValue는 string
}
```

### 4. useActionState의 이전 상태 활용

```typescript
const [state, formAction] = useActionState(
  async (previousState, formData) => {
    // previousState를 활용하여 누적 가능
    return {
      attempts: previousState.attempts + 1,
      // ...
    };
  },
  { attempts: 0 }
);
```

---

## 💪 실전 팁

### 1. 폼 리셋

```typescript
function CreateTaskForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(async (prev, formData) => {
    // 작업 생성...

    // 성공 시 폼 리셋
    formRef.current?.reset();

    return { success: true };
  }, {});

  return <form ref={formRef} action={formAction}>...</form>;
}
```

### 2. 낙관적 업데이트와 결합

```typescript
import { useActionState, useOptimistic } from 'react';

function TaskForm({ tasks }) {
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, newTask) => [...state, newTask]
  );

  const [state, formAction] = useActionState(async (prev, formData) => {
    const newTask = { /* ... */ };

    // 즉시 UI 업데이트
    addOptimisticTask(newTask);

    // 서버에 저장
    await saveTask(newTask);

    return { success: true };
  }, {});

  return (
    <>
      <TaskList tasks={optimisticTasks} />
      <form action={formAction}>...</form>
    </>
  );
}
```

### 3. Zod를 활용한 유효성 검사

```typescript
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요').max(100),
  description: z.string().max(1000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.date().min(new Date(), '마감일은 미래여야 합니다').optional(),
});

const [state, formAction] = useActionState(async (prev, formData) => {
  const result = taskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : undefined,
  });

  if (!result.success) {
    return { errors: result.error.flatten() };
  }

  // result.data는 타입 안전
  await createTask(result.data);

  return { success: true };
}, {});
```

### 4. 여러 submit 버튼

```typescript
<form action={formAction}>
  <input name="title" />

  {/* 버튼의 name/value로 구분 */}
  <button type="submit" name="action" value="draft">
    임시저장
  </button>
  <button type="submit" name="action" value="publish">
    발행
  </button>
</form>

// action에서 구분
async function formAction(formData: FormData) {
  const action = formData.get('action');

  if (action === 'draft') {
    await saveDraft(formData);
  } else if (action === 'publish') {
    await publish(formData);
  }
}
```

---

## 🧪 테스트

**CreateTaskForm.test.tsx**:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTaskForm } from './CreateTaskForm';

describe('CreateTaskForm', () => {
  it('submits form successfully', async () => {
    const onTaskCreated = vi.fn();

    render(
      <CreateTaskForm
        projectId="proj-1"
        onTaskCreated={onTaskCreated}
      />
    );

    // 폼 입력
    await userEvent.type(screen.getByLabelText('작업 제목'), 'Test Task');
    await userEvent.type(screen.getByLabelText('설명'), 'Test Description');

    // 제출
    await userEvent.click(screen.getByText('작업 생성'));

    // 로딩 상태 확인
    expect(screen.getByText('생성 중...')).toBeInTheDocument();

    // 성공 확인
    await waitFor(() => {
      expect(onTaskCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          description: 'Test Description',
        })
      );
    });
  });

  it('shows validation error', async () => {
    render(<CreateTaskForm projectId="proj-1" />);

    // 빈 제목으로 제출
    await userEvent.click(screen.getByText('작업 생성'));

    await waitFor(() => {
      expect(screen.getByText('제목을 입력하세요')).toBeInTheDocument();
    });
  });
});
```

---

## 📚 참고 자료

- [React 19 - Actions](https://react.dev/reference/react/useActionState)
- [React 19 - useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)

---

## 🎓 연습 문제

### 기본

1. **프로젝트 생성 폼**을 만들어서 useActionState를 사용하세요.

2. **파일 업로드**를 지원하는 폼을 만드세요 (FormData 활용).

3. **다단계 폼**을 만들어서 단계별로 진행하세요.

### 도전

4. **자동 저장 기능**을 추가하세요 (debounce 활용).

5. **폼 데이터를 URL 쿼리로 동기화**하세요.

6. **드래그 앤 드롭 파일 업로드**를 구현하세요.

### 고급

7. **Optimistic Updates**와 Form Actions를 결합하여 즉각 반응하는 폼을 만드세요.

8. **Server Actions**를 사용하여 완전한 풀스택 폼을 구현하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **Context와 전역 상태**를 다룹니다:

- Context API 사용법
- **NEW**: `<Context>` vs `<Context.Provider>`
- **NEW**: use() API로 Context 읽기
- 인증 Context 구현
- 테마 Context 구현

**[Chapter 5: Context와 전역 상태 →](05-context-and-state.md)**

---

**축하합니다!** 🎉 React 19의 현대적인 폼 처리를 마스터했습니다!
