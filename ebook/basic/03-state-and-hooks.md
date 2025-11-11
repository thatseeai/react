# Chapter 3: State와 기본 Hooks

> **학습 목표**: useState, useEffect, useRef를 마스터하고 React 19의 useEffectEvent를 활용한다
> **소요 시간**: 120분
> **난이도**: 초급~중급

## 📖 개요

React의 Hooks는 함수 컴포넌트에서 상태와 생명주기 기능을 사용할 수 있게 해주는 핵심 기능입니다. 이 챕터에서는 가장 많이 사용되는 기본 Hooks를 배우고, React 19에서 새롭게 추가된 **useEffectEvent**를 활용하여 Effect를 최적화하는 방법을 학습합니다.

TaskFlow 앱의 Task 목록 관리 기능을 구현하면서 실전 패턴을 익힙니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ Task 목록 상태 관리 (useState)
- ✅ Task 필터링 및 검색
- ✅ LocalStorage 연동 (useEffect)
- ✅ **NEW**: useEffectEvent로 로깅 최적화
- ✅ Custom Hooks (useTaskList, useLocalStorage)

---

## 💡 핵심 개념

### 1. useState - 상태 관리의 기본

`useState`는 컴포넌트에 상태를 추가하는 가장 기본적인 Hook입니다.

```typescript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>카운트: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}
```

**주요 특징**:
- 초기값 설정 가능
- 상태 업데이트는 비동기적
- 함수형 업데이트 지원
- 여러 개의 state를 분리하여 관리

#### 함수형 업데이트

```typescript
// ❌ 잘못된 방법 - 이전 값에 의존
const [count, setCount] = useState(0);
setCount(count + 1);
setCount(count + 1); // 여전히 1만 증가

// ✅ 올바른 방법 - 함수형 업데이트
setCount(prev => prev + 1);
setCount(prev => prev + 1); // 2 증가
```

#### 객체 상태 업데이트

```typescript
const [user, setUser] = useState({ name: '', email: '' });

// ❌ 잘못된 방법 - 기존 값 덮어씀
setUser({ name: 'John' }); // email이 사라짐

// ✅ 올바른 방법 - 스프레드 연산자
setUser(prev => ({ ...prev, name: 'John' }));
```

### 2. useEffect - Side Effects 처리

`useEffect`는 컴포넌트가 렌더링된 후 실행되는 Side Effect를 처리합니다.

```typescript
import { useEffect } from 'react';

useEffect(() => {
  // Effect 실행
  console.log('컴포넌트 렌더링됨');

  // Cleanup 함수 (선택적)
  return () => {
    console.log('컴포넌트 언마운트 또는 Effect 재실행 전');
  };
}, [의존성배열]);
```

**의존성 배열**:
- `[]`: 마운트 시 한 번만 실행
- `[dep1, dep2]`: dep1이나 dep2가 변경될 때 실행
- 생략: 매 렌더링마다 실행 (대부분 잘못된 사용)

#### useEffect의 일반적인 사용 사례

```typescript
// 1. 데이터 페칭
useEffect(() => {
  fetch('/api/tasks')
    .then(res => res.json())
    .then(data => setTasks(data));
}, []);

// 2. 구독(Subscription)
useEffect(() => {
  const subscription = eventEmitter.on('update', handleUpdate);
  return () => subscription.unsubscribe();
}, []);

// 3. DOM 조작
useEffect(() => {
  document.title = `${taskCount}개의 작업`;
}, [taskCount]);

// 4. 타이머
useEffect(() => {
  const timer = setTimeout(() => console.log('완료!'), 1000);
  return () => clearTimeout(timer);
}, []);
```

### 3. useRef - 값 유지 및 DOM 접근

`useRef`는 두 가지 주요 용도가 있습니다:

1. **렌더링 사이에 값을 유지** (리렌더링을 유발하지 않음)
2. **DOM 요소에 직접 접근**

```typescript
import { useRef, useEffect } from 'react';

function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const renderCount = useRef(0);

  useEffect(() => {
    // 마운트 시 input에 포커스
    inputRef.current?.focus();
  }, []);

  // 리렌더링 횟수 추적 (리렌더링 유발하지 않음)
  renderCount.current += 1;

  return (
    <div>
      <p>렌더링 횟수: {renderCount.current}</p>
      <input ref={inputRef} />
    </div>
  );
}
```

