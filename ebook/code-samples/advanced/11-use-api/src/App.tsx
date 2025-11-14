import { use, Suspense, createContext, useState } from 'react';
import './App.css';

/**
 * 사용자 데이터 타입
 */
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

/**
 * API 응답 시뮬레이션
 */
async function fetchUser(userId: number): Promise<User> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 랜덤 에러 (10%)
  if (Math.random() < 0.1) {
    throw new Error('사용자 정보를 불러오는데 실패했습니다');
  }

  // 사용자 데이터 반환
  const users: User[] = [
    {
      id: 1,
      name: '김철수',
      email: 'kim@example.com',
      avatar: '👨‍💻',
      role: '개발자'
    },
    {
      id: 2,
      name: '이영희',
      email: 'lee@example.com',
      avatar: '👩‍🎨',
      role: '디자이너'
    },
    {
      id: 3,
      name: '박민수',
      email: 'park@example.com',
      avatar: '👨‍💼',
      role: '매니저'
    }
  ];

  return users.find(u => u.id === userId) || users[0];
}

/**
 * Promise 캐싱 (중복 요청 방지)
 */
const promiseCache = new Map<number, Promise<User>>();

function getUserPromise(userId: number): Promise<User> {
  if (!promiseCache.has(userId)) {
    promiseCache.set(userId, fetchUser(userId));
  }
  return promiseCache.get(userId)!;
}

/**
 * Theme Context (use()로 읽을 수 있음)
 */
const ThemeContext = createContext<'light' | 'dark'>('light');

/**
 * 컴포넌트 1: use()로 Promise 읽기
 */
function UserProfile({ userId }: { userId: number }) {
  // use() API로 Promise 읽기 - Suspense와 함께 작동
  const user = use(getUserPromise(userId));

  // use()로 Context도 읽기
  const theme = use(ThemeContext);

  return (
    <div className={`user-profile theme-${theme}`}>
      <div className="user-avatar">{user.avatar}</div>
      <div className="user-info">
        <h3>{user.name}</h3>
        <p className="user-email">{user.email}</p>
        <span className="user-role">{user.role}</span>
      </div>
    </div>
  );
}

/**
 * 컴포넌트 2: 조건부 use() (React 19의 특별한 기능!)
 */
function ConditionalUser({ userId, shouldFetch }: { userId: number; shouldFetch: boolean }) {
  const theme = use(ThemeContext);

  // ⭐ React 19: 조건부로 use() 호출 가능!
  // 다른 Hook들은 불가능하지만 use()는 가능
  if (!shouldFetch) {
    return (
      <div className={`conditional-user theme-${theme}`}>
        <p>사용자 정보를 불러오려면 "데이터 가져오기"를 클릭하세요</p>
      </div>
    );
  }

  const user = use(getUserPromise(userId));

  return (
    <div className={`conditional-user theme-${theme}`}>
      <span className="avatar-small">{user.avatar}</span>
      <span>{user.name}</span>
    </div>
  );
}

/**
 * 에러 바운더리 (함수형)
 */
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="error-fallback">
      <div className="error-icon">⚠️</div>
      <h3>오류가 발생했습니다</h3>
      <p>{error.message}</p>
      <button onClick={reset} className="btn-retry">
        다시 시도
      </button>
    </div>
  );
}

/**
 * 로딩 스켈레톤
 */
function UserSkeleton() {
  return (
    <div className="user-profile skeleton">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-info">
        <div className="skeleton-text skeleton-name"></div>
        <div className="skeleton-text skeleton-email"></div>
        <div className="skeleton-text skeleton-role"></div>
      </div>
    </div>
  );
}

/**
 * 메인 App
 */
