import { useActionState } from 'react';
import './App.css';

/**
 * Task 타입 정의
 */
interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

/**
 * Form State 타입
 */
interface FormState {
  success: boolean;
  error?: string;
  task?: Task;
}

/**
 * Server Action 시뮬레이션
 * 실제로는 'use server'를 사용하여 서버에서 실행
 */
async function addTaskAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  // 폼 데이터 추출
  const title = formData.get('title') as string;
  const priority = formData.get('priority') as 'low' | 'medium' | 'high';

  // 검증
  if (!title || title.trim().length < 3) {
    return {
      success: false,
      error: '제목은 최소 3자 이상이어야 합니다'
    };
  }

  // API 호출 시뮬레이션 (1초 대기)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 랜덤 에러 시뮬레이션 (20% 확률)
  if (Math.random() < 0.2) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.'
    };
  }

  // 성공
  const newTask: Task = {
    id: Math.random().toString(36).substr(2, 9),
    title: title.trim(),
    priority,
    createdAt: new Date()
  };

  return {
    success: true,
    task: newTask
  };
}

/**
 * 메인 App 컴포넌트
 */
function App() {
  // useActionState: React 19의 새로운 Hook
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    addTaskAction,
    { success: false }
  );

  return (
    <div className="app">
      <header className="header">
        <h1>React 19: Form Actions</h1>
        <p>useActionState로 간편한 폼 처리</p>
      </header>

      <main className="main">
        <div className="demo-section">
          <h2>새 태스크 추가</h2>

          <form action={formAction} className="form">
            <div className="input-group">
              <label htmlFor="title">태스크 제목 *</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="예: 문서 작성하기"
                required
                disabled={isPending}
              />
            </div>

            <div className="input-group">
              <label htmlFor="priority">우선순위 *</label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                disabled={isPending}
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary"
            >
              {isPending ? '추가 중...' : '태스크 추가'}
            </button>

            {/* 에러 메시지 */}
            {state?.error && (
              <div className="error-message" role="alert">
                ❌ {state.error}
              </div>
            )}

            {/* 성공 메시지 */}
            {state?.success && state?.task && (
              <div className="success-message" role="status">
                ✅ 태스크가 추가되었습니다!
                <div className="task-preview">
                  <strong>{state.task.title}</strong>
                  <span className={`badge badge-${state.task.priority}`}>
                    {state.task.priority === 'high' && '높음'}
                    {state.task.priority === 'medium' && '보통'}
                    {state.task.priority === 'low' && '낮음'}
                  </span>
                </div>
              </div>
            )}
          </form>

          {/* 로딩 인디케이터 */}
          {isPending && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>태스크 추가 중...</p>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>주요 기능</h3>
          <ul>
            <li>
              ✅ <strong>useActionState</strong>: 비동기 액션 상태 관리
            </li>
            <li>
              ✅ <strong>isPending</strong>: 자동 로딩 상태 추적
            </li>
            <li>
              ✅ <strong>FormData</strong>: 자동 폼 데이터 수집
            </li>
            <li>
              ✅ <strong>에러 처리</strong>: 간편한 에러 상태 관리
            </li>
          </ul>

          <h3>코드 비교</h3>
          <div className="code-comparison">
            <div className="code-block">
              <h4>React 18 ❌</h4>
              <pre>{`const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const formData = new FormData(e.target);
    await addTask(formData);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};`}</pre>
            </div>

            <div className="code-block">
              <h4>React 19 ✅</h4>
              <pre>{`const [state, formAction, isPending] =
  useActionState(addTaskAction, {});

return (
  <form action={formAction}>
    {/* 폼 필드 */}
    <button disabled={isPending}>
      {isPending ? '추가 중...' : '추가'}
    </button>
  </form>
);`}</pre>
            </div>
          </div>

          <h3>장점</h3>
          <div className="benefits">
            <div className="benefit-card">
              <span className="benefit-icon">⚡</span>
              <div>
                <strong>간결한 코드</strong>
                <p>보일러플레이트 코드 최소화</p>
              </div>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">🎯</span>
              <div>
                <strong>자동 상태 관리</strong>
                <p>로딩, 에러 상태 자동 추적</p>
              </div>
            </div>
            <div className="benefit-card">
              <span className="benefit-icon">🛡️</span>
              <div>
                <strong>타입 안전</strong>
                <p>TypeScript 완벽 지원</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
