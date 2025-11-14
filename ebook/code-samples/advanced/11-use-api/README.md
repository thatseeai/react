# React 19: use() API

React 19의 가장 혁신적인 기능인 **use() API**를 체험하는 예제입니다.

## use() API란?

`use()`는 Promise와 Context를 읽을 수 있는 새로운 Hook입니다. 다른 Hook들과 달리 **조건부로 호출할 수 있습니다**.

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:5173 을 열어보세요.

## 주요 기능

### 1. Promise 읽기
```typescript
function UserProfile({ userId }) {
  // Promise를 직접 읽음!
  const user = use(fetchUser(userId));

  return <div>{user.name}</div>;
}

// Suspense로 감싸기 필수
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>
```

### 2. Context 읽기
```typescript
const ThemeContext = createContext('light');

function Component() {
  // useContext 대신 use() 사용 가능
  const theme = use(ThemeContext);

  return <div className={theme}>...</div>;
}
```

### 3. ⭐ 조건부 호출 (특별!)
```typescript
function Component({ shouldFetch }) {
  // ⭐ 다른 Hook과 달리 조건부 호출 가능!
  if (!shouldFetch) {
    return <div>No data</div>;
  }

  const data = use(fetchData());
  return <div>{data}</div>;
}
```

## 이 예제에서 배우는 것

1. ✅ **Promise 읽기**: use()로 비동기 데이터 페칭
2. ✅ **Context 읽기**: useContext의 대안
3. ✅ **조건부 호출**: if문 내에서 use() 사용
4. ✅ **Suspense 통합**: 자동 로딩 처리
5. ✅ **ErrorBoundary**: 자동 에러 처리
6. ✅ **Promise 캐싱**: 중복 요청 방지

## 작동 방식

### Promise 읽기 흐름
1. `use(promise)` 호출
2. Promise가 pending → Suspense fallback 표시
3. Promise가 resolve → 데이터 반환, 컴포넌트 렌더링
4. Promise가 reject → ErrorBoundary로 에러 전달

### 캐싱 전략
```typescript
const promiseCache = new Map();

function getUserPromise(userId) {
  if (!promiseCache.has(userId)) {
    promiseCache.set(userId, fetchUser(userId));
  }
  return promiseCache.get(userId);
}

// 같은 userId로 여러 번 호출해도 한 번만 fetch
const user1 = use(getUserPromise(1)); // fetch 실행
const user2 = use(getUserPromise(1)); // 캐시 사용
```

## React 18 vs 19

### React 18 ❌
```typescript
function Component() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error) return <Error error={error} />;
  return <div>{data.name}</div>;
}
```

### React 19 ✅
```typescript
function Component() {
  const data = use(fetchData());
  return <div>{data.name}</div>;
}

// 사용처
<ErrorBoundary fallback={<Error />}>
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

## 특별한 점

### 1. 조건부 호출 가능
```typescript
// ❌ 다른 Hook들 - 불가능
function Bad({ shouldFetch }) {
  if (shouldFetch) {
    const data = useState(null); // Error!
  }
}

// ✅ use() - 가능!
function Good({ shouldFetch }) {
  if (shouldFetch) {
    const data = use(fetchData()); // OK!
  }
}
```

### 2. 루프 안에서도 사용 가능
```typescript
function MultipleUsers({ userIds }) {
  return userIds.map(id => {
    const user = use(fetchUser(id)); // OK!
    return <div>{user.name}</div>;
  });
}
```

## 시도해보세요

- ✅ 사용자 버튼 클릭 → 즉시 로딩 스켈레톤 → 1.5초 후 데이터 표시
- ✅ 테마 변경 → Context 값이 즉시 반영
- ✅ 조건부 데이터 가져오기 토글
- ✅ 10% 확률 에러 → ErrorBoundary 작동

## 장점

- ⚡ **간결한 코드**: useEffect, useState 불필요
- 🎯 **선언적**: Suspense가 로딩 자동 처리
- 🛡️ **에러 처리**: ErrorBoundary 자동 연동
- 🔄 **유연함**: 조건부 호출 가능
- 📦 **타입 안전**: TypeScript 완벽 지원

## 주의사항

1. **Suspense 필수**: use()로 Promise를 읽으려면 Suspense로 감싸야 함
2. **ErrorBoundary 권장**: 에러 처리를 위해 ErrorBoundary 사용
3. **캐싱 필요**: 같은 Promise를 여러 번 생성하지 않도록 캐싱

## 다음 단계

- **15-suspense-demo**: Suspense + ErrorBoundary 고급 패턴
- **12-server-components**: Server Components와 use() 통합

## 관련 챕터

- ebook/advanced/11-use-api.md
- ebook/advanced/15-suspense-error.md
