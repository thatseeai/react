# Chapter 9: Transitions와 비동기 처리

> **학습 목표**: useTransition과 useDeferredValue를 마스터하여 반응형 UI를 구현한다
> **소요 시간**: 120분
> **난이도**: 중급~고급

## 📖 개요

React 19는 비동기 작업을 더욱 우아하게 처리할 수 있도록 Transitions를 개선했습니다. **Async Transitions**를 지원하며, `useDeferredValue`에 `initialValue` 파라미터가 추가되었습니다. 이를 통해 사용자 경험을 해치지 않으면서도 무거운 작업을 처리할 수 있습니다.

이 챕터에서는 TaskFlow의 검색, 필터링, 정렬 기능을 Transitions로 최적화합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ useTransition으로 비차단 업데이트
- ✅ **NEW**: Async Transitions
- ✅ **NEW**: useDeferredValue의 initialValue
- ✅ Suspense와 Transitions 통합
- ✅ 검색 기능 최적화

---

## 💡 핵심 개념

### 1. useTransition - 비차단 업데이트

`useTransition`은 UI를 차단하지 않고 상태 업데이트를 수행할 수 있게 해줍니다.

```typescript
import { useTransition, useState } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    // 즉시 업데이트 (높은 우선순위)
    setQuery(value);

    // 지연 가능한 업데이트 (낮은 우선순위)
    startTransition(() => {
      const filtered = expensiveFilter(value);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && <span>검색 중...</span>}
      <ResultList results={results} />
    </div>
  );
}
```

**작동 원리**:
- `setQuery`는 즉시 실행 (입력이 끊기지 않음)
- `startTransition` 내부는 낮은 우선순위로 실행
- `isPending`은 transition이 진행 중일 때 `true`

### 2. React 19: Async Transitions

React 19부터 `startTransition`에 async 함수를 전달할 수 있습니다!

```typescript
import { useTransition } from 'react';

// React 18 - async 불가
const [isPending, startTransition] = useTransition();

startTransition(() => {
  // ❌ async 함수 사용 불가
  const data = await fetchData(); // 에러!
});

// React 19 - async 가능!
const [isPending, startTransition] = useTransition();

startTransition(async () => {
  // ✅ async 함수 사용 가능
  const data = await fetchData();
  setData(data);
});
```

**isPending 동작**:
- async 함수가 시작되면 `isPending`이 `true`
- async 함수가 완료되면 `isPending`이 `false`
- Promise가 reject되면 `isPending`이 `false`

**React 18과의 비교**:

```typescript
// React 18 - 복잡한 우회 방법
const [isPending, startTransition] = useTransition();
const [isLoading, setIsLoading] = useState(false);

const handleClick = async () => {
  setIsLoading(true);
  const data = await fetchData();

  startTransition(() => {
    setData(data);
    setIsLoading(false);
  });
};

// React 19 - 간단명료
const [isPending, startTransition] = useTransition();

const handleClick = () => {
  startTransition(async () => {
    const data = await fetchData();
    setData(data);
  });
};
```

### 3. useDeferredValue - 지연된 값

`useDeferredValue`는 값의 업데이트를 지연시킵니다.

```typescript
import { useDeferredValue, useState } from 'react';

function SearchResults() {
  const [query, setQuery] = useState('');

  // query의 지연된 버전
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* deferredQuery로 무거운 컴포넌트 렌더링 */}
      <ExpensiveList query={deferredQuery} />
    </div>
  );
}
```

### 4. React 19: useDeferredValue의 initialValue

React 19에서는 `useDeferredValue`에 `initialValue` 파라미터가 추가되었습니다.

```typescript
// React 18
const deferredValue = useDeferredValue(value);

// React 19
const deferredValue = useDeferredValue(value, initialValue);
```

**사용 예제**:

```typescript
function SearchResults({ query }: { query: string }) {
  // 초기 렌더링에는 빈 문자열 사용
  const deferredQuery = useDeferredValue(query, '');

  // 첫 렌더링에서 ExpensiveList는 빈 쿼리로 렌더링
  // 이후 query가 변경되면 deferredQuery가 업데이트됨
  return <ExpensiveList query={deferredQuery} />;
}
```

