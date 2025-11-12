import { useState, useOptimistic, startTransition } from 'react';
import './App.css';

/**
 * Todo 타입 정의
 */
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

/**
 * API 호출 시뮬레이션
 */
const api = {
  toggleTodo: async (id: string): Promise<void> => {
    // 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 랜덤 에러 시뮬레이션 (10% 확률)
    if (Math.random() < 0.1) {
      throw new Error('네트워크 오류');
    }
  },

  deleteTodo: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (Math.random() < 0.1) {
      throw new Error('삭제 실패');
    }
  }
};

/**
 * 초기 Todo 데이터
 */
const initialTodos: Todo[] = [
  {
    id: '1',
    text: 'React 19 배우기',
    completed: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    text: 'useOptimistic Hook 마스터하기',
    completed: false,
    createdAt: new Date('2024-01-02')
  },
  {
    id: '3',
    text: '낙관적 업데이트 적용하기',
    completed: false,
    createdAt: new Date('2024-01-03')
  }
];

function App() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [error, setError] = useState<string>('');

  /**
   * useOptimistic: 낙관적 업데이트
   * - optimisticTodos: UI에 표시될 낙관적 상태
   * - updateOptimisticTodos: 낙관적 업데이트 트리거
   */
  const [optimisticTodos, updateOptimisticTodos] = useOptimistic(
    todos,
    (state: Todo[], action: { type: 'toggle' | 'delete'; id: string }) => {
      switch (action.type) {
        case 'toggle':
          return state.map(todo =>
            todo.id === action.id
              ? { ...todo, completed: !todo.completed }
              : todo
          );
        case 'delete':
          return state.filter(todo => todo.id !== action.id);
        default:
          return state;
      }
    }
  );

  /**
   * Todo 완료 상태 토글
   */
  const handleToggle = async (todo: Todo) => {
    setError('');

    // 낙관적 업데이트 (즉시 UI 반영)
    startTransition(() => {
      updateOptimisticTodos({ type: 'toggle', id: todo.id });
    });

    try {
      // 실제 API 호출
      await api.toggleTodo(todo.id);

      // 성공 시 실제 상태 업데이트
      setTodos(prevTodos =>
        prevTodos.map(t =>
          t.id === todo.id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (err) {
      // 실패 시 에러 표시 (자동으로 이전 상태로 롤백됨)
      setError(`${todo.text} 업데이트 실패. 다시 시도해주세요.`);
    }
  };

  /**
   * Todo 삭제
   */
  const handleDelete = async (todo: Todo) => {
    setError('');

    // 낙관적 업데이트
    startTransition(() => {
      updateOptimisticTodos({ type: 'delete', id: todo.id });
    });

    try {
      await api.deleteTodo(todo.id);

      // 성공 시 실제 상태 업데이트
      setTodos(prevTodos => prevTodos.filter(t => t.id !== todo.id));
    } catch (err) {
      setError(`${todo.text} 삭제 실패. 다시 시도해주세요.`);
    }
  };

  /**
   * 통계 계산
   */
  const stats = {
    total: optimisticTodos.length,
    completed: optimisticTodos.filter(t => t.completed).length,
    pending: optimisticTodos.filter(t => !t.completed).length
  };

  return (
    <div className="app">
      <header className="header">
        <h1>React 19: Optimistic Updates</h1>
        <p>useOptimistic으로 즉각적인 UI 반응 구현</p>
      </header>

      <main className="main">
        <div className="demo-section">
          <div className="stats-bar">
            <div className="stat">
              <span className="stat-label">전체</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat">
              <span className="stat-label">완료</span>
              <span className="stat-value stat-completed">{stats.completed}</span>
            </div>
            <div className="stat">
              <span className="stat-label">남음</span>
              <span className="stat-value stat-pending">{stats.pending}</span>
            </div>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              ❌ {error}
            </div>
          )}

          <div className="todo-list">
            {optimisticTodos.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <p>모든 할 일을 완료했습니다!</p>
              </div>
            ) : (
              optimisticTodos.map(todo => (
                <div
                  key={todo.id}
                  className={`todo-item ${todo.completed ? 'completed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo)}
                    className="todo-checkbox"
                    aria-label={`${todo.text} 완료 상태 토글`}
                  />

                  <span className="todo-text">{todo.text}</span>

                  <button
                    onClick={() => handleDelete(todo)}
                    className="delete-button"
                    aria-label={`${todo.text} 삭제`}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="demo-info">
            <h3>💡 시도해보세요</h3>
            <ul>
              <li>체크박스를 클릭하면 <strong>즉시</strong> 변경사항이 반영됩니다</li>
              <li>네트워크 지연(1.5초)에도 불구하고 UI는 즉시 반응합니다</li>
              <li>10% 확률로 에러가 발생하면 자동으로 이전 상태로 복원됩니다</li>
              <li>삭제 버튼도 동일하게 낙관적으로 동작합니다</li>
            </ul>
          </div>
        </div>

        <div className="info-section">
          <h3>주요 개념</h3>
          <div className="concept-card">
            <h4>🚀 낙관적 업데이트란?</h4>
            <p>
              서버 응답을 기다리지 않고 즉시 UI를 업데이트하여
              더 빠른 사용자 경험을 제공하는 패턴입니다.
            </p>
          </div>

          <div className="concept-card">
            <h4>🎯 useOptimistic 작동 원리</h4>
            <ol>
              <li>사용자 액션 발생 (예: 체크박스 클릭)</li>
              <li><code>updateOptimisticTodos</code>로 즉시 UI 업데이트</li>
              <li>백그라운드에서 실제 API 호출</li>
              <li>성공 시: 실제 상태 업데이트</li>
              <li>실패 시: 자동으로 이전 상태로 롤백</li>
            </ol>
          </div>

          <h3>코드 예시</h3>
          <div className="code-block">
            <pre>{`const [optimisticTodos, updateOptimisticTodos] =
  useOptimistic(todos, (state, action) => {
    // 낙관적 업데이트 로직
    if (action.type === 'toggle') {
      return state.map(todo =>
        todo.id === action.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    }
    return state;
  });

const handleToggle = async (todo) => {
  // 1. 즉시 UI 업데이트
  startTransition(() => {
    updateOptimisticTodos({
      type: 'toggle',
      id: todo.id
    });
  });

  try {
    // 2. 실제 API 호출
    await api.toggleTodo(todo.id);

    // 3. 성공 시 실제 상태 업데이트
    setTodos(prev => /* ... */);
  } catch {
    // 4. 실패 시 자동 롤백
  }
};`}</pre>
          </div>

          <h3>장점</h3>
          <ul className="benefits-list">
            <li>⚡ 즉각적인 UI 반응</li>
            <li>🎨 더 나은 사용자 경험</li>
            <li>🛡️ 자동 에러 복구</li>
            <li>🔄 간단한 상태 관리</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