**useState vs useRef**:

| useState | useRef |
|----------|--------|
| 값 변경 시 리렌더링 | 값 변경 시 리렌더링 안 함 |
| UI에 표시되는 데이터 | 내부적으로만 사용되는 데이터 |
| `setCount(1)` | `ref.current = 1` |

### 4. useEffectEvent - React 19의 새로운 Hook

**React 19에서 새롭게 추가**된 `useEffectEvent`는 Effect 내에서 비반응형(non-reactive) 로직을 추출할 수 있게 해줍니다.

#### 문제 상황

```typescript
// ❌ 문제: userId가 변경될 때만 실행하고 싶지만, theme도 의존성 배열에 포함해야 함
function ChatRoom({ userId, theme }) {
  useEffect(() => {
    const connection = createConnection(userId);
    connection.connect();

    // theme를 사용하지만 theme 변경 시 재연결하고 싶지 않음
    connection.send(`테마: ${theme}`);

    return () => connection.disconnect();
  }, [userId, theme]); // theme 변경 시에도 재연결됨 (비효율적)
}
```

#### React 19 해결책: useEffectEvent

```typescript
import { useEffect, useEffectEvent } from 'react';

// ✅ 해결: useEffectEvent로 비반응형 로직 추출
function ChatRoom({ userId, theme }) {
  // React 19: Effect Event 생성
  const onConnected = useEffectEvent(() => {
    // theme를 사용하지만 의존성으로 취급되지 않음
    console.log(`연결됨. 테마: ${theme}`);
  });

  useEffect(() => {
    const connection = createConnection(userId);
    connection.connect();
    onConnected(); // 항상 최신 theme 사용

    return () => connection.disconnect();
  }, [userId]); // theme는 의존성 배열에 없음
}
```

**useEffectEvent의 장점**:
- Effect의 의존성을 줄여 불필요한 재실행 방지
- 항상 최신 props/state에 접근 가능
- 로깅, 분석 등 비반응형 로직에 적합

**React 18과의 비교**:

```typescript
// React 18 - 복잡한 우회 방법
function Component({ url, onSuccess }) {
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    fetch(url)
      .then(() => onSuccessRef.current()); // ref를 통해 접근
  }, [url]);
}

// React 19 - 간단명료
function Component({ url, onSuccess }) {
  const handleSuccess = useEffectEvent(() => {
    onSuccess(); // 직접 접근
  });

  useEffect(() => {
    fetch(url)
      .then(() => handleSuccess());
  }, [url]);
}
```

---

## 🛠️ 실습: Task 목록 관리

### Step 1: Task 상태 관리

**src/hooks/useTaskList.ts**:

```typescript
import { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';

export function useTaskList(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Task 추가
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  // Task 수정
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date() }
          : task
      )
    );
  };

  // Task 삭제
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // Task 상태 변경
  const changeTaskStatus = (taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
  };

  // Task 우선순위 변경
  const changeTaskPriority = (taskId: string, priority: TaskPriority) => {
    updateTask(taskId, { priority });
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    changeTaskPriority,
  };
}
```

### Step 2: Task 필터링

**src/hooks/useTaskFilter.ts**:

```typescript
import { useMemo, useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';

interface FilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  searchQuery?: string;
  projectId?: string;
}

export function useTaskFilter(tasks: Task[]) {
  const [filters, setFilters] = useState<FilterOptions>({});

  // useMemo로 필터링 결과 메모이제이션
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 상태 필터
      if (filters.status && task.status !== filters.status) {
        return false;
      }

      // 우선순위 필터
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }

      // 프로젝트 필터
      if (filters.projectId && task.projectId !== filters.projectId) {
        return false;
      }

      // 검색어 필터
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [tasks, filters]);

  // 필터 업데이트
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // 필터 초기화
  const clearFilters = () => {
    setFilters({});
  };

  return {
    filteredTasks,
    filters,
    updateFilters,
    clearFilters,
  };
}
```

### Step 3: LocalStorage 연동

**src/hooks/useLocalStorage.ts**:

```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 초기값 설정 (lazy initialization)
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // 값이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
```

**사용 예제**:

```typescript
function TaskManager() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);

  // tasks가 변경되면 자동으로 localStorage에 저장됨
  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  return <TaskList tasks={tasks} onAddTask={addTask} />;
}
```

### Step 4: React 19의 useEffectEvent 활용

