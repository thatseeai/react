# Chapter 14: React Compiler

## 개요

React Compiler는 React 19에서 도입된 혁명적인 최적화 도구입니다. 개발자가 수동으로 `useMemo`, `useCallback`, `React.memo`를 사용하지 않아도, 컴파일러가 자동으로 최적화를 수행합니다.

**이 장에서 다룰 내용:**
- React Compiler의 작동 원리
- babel-plugin-react-compiler 설정
- 자동 메모이제이션과 useMemoCache
- Rules of React 검증
- ESLint 플러그인 통합
- 컴파일러 디버깅 기법

**TaskFlow에서의 활용:**
복잡한 컴포넌트 트리에서 수동 최적화 없이도 최고의 성능을 달성합니다.

## 핵심 개념

### 1. React Compiler란?

React Compiler는 빌드 타임에 컴포넌트를 분석하고 최적화하는 Babel 플러그인입니다.

**주요 기능:**
- **자동 메모이제이션**: 컴포넌트와 값을 자동으로 메모이제이션
- **Rules of React 검증**: React 규칙 위반을 컴파일 타임에 감지
- **세밀한 최적화**: 필요한 부분만 선택적으로 리렌더링
- **Zero Runtime Cost**: 런타임 오버헤드 없음

### 2. useMemoCache - 내부 구현

컴파일러가 생성하는 내부 Hook:

```typescript
// React 18 - 수동 최적화
function TaskItem({ task, onUpdate }) {
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('ko-KR').format(task.dueDate);
  }, [task.dueDate]);

  const handleClick = useCallback(() => {
    onUpdate(task.id);
  }, [task.id, onUpdate]);

  return (
    <div onClick={handleClick}>
      {task.title} - {formattedDate}
    </div>
  );
}

export default React.memo(TaskItem);
```

```typescript
// React 19 with Compiler - 자동 최적화
function TaskItem({ task, onUpdate }) {
  // 컴파일러가 자동으로 useMemoCache를 삽입
  const $ = useMemoCache(4);

  let t0;
  if ($[0] !== task.dueDate) {
    t0 = new Intl.DateTimeFormat('ko-KR').format(task.dueDate);
    $[0] = task.dueDate;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const formattedDate = t0;

  let t1;
  if ($[2] !== task.id || $[3] !== onUpdate) {
    t1 = () => onUpdate(task.id);
    $[2] = task.id;
    $[3] = onUpdate;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const handleClick = t1;

  // JSX도 메모이제이션됨
  return (
    <div onClick={handleClick}>
      {task.title} - {formattedDate}
    </div>
  );
}

// 컴포넌트 자체도 자동으로 메모이제이션됨
```

### 3. Rules of React

컴파일러가 최적화하기 위해 반드시 지켜야 할 규칙:

**1) 컴포넌트와 Hook은 순수해야 함**
```typescript
// ❌ 잘못된 예 - 외부 변수 수정
let count = 0;
function Counter() {
  count++; // 부수 효과!
  return <div>{count}</div>;
}

// ✅ 올바른 예
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

**2) Hook은 최상위에서만 호출**
```typescript
// ❌ 잘못된 예
function Task({ id }) {
  if (id) {
    const data = useTask(id); // 조건부 Hook!
  }
}

// ✅ 올바른 예
function Task({ id }) {
  const data = id ? useTask(id) : null;
}
```

**3) Props와 State는 불변**
```typescript
// ❌ 잘못된 예
function TaskList({ tasks }) {
  tasks.push(newTask); // props 직접 수정!
}

// ✅ 올바른 예
function TaskList({ tasks }) {
  const newTasks = [...tasks, newTask];
}
```

### 4. 컴파일러 최적화 범위

```typescript
// 최적화되는 항목들
function OptimizedComponent({ user, settings }) {
  // 1. 계산된 값
  const displayName = user.firstName + ' ' + user.lastName;

  // 2. 이벤트 핸들러
  const handleSave = () => {
    saveUser(user);
  };

  // 3. 조건부 렌더링
  const content = user.isPremium ? (
    <PremiumFeatures />
  ) : (
    <StandardFeatures />
  );

  // 4. 배열 변환
  const items = user.tasks.map(task => ({
    ...task,
    isOverdue: task.dueDate < Date.now()
  }));

  // 5. JSX 표현식
  return (
    <div>
      <h1>{displayName}</h1>
      {content}
      <TaskList items={items} onSave={handleSave} />
    </div>
  );
}
// 모든 부분이 자동으로 메모이제이션됨!
```

## 실습: React Compiler 설정하기

### 1. 프로젝트 설정

```bash
# React Compiler 패키지 설치
npm install --save-dev babel-plugin-react-compiler

