# React 19 코드 샘플

이 디렉토리는 ebook의 각 챕터에서 다룬 내용을 실제로 실행해볼 수 있는 예제 코드를 포함합니다.

## 📁 구조

```
code-samples/
├── basic/              # 기본편 샘플
│   ├── 01-hello-react-19/
│   ├── 02-ref-as-prop/
│   ├── 03-state-hooks/
│   ├── 04-form-actions/
│   ├── 05-context/
│   └── ...
├── advanced/           # 고급편 샘플
│   ├── 09-transitions/
│   ├── 10-optimistic-updates/
│   ├── 11-use-api/
│   ├── 12-server-components/
│   └── ...
└── shared/             # 공통 유틸리티
    ├── components/
    └── utils/
```

## 🚀 실행 방법

각 샘플은 독립적으로 실행할 수 있습니다:

```bash
# 1. 샘플 디렉토리로 이동
cd basic/01-hello-react-19

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 http://localhost:5173 열기
```

## 📋 샘플 목록

### 기본편

| 샘플 | 설명 | 주요 기능 |
|------|------|-----------|
| **01-hello-react-19** | React 19 시작하기 | createRoot, StrictMode |
| **02-ref-as-prop** | ref를 일반 prop으로 사용 | No forwardRef |
| **03-state-hooks** | State와 Hooks | useState, useEffect, useRef |
| **04-form-actions** | Form Actions | useActionState, useFormStatus |
| **05-context** | Context API | 간소화된 Provider |
| **06-task-list** | 태스크 리스트 | 종합 예제 |

### 고급편

| 샘플 | 설명 | 주요 기능 |
|------|------|-----------|
| **09-transitions** | Async Transitions | startTransition, useDeferredValue |
| **10-optimistic-updates** | 낙관적 업데이트 | useOptimistic |
| **11-use-api** | use() API | Promise/Context 읽기 |
| **12-server-components** | Server Components | Next.js, RSC |
| **13-performance** | 성능 최적화 | Resource Hints, Virtualization |
| **14-compiler** | React Compiler | 자동 메모이제이션 |
| **15-suspense** | Suspense & Error | use() + Suspense + ErrorBoundary |

## 🛠️ 요구사항

- **Node.js**: 18.17.0 이상
- **npm**: 9.0.0 이상

## 📦 공통 의존성

모든 샘플은 다음 패키지를 사용합니다:

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0"
  }
}
```

## 🎯 학습 팁

1. **순서대로 학습**: 기본편부터 시작하여 고급편으로 진행하세요
2. **코드 수정**: 예제를 직접 수정하며 실험해보세요
3. **DevTools 활용**: React DevTools로 컴포넌트 구조를 확인하세요
4. **에러 경험**: 일부러 에러를 만들어보며 디버깅 연습을 하세요

## 🔗 관련 링크

- [React 19 공식 문서](https://react.dev)
- [Vite 문서](https://vitejs.dev)
- [TypeScript 문서](https://www.typescriptlang.org)

## ❓ 문제 해결

### Port가 이미 사용 중일 때

```bash
# 다른 포트로 실행
npm run dev -- --port 3000
```

### 의존성 오류

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### TypeScript 에러

```bash
# 타입 체크
npm run type-check
```

## 📝 라이선스

이 예제 코드는 학습 목적으로 자유롭게 사용할 수 있습니다.
