# React 19: Form Actions

React 19의 핵심 기능인 **useActionState**를 사용한 현대적인 폼 처리 예제입니다.

## 주요 기능

### useActionState Hook

```typescript
const [state, formAction, isPending] = useActionState(
  addTaskAction,
  initialState
);
```

- **state**: 액션의 결과 상태
- **formAction**: 폼의 action prop에 전달할 함수
- **isPending**: 액션 실행 중 여부

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:5173 을 열어보세요.

## 이 예제에서 배우는 것

1. ✅ **useActionState**: 비동기 폼 액션 처리
2. ✅ **FormData**: 자동 폼 데이터 수집
3. ✅ **isPending**: 자동 로딩 상태 추적
4. ✅ **에러 처리**: 간편한 에러 상태 관리
5. ✅ **Progressive Enhancement**: JavaScript 없이도 작동 (서버에서)

## 코드 하이라이트

### Server Action 시뮬레이션
```typescript
async function addTaskAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  const title = formData.get('title') as string;

  // 검증
  if (!title || title.trim().length < 3) {
    return { success: false, error: '제목은 최소 3자 이상이어야 합니다' };
  }

  // API 호출
  const task = await createTask(title);

  return { success: true, task };
}
```

### Form 컴포넌트
```typescript
function TaskForm() {
  const [state, formAction, isPending] = useActionState(
    addTaskAction,
    { success: false }
  );

  return (
    <form action={formAction}>
      <input name="title" disabled={isPending} />
      <button disabled={isPending}>
        {isPending ? '추가 중...' : '추가'}
      </button>

      {state.error && <p>{state.error}</p>}
      {state.success && <p>성공!</p>}
    </form>
  );
}
```

## React 18 vs React 19

### React 18 ❌
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const formData = new FormData(e.currentTarget);
    await addTask(formData);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### React 19 ✅
```typescript
const [state, formAction, isPending] = useActionState(
  addTaskAction,
  {}
);

// JSX
<form action={formAction}>
  {/* ... */}
</form>
```

## 주요 장점

1. **간결함**: 보일러플레이트 코드 제거
2. **자동화**: 로딩/에러 상태 자동 관리
3. **타입 안전**: TypeScript 완벽 지원
4. **접근성**: 네이티브 폼 동작 유지

## 다음 단계

- **advanced/10-optimistic-updates**: useOptimistic으로 낙관적 업데이트
- **advanced/11-use-api**: use() API로 데이터 페칭

## 관련 챕터

- ebook/basic/04-forms-and-input.md
