# Chapter 10: Optimistic Updates

> **학습 목표**: useOptimistic Hook을 마스터하여 즉각 반응하는 UI를 구현한다
> **소요 시간**: 120분
> **난이도**: 고급

## 📖 개요

**Optimistic Update**(낙관적 업데이트)는 서버 응답을 기다리지 않고 UI를 즉시 업데이트하는 패턴입니다. React 19는 이를 위한 전용 Hook인 `useOptimistic`을 제공합니다. 이를 통해 네트워크 지연 없이 즉각 반응하는 사용자 경험을 만들 수 있습니다.

이 챕터에서는 TaskFlow의 Task CRUD를 optimistic updates로 구현합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ **NEW**: useOptimistic Hook
- ✅ Task 생성/수정/삭제 즉시 반영
- ✅ 에러 발생 시 롤백
- ✅ Form Actions와 통합
- ✅ 낙관적 UI 패턴

---

## 💡 핵심 개념

### 1. Optimistic Update란?

**전통적인 방식**:
```typescript
// 1. 서버에 요청
const handleLike = async () => {
  setIsLoading(true);
  await api.like(postId);
  // 2. 응답 받은 후 UI 업데이트
  setLiked(true);
  setIsLoading(false);
};

// 사용자는 응답을 기다려야 함 (느림)
```

**Optimistic Update 방식**:
```typescript
// 1. UI 즉시 업데이트
setLiked(true);
// 2. 백그라운드에서 서버 요청
api.like(postId).catch(() => {
  // 3. 실패 시 롤백
  setLiked(false);
});

// 사용자는 즉시 반응을 봄 (빠름)
```

### 2. useOptimistic Hook

React 19의 `useOptimistic`은 낙관적 업데이트를 쉽게 구현할 수 있게 해줍니다.

```typescript
import { useOptimistic } from 'react';

const [optimisticState, addOptimistic] = useOptimistic(
  state,
  (currentState, optimisticValue) => {
    // 낙관적 상태 계산
    return [...currentState, optimisticValue];
  }
);
```

**파라미터**:
- `state`: 실제 상태
- `updateFn`: 낙관적 상태를 계산하는 함수
  - `currentState`: 현재 실제 상태
  - `optimisticValue`: 추가할 낙관적 값

**반환값**:
- `optimisticState`: 낙관적 상태 (UI에 표시)
- `addOptimistic`: 낙관적 업데이트를 추가하는 함수

### 3. 작동 원리

```typescript
const [messages, setMessages] = useState<Message[]>([]);

const [optimisticMessages, addOptimisticMessage] = useOptimistic(
  messages,
  (state, newMessage: Message) => [...state, newMessage]
);

const sendMessage = async (text: string) => {
  const tempMessage = { id: 'temp', text, pending: true };

  // 1. 즉시 UI에 표시
  addOptimisticMessage(tempMessage);

  try {
    // 2. 서버에 전송
    const savedMessage = await api.sendMessage(text);

    // 3. 성공하면 실제 상태 업데이트
    setMessages(prev => [...prev, savedMessage]);
  } catch (error) {
    // 4. 실패하면 자동으로 optimisticMessages에서 제거됨
    alert('전송 실패');
  }
};

// UI는 optimisticMessages 사용
return (
  <div>
    {optimisticMessages.map(msg => (
      <div key={msg.id} className={msg.pending ? 'opacity-50' : ''}>
        {msg.text}
      </div>
    ))}
  </div>
);
```

**자동 롤백**:
- `setMessages`가 호출되면 `optimisticMessages`가 새 상태로 재계산됨
- 낙관적 업데이트가 실제 상태에 포함되지 않으면 자동으로 사라짐

### 4. React 18과의 비교

```typescript
// ❌ React 18 - 수동 관리
function Component() {
  const [items, setItems] = useState<Item[]>([]);
  const [optimisticItems, setOptimisticItems] = useState<Item[]>([]);

  const addItem = async (item: Item) => {
    // 낙관적 상태 수동 추가
    setOptimisticItems(prev => [...prev, item]);

    try {
      const saved = await api.save(item);
      setItems(prev => [...prev, saved]);
      // 성공 시 낙관적 상태에서 제거
      setOptimisticItems(prev => prev.filter(i => i.id !== item.id));
    } catch {
      // 실패 시 롤백
      setOptimisticItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  // 수동으로 병합
  const displayItems = [...items, ...optimisticItems];
}

// ✅ React 19 - useOptimistic
function Component() {
  const [items, setItems] = useState<Item[]>([]);

  const [optimisticItems, addOptimisticItem] = useOptimistic(
    items,
    (state, item: Item) => [...state, item]
  );

  const addItem = async (item: Item) => {
    addOptimisticItem(item);

    try {
      const saved = await api.save(item);
      setItems(prev => [...prev, saved]);
      // 자동으로 낙관적 상태 정리됨
    } catch {
      // 자동으로 롤백됨
    }
  };

  // optimisticItems 바로 사용
  return <List items={optimisticItems} />;
}
```

