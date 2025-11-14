# React 19: Suspense & Error Boundary

Suspense와 Error Boundary를 실전처럼 활용한 대시보드 데모입니다.

## 데모 개요

실제 애플리케이션처럼 여러 섹션이 있는 대시보드에서:
- 각 섹션이 독립적으로 로딩
- 각 섹션이 독립적으로 에러 처리
- 점진적 렌더링으로 빠른 사용자 경험

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:5173 을 열어보세요.

## 주요 기능

### 1. 점진적 로딩
```
📊 통계 (500ms)  → 가장 먼저 표시
📝 태스크 (1000ms) → 그 다음 표시
🔔 활동 (2000ms)  → 마지막 표시
```

각 섹션이 독립적으로 로딩되므로 빠른 섹션은 먼저 표시됩니다.

### 2. 독립적인 Suspense 경계

```typescript
// 각 섹션마다 독립적인 Suspense
<Suspense fallback={<StatsSkeleton />}>
  <QuickStats /> {/* 500ms */}
</Suspense>

<Suspense fallback={<TaskListSkeleton />}>
  <TaskList /> {/* 1000ms */}
</Suspense>

<Suspense fallback={<ActivitySkeleton />}>
  <ActivityFeed /> {/* 2000ms */}
</Suspense>
```

### 3. 독립적인 Error Boundary

```typescript
// 각 섹션마다 독립적인 ErrorBoundary
<ErrorBoundary onReset={() => handleSectionReset('stats')}>
  <Suspense fallback={<Skeleton />}>
    <QuickStats />
  </Suspense>
</ErrorBoundary>

// 한 섹션의 에러가 다른 섹션에 영향 없음
```

### 4. 스켈레톤 UI

실제 컴포넌트와 비슷한 모양의 로딩 UI:
```typescript
function TaskListSkeleton() {
  return (
    <div className="task-list">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="task-item skeleton">
          <div className="skeleton-circle"></div>
          <div className="skeleton-text"></div>
        </div>
      ))}
    </div>
  );
}
```

## 이 예제에서 배우는 것

1. ✅ **중첩 Suspense**: 여러 Suspense 경계 사용
2. ✅ **점진적 로딩**: 빠른 것부터 표시
3. ✅ **에러 격리**: 독립적인 ErrorBoundary
4. ✅ **스켈레톤 UI**: 로딩 중 사용자 경험
5. ✅ **재시도 기능**: 섹션별 재시도
6. ✅ **Promise 캐싱**: 중복 요청 방지

## 작동 방식

### 로딩 순서
```
1. 페이지 로드 시작
2. 모든 섹션 Suspense fallback 표시
3. 통계 API 완료 (500ms) → 통계 섹션 렌더링
4. 태스크 API 완료 (1000ms) → 태스크 섹션 렌더링
5. 활동 API 완료 (2000ms) → 활동 섹션 렌더링
```

### 에러 처리
```
- 통계 API 에러 (5% 확률)
  → 통계 섹션만 에러 표시
  → 다른 섹션은 정상 작동

- 태스크 API 에러 (10% 확률)
  → 태스크 섹션만 에러 표시
  → 통계, 활동은 정상 작동
```

## 코드 구조

### ErrorBoundary 클래스
```typescript
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.error, this.reset);
    }
    return this.props.children;
  }
}
```

### use() API로 데이터 페칭
```typescript
function QuickStats() {
  // use()로 Promise 읽기
  const stats = use(getCachedPromise('stats', api.fetchStats));

  return (
    <div className="stats-grid">
      {/* stats 렌더링 */}
    </div>
  );
}
```

### Promise 캐싱
```typescript
const cache = new Map();

function getCachedPromise(key, fetcher) {
  if (!cache.has(key)) {
    cache.set(key, fetcher());
  }
  return cache.get(key);
}

// 같은 key로 여러 번 호출해도 한 번만 fetch
```

## 시도해보세요

1. **페이지 새로고침**
   - 섹션들이 순차적으로 나타나는 것 확인
   - 통계 → 태스크 → 활동 순서

2. **에러 발생 대기**
   - 여러 번 새로고침하면 랜덤 에러 발생
   - 에러 섹션만 영향 받는 것 확인

3. **재시도 버튼**
   - 에러 발생 시 "다시 시도" 클릭
   - 해당 섹션만 재로딩

4. **전체 새로고침**
   - 오른쪽 상단 🔄 버튼 클릭
   - 모든 섹션 초기화 및 재로딩

## 실전 팁

### 1. Suspense 경계 배치
```typescript
// ❌ 너무 큰 경계 - 모든 것이 함께 로딩
<Suspense fallback={<PageLoader />}>
  <QuickStats />
  <TaskList />
  <ActivityFeed />
</Suspense>

// ✅ 적절한 경계 - 독립적 로딩
<Suspense fallback={<StatsLoader />}>
  <QuickStats />
</Suspense>
<Suspense fallback={<TasksLoader />}>
  <TaskList />
</Suspense>
```

### 2. ErrorBoundary 배치
```typescript
// ✅ 각 Suspense를 ErrorBoundary로 감싸기
<ErrorBoundary>
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
</ErrorBoundary>
```

### 3. 스켈레톤 UI 디자인
- 실제 컴포넌트와 비슷한 구조
- 애니메이션으로 로딩 중임을 명확히 표시
- 높이를 비슷하게 맞춰 레이아웃 시프트 방지

## 장점

- ⚡ **빠른 초기 렌더링**: 빠른 데이터부터 표시
- 🎨 **부드러운 UX**: 스켈레톤으로 로딩감 감소
- 🛡️ **안정성**: 에러 격리로 전체 앱 다운 방지
- 🔄 **복구 가능**: 섹션별 재시도
- 📊 **실전적**: 실제 대시보드와 유사한 패턴

## 다음 단계

- **11-use-api**: use() API 자세히 알아보기
- **10-optimistic-updates**: useOptimistic과 함께 사용하기

## 관련 챕터

- ebook/advanced/15-suspense-error.md
- ebook/advanced/11-use-api.md
