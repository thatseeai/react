# Chapter 6: 리스트와 조건부 렌더링

> **학습 목표**: 효율적인 리스트 렌더링과 다양한 조건부 렌더링 패턴을 마스터한다
> **소요 시간**: 90분
> **난이도**: 초급~중급

## 📖 개요

대부분의 React 앱은 데이터 리스트를 표시합니다. 이 챕터에서는 리스트를 효율적으로 렌더링하는 방법, key 속성의 중요성, 그리고 다양한 조건부 렌더링 패턴을 학습합니다. TaskFlow의 Task와 Project 리스트를 최적화하면서 실전 패턴을 익힙니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ Task 리스트 렌더링 및 정렬
- ✅ Key 속성으로 렌더링 최적화
- ✅ 조건부 렌더링 패턴
- ✅ React.memo로 불필요한 리렌더링 방지
- ✅ 가상 스크롤링 (성능 최적화)

---

## 💡 핵심 개념

### 1. 리스트 렌더링

배열을 JSX로 변환하는 기본 패턴:

```typescript
const tasks = [
  { id: '1', title: 'Task 1' },
  { id: '2', title: 'Task 2' },
  { id: '3', title: 'Task 3' },
];

function TaskList() {
  return (
    <ul>
      {tasks.map(task => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

### 2. Key 속성의 중요성

Key는 React가 어떤 항목이 변경, 추가, 제거되었는지 식별하는 데 사용됩니다.

```typescript
// ❌ 잘못된 key 사용
tasks.map((task, index) => (
  <TaskCard key={index} task={task} /> // 인덱스를 key로 사용
));

// ✅ 올바른 key 사용
tasks.map(task => (
  <TaskCard key={task.id} task={task} /> // 고유 ID를 key로 사용
));
```

**인덱스를 key로 사용하면 안 되는 이유**:

```typescript
// 초기 상태
[
  { id: 'a', title: 'Task A' }, // key=0
  { id: 'b', title: 'Task B' }, // key=1
  { id: 'c', title: 'Task C' }, // key=2
]

// 첫 번째 항목 삭제 후
[
  { id: 'b', title: 'Task B' }, // key=0 (이전에는 1)
  { id: 'c', title: 'Task C' }, // key=1 (이전에는 2)
]

// React는 key=2인 항목이 삭제되었다고 생각하고
// key=0, key=1의 내용을 업데이트함 (비효율적)
```

**올바른 key 사용**:

```typescript
// 초기 상태
[
  { id: 'a', title: 'Task A' }, // key='a'
  { id: 'b', title: 'Task B' }, // key='b'
  { id: 'c', title: 'Task C' }, // key='c'
]

// 첫 번째 항목 삭제 후
[
  { id: 'b', title: 'Task B' }, // key='b'
  { id: 'c', title: 'Task C' }, // key='c'
]

// React는 key='a'인 항목만 제거하면 됨을 알고 있음
```

### 3. 조건부 렌더링 패턴

#### 패턴 1: && 연산자

```typescript
function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      {tasks.length > 0 && (
        <p>{tasks.length}개의 작업이 있습니다</p>
      )}
    </div>
  );
}
```

**주의**: falsy 값이 렌더링될 수 있음

```typescript
// ❌ 0이 화면에 표시됨
{tasks.length && <p>작업이 있습니다</p>}