---

## 🛠️ 실습: Task Optimistic Updates

### Step 1: Task 추가 (Optimistic)

**src/hooks/useOptimisticTasks.ts**:

```typescript
import { useState, useOptimistic } from 'react';
import { Task } from '@/types/task';

export function useOptimisticTasks(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, newTask: Task) => [...state, newTask]
  );

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    // 임시 Task 생성
    const tempTask: Task = {
      ...taskData,
      id: `temp-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 즉시 UI에 표시
    addOptimisticTask(tempTask);

    try {
      // 서버에 저장 (시뮬레이션)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const savedTask: Task = {
        ...tempTask,
        id: crypto.randomUUID(),
      };

      // 실제 상태 업데이트
      setTasks(prev => [...prev, savedTask]);

      return savedTask;
    } catch (error) {
      // 실패 시 자동으로 롤백됨
      throw error;
    }
  };

  return {
    tasks: optimisticTasks,
    createTask,
  };
}
```

**사용**:

```typescript
import { useOptimisticTasks } from '@/hooks/useOptimisticTasks';

function TaskList() {
  const { tasks, createTask } = useOptimisticTasks();

  const handleCreate = async () => {
    try {
      await createTask({
        title: '새 작업',
        description: '설명',
        projectId: 'proj-1',
        status: 'todo',
        priority: 'medium',
      });
    } catch (error) {
      alert('작업 생성 실패');
    }
  };

  return (
    <div>
      <button onClick={handleCreate}>작업 추가</button>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          isPending={task.id.startsWith('temp-')}
        />
      ))}
    </div>
  );
}
```

### Step 2: Task 수정 (Optimistic)

**src/hooks/useOptimisticTasks.ts** (확장):

```typescript
export function useOptimisticTasks(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const [optimisticTasks, updateOptimistic] = useOptimistic(
    tasks,
    (state, update: { type: 'add' | 'update' | 'delete'; task?: Task; id?: string; updates?: Partial<Task> }) => {
      switch (update.type) {
        case 'add':
          return [...state, update.task!];

        case 'update':
          return state.map(task =>
            task.id === update.id
              ? { ...task, ...update.updates, updatedAt: new Date() }
              : task
          );

        case 'delete':
          return state.filter(task => task.id !== update.id);

        default:
          return state;
      }
    }
  );

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tempTask: Task = {
      ...taskData,
      id: `temp-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    updateOptimistic({ type: 'add', task: tempTask });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const savedTask: Task = {
        ...tempTask,
        id: crypto.randomUUID(),
      };

      setTasks(prev => [...prev, savedTask]);
      return savedTask;
    } catch (error) {
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // 즉시 UI 업데이트
    updateOptimistic({ type: 'update', id: taskId, updates });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 실제 상태 업데이트
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    // 즉시 UI에서 제거
    updateOptimistic({ type: 'delete', id: taskId });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 실제 상태에서 제거
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      throw error;
    }
  };

  return {
    tasks: optimisticTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
```

### Step 3: Form Actions와 통합

**src/components/task/OptimisticTaskForm.tsx**:

```typescript
import { useActionState, useOptimistic } from 'react';
import { Task } from '@/types/task';
import { Input } from '@/components/common/Input';
import { SubmitButton } from '@/components/common/SubmitButton';

interface OptimisticTaskFormProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export function OptimisticTaskForm({ tasks, onTasksChange }: OptimisticTaskFormProps) {
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    tasks,
    (state, newTask: Task) => [...state, newTask]
  );

  const [state, formAction] = useActionState(
    async (previousState: any, formData: FormData) => {
      const tempTask: Task = {
        id: `temp-${Date.now()}`,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        projectId: 'proj-1',
        status: 'todo',
        priority: formData.get('priority') as Task['priority'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 즉시 UI 업데이트
      addOptimisticTask(tempTask);

      try {
        // 서버 저장
        await new Promise(resolve => setTimeout(resolve, 1000));

        const savedTask: Task = {
          ...tempTask,
          id: crypto.randomUUID(),
        };

        // 실제 상태 업데이트
        onTasksChange([...tasks, savedTask]);

        return { success: true };
      } catch (error) {
        return { error: '작업 생성 실패' };
      }
    },
    {}
  );

  return (
    <div>
      <form action={formAction} className="space-y-4 mb-6">
        <Input name="title" label="작업 제목" required />
        <Input name="description" label="설명" />
        <select name="priority" className="w-full px-4 py-2 border rounded-lg">
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
          <option value="urgent">긴급</option>
        </select>
        <SubmitButton>작업 추가</SubmitButton>
      </form>

      {/* Optimistic Tasks 표시 */}
      <div className="space-y-2">
        {optimisticTasks.map(task => (
          <div
            key={task.id}
            className={`p-4 border rounded-lg ${
              task.id.startsWith('temp-')
                ? 'opacity-50 border-dashed'
                : 'opacity-100'
            }`}
          >
            <h3 className="font-semibold">{task.title}</h3>
            {task.id.startsWith('temp-') && (
              <span className="text-xs text-blue-600">저장 중...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 4: 에러 처리 및 토스트

**src/components/task/TaskListWithOptimistic.tsx**:

```typescript
import { useState, useOptimistic } from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { toast } from '@/utils/toast';

export function TaskListWithOptimistic({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  const [optimisticTasks, updateOptimistic] = useOptimistic(
    tasks,
    (state, action: { type: string; task?: Task; id?: string }) => {
      switch (action.type) {
        case 'delete':
          return state.filter(t => t.id !== action.id);
        default:
          return state;
      }
    }
  );

  const handleDelete = async (taskId: string) => {
    // 즉시 UI에서 제거
    updateOptimistic({ type: 'delete', id: taskId });

    try {
      // 서버에서 삭제
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // 실패 시뮬레이션 (10% 확률)
          if (Math.random() < 0.1) {
            reject(new Error('삭제 실패'));
          } else {
            resolve(true);
          }
        }, 1000);
      });

      // 성공: 실제 상태 업데이트
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('작업이 삭제되었습니다');
    } catch (error) {
      // 실패: 자동으로 롤백됨
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) return;

    // 즉시 UI 업데이트
    updateOptimistic({
      type: 'update',
      id: taskId,
      updates: { status: newStatus },
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTasks(prev =>
        prev.map(t =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );
    } catch (error) {
      toast.error('상태 변경 실패');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {optimisticTasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          isPending={task.id.startsWith('temp-')}
        />
      ))}
    </div>
  );
}
```

### Step 5: 복합 낙관적 업데이트

**src/components/task/TaskBoardWithOptimistic.tsx**:

```typescript
import { useState, useOptimistic } from 'react';
import { Task, TaskStatus } from '@/types/task';