# ESLint 플러그인 (선택사항)
npm install --save-dev eslint-plugin-react-compiler
```

### 2. Vite 설정

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            // 컴파일러 옵션
            target: '19', // React 버전

            // 개발 모드 설정
            environment: {
              enableChangeDetectionForDebugging: process.env.NODE_ENV === 'development'
            },

            // 최적화 수준
            compilationMode: 'annotation', // 'all' | 'annotation' | 'infer'

            // 소스맵 생성
            sources: (filename) => filename.includes('src'),

            // 로깅
            logger: {
              logEvent: (event) => {
                if (event.kind === 'CompileError') {
                  console.error('Compiler error:', event);
                }
              }
            }
          }]
        ]
      }
    })
  ]
});
```

### 3. 컴파일 모드 선택

**a) 전체 최적화 모드 (compilationMode: 'all')**
```typescript
// 모든 컴포넌트가 자동으로 최적화됨
function TaskCard({ task }) {
  return <div>{task.title}</div>;
}
// 추가 설정 불필요
```

**b) 주석 기반 모드 (compilationMode: 'annotation')**
```typescript
'use memo'; // 이 파일의 모든 컴포넌트 최적화

function TaskCard({ task }) {
  return <div>{task.title}</div>;
}

function TaskList({ tasks }) {
  return tasks.map(task => <TaskCard key={task.id} task={task} />);
}
```

**c) 컴포넌트별 주석**
```typescript
function TaskCard({ task }) {
  'use memo'; // 이 컴포넌트만 최적화
  return <div>{task.title}</div>;
}
```

### 4. ESLint 통합

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    // ... 기존 설정
  ],
  plugins: ['react-compiler'],
  rules: {
    // React Compiler 규칙 활성화
    'react-compiler/react-compiler': 'error'
  }
};
```

이 규칙은 다음을 검증합니다:
- Hook 호출 순서
- 순수 함수 규칙
- Props/State 불변성
- 의존성 배열 (필요시)

## 완성 코드: 컴파일러 최적화 예제

### 1. TaskFlow 프로젝트 구조

```
src/
├── components/
│   ├── TaskBoard.tsx         # 'use memo' 적용
│   ├── TaskColumn.tsx        # 자동 최적화
│   ├── TaskCard.tsx          # 자동 최적화
│   └── TaskDetails.tsx       # 자동 최적화
├── hooks/
│   ├── useTaskData.ts        # Hook도 최적화
│   └── useTaskFilters.ts
└── vite.config.ts
```

### 2. 복잡한 대시보드 컴포넌트

```typescript
// src/components/TaskBoard.tsx
'use memo';

import { useState } from 'react';
import type { Task, TaskStatus } from '../types';

interface TaskBoardProps {
  projectId: string;
  initialTasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export default function TaskBoard({
  projectId,
  initialTasks,
  onTaskUpdate
}: TaskBoardProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 컴파일러가 자동으로 메모이제이션
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // 상태별 그룹화 - 자동 메모이제이션
  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    inProgress: filteredTasks.filter(t => t.status === 'in-progress'),
    done: filteredTasks.filter(t => t.status === 'done')
  };

  // 통계 계산 - 자동 메모이제이션
  const stats = {
    total: filteredTasks.length,
    completed: tasksByStatus.done.length,
    progress: filteredTasks.length > 0
      ? Math.round((tasksByStatus.done.length / filteredTasks.length) * 100)
      : 0
  };