**src/hooks/useTaskAnalytics.ts**:

```typescript
import { useEffect, useEffectEvent } from 'react';
import { Task } from '@/types/task';

interface AnalyticsEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted';
  taskId: string;
  timestamp: Date;
}

export function useTaskAnalytics(
  tasks: Task[],
  onEvent: (event: AnalyticsEvent) => void
) {
  const taskCount = tasks.length;

  // React 19: useEffectEvent로 비반응형 로직 추출
  const logAnalytics = useEffectEvent((event: AnalyticsEvent) => {
    // onEvent는 props이지만 의존성으로 취급되지 않음
    onEvent(event);

    // 추가 로깅 (항상 최신 onEvent 사용)
    console.log('Analytics:', event);
  });

  useEffect(() => {
    // taskCount 변경 시에만 실행
    // onEvent가 변경되어도 재실행되지 않음
    if (taskCount > 0) {
      logAnalytics({
        type: 'task_updated',
        taskId: 'summary',
        timestamp: new Date(),
      });
    }
  }, [taskCount]); // onEvent는 의존성이 아님
}
```

**React 18과의 비교**:

```typescript
// React 18 - ref를 사용한 우회 방법
export function useTaskAnalytics(tasks: Task[], onEvent: (event: AnalyticsEvent) => void) {
  const taskCount = tasks.length;
  const onEventRef = useRef(onEvent);

  // onEvent가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (taskCount > 0) {
      // ref를 통해 간접 접근
      onEventRef.current({
        type: 'task_updated',
        taskId: 'summary',
        timestamp: new Date(),
      });
    }
  }, [taskCount]);
}

// React 19 - useEffectEvent로 간단하게
export function useTaskAnalytics(tasks: Task[], onEvent: (event: AnalyticsEvent) => void) {
  const taskCount = tasks.length;

  const logAnalytics = useEffectEvent((event: AnalyticsEvent) => {
    onEvent(event); // 직접 접근
  });

  useEffect(() => {
    if (taskCount > 0) {
      logAnalytics({
        type: 'task_updated',
        taskId: 'summary',
        timestamp: new Date(),
      });
    }
  }, [taskCount]);
}
```

### Step 5: TaskList 컴포넌트

**src/components/task/TaskList.tsx**:

```typescript
import { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { useTaskList } from '@/hooks/useTaskList';
import { useTaskFilter } from '@/hooks/useTaskFilter';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function TaskList() {
  const [savedTasks, setSavedTasks] = useLocalStorage<Task[]>('taskflow-tasks', []);
  const { tasks, addTask, updateTask, deleteTask } = useTaskList(savedTasks);
  const { filteredTasks, filters, updateFilters, clearFilters } = useTaskFilter(tasks);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // tasks가 변경되면 localStorage에 저장
  useEffect(() => {
    setSavedTasks(tasks);
  }, [tasks, setSavedTasks]);

  // Ctrl+K로 검색 포커스
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddTask = () => {
    addTask({
      title: '새 작업',
      description: '작업 설명을 입력하세요',
      projectId: 'default',
      status: 'todo',
      priority: 'medium',
    });
  };

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 */}
      <div className="flex gap-4">
        <Input
          ref={searchInputRef}
          placeholder="작업 검색... (Ctrl+K)"
          value={filters.searchQuery || ''}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
        />

        <select
          value={filters.status || ''}
          onChange={(e) => updateFilters({ status: e.target.value as TaskStatus || undefined })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">모든 상태</option>
          <option value="todo">할 일</option>
          <option value="in-progress">진행중</option>
          <option value="review">검토중</option>
          <option value="done">완료</option>
        </select>

        <Button onClick={clearFilters} variant="ghost">
          필터 초기화
        </Button>

        <Button onClick={handleAddTask}>
          작업 추가
        </Button>
      </div>

      {/* 통계 */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span>전체: {tasks.length}개</span>
        <span>필터링됨: {filteredTasks.length}개</span>
      </div>

      {/* Task 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={(task) => console.log('Edit:', task)}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {tasks.length === 0 ? '작업이 없습니다' : '검색 결과가 없습니다'}
        </div>
      )}
    </div>
  );
}
```

---

## ✅ 완성 코드 구조

