import { use, Suspense, useState, Component, type ReactNode } from 'react';
import './App.css';

/**
 * 데이터 타입들
 */
interface Stats {
  totalTasks: number;
  completedTasks: number;
  activeUsers: number;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  timestamp: Date;
}

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

/**
 * API 시뮬레이션
 */
const api = {
  // 빠른 API (~500ms)
  fetchStats: async (): Promise<Stats> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (Math.random() < 0.05) {
      throw new Error('통계 데이터를 불러올 수 없습니다');
    }

    return {
      totalTasks: 48,
      completedTasks: 32,
      activeUsers: 12
    };
  },

  // 중간 속도 API (~1000ms)
  fetchTasks: async (): Promise<Task[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (Math.random() < 0.1) {
      throw new Error('태스크를 불러오는데 실패했습니다');
    }

    return [
      { id: '1', title: 'React 19 학습하기', status: 'in-progress' },
      { id: '2', title: 'Suspense 마스터하기', status: 'todo' },
      { id: '3', title: 'ErrorBoundary 구현하기', status: 'done' },
      { id: '4', title: '프로젝트에 적용하기', status: 'todo' }
    ];
  },

  // 느린 API (~2000ms)
  fetchActivities: async (): Promise<Activity[]> => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (Math.random() < 0.15) {
      throw new Error('활동 내역을 불러올 수 없습니다');
    }

    return [
      {
        id: '1',
        user: '김철수',
        action: '태스크를 완료했습니다',
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: '2',
        user: '이영희',
        action: '새 태스크를 생성했습니다',
        timestamp: new Date(Date.now() - 1000 * 60 * 15)
      },
      {
        id: '3',
        user: '박민수',
        action: '댓글을 남겼습니다',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      }
    ];
  }
};

/**
 * Promise 캐시
 */
const cache = new Map<string, Promise<any>>();

function getCachedPromise<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    cache.set(key, fetcher());
  }
  return cache.get(key)!;
}

/**
 * ErrorBoundary 컴포넌트
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="error-fallback">
          <div className="error-icon">⚠️</div>
          <h3>오류가 발생했습니다</h3>
          <p>{this.state.error.message}</p>
          <button onClick={this.reset} className="btn-retry">
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 1. 빠른 통계 컴포넌트
 */
function QuickStats() {
  const stats = use(getCachedPromise('stats', api.fetchStats));

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{stats.totalTasks}</div>
        <div className="stat-label">전체 태스크</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.completedTasks}</div>
        <div className="stat-label">완료됨</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{stats.activeUsers}</div>
        <div className="stat-label">활성 사용자</div>
      </div>
    </div>
  );
}

/**
 * 2. 태스크 리스트
 */
function TaskList() {
  const tasks = use(getCachedPromise('tasks', api.fetchTasks));

  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task.id} className={`task-item status-${task.status}`}>
          <div className={`status-dot ${task.status}`}></div>
          <div className="task-title">{task.title}</div>
          <div className="task-status">
            {task.status === 'todo' && '할 일'}
            {task.status === 'in-progress' && '진행 중'}
            {task.status === 'done' && '완료'}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 3. 활동 피드
 */