function App() {
  const [userId, setUserId] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [key, setKey] = useState(0); // 리셋용

  const handleUserChange = (newUserId: number) => {
    // 캐시 초기화
    promiseCache.clear();
    setUserId(newUserId);
    setKey(k => k + 1);
  };

  const handleReset = () => {
    promiseCache.clear();
    setKey(k => k + 1);
  };

  return (
    <ThemeContext value={theme}>
      <div className={`app theme-${theme}`}>
        <header className="header">
          <h1>React 19: use() API</h1>
          <p>Promise와 Context를 읽는 혁신적인 방법</p>
        </header>

        <main className="main">
          <div className="demo-section">
            <div className="controls">
              <div className="control-group">
                <label>사용자 선택:</label>
                <div className="button-group">
                  <button
                    onClick={() => handleUserChange(1)}
                    className={userId === 1 ? 'active' : ''}
                  >
                    김철수
                  </button>
                  <button
                    onClick={() => handleUserChange(2)}
                    className={userId === 2 ? 'active' : ''}
                  >
                    이영희
                  </button>
                  <button
                    onClick={() => handleUserChange(3)}
                    className={userId === 3 ? 'active' : ''}
                  >
                    박민수
                  </button>
                </div>
              </div>

              <div className="control-group">
                <label>테마:</label>
                <div className="button-group">
                  <button
                    onClick={() => setTheme('light')}
                    className={theme === 'light' ? 'active' : ''}
                  >
                    🌞 Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={theme === 'dark' ? 'active' : ''}
                  >
                    🌙 Dark
                  </button>
                </div>
              </div>
            </div>

            <div className="demo-box">
              <h3>1. use()로 Promise 읽기</h3>
              <Suspense key={key} fallback={<UserSkeleton />}>
                <ErrorBoundary onReset={handleReset}>
                  <UserProfile userId={userId} />
                </ErrorBoundary>
              </Suspense>
            </div>

            <div className="demo-box">
              <h3>2. 조건부 use() (React 19만 가능!)</h3>
              <div className="conditional-controls">
                <button
                  onClick={() => setShouldFetch(!shouldFetch)}
                  className="btn-toggle"
                >
                  {shouldFetch ? '숨기기' : '데이터 가져오기'}
                </button>
              </div>
              <Suspense fallback={<div className="loading-text">로딩 중...</div>}>
                <ConditionalUser userId={userId} shouldFetch={shouldFetch} />
              </Suspense>
            </div>

            <div className="feature-highlight">
              <h4>⭐ use() API 특징</h4>
              <ul>
                <li>✅ Promise를 직접 읽을 수 있음</li>
                <li>✅ Context도 읽을 수 있음</li>
                <li>✅ 조건부 호출 가능 (다른 Hook과 다름!)</li>
                <li>✅ Suspense와 자동 통합</li>
                <li>✅ ErrorBoundary와 자동 통합</li>
              </ul>
            </div>
          </div>

          <div className="info-section">
            <h3>코드 예시</h3>

            <div className="code-block">
              <h4>use()로 Promise 읽기</h4>
              <pre>{`function UserProfile({ userId }) {
  // Promise를 직접 읽음!
  const user = use(fetchUser(userId));

  return <div>{user.name}</div>;
}

// Suspense로 감싸기
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>`}</pre>
            </div>

            <div className="code-block">
              <h4>use()로 Context 읽기</h4>
              <pre>{`const ThemeContext = createContext('light');

function Component() {
  // useContext 대신 use() 사용 가능
  const theme = use(ThemeContext);

  return <div className={theme}>...</div>;
}`}</pre>
            </div>

            <div className="code-block">
              <h4>⭐ 조건부 use() (특별!)</h4>
              <pre>{`function Component({ shouldFetch }) {
  // ⭐ 조건부 호출 가능! (다른 Hook은 불가)
  if (!shouldFetch) {
    return <div>No data</div>;
  }

  const data = use(fetchData());
  return <div>{data}</div>;
}`}</pre>
            </div>

            <h3>React 18 vs 19</h3>
            <div className="comparison">
              <div className="compare-item">
                <h4>React 18 ❌</h4>
                <pre>{`const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(setData)
    .finally(() => setLoading(false));
}, []);

if (loading) return <Loading />;
return <div>{data.name}</div>;`}</pre>
              </div>

              <div className="compare-item">
                <h4>React 19 ✅</h4>
                <pre>{`function Component() {
  const data = use(fetchData());
  return <div>{data.name}</div>;
}

<Suspense fallback={<Loading />}>
  <Component />
</Suspense>`}</pre>
              </div>
            </div>

            <h3>장점</h3>
            <div className="benefits">
              <div className="benefit">
                <span className="benefit-icon">⚡</span>
                <div>
                  <strong>간결한 코드</strong>
                  <p>useEffect, useState 불필요</p>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🎯</span>
                <div>
                  <strong>선언적</strong>
                  <p>Suspense가 로딩 처리</p>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🔄</span>
                <div>
                  <strong>유연함</strong>
                  <p>조건부 호출 가능</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeContext>
  );
}

/**
 * 간단한 ErrorBoundary (클래스 대신 함수형으로 시뮬레이션)
 */
function ErrorBoundary({
  children,
  onReset
}: {
  children: React.ReactNode;
  onReset: () => void;
}) {
  return (
    <ErrorBoundaryClass onReset={onReset}>
      {children}
    </ErrorBoundaryClass>
  );
}

class ErrorBoundaryClass extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          reset={() => {
            this.setState({ hasError: false, error: null });
            this.props.onReset();
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default App;