```
src/
├── hooks/
│   ├── useTaskList.ts        ✅ (Task CRUD)
│   ├── useTaskFilter.ts      ✅ (필터링 및 검색)
│   ├── useLocalStorage.ts    ✅ (localStorage 연동)
│   └── useTaskAnalytics.ts   ✅ (useEffectEvent 활용)
├── components/
│   └── task/
│       └── TaskList.tsx      ✅ (Task 목록 컴포넌트)
```

---

## 🔍 코드 분석

### useState의 Lazy Initialization

초기값 계산이 비싼 경우, 함수를 전달하여 최초 1회만 실행:

```typescript
// ❌ 매 렌더링마다 계산 (비효율)
const [tasks, setTasks] = useState(expensiveComputation());

// ✅ 최초 1회만 계산
const [tasks, setTasks] = useState(() => expensiveComputation());

// 예제
const [tasks, setTasks] = useState(() => {
  const saved = localStorage.getItem('tasks');
  return saved ? JSON.parse(saved) : [];
});
```

### useEffect의 Cleanup 함수

```typescript
useEffect(() => {
  // 1. Effect 실행
  const subscription = eventEmitter.subscribe('task-update', handler);

  // 2. Cleanup 함수 반환
  return () => {
    // 컴포넌트 언마운트 시 또는 Effect 재실행 전에 실행
    subscription.unsubscribe();
  };
}, [dependencies]);
```

**Cleanup이 필요한 경우**:
- 이벤트 리스너 제거
- 타이머 정리 (setTimeout, setInterval)
- WebSocket 연결 종료
- 구독 취소

### useMemo로 계산 최적화

```typescript
const filteredTasks = useMemo(() => {
  // 비싼 계산
  return tasks.filter(task => {
    // 복잡한 필터링 로직
  });
}, [tasks, filters]); // tasks나 filters가 변경될 때만 재계산
```

**useMemo vs 일반 변수**:

```typescript
// ❌ 매 렌더링마다 재계산
const filteredTasks = tasks.filter(...);

// ✅ 의존성이 변경될 때만 재계산
const filteredTasks = useMemo(() => tasks.filter(...), [tasks, filters]);
```

---

## ⚠️ 주의사항

### 1. useEffect 무한 루프 방지

```typescript
// ❌ 무한 루프 - 매 렌더링마다 객체 재생성
const config = { theme: 'dark' };
useEffect(() => {
  applyConfig(config);
}, [config]); // config는 매번 새 객체

// ✅ 해결 1 - useMemo로 메모이제이션
const config = useMemo(() => ({ theme: 'dark' }), []);
useEffect(() => {
  applyConfig(config);
}, [config]);

// ✅ 해결 2 - 의존성을 primitive 값으로
useEffect(() => {
  applyConfig({ theme: 'dark' });
}, []); // 의존성 없음
```

### 2. useState의 비동기 특성

```typescript
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(count + 1);
  console.log(count); // ❌ 여전히 0 (업데이트가 비동기)

  // ✅ 함수형 업데이트로 해결
  setCount(prev => {
    console.log(prev); // 이전 값
    return prev + 1;
  });
};
```

### 3. useRef는 리렌더링을 유발하지 않음

```typescript
const countRef = useRef(0);

const increment = () => {
  countRef.current += 1;
  console.log(countRef.current); // 증가함
  // 하지만 화면은 업데이트되지 않음!
};

// UI에 표시하려면 useState 사용 필요
```

### 4. useEffectEvent 사용 규칙

```typescript
// ✅ Effect 내부에서만 호출
useEffect(() => {
  const handleEvent = useEffectEvent(() => {});
  handleEvent();
}, []);

// ❌ 렌더링 중 호출 불가
const handleEvent = useEffectEvent(() => {});
handleEvent(); // 에러!
```

---

## 💪 실전 팁

### 1. Custom Hook 네이밍

Custom Hook은 항상 `use`로 시작:

```typescript
// ✅ 올바른 네이밍
useTaskList()
useLocalStorage()
useDebounce()

// ❌ 잘못된 네이밍
taskList()
localStorage()
debounce()
```

### 2. useEffect 의존성 린팅

ESLint의 `react-hooks/exhaustive-deps` 규칙 활성화:

```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 3. 디버깅용 useEffect

```typescript
useEffect(() => {
  console.log('Component mounted');

  return () => {
    console.log('Component unmounted');
  };
}, []);