**장점**:
- 초기 렌더링 성능 향상
- 서버 사이드 렌더링에서 유용
- Suspense와 함께 사용 시 더 나은 UX

### 5. useTransition vs useDeferredValue

| useTransition | useDeferredValue |
|---------------|------------------|
| 상태 업데이트를 감쌈 | 값을 지연 |
| 여러 상태 업데이트 가능 | 하나의 값만 지연 |
| isPending 제공 | pending 상태 없음 |
| 더 많은 제어 가능 | 더 간단 |

**언제 무엇을 사용할까?**

```typescript
// useTransition - 상태 업데이트를 제어할 수 있을 때
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setFilter(newFilter);
  setSortOrder(newOrder);
  setPage(1);
});

// useDeferredValue - props나 외부 값일 때
function Component({ searchQuery }: { searchQuery: string }) {
  const deferredQuery = useDeferredValue(searchQuery);
  // ...
}
```

---

## 🛠️ 실습: Task 검색 최적화

### Step 1: 기본 검색 (문제 상황)

```typescript
import { useState } from 'react';
import { Task } from '@/types/task';

// ❌ 문제: 타이핑할 때마다 전체 리스트 필터링 (느림)
function TaskSearch({ tasks }: { tasks: Task[] }) {
  const [query, setQuery] = useState('');

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(query.toLowerCase()) ||
    task.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="작업 검색..."
      />
      <p>검색 결과: {filteredTasks.length}개</p>
      <TaskList tasks={filteredTasks} />
    </div>
  );
}
```

**문제점**:
- 타이핑할 때마다 필터링 실행
- tasks가 많으면 입력이 버벅거림
- 사용자 경험 저하

### Step 2: useTransition으로 개선

**src/components/task/TaskSearchWithTransition.tsx**:

```typescript
import { useState, useTransition, useMemo } from 'react';
import { Task } from '@/types/task';
import { TaskList } from './TaskList';

export function TaskSearchWithTransition({ tasks }: { tasks: Task[] }) {
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    // 즉시 업데이트: 입력 필드
    setQuery(value);

    // 지연 가능: 검색 결과
    startTransition(() => {
      setSearchQuery(value);
    });
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;

    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, searchQuery]);

  return (
    <div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="작업 검색..."
          className="w-full px-4 py-2 border rounded-lg"
        />
        {isPending && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-2">
        검색 결과: {filteredTasks.length}개
        {isPending && <span className="text-blue-600 ml-2">(검색 중...)</span>}
      </p>

      <div className={isPending ? 'opacity-50' : ''}>
        <TaskList tasks={filteredTasks} />
      </div>
    </div>
  );
}
```

### Step 3: useDeferredValue로 개선

**src/components/task/TaskSearchWithDeferred.tsx**:

```typescript
import { useState, useDeferredValue, useMemo } from 'react';
import { Task } from '@/types/task';
import { TaskList } from './TaskList';

export function TaskSearchWithDeferred({ tasks }: { tasks: Task[] }) {
  const [query, setQuery] = useState('');

  // React 19: initialValue 파라미터
  const deferredQuery = useDeferredValue(query, '');

  const filteredTasks = useMemo(() => {
    if (!deferredQuery) return tasks;

    return tasks.filter(task =>
      task.title.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(deferredQuery.toLowerCase())
    );
  }, [tasks, deferredQuery]);

  // query와 deferredQuery가 다르면 업데이트 중
  const isPending = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="작업 검색..."
        className="w-full px-4 py-2 border rounded-lg"
      />

      <p className="text-sm text-gray-600 mt-2">
        검색 결과: {filteredTasks.length}개
        {isPending && <span className="text-blue-600 ml-2">(검색 중...)</span>}
      </p>

      <div className={isPending ? 'opacity-50 transition-opacity' : ''}>
        <TaskList tasks={filteredTasks} />
      </div>
    </div>
  );
}
```

### Step 4: Async Transitions 활용

**src/components/task/TaskSearchAsync.tsx**:

```typescript
import { useState, useTransition } from 'react';
import { Task } from '@/types/task';
import { TaskList } from './TaskList';

// 비동기 검색 API (시뮬레이션)
async function searchTasks(query: string): Promise<Task[]> {
  // 실제로는 서버 API 호출
  await new Promise(resolve => setTimeout(resolve, 500));

  const savedTasks = localStorage.getItem('taskflow-tasks');
  if (!savedTasks) return [];

  const tasks: Task[] = JSON.parse(savedTasks);
  return tasks.filter(task =>
    task.title.toLowerCase().includes(query.toLowerCase())
  );
}

export function TaskSearchAsync() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    // React 19: async 함수를 startTransition에 전달
    startTransition(async () => {
      const tasks = await searchTasks(value);
      setResults(tasks);
    });
  };

  return (
    <div>
      <div className="relative">
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="서버에서 검색..."
          className="w-full px-4 py-2 border rounded-lg"
        />
        {isPending && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {isPending ? (
        <div className="text-center py-8 text-gray-500">
          검색 중...
        </div>
      ) : results.length > 0 ? (
        <TaskList tasks={results} />
      ) : query ? (
        <div className="text-center py-8 text-gray-500">
          검색 결과가 없습니다
        </div>
      ) : null}
    </div>
  );
}
```

### Step 5: Suspense와 통합

**src/components/task/TaskSearchWithSuspense.tsx**:

```typescript
import { Suspense, useState, useTransition } from 'react';
import { Task } from '@/types/task';

// Suspense를 사용하는 컴포넌트
function SearchResults({ query }: { query: string }) {
  // use() API로 Promise 읽기 (Chapter 11에서 자세히)
  const results = use(searchTasksPromise(query));

  return <TaskList tasks={results} />;
}

export function TaskSearchWithSuspense() {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setQuery(value);

    startTransition(() => {
      setDeferredQuery(value);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="검색 (Suspense)..."
      />

      {isPending && <div>업데이트 중...</div>}

      <Suspense fallback={<div>로딩 중...</div>}>
        {deferredQuery && <SearchResults query={deferredQuery} />}
      </Suspense>
    </div>
  );
}
```

### Step 6: 복합 필터링

**src/components/task/AdvancedTaskFilter.tsx**:

```typescript
import { useState, useTransition, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { TaskList } from './TaskList';

interface Filters {
  query: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  sortBy: 'title' | 'createdAt' | 'priority';
}

export function AdvancedTaskFilter({ tasks }: { tasks: Task[] }) {
  const [filters, setFilters] = useState<Filters>({
    query: '',
    status: 'all',
    priority: 'all',
    sortBy: 'createdAt',
  });

  const [deferredFilters, setDeferredFilters] = useState(filters);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (updates: Partial<Filters>) => {
    const newFilters = { ...filters, ...updates };

    // 즉시 업데이트: 필터 UI
    setFilters(newFilters);

    // 지연 가능: 필터링 결과
    startTransition(() => {
      setDeferredFilters(newFilters);
    });
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // 검색어 필터
    if (deferredFilters.query) {
      const query = deferredFilters.query.toLowerCase();
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query)
      );
    }

    // 상태 필터
    if (deferredFilters.status !== 'all') {
      result = result.filter(task => task.status === deferredFilters.status);
    }

    // 우선순위 필터
    if (deferredFilters.priority !== 'all') {
      result = result.filter(task => task.priority === deferredFilters.priority);
    }

    // 정렬
    result.sort((a, b) => {
      switch (deferredFilters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'createdAt':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return result;
  }, [tasks, deferredFilters]);

  return (
    <div className="space-y-4">
      {/* 필터 컨트롤 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="검색..."
          value={filters.query}
          onChange={(e) => handleFilterChange({ query: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        />

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ status: e.target.value as any })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">모든 상태</option>
          <option value="todo">할 일</option>
          <option value="in-progress">진행중</option>
          <option value="review">검토중</option>
          <option value="done">완료</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange({ priority: e.target.value as any })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">모든 우선순위</option>
          <option value="low">낮음</option>
          <option value="medium">보통</option>
          <option value="high">높음</option>
          <option value="urgent">긴급</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="createdAt">생성일</option>
          <option value="title">제목</option>
          <option value="priority">우선순위</option>
        </select>
      </div>

      {/* 결과 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredTasks.length}개의 작업
          {isPending && <span className="text-blue-600 ml-2">(업데이트 중...)</span>}
        </p>
      </div>

      {/* 리스트 */}
      <div className={isPending ? 'opacity-60 transition-opacity' : ''}>
        <TaskList tasks={filteredTasks} />
      </div>
    </div>
  );
}
```

