import { useRef } from 'react';
import './App.css';

/**
 * React 19: ref를 일반 prop으로 받기
 * forwardRef 불필요!
 */
interface InputProps {
  label: string;
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>;
}

function CustomInput({ label, placeholder, ref }: InputProps) {
  return (
    <div className="input-group">
      <label>{label}</label>
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        className="custom-input"
      />
    </div>
  );
}

/**
 * 비교: React 18 방식 (참고용)
 *
 * import { forwardRef } from 'react';
 *
 * const CustomInput = forwardRef<HTMLInputElement, InputProps>(
 *   ({ label, placeholder }, ref) => {
 *     return (
 *       <div className="input-group">
 *         <label>{label}</label>
 *         <input ref={ref} type="text" placeholder={placeholder} />
 *       </div>
 *     );
 *   }
 * );
 */

function App() {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleFocusName = () => {
    nameInputRef.current?.focus();
  };

  const handleFocusEmail = () => {
    emailInputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name = nameInputRef.current?.value;
    const email = emailInputRef.current?.value;

    alert(`이름: ${name}\n이메일: ${email}`);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>React 19: ref as Prop</h1>
        <p>forwardRef 없이 ref를 일반 prop처럼 사용하기</p>
      </header>

      <main className="main">
        <div className="demo-section">
          <h2>예제: 사용자 정보 입력</h2>

          <form onSubmit={handleSubmit} className="form">
            <CustomInput
              label="이름"
              placeholder="홍길동"
              ref={nameInputRef}
            />

            <CustomInput
              label="이메일"
              placeholder="example@email.com"
              ref={emailInputRef}
            />

            <div className="button-group">
              <button type="button" onClick={handleFocusName} className="btn-secondary">
                이름 입력칸 포커스
              </button>
              <button type="button" onClick={handleFocusEmail} className="btn-secondary">
                이메일 입력칸 포커스
              </button>
            </div>

            <button type="submit" className="btn-primary">
              제출
            </button>
          </form>
        </div>

        <div className="info-section">
          <h3>주요 변경사항</h3>
          <ul>
            <li>✅ <code>forwardRef</code> 불필요</li>
            <li>✅ ref를 일반 prop처럼 전달</li>
            <li>✅ 타입 정의 간소화</li>
            <li>✅ 더 직관적인 코드</li>
          </ul>

          <h3>코드 비교</h3>
          <div className="code-comparison">
            <div className="code-block">
              <h4>React 18 ❌</h4>
              <pre>{`const Input = forwardRef<HTMLInputElement, Props>(
  ({ label }, ref) => {
    return <input ref={ref} />;
  }
);`}</pre>
            </div>

            <div className="code-block">
              <h4>React 19 ✅</h4>
              <pre>{`function Input({ label, ref }: Props) {
  return <input ref={ref} />;
}`}</pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