useEffect(() => {
  console.log('Tasks changed:', tasks);
}, [tasks]);
```

### 4. 조건부 Effect 실행

```typescript
useEffect(() => {
  if (!isEnabled) return;

  // Effect 로직
  const cleanup = setupSomething();

  return cleanup;
}, [isEnabled]);
```

### 5. useCallback으로 함수 메모이제이션

```typescript
import { useCallback } from 'react';

function TaskList() {
  const [tasks, setTasks] = useState([]);

  // ✅ 함수를 메모이제이션하여 자식 컴포넌트 리렌더링 방지
  const handleDelete = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []); // 의존성 없음

  return <TaskCard onDelete={handleDelete} />;
}
```

---

## 🧪 테스트

**useTaskList.test.ts**:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTaskList } from './useTaskList';

describe('useTaskList', () => {
  it('should add a task', () => {
    const { result } = renderHook(() => useTaskList());

    act(() => {
      result.current.addTask({
        title: 'Test Task',
        description: 'Test Description',
        projectId: 'proj-1',
        status: 'todo',
        priority: 'high',
      });
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].title).toBe('Test Task');
  });

  it('should update a task', () => {
    const { result } = renderHook(() => useTaskList());

    act(() => {
      result.current.addTask({
        title: 'Original',
        description: 'Test',
        projectId: 'proj-1',
        status: 'todo',
        priority: 'high',
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.updateTask(taskId, { title: 'Updated' });
    });

    expect(result.current.tasks[0].title).toBe('Updated');
  });

  it('should delete a task', () => {
    const { result } = renderHook(() => useTaskList());

    act(() => {
      result.current.addTask({
        title: 'To Delete',
        description: 'Test',
        projectId: 'proj-1',
        status: 'todo',
        priority: 'high',
      });
    });

    const taskId = result.current.tasks[0].id;

    act(() => {
      result.current.deleteTask(taskId);
    });

    expect(result.current.tasks).toHaveLength(0);
  });
});
```

**useLocalStorage.test.ts**:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should use initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should save to localStorage on update', () => {
    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorage.getItem('test')).toBe(JSON.stringify('updated'));
  });

  it('should load from localStorage on mount', () => {
    localStorage.setItem('test', JSON.stringify('stored'));

    const { result } = renderHook(() => useLocalStorage('test', 'initial'));

    expect(result.current[0]).toBe('stored');
  });
});
```

---

## 📚 참고 자료

- [React Hooks 공식 문서](https://react.dev/reference/react)
- [React 19 - useEffectEvent](https://react.dev/reference/react/useEffectEvent)
- [useState 심화](https://react.dev/reference/react/useState)
- [useEffect 완벽 가이드](https://overreacted.io/a-complete-guide-to-useeffect/)

---

## 🎓 연습 문제

### 기본

1. **useDebounce Hook**을 만들어서 검색 입력에 적용하세요.
   ```typescript
   const debouncedSearch = useDebounce(searchQuery, 500);
   ```

2. **usePrevious Hook**을 만들어서 이전 값을 추적하세요.
   ```typescript
   const previousCount = usePrevious(count);
   ```

3. **useToggle Hook**을 만들어서 boolean 상태를 토글하세요.
   ```typescript
   const [isOpen, toggle] = useToggle(false);
   ```

### 도전

4. **useTaskSort Hook**을 만들어서 Task를 다양한 기준으로 정렬하세요.
   - 생성일, 수정일, 제목, 우선순위

5. **useUndoRedo Hook**을 만들어서 Task 수정을 되돌릴 수 있게 하세요.

6. **useOnlineStatus Hook**을 만들어서 네트워크 상태를 추적하세요.
   ```typescript
   const isOnline = useOnlineStatus();
   ```

### 고급

7. **useEffectEvent를 활용**하여 Task 변경 이력을 로깅하는 시스템을 만드세요.
   - 변경사항만 기록하고 불필요한 Effect 재실행은 방지

8. **useIntersectionObserver Hook**을 만들어서 무한 스크롤을 구현하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **폼과 사용자 입력**을 다룹니다:

- **NEW**: Form Actions (`<form action={}>`)
- **NEW**: useActionState로 폼 상태 관리
- **NEW**: useFormStatus로 제출 상태 확인
- Progressive Enhancement
- Task 생성/수정 폼 구현

**[Chapter 4: 폼과 사용자 입력 →](04-forms-and-input.md)**

---

**축하합니다!** 🎉 React Hooks의 핵심을 마스터했습니다!
