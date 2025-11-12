# React 19: Optimistic Updates

React 19의 **useOptimistic** Hook을 사용한 낙관적 업데이트 예제입니다.

## 낙관적 업데이트란?

서버 응답을 기다리지 않고 즉시 UI를 업데이트하여 더 빠른 사용자 경험을 제공하는 패턴입니다.

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:5173 을 열어보세요.

## 이 예제에서 배우는 것

1. ✅ **useOptimistic**: 낙관적 상태 관리
2. ✅ **startTransition**: 낙관적 업데이트 트리거
3. ✅ **자동 롤백**: 에러 시 자동 복구
4. ✅ **즉각적인 UI**: 네트워크 지연에도 빠른 반응

## 주요 코드

### useOptimistic 사용법

```typescript
const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
  todos, // 실제 상태
  (state, action) => {
    // 낙관적 업데이트 로직
    if (action.type === 'toggle') {
      return state.map(todo =>
        todo.id === action.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    }
    return state;
  }
);
```

### 핸들러 구현

```typescript
const handleToggle = async (todo: Todo) => {
  // 1. 즉시 UI 업데이트 (낙관적)
  startTransition(() => {
    updateOptimisticTodos({ type: 'toggle', id: todo.id });
  });

  try {
    // 2. 실제 API 호출
    await api.toggleTodo(todo.id);

    // 3. 성공 시 실제 상태 업데이트
    setTodos(prev => /* ... */);
  } catch (error) {
    // 4. 실패 시 에러 표시
    // optimisticTodos는 자동으로 이전 상태로 롤백됨
    setError('업데이트 실패');
  }
};
```

## 작동 원리

1. **사용자 액션**: 체크박스 클릭
2. **낙관적 업데이트**: `updateOptimisticTodos` 호출 → 즉시 UI 반영
3. **API 호출**: 백그라운드에서 서버 요청
4. **성공**: `setTodos`로 실제 상태 업데이트
5. **실패**: 자동으로 이전 상태(`todos`)로 복원

## 시도해보세요

- ✅ 체크박스 클릭 → 즉시 변경 반영 (1.5초 네트워크 지연에도)
- ✅ 삭제 버튼 클릭 → 즉시 아이템 제거
- ✅ 10% 확률 에러 발생 → 자동 복구

## React 18 vs React 19

### React 18 ❌
```typescript
const [todos, setTodos] = useState([]);
const [tempTodos, setTempTodos] = useState([]);

const handleToggle = async (todo) => {
  // 수동 낙관적 업데이트
  setTempTodos(prev => /* ... */);

  try {
    await api.toggle(todo.id);
    setTodos(prev => /* ... */);
  } catch {
    // 수동 롤백
    setTempTodos(todos);
  }
};
```

### React 19 ✅
```typescript
const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
  todos,
  (state, action) => /* ... */
);

const handleToggle = async (todo) => {
  startTransition(() => {
    updateOptimisticTodos({ type: 'toggle', id: todo.id });
  });

  try {
    await api.toggle(todo.id);
    setTodos(prev => /* ... */);
  } catch {
    // 자동 롤백!
  }
};
```

## 장점

- ⚡ **즉각적인 반응**: 사용자가 기다릴 필요 없음
- 🎨 **더 나은 UX**: 느린 네트워크에서도 빠르게 느껴짐
- 🛡️ **자동 복구**: 에러 시 자동으로 이전 상태로
- 🔄 **간단한 코드**: 복잡한 상태 관리 불필요

## 다음 단계

- **11-use-api**: use() API로 데이터 페칭
- **15-suspense**: Suspense와 Error Boundary 통합

## 관련 챕터

- ebook/advanced/10-optimistic-updates.md