interface Column {
  status: TaskStatus;
  title: string;
  tasks: Task[];
}

export function TaskBoardWithOptimistic({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  const [optimisticTasks, updateOptimistic] = useOptimistic(
    tasks,
    (state, action: { taskId: string; newStatus: TaskStatus }) => {
      return state.map(task =>
        task.id === action.taskId
          ? { ...task, status: action.newStatus }
          : task
      );
    }
  );

  // 상태별로 그룹화
  const columns: Column[] = [
    { status: 'todo', title: '할 일', tasks: [] },
    { status: 'in-progress', title: '진행중', tasks: [] },
    { status: 'review', title: '검토중', tasks: [] },
    { status: 'done', title: '완료', tasks: [] },
  ];

  optimisticTasks.forEach(task => {
    const column = columns.find(c => c.status === task.status);
    if (column) column.tasks.push(task);
  });

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    // 즉시 UI 업데이트 (드래그 앤 드롭 시 즉각 반응)
    updateOptimistic({ taskId, newStatus });

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      alert('이동 실패');
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map(column => (
        <div key={column.status} className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold mb-4">
            {column.title} ({column.tasks.length})
          </h3>
          <div className="space-y-2">
            {column.tasks.map(task => (
              <div
                key={task.id}
                className="bg-white p-3 rounded shadow cursor-move"
                draggable
                onDragEnd={() => {
                  // 실제로는 드롭 위치에 따라 newStatus 결정
                }}
              >
                <p className="font-medium">{task.title}</p>
                <div className="mt-2 flex gap-1">
                  {(['todo', 'in-progress', 'review', 'done'] as TaskStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => moveTask(task.id, status)}
                      className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ 완성 코드 구조

```
src/
├── hooks/
│   └── useOptimisticTasks.ts         ✅
├── components/
│   └── task/
│       ├── OptimisticTaskForm.tsx    ✅
│       ├── TaskListWithOptimistic.tsx✅
│       └── TaskBoardWithOptimistic.tsx✅
└── utils/
    └── toast.ts                      ✅
```

---

## 🔍 코드 분석

### useOptimistic의 내부 동작

```typescript
const [optimisticState, addOptimistic] = useOptimistic(
  actualState,
  updateFn
);

// 1. addOptimistic 호출 시:
//    - updateFn(actualState, newValue) 실행
//    - 결과를 임시로 optimisticState에 저장

// 2. actualState 변경 시:
//    - optimisticState 재계산
//    - 낙관적 업데이트가 포함되지 않으면 제거됨

// 3. 자동 롤백:
//    - actualState가 업데이트되면
//    - optimisticState = updateFn(newActualState, pendingOptimistic)
```

### isPending 구분하기

```typescript
// 방법 1: ID 패턴
const isPending = task.id.startsWith('temp-');

// 방법 2: 플래그 속성
interface Task {
  id: string;
  title: string;
  isPending?: boolean;
}

const tempTask = { ...data, id: 'temp', isPending: true };

// 방법 3: Set으로 추적
const [pendingIds, setPendingIds] = useState(new Set<string>());
```

---

## ⚠️ 주의사항

### 1. 낙관적 업데이트가 적합하지 않은 경우

```typescript
// ❌ 결제 처리 - 낙관적 업데이트 부적합
const handlePayment = async () => {
  // 결제는 반드시 서버 응답 확인 필요
  const result = await processPayment();
  if (result.success) {
    setPaymentComplete(true);
  }
};

// ✅ 좋아요 버튼 - 낙관적 업데이트 적합
const handleLike = () => {
  addOptimistic({ liked: true });
  api.like(postId);
};
```

### 2. ID 충돌 방지

```typescript
// ❌ 충돌 가능
const tempId = Date.now().toString();

// ✅ 고유성 보장
const tempId = `temp-${Date.now()}-${Math.random()}`;
```

### 3. 에러 메시지 표시

```typescript
const handleCreate = async () => {
  addOptimistic(tempItem);

  try {
    await api.create(tempItem);
  } catch (error) {
    // 사용자에게 에러 알림 필수
    toast.error('생성에 실패했습니다');
  }
};
```

---

## 💪 실전 팁

### 1. 낙관적 업데이트 + 재검증

```typescript
const handleUpdate = async () => {
  addOptimistic(newData);

  try {
    await api.update(newData);
    // 성공 후 최신 데이터 재조회
    await refetch();
  } catch {
    // 롤백
  }
};
```

### 2. 여러 작업 배치 처리

```typescript
const [queue, setQueue] = useState<Task[]>([]);

const batchCreate = async (tasks: Task[]) => {
  tasks.forEach(task => addOptimistic(task));

  try {
    const results = await Promise.all(
      tasks.map(task => api.create(task))
    );
    setTasks(prev => [...prev, ...results]);
  } catch {
    // 일부 실패 처리
  }
};
```

### 3. WebSocket과 통합

```typescript
useEffect(() => {
  const ws = new WebSocket('ws://server');

  ws.onmessage = (event) => {
    const serverTask = JSON.parse(event.data);
    // 서버에서 받은 데이터로 실제 상태 업데이트
    setTasks(prev => [...prev, serverTask]);
  };

  return () => ws.close();
}, []);
```

---

## 📚 참고 자료

- [React 19 - useOptimistic](https://react.dev/reference/react/useOptimistic)
- [Optimistic UI Patterns](https://www.patterns.dev/posts/optimistic-ui)

---

## 🎓 연습 문제

### 기본

1. **좋아요 버튼**을 낙관적 업데이트로 구현하세요.

2. **댓글 추가**를 useOptimistic으로 만드세요.

3. **상태 토글**을 즉시 반응하도록 하세요.

### 도전

4. **드래그 앤 드롭**으로 Task 순서 변경을 구현하세요.

5. **일괄 삭제**를 낙관적 업데이트로 만드세요.

6. **충돌 해결**: 동시에 여러 사용자가 수정할 때 처리하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **use() API 활용**을 다룹니다:

- use()로 Promise 읽기
- use()로 Context 읽기 (복습)
- 조건부 데이터 페칭
- Suspense와 통합
- 실전 패턴

**[Chapter 11: use() API 활용 →](11-use-api.md)**

---

**축하합니다!** 🎉 Optimistic Updates를 마스터했습니다!
