# React 19: ref as Prop

React 19의 가장 큰 변화 중 하나인 **ref를 일반 prop으로 사용하기**를 실습하는 예제입니다.

## 주요 변경사항

### React 18 ❌
```typescript
import { forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label }, ref) => {
    return <input ref={ref} />;
  }
);
```

### React 19 ✅
```typescript
function Input({ label, ref }: Props) {
  return <input ref={ref} />;
}
```

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:5173 을 열어보세요.

## 이 예제에서 배우는 것

1. ✅ **forwardRef 불필요**: ref를 일반 prop처럼 전달
2. ✅ **간소화된 타입**: 더 직관적인 타입 정의
3. ✅ **ref 활용**: useRef로 DOM 요소 제어
4. ✅ **포커스 관리**: ref를 사용한 입력 필드 포커스

## 코드 구조

```
src/
├── main.tsx        # 엔트리 포인트
├── App.tsx         # ref-as-prop 데모
├── App.css         # 스타일
└── index.css       # 글로벌 스타일
```

## 주요 기능

### 1. CustomInput 컴포넌트
- ref를 일반 prop으로 받음
- forwardRef 없이 구현

### 2. 버튼으로 포커스 제어
- nameInputRef, emailInputRef로 각 필드 참조
- 버튼 클릭 시 해당 필드에 포커스

### 3. Form 제출
- ref를 통해 값 접근
- 제출 시 alert로 표시

## 다음 단계

- **04-form-actions**: useActionState로 폼 처리
- **05-context**: 간소화된 Context API

## 관련 챕터

- ebook/basic/02-components-and-props.md