---

## ✅ 완성 코드 구조

```
src/
├── components/
│   └── task/
│       ├── TaskSearchWithTransition.tsx   ✅
│       ├── TaskSearchWithDeferred.tsx     ✅
│       ├── TaskSearchAsync.tsx            ✅
│       ├── TaskSearchWithSuspense.tsx     ✅
│       └── AdvancedTaskFilter.tsx         ✅
```

---

## 🔍 코드 분석

### Transition 우선순위

```typescript
// 높은 우선순위 (즉시 실행)
setInputValue(value);

// 낮은 우선순위 (지연 가능)
startTransition(() => {
  setFilteredResults(expensiveFilter(value));
});

// React가 자동으로 우선순위 관리:
// 1. 입력 업데이트 먼저
// 2. 그 다음 필터링 결과
```

### isPending의 활용

```typescript
const [isPending, startTransition] = useTransition();

// 1. 로딩 인디케이터
{isPending && <Spinner />}

// 2. 디밍 효과
<div className={isPending ? 'opacity-50' : ''}>

// 3. 버튼 비활성화
<button disabled={isPending}>

// 4. 프로그레스 바
{isPending && <ProgressBar />}
```

---

## ⚠️ 주의사항

### 1. 너무 많은 Transition 사용 금지

```typescript
// ❌ 모든 것을 transition으로
startTransition(() => {
  setCount(count + 1); // 간단한 카운터까지 transition?
});

// ✅ 무거운 작업만 transition으로
setCount(count + 1); // 즉시 업데이트
startTransition(() => {
  setLargeDataSet(newData); // transition 필요
});
```

### 2. Transition 중첩 피하기

```typescript
// ❌ 중첩된 transition
startTransition(() => {
  startTransition(() => { // 불필요
    setData(newData);
  });
});

// ✅ 하나의 transition
startTransition(() => {
  setFilter(newFilter);
  setSortOrder(newOrder);
  setData(newData);
});
```

### 3. Async Transition 에러 처리

```typescript
startTransition(async () => {
  try {
    const data = await fetchData();
    setData(data);
  } catch (error) {
    setError(error);
  }
});
```

---

## 💪 실전 팁

### 1. Debounce와 Transition 결합

```typescript
import { useState, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';

function SearchWithDebounce() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const debouncedSearch = useDebouncedCallback((value: string) => {
    startTransition(async () => {
      const results = await search(value);
      setResults(results);
    });
  }, 300);

  return (
    <input
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

### 2. 여러 상태를 함께 업데이트

```typescript
startTransition(() => {
  // 모두 낮은 우선순위로 함께 업데이트
  setFilter(newFilter);
  setPage(1);
  setSortOrder(newOrder);
});
```

### 3. 조건부 Transition

```typescript
const handleUpdate = (isExpensive: boolean) => {
  if (isExpensive) {
    startTransition(() => {
      updateState(newValue);
    });
  } else {
    updateState(newValue);
  }
};
```

---

## 📚 참고 자료

- [React 19 - useTransition](https://react.dev/reference/react/useTransition)
- [React 19 - useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [Async Transitions](https://react.dev/blog/2024/04/25/react-19#async-transitions)

---

## 🎓 연습 문제

### 기본

1. **정렬 기능**에 useTransition을 적용하세요.

2. **페이지네이션**을 useDeferredValue로 구현하세요.

3. **필터 리셋 버튼**을 만들고 transition 적용하세요.

### 도전

4. **무한 스크롤**을 async transition으로 구현하세요.

5. **자동완성**을 debounce + transition으로 만드세요.

6. **복합 대시보드**에서 여러 차트를 동시에 업데이트하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **Optimistic Updates**를 다룹니다:

- **NEW**: useOptimistic Hook
- 낙관적 UI 패턴
- 에러 처리 및 롤백
- Task CRUD에 적용
- Form Actions와 통합

**[Chapter 10: Optimistic Updates →](10-optimistic-updates.md)**

---

**축하합니다!** 🎉 Transitions를 마스터했습니다!