  // 이벤트 핸들러들 - 자동 메모이제이션
  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ));

    try {
      await onTaskUpdate(taskId, { status: newStatus });
    } catch (error) {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: task.status } : t
      ));
    }
  };

  const handleTaskEdit = async (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ));

    await onTaskUpdate(taskId, updates);
  };

  const handleFilterChange = (newFilter: TaskStatus | 'all') => {
    setFilter(newFilter);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // JSX도 자동으로 최적화됨
  return (
    <div className="task-board">
      {/* 헤더와 필터 */}
      <BoardHeader
        stats={stats}
        filter={filter}
        searchQuery={searchQuery}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      {/* 칸반 보드 */}
      <div className="board-columns">
        <TaskColumn
          title="할 일"
          status="todo"
          tasks={tasksByStatus.todo}
          onTaskMove={handleTaskMove}
          onTaskEdit={handleTaskEdit}
        />

        <TaskColumn
          title="진행 중"
          status="in-progress"
          tasks={tasksByStatus.inProgress}
          onTaskMove={handleTaskMove}
          onTaskEdit={handleTaskEdit}
        />

        <TaskColumn
          title="완료"
          status="done"
          tasks={tasksByStatus.done}
          onTaskMove={handleTaskMove}
          onTaskEdit={handleTaskEdit}
        />
      </div>
    </div>
  );
}

// 컴파일러 출력 예시 (실제 코드):
// function TaskBoard(props) {
//   const $ = useMemoCache(25);
//
//   // ... state 선언
//
//   let t0;
//   if ($[0] !== tasks || $[1] !== filter || $[2] !== searchQuery) {
//     t0 = tasks.filter(task => {
//       const matchesFilter = filter === 'all' || task.status === filter;
//       const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
//       return matchesFilter && matchesSearch;
//     });
//     $[0] = tasks;
//     $[1] = filter;
//     $[2] = searchQuery;
//     $[3] = t0;
//   } else {
//     t0 = $[3];
//   }
//   const filteredTasks = t0;
//
//   // ... 나머지도 유사하게 최적화
// }
```

### 3. TaskColumn 컴포넌트

```typescript
// src/components/TaskColumn.tsx
import { useMemo } from 'react';
import { useDrop } from 'react-dnd';
import TaskCard from './TaskCard';
import type { Task, TaskStatus } from '../types';

interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void;
  onTaskEdit: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskColumn({
  title,
  status,
  tasks,
  onTaskMove,
  onTaskEdit
}: TaskColumnProps) {
  // Drag & Drop 설정
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string }) => {
      onTaskMove(item.id, status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }), [status, onTaskMove]); // 컴파일러가 있어도 명시적 deps 필요 (외부 라이브러리)

  // 우선순위별 정렬 - 자동 메모이제이션
  const sortedTasks = tasks.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // 통계 - 자동 메모이제이션
  const columnStats = {
    total: tasks.length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
    overdue: tasks.filter(t => t.dueDate && t.dueDate < Date.now()).length
  };

  return (
    <div
      ref={drop}
      className={`task-column ${isOver ? 'drag-over' : ''}`}
      data-status={status}
    >
      <div className="column-header">
        <h2>{title}</h2>
        <span className="task-count">{columnStats.total}</span>
        {columnStats.overdue > 0 && (
          <span className="overdue-badge">{columnStats.overdue} 지연</span>
        )}
      </div>

      <div className="column-content">
        {sortedTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onTaskEdit}
          />
        ))}

        {tasks.length === 0 && (
          <div className="empty-state">
            태스크가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. TaskCard 컴포넌트

```typescript
// src/components/TaskCard.tsx
import { useDrag } from 'react-dnd';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  // Drag 설정
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [task.id]);

  // 날짜 포맷 - 자동 메모이제이션
  const formattedDate = task.dueDate
    ? formatDistanceToNow(task.dueDate, { addSuffix: true, locale: ko })
    : null;

  // 지연 여부 - 자동 메모이제이션
  const isOverdue = task.dueDate && task.dueDate < Date.now();

  // 우선순위 색상 - 자동 메모이제이션
  const priorityColor = {
    high: 'red',
    medium: 'yellow',
    low: 'gray'
  }[task.priority];

  // 이벤트 핸들러 - 자동 메모이제이션
  const handleClick = () => {
    // 상세 모달 열기
  };

  const handlePriorityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priorities = ['low', 'medium', 'high'] as const;
    const currentIndex = priorities.indexOf(task.priority);
    const nextPriority = priorities[(currentIndex + 1) % 3];
    onEdit(task.id, { priority: nextPriority });
  };

  return (
    <div
      ref={drag}
      className={`task-card ${isDragging ? 'dragging' : ''} ${isOverdue ? 'overdue' : ''}`}
      onClick={handleClick}
    >
      <div className="task-header">
        <h3>{task.title}</h3>
        <button
          className={`priority-badge priority-${priorityColor}`}
          onClick={handlePriorityToggle}
        >
          {task.priority}
        </button>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-footer">
        {formattedDate && (
          <span className={`due-date ${isOverdue ? 'text-red-500' : ''}`}>
            {formattedDate}
          </span>
        )}

        {task.assignee && (
          <div className="assignee">
            <img src={task.assignee.avatar} alt={task.assignee.name} />
            <span>{task.assignee.name}</span>
          </div>
        )}

        {task.tags.length > 0 && (
          <div className="tags">
            {task.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5. Custom Hook 최적화

```typescript
// src/hooks/useTaskFilters.ts
'use memo';

import { useState, useMemo } from 'react';
import type { Task, TaskStatus } from '../types';

interface FilterOptions {
  status: TaskStatus | 'all';
  priority: Task['priority'] | 'all';
  assignee: string | 'all';
  tags: string[];
  searchQuery: string;
}

export function useTaskFilters(tasks: Task[]) {
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    assignee: 'all',
    tags: [],
    searchQuery: ''
  });

  // 필터링 로직 - 컴파일러가 자동 최적화
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    // Priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }

    // Assignee filter
    if (filters.assignee !== 'all' && task.assignee?.id !== filters.assignee) {
      return false;
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag => task.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }

    return true;
  });

  // 필터 업데이트 함수들 - 자동 메모이제이션
  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      tags: [],
      searchQuery: ''
    });
  };

  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.assignee !== 'all' ||
    filters.tags.length > 0 ||
    filters.searchQuery !== '';

  return {
    filters,
    filteredTasks,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    count: filteredTasks.length
  };
}
```

## 코드 분석

### 1. 컴파일러 변환 과정

**원본 코드:**
```typescript
function TaskCard({ task }) {
  const isUrgent = task.priority === 'high' && task.dueDate < Date.now();

  return (
    <div className={isUrgent ? 'urgent' : ''}>
      {task.title}
    </div>
  );
}
```

**컴파일러 출력 (간소화):**
```typescript
function TaskCard(t0) {
  const $ = useMemoCache(5);
  const { task } = t0;

  let t1;
  if ($[0] !== task.priority || $[1] !== task.dueDate) {
    t1 = task.priority === 'high' && task.dueDate < Date.now();
    $[0] = task.priority;
    $[1] = task.dueDate;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const isUrgent = t1;

  let t2;
  if ($[3] !== isUrgent || $[4] !== task.title) {
    t2 = (
      <div className={isUrgent ? 'urgent' : ''}>
        {task.title}
      </div>
    );
    $[3] = isUrgent;
    $[4] = task.title;
    $[5] = t2;
  } else {
    t2 = $[5];
  }

  return t2;
}
```

**분석:**
1. **useMemoCache 삽입**: 캐시 배열 생성
2. **의존성 추적**: 각 계산의 입력값 추적
3. **선택적 재계산**: 의존성이 변경된 경우에만 재계산
4. **JSX 메모이제이션**: JSX 결과도 캐싱

### 2. 성능 비교

**수동 최적화 (React 18):**
- 개발자가 `useMemo`, `useCallback` 배치
- 의존성 배열 관리 필요
- 과도한 메모이제이션 가능성
- 유지보수 부담

**자동 최적화 (React 19 Compiler):**
- 컴파일러가 필요한 부분만 최적화
- 의존성 자동 추적
- 최적의 메모이제이션 전략
- 코드가 더 간결

### 3. 최적화 결과 검증

```typescript
// src/utils/compilerDebug.ts
export function measureCompilerImpact(
  componentName: string,
  render: () => void
) {
  const startTime = performance.now();
  render();
  const endTime = performance.now();

  console.log(`${componentName} render time: ${endTime - startTime}ms`);

  // React DevTools Profiler API 사용
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
    const profilerData = __REACT_DEVTOOLS_GLOBAL_HOOK__.getFiberRoots(1);
    // ... 프로파일링 데이터 분석
  }
}