// ✅ boolean으로 변환
{tasks.length > 0 && <p>작업이 있습니다</p>}
{!!tasks.length && <p>작업이 있습니다</p>}
```

#### 패턴 2: 삼항 연산자

```typescript
function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      {tasks.length > 0 ? (
        <TaskCards tasks={tasks} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
```

#### 패턴 3: 조기 반환

```typescript
function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return <TaskCards tasks={tasks} />;
}
```

#### 패턴 4: 변수에 할당

```typescript
function TaskList({ tasks, isLoading }: Props) {
  let content;

  if (isLoading) {
    content = <LoadingSpinner />;
  } else if (tasks.length === 0) {
    content = <EmptyState />;
  } else {
    content = <TaskCards tasks={tasks} />;
  }

  return <div>{content}</div>;
}
```

### 4. React.memo로 최적화

컴포넌트가 같은 props로 리렌더링되는 것을 방지:

```typescript
import { memo } from 'react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

// memo로 감싸면 props가 변경되지 않으면 리렌더링하지 않음
export const TaskCard = memo(function TaskCard({
  task,
  onEdit,
  onDelete,
}: TaskCardProps) {
  console.log('Rendering TaskCard:', task.id);

  return (
    <div>
      <h3>{task.title}</h3>
      <button onClick={() => onEdit(task)}>수정</button>
      <button onClick={() => onDelete(task.id)}>삭제</button>
    </div>
  );
});
```

**주의**: 함수 props는 useCallback으로 메모이제이션 필요

```typescript
function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);

  // ❌ 매 렌더링마다 새 함수 생성 (memo 무효화)
  const handleEdit = (task: Task) => {
    console.log('Edit', task);
  };

  // ✅ useCallback으로 함수 메모이제이션
  const handleEdit = useCallback((task: Task) => {
    console.log('Edit', task);
  }, []);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onEdit={handleEdit} />
      ))}
    </div>
  );
}
```

---

## 🛠️ 실습: Task 리스트 최적화

### Step 1: 정렬 가능한 Task 리스트

**src/components/task/SortableTaskList.tsx**:

```typescript
import { useState, useMemo, useCallback } from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

type SortBy = 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

interface SortableTaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
const statusOrder = { todo: 1, 'in-progress': 2, review: 3, done: 4 };