function ActivityFeed() {
  const activities = use(getCachedPromise('activities', api.fetchActivities));

  const formatTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  };

  return (
    <div className="activity-feed">
      {activities.map(activity => (
        <div key={activity.id} className="activity-item">
          <div className="activity-avatar">{activity.user[0]}</div>
          <div className="activity-content">
            <div className="activity-text">
              <strong>{activity.user}</strong> {activity.action}
            </div>
            <div className="activity-time">{formatTime(activity.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 스켈레톤 로딩 컴포넌트들
 */
function StatsSkeleton() {
  return (
    <div className="stats-grid">
      {[1, 2, 3].map(i => (
        <div key={i} className="stat-card skeleton">
          <div className="skeleton-text skeleton-value"></div>
          <div className="skeleton-text skeleton-label"></div>
        </div>
      ))}
    </div>
  );
}

function TaskListSkeleton() {
  return (
    <div className="task-list">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="task-item skeleton">
          <div className="skeleton-circle"></div>
          <div className="skeleton-text skeleton-task"></div>
          <div className="skeleton-text skeleton-status"></div>
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="activity-feed">
      {[1, 2, 3].map(i => (
        <div key={i} className="activity-item skeleton">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-content">
            <div className="skeleton-text skeleton-activity"></div>
            <div className="skeleton-text skeleton-time"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 커스텀 에러 UI
 */
function CustomErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="custom-error">
      <div className="error-icon">😕</div>
      <h4>데이터를 불러올 수 없습니다</h4>
      <p className="error-message">{error.message}</p>
      <button onClick={reset} className="btn-small">
        다시 시도
      </button>
    </div>
  );
}

/**
 * 메인 App
 */
function App() {
  const [resetKey, setResetKey] = useState(0);

  const handleGlobalReset = () => {
    cache.clear();
    setResetKey(k => k + 1);
  };

  const handleSectionReset = (section: string) => {
    cache.delete(section);
    setResetKey(k => k + 1);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div>
            <h1>React 19: Suspense & ErrorBoundary</h1>
            <p>점진적 로딩과 독립적인 에러 처리</p>
          </div>
          <button onClick={handleGlobalReset} className="btn-refresh">
            🔄 전체 새로고침
          </button>
        </div>
      </header>

      <main className="dashboard" key={resetKey}>
        {/* 1. 빠른 통계 - 즉시 표시 */}
        <section className="dashboard-section stats-section">
          <div className="section-header">
            <h2>📊 통계</h2>
            <span className="loading-badge">~500ms</span>
          </div>
          <ErrorBoundary onReset={() => handleSectionReset('stats')}>
            <Suspense fallback={<StatsSkeleton />}>
              <QuickStats />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* 2. 태스크 - 중간 속도 */}
        <section className="dashboard-section tasks-section">
          <div className="section-header">
            <h2>📝 태스크</h2>
            <span className="loading-badge">~1000ms</span>
          </div>
          <ErrorBoundary
            fallback={(error, reset) => <CustomErrorFallback error={error} reset={reset} />}
            onReset={() => handleSectionReset('tasks')}
          >
            <Suspense fallback={<TaskListSkeleton />}>
              <TaskList />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* 3. 활동 피드 - 느림 */}
        <section className="dashboard-section activity-section">
          <div className="section-header">
            <h2>🔔 활동</h2>
            <span className="loading-badge">~2000ms</span>
          </div>
          <ErrorBoundary
            fallback={(error, reset) => <CustomErrorFallback error={error} reset={reset} />}
            onReset={() => handleSectionReset('activities')}
          >
            <Suspense fallback={<ActivitySkeleton />}>
              <ActivityFeed />
            </Suspense>
          </ErrorBoundary>
        </section>

        {/* 정보 패널 */}
        <section className="info-panel">
          <h3>💡 이 데모의 특징</h3>
          <ul>
            <li>✅ <strong>점진적 로딩</strong>: 각 섹션이 독립적으로 로드됩니다</li>
            <li>✅ <strong>Suspense 경계</strong>: 빠른 컴포넌트는 먼저 표시됩니다</li>
            <li>✅ <strong>Error 격리</strong>: 한 섹션의 에러가 전체에 영향 없음</li>
            <li>✅ <strong>스켈레톤 UI</strong>: 로딩 중 실제와 비슷한 UI 표시</li>
            <li>✅ <strong>재시도 기능</strong>: 각 섹션별로 다시 시도 가능</li>
          </ul>

          <div className="demo-steps">
            <h4>🔄 페이지를 새로고침해보세요!</h4>
            <ol>
              <li>통계가 가장 먼저 표시됩니다 (~500ms)</li>
              <li>태스크가 그 다음에 표시됩니다 (~1000ms)</li>
              <li>활동 피드가 마지막에 표시됩니다 (~2000ms)</li>
              <li>랜덤 에러 발생 시 해당 섹션만 에러 표시</li>
            </ol>
          </div>

          <div className="error-rates">
            <h4>⚠️ 에러 발생 확률</h4>
            <div className="rate-item">
              <span className="rate-label">통계:</span>
              <span className="rate-value">5%</span>
            </div>
            <div className="rate-item">
              <span className="rate-label">태스크:</span>
              <span className="rate-value">10%</span>
            </div>
            <div className="rate-item">
              <span className="rate-label">활동:</span>
              <span className="rate-value">15%</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