// 사용 예
function TaskBoardWithProfiling(props: TaskBoardProps) {
  measureCompilerImpact('TaskBoard', () => {
    return <TaskBoard {...props} />;
  });
}
```

## 주의사항

### 1. 컴파일러가 최적화하지 못하는 경우

```typescript
// ❌ 외부 변수 수정 - 최적화 불가
let externalCount = 0;
function Counter() {
  externalCount++; // 부수 효과!
  return <div>{externalCount}</div>;
}

// ❌ 비순수 계산 - 최적화 불가
function RandomComponent() {
  const value = Math.random(); // 매번 다른 결과!
  return <div>{value}</div>;
}

// ❌ DOM 직접 조작 - 최적화 불가
function DirectDOM() {
  document.title = 'New Title'; // 직접 DOM 수정!
  return <div>Content</div>;
}

// ✅ 올바른 방법 - useEffect 사용
function ProperDOM() {
  useEffect(() => {
    document.title = 'New Title';
  }, []);
  return <div>Content</div>;
}
```

### 2. Ref와 컴파일러

```typescript
// ⚠️ Ref 값 읽기 - 최적화되지 않음
function Component() {
  const ref = useRef(0);

  // ref.current는 reactive하지 않음
  const doubled = ref.current * 2; // 리렌더링 트리거 안 됨

  return <div>{doubled}</div>;
}

// ✅ State 사용
function Component() {
  const [count, setCount] = useState(0);
  const doubled = count * 2; // 컴파일러가 최적화

  return <div>{doubled}</div>;
}
```

### 3. 외부 라이브러리 Hook

```typescript
// 외부 라이브러리 Hook은 명시적 의존성 필요
import { useQuery } from '@tanstack/react-query';

function TaskList() {
  const { data } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks
  }); // ✅ 라이브러리 Hook은 그대로 사용

  // 컴파일러는 이후 코드만 최적화
  const sortedTasks = data?.sort((a, b) =>
    a.priority - b.priority
  );

  return <div>{/* ... */}</div>;
}
```

### 4. 동적 Hook 호출은 여전히 불가

```typescript
// ❌ 여전히 불가능 - Hook 규칙 위반
function Component({ shouldFetch }) {
  if (shouldFetch) {
    const data = useFetch(); // 조건부 Hook!
  }
}

// ✅ 올바른 방법
function Component({ shouldFetch }) {
  const data = shouldFetch ? useFetch() : null; // 조건부 반환
}
```

## 실전 팁

### 1. 점진적 도입 전략

```typescript
// 1단계: 특정 디렉토리만 활성화
// vite.config.ts
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            compilationMode: 'annotation', // 주석 기반
            sources: (filename) => {
              // src/components/optimized 디렉토리만
              return filename.includes('src/components/optimized');
            }
          }]
        ]
      }
    })
  ]
});

// 2단계: 파일별 활성화
// src/components/optimized/TaskBoard.tsx
'use memo'; // 이 파일만 최적화

export function TaskBoard() {
  // ...
}
```

### 2. 컴파일러 출력 확인

```bash
# 컴파일 결과 확인
BABEL_SHOW_CONFIG_FOR=src/components/TaskBoard.tsx npm run build

# 컴파일러 로그 활성화
DEBUG=babel-plugin-react-compiler npm run dev
```

### 3. 성능 측정

```typescript
// src/utils/performance.ts
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function TrackedComponent(props: P) {
    const renderCount = useRef(0);
    const lastRenderTime = useRef(0);

    useEffect(() => {
      renderCount.current++;
      const now = performance.now();
      const renderTime = now - lastRenderTime.current;
      lastRenderTime.current = now;

      console.log(`${componentName} render #${renderCount.current}: ${renderTime}ms`);
    });

    return <Component {...props} />;
  };
}