export function SortableTaskList({
  tasks,
  onEdit,
  onDelete,
}: SortableTaskListProps) {
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 정렬된 tasks를 useMemo로 메모이제이션
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;

        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;

        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;

        case 'createdAt':
        case 'updatedAt':
          comparison = a[sortBy].getTime() - b[sortBy].getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [tasks, sortBy, sortOrder]);

  // 정렬 토글
  const toggleSort = useCallback((field: SortBy) => {
    setSortBy(prev => {
      if (prev === field) {
        // 같은 필드를 클릭하면 순서만 반대로
        setSortOrder(order => order === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      // 다른 필드를 클릭하면 desc로 초기화
      setSortOrder('desc');
      return field;
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* 정렬 컨트롤 */}
      <div className="flex gap-2">
        <span className="text-sm text-gray-600">정렬:</span>
        {(['title', 'priority', 'status', 'createdAt'] as SortBy[]).map(field => (
          <button
            key={field}
            onClick={() => toggleSort(field)}
            className={`px-3 py-1 text-sm rounded ${
              sortBy === field
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {field}
            {sortBy === field && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
          </button>
        ))}
      </div>

      {/* Task 리스트 */}
      {sortedTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 text-lg">작업이 없습니다</p>
      <p className="text-gray-400 text-sm mt-2">새 작업을 만들어보세요!</p>
    </div>
  );
}
```

### Step 2: 그룹화된 Task 리스트

**src/components/task/GroupedTaskList.tsx**:

```typescript
import { useMemo } from 'react';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';

interface GroupedTaskListProps {
  tasks: Task[];
  groupBy: 'status' | 'priority' | 'project';
}

export function GroupedTaskList({ tasks, groupBy }: GroupedTaskListProps) {
  // 그룹화된 tasks
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, Task[]>();

    tasks.forEach(task => {
      const key = task[groupBy];
      const group = groups.get(key) || [];
      group.push(task);
      groups.set(key, group);
    });

    return groups;
  }, [tasks, groupBy]);

  return (
    <div className="space-y-6">
      {Array.from(groupedTasks.entries()).map(([groupName, groupTasks]) => (
        <div key={groupName} className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GroupIcon groupBy={groupBy} groupName={groupName} />
            {groupName}
            <span className="text-sm text-gray-500">
              ({groupTasks.length})
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      ))}

      {groupedTasks.size === 0 && <EmptyState />}
    </div>
  );
}

function GroupIcon({ groupBy, groupName }: { groupBy: string; groupName: string }) {
  const icons: Record<string, Record<string, string>> = {
    status: {
      todo: '📋',
      'in-progress': '🚧',
      review: '👀',
      done: '✅',
    },
    priority: {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      urgent: '🔴',
    },
    project: {
      default: '📁',
    },
  };

  return <span>{icons[groupBy]?.[groupName] || '📁'}</span>;
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">작업이 없습니다</p>
    </div>
  );
}
```

### Step 3: 필터링과 검색

**src/components/task/FilterableTaskList.tsx**:

```typescript
import { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { Input } from '@/components/common/Input';
import { TaskCard } from './TaskCard';

interface FilterableTaskListProps {
  tasks: Task[];
}

export function FilterableTaskList({ tasks }: FilterableTaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  // 필터링 및 검색
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // 상태 필터
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }

      // 우선순위 필터
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="space-y-4">
      {/* 필터 컨트롤 */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="작업 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">모든 상태</option>
          <option value="todo">할 일</option>
          <option value="in-progress">진행중</option>
          <option value="review">검토중</option>
          <option value="done">완료</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">모든 우선순위</option>
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
          <option value="urgent">긴급</option>
        </select>
      </div>

      {/* 필터 요약 */}
      <div className="text-sm text-gray-600">
        전체 {tasks.length}개 중 {filteredTasks.length}개 표시
        {(statusFilter !== 'all' || priorityFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPriorityFilter('all');
            }}
            className="ml-2 text-blue-600 hover:underline"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* Task 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
```

### Step 4: 가상 스크롤링 (대량 데이터)

**src/components/task/VirtualTaskList.tsx**:

```typescript
import { useRef, useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

const ITEM_HEIGHT = 200; // 각 TaskCard의 높이
const BUFFER = 3; // 뷰포트 위아래로 추가로 렌더링할 항목 수

interface VirtualTaskListProps {
  tasks: Task[];
  containerHeight: number;
}

export function VirtualTaskList({ tasks, containerHeight }: VirtualTaskListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 보이는 범위 계산
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT);
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIndex = Math.min(tasks.length, startIndex + visibleCount + BUFFER * 2);
  const visibleTasks = tasks.slice(startIndex, endIndex);

  // 전체 높이
  const totalHeight = tasks.length * ITEM_HEIGHT;

  // 스크롤 핸들러
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: 'auto' }}
      className="relative"
    >
      {/* 전체 높이를 유지하는 spacer */}
      <div style={{ height: totalHeight }} />

      {/* 보이는 항목들 */}
      <div
        style={{
          position: 'absolute',
          top: startIndex * ITEM_HEIGHT,
          left: 0,
          right: 0,
        }}
      >
        {visibleTasks.map((task, index) => (
          <div
            key={task.id}
            style={{ height: ITEM_HEIGHT }}
            className="px-4"
          >
            <TaskCard task={task} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🛠️ 실습: 조건부 렌더링 패턴

### Step 1: 로딩/에러/데이터 상태 관리

**src/components/common/DataDisplay.tsx**:

```typescript
import { ReactNode } from 'react';

interface DataDisplayProps<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  emptyMessage?: string;
  children: (data: T[]) => ReactNode;
}

export function DataDisplay<T>({
  data,
  isLoading,
  error,
  emptyMessage = '데이터가 없습니다',
  children,
}: DataDisplayProps<T>) {
  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg">
        <p className="font-semibold">오류가 발생했습니다</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  // 데이터 없음
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // 데이터 표시
  return <>{children(data)}</>;
}
```

**사용**:

```typescript
function TaskListPage() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DataDisplay
      data={tasks}
      isLoading={isLoading}
      error={error}
      emptyMessage="작업이 없습니다"
    >
      {(tasks) => (
        <div className="grid grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </DataDisplay>
  );
}
```

### Step 2: 권한 기반 렌더링

**src/components/common/CanAccess.tsx**:

```typescript
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Permission = 'read' | 'write' | 'delete' | 'admin';

interface CanAccessProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAccess({ permission, children, fallback = null }: CanAccessProps) {
  const { user } = useAuth();

  const hasPermission = (perm: Permission): boolean => {
    if (!user) return false;

    // 실제로는 서버에서 권한 정보를 받아와야 함
    const userPermissions = ['read', 'write']; // 예시

    if (perm === 'admin') {
      return user.email.endsWith('@admin.com');
    }

    return userPermissions.includes(perm);
  };

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
```

**사용**:

```typescript
<CanAccess permission="write">
  <Button onClick={handleEdit}>수정</Button>
</CanAccess>

<CanAccess
  permission="delete"
  fallback={<p className="text-gray-400">삭제 권한이 없습니다</p>}
>
  <Button variant="danger" onClick={handleDelete}>
    삭제
  </Button>
</CanAccess>
```

---

## ✅ 완성 코드 구조

```
src/
├── components/
│   ├── task/
│   │   ├── SortableTaskList.tsx      ✅
│   │   ├── GroupedTaskList.tsx       ✅
│   │   ├── FilterableTaskList.tsx    ✅
│   │   └── VirtualTaskList.tsx       ✅
│   └── common/
│       ├── DataDisplay.tsx           ✅
│       └── CanAccess.tsx             ✅
```

---

## 🔍 코드 분석

### Key 속성 성능 비교

```typescript
// ❌ 인덱스 사용 - 비효율적
{tasks.map((task, i) => <TaskCard key={i} task={task} />)}

// ✅ 고유 ID 사용 - 효율적
{tasks.map(task => <TaskCard key={task.id} task={task} />)}

// 📊 성능 차이:
// - 인덱스: 항목 삭제 시 모든 하위 항목 리렌더링
// - 고유 ID: 변경된 항목만 리렌더링
```

### React.memo 작동 원리

```typescript
const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
  // true를 반환하면 리렌더링 스킵
  // false를 반환하면 리렌더링
  return prevProps.id === nextProps.id;
});
```

---

## ⚠️ 주의사항

### 1. Key로 랜덤 값 사용 금지

```typescript
// ❌ 매 렌더링마다 새 key (모든 항목 리렌더링)
{tasks.map(task => <TaskCard key={Math.random()} task={task} />)}

// ✅ 안정적인 고유 ID
{tasks.map(task => <TaskCard key={task.id} task={task} />)}
```

### 2. Fragment에도 key 필요

```typescript
{tasks.map(task => (
  <Fragment key={task.id}>
    <h3>{task.title}</h3>
    <p>{task.description}</p>
  </Fragment>
))}
```

### 3. 조건부 렌더링 시 falsy 값 주의

```typescript
// ❌ 0이 화면에 렌더링됨
{count && <div>Count: {count}</div>}

// ✅ boolean 변환
{count > 0 && <div>Count: {count}</div>}
{Boolean(count) && <div>Count: {count}</div>}
```

---

## 💪 실전 팁

### 1. 복잡한 필터링은 Web Worker로

```typescript
const worker = new Worker('filter-worker.js');

worker.postMessage({ tasks, filters });
worker.onmessage = (e) => {
  setFilteredTasks(e.data);
};
```

### 2. 무한 스크롤

```typescript
function useInfiniteScroll(callback: () => void) {
  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        callback();
      }
    });

    if (node) observer.current.observe(node);
  }, [callback]);

  return lastElementRef;
}
```

### 3. 리스트 애니메이션

```typescript
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {tasks.map(task => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <TaskCard task={task} />
    </motion.div>
  ))}
</AnimatePresence>
```

---

## 🧪 테스트

```typescript
import { render, screen } from '@testing-library/react';
import { SortableTaskList } from './SortableTaskList';

const mockTasks: Task[] = [
  { id: '1', title: 'Task A', priority: 'high', /* ... */ },
  { id: '2', title: 'Task B', priority: 'low', /* ... */ },
];

describe('SortableTaskList', () => {
  it('renders all tasks', () => {
    render(<SortableTaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();
  });

  it('sorts tasks by priority', async () => {
    render(<SortableTaskList tasks={mockTasks} onEdit={vi.fn()} onDelete={vi.fn()} />);

    await userEvent.click(screen.getByText('priority'));

    const cards = screen.getAllByRole('article');
    expect(cards[0]).toHaveTextContent('Task A'); // high priority first
  });
});
```

---

## 📚 참고 자료

- [Lists and Keys](https://react.dev/learn/rendering-lists)
- [Conditional Rendering](https://react.dev/learn/conditional-rendering)
- [React.memo](https://react.dev/reference/react/memo)

---

## 🎓 연습 문제

### 기본

1. **페이지네이션**을 구현하세요 (10개씩 표시).

2. **드래그 앤 드롭**으로 Task 순서를 변경하세요.

3. **다중 선택** 기능을 추가하세요.

### 도전

4. **가상 스크롤링**을 직접 구현하세요.

5. **Masonry 레이아웃**을 구현하세요.

6. **검색 하이라이팅** 기능을 추가하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **라우팅**을 다룹니다:

- React Router v7
- 중첩 라우팅
- 동적 라우팅
- Loader와 Action
- Protected Routes

**[Chapter 7: 라우팅 →](07-routing.md)**

---

**축하합니다!** 🎉 효율적인 리스트 렌더링을 마스터했습니다!