// 사용
const TrackedTaskBoard = withPerformanceTracking(TaskBoard, 'TaskBoard');
```

### 4. 컴파일러 디버깅

```typescript
// 컴파일러가 생성한 코드 보기
function DebugCompiler() {
  'use memo';

  const [count, setCount] = useState(0);

  // 이 코드가 어떻게 변환되는지 확인
  const doubled = count * 2;

  // React DevTools에서 확인:
  // - useMemoCache 호출 횟수
  // - 캐시 히트/미스 비율
  // - 리렌더링 원인

  return <div>{doubled}</div>;
}
```

### 5. 마이그레이션 체크리스트

```typescript
// migration-checklist.ts
export const compilerMigrationChecklist = {
  preparation: [
    '✓ React 19로 업그레이드',
    '✓ ESLint 플러그인 설치',
    '✓ 모든 테스트 통과 확인'
  ],

  codeChanges: [
    '✓ useMemo/useCallback 제거 가능 여부 확인',
    '✓ React.memo 제거 가능 여부 확인',
    '✓ Rules of React 준수 확인',
    '✓ 외부 라이브러리 Hook 호환성 확인'
  ],

  testing: [
    '✓ 각 컴포넌트 단위 테스트',
    '✓ E2E 테스트 실행',
    '✓ 성능 프로파일링',
    '✓ 번들 크기 확인'
  ],

  deployment: [
    '✓ 스테이징 환경 배포',
    '✓ A/B 테스트 (컴파일러 있음/없음)',
    '✓ 모니터링 설정',
    '✓ 프로덕션 배포'
  ]
};
```

### 6. 컴파일러와 다른 최적화 기법 조합

```typescript
// 컴파일러 + Code Splitting
const LazyTaskBoard = lazy(() => import('./components/TaskBoard'));

function App() {
  'use memo';

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyTaskBoard />
    </Suspense>
  );
}

// 컴파일러 + Virtualization
function LargeTaskList({ tasks }: { tasks: Task[] }) {
  'use memo';

  // 컴파일러가 필터링을 최적화
  const filteredTasks = tasks.filter(t => t.status === 'active');

  // Virtualization은 여전히 유용
  return (
    <VirtualList
      items={filteredTasks}
      height={600}
      itemHeight={80}
      renderItem={(task) => <TaskCard task={task} />}
    />
  );
}
```

## 테스트: 컴파일러 최적화 검증

### 1. 리렌더링 횟수 테스트

```typescript
// src/__tests__/compiler-optimization.test.tsx
import { render, screen } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import TaskCard from '../components/TaskCard';

describe('Compiler Optimization', () => {
  it('should not re-render when unrelated props change', () => {
    let renderCount = 0;

    function TestComponent({ task, unrelatedProp }: any) {
      'use memo';
      renderCount++;
      return <div>{task.title}</div>;
    }

    const task = { id: '1', title: 'Test Task' };
    const { rerender } = render(
      <TestComponent task={task} unrelatedProp="a" />
    );

    expect(renderCount).toBe(1);

    // unrelatedProp 변경 - 리렌더링 안 됨
    rerender(<TestComponent task={task} unrelatedProp="b" />);
    expect(renderCount).toBe(1); // 여전히 1!

    // task 변경 - 리렌더링 됨
    rerender(<TestComponent task={{ ...task, title: 'New' }} unrelatedProp="b" />);
    expect(renderCount).toBe(2);
  });

  it('should memoize expensive calculations', () => {
    const expensiveCalc = vi.fn((n: number) => n * 2);

    function TestComponent({ value }: { value: number }) {
      'use memo';
      const result = expensiveCalc(value);
      return <div>{result}</div>;
    }

    const { rerender } = render(<TestComponent value={5} />);
    expect(expensiveCalc).toHaveBeenCalledTimes(1);

    // 같은 값으로 리렌더링 - 재계산 안 됨
    rerender(<TestComponent value={5} />);
    expect(expensiveCalc).toHaveBeenCalledTimes(1);

    // 다른 값으로 리렌더링 - 재계산 됨
    rerender(<TestComponent value={10} />);
    expect(expensiveCalc).toHaveBeenCalledTimes(2);
  });
});
```

### 2. 성능 벤치마크

```typescript
// src/__tests__/compiler-performance.test.tsx
import { performance } from 'perf_hooks';

describe('Compiler Performance', () => {
  it('should be faster than manual memoization', () => {
    const iterations = 1000;
    const tasks = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      title: `Task ${i}`,
      priority: 'medium' as const
    }));

    // 수동 메모이제이션
    const manualStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const filtered = useMemo(
        () => tasks.filter(t => t.priority === 'high'),
        [tasks]
      );
    }
    const manualTime = performance.now() - manualStart;

    // 컴파일러 자동 최적화
    function AutoOptimized() {
      'use memo';
      const filtered = tasks.filter(t => t.priority === 'high');
      return filtered;
    }

    const autoStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      AutoOptimized();
    }
    const autoTime = performance.now() - autoStart;

    console.log(`Manual: ${manualTime}ms, Auto: ${autoTime}ms`);
    expect(autoTime).toBeLessThanOrEqual(manualTime * 1.1); // 10% 오차 허용
  });
});
```

### 3. 통합 테스트

```typescript
// src/__tests__/task-board-integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskBoard from '../components/TaskBoard';

describe('TaskBoard with Compiler', () => {
  it('should handle complex interactions efficiently', async () => {
    const user = userEvent.setup();
    const tasks = generateMockTasks(100);
    const onTaskUpdate = vi.fn();

    const { rerender } = render(
      <TaskBoard
        projectId="1"
        initialTasks={tasks}
        onTaskUpdate={onTaskUpdate}
      />
    );

    // 필터 변경
    const filterButton = screen.getByRole('button', { name: /필터/ });
    await user.click(filterButton);

    // 검색
    const searchInput = screen.getByPlaceholderText(/검색/);
    await user.type(searchInput, 'test');

    // 드래그 앤 드롭
    const taskCard = screen.getAllByTestId('task-card')[0];
    await user.click(taskCard);

    // 성능 체크 - 모든 인터랙션이 60fps 유지
    const metrics = await getPerformanceMetrics();
    expect(metrics.fps).toBeGreaterThanOrEqual(60);
  });
});
```

## 연습 문제

### 기초

1. **컴파일러 설정**
   - Vite 프로젝트에 React Compiler 설정
   - ESLint 플러그인 추가
   - 첫 컴포넌트에 `'use memo'` 적용

2. **수동 최적화 제거**
   - 기존 컴포넌트에서 `useMemo`, `useCallback`, `React.memo` 제거
   - 컴파일러로 전환
   - 성능 비교

3. **Rules of React 검증**
   - ESLint로 코드 검사
   - 발견된 위반 사항 수정
   - 테스트 작성

### 중급

4. **복잡한 컴포넌트 최적화**
   - 데이터 테이블 컴포넌트 작성
   - 필터링, 정렬, 페이지네이션 구현
   - 컴파일러 최적화 확인

5. **Custom Hook 최적화**
   - `useTaskFilters` Hook 구현
   - 여러 필터 조합
   - 성능 프로파일링

6. **마이그레이션 전략**
   - 기존 프로젝트 분석
   - 점진적 마이그레이션 계획 수립
   - A/B 테스트 설계

### 고급

7. **컴파일러 디버깅**
   - 최적화되지 않는 컴포넌트 식별
   - 원인 분석 및 해결
   - 커스텀 디버깅 도구 작성

8. **성능 최적화 조합**
   - 컴파일러 + Code Splitting
   - 컴파일러 + Virtualization
   - 컴파일러 + Server Components
   - 최적의 조합 찾기

9. **프로덕션 배포**
   - 컴파일러 활성화 전략
   - 모니터링 설정
   - 롤백 계획
   - 성과 측정

## 다음 단계

다음 장에서는 **Suspense와 에러 처리**를 다룹니다:
- Suspense를 활용한 데이터 페칭
- Error Boundary 패턴
- 로딩 상태 관리
- 에러 복구 전략

React Compiler와 함께 Suspense를 사용하면 더욱 강력한 최적화가 가능합니다!

---

**핵심 요약:**
- React Compiler는 자동 메모이제이션 도구입니다
- `'use memo'` 주석으로 활성화합니다
- useMemoCache를 내부적으로 사용합니다
- Rules of React를 준수해야 합니다
- 점진적 도입이 가능합니다
- ESLint 플러그인으로 검증합니다
