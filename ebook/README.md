# React 19 실전 완벽 가이드

> 시나리오 기반으로 배우는 최신 React 개발

[![React Version](https://img.shields.io/badge/React-19.3.0-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📘 소개

이 전자책은 **React 19의 최신 기능**을 실전 중심으로 학습할 수 있도록 구성되었습니다. 단순한 이론 설명이 아닌, **협업 작업 관리 플랫폼 "TaskFlow"**를 처음부터 끝까지 구축하면서 React 19의 모든 주요 기능을 익힐 수 있습니다.

### 🎯 이 책의 특징

- ✅ **시나리오 기반 학습**: 하나의 완성된 앱을 만들어가며 학습
- ✅ **최신 React 19 기능**: useActionState, useOptimistic, use() 등 최신 API 완벽 커버
- ✅ **실행 가능한 코드**: 모든 예제 코드는 바로 실행 가능
- ✅ **비교 학습**: React 18과의 차이점을 명확히 설명
- ✅ **TypeScript 기반**: 타입 안전성을 고려한 모든 예제
- ✅ **프로덕션 준비**: 실전에서 사용할 수 있는 패턴과 모범 사례

---

## 🎓 대상 독자

- React 기초 지식이 있는 개발자
- React 18에서 19로 업그레이드를 고려하는 개발자
- 최신 React 패턴과 모범 사례를 학습하고자 하는 개발자
- 프로덕션 레벨의 React 앱을 만들고 싶은 개발자

---

## 🚀 무엇을 만들까요?

### TaskFlow - 협업 작업 관리 플랫폼

이 전자책을 통해 다음 기능을 가진 완전한 웹 애플리케이션을 구축합니다:

- 🔐 **사용자 인증 및 프로필 관리**
- 📁 **프로젝트 생성 및 관리**
- ✅ **작업(Task) CRUD**
- ⚡ **실시간 협업 및 낙관적 업데이트**
- 💬 **댓글 및 첨부파일**
- 📊 **대시보드 및 통계**
- 🔍 **검색 및 필터링**
- 🌓 **다크모드 및 접근성**

---

## 📚 목차

### PART 1: 기본편

| 챕터 | 제목 | 주요 내용 |
|------|------|----------|
| 1 | [React 19 시작하기](basic/01-getting-started.md) | 개발 환경 설정, 프로젝트 구조 |
| 2 | [컴포넌트와 Props](basic/02-components-and-props.md) | ref as prop, 컴포넌트 패턴 |
| 3 | [State와 기본 Hooks](basic/03-state-and-hooks.md) | useState, useEffect, useEffectEvent |
| 4 | [폼과 사용자 입력](basic/04-forms-and-input.md) | Form Actions, useActionState |
| 5 | [Context와 전역 상태](basic/05-context-and-state.md) | Context API, use() |
| 6 | [리스트와 조건부 렌더링](basic/06-lists-and-conditional.md) | 리스트 최적화 |
| 7 | [라우팅](basic/07-routing.md) | React Router v7 |
| 8 | [스타일링](basic/08-styling.md) | CSS Modules, Tailwind, 다크모드 |

### PART 2: 고급편

| 챕터 | 제목 | 주요 내용 |
|------|------|----------|
| 9 | [Transitions와 비동기 처리](advanced/09-transitions-async.md) | useTransition, Async Actions |
| 10 | [Optimistic Updates](advanced/10-optimistic-updates.md) | useOptimistic |
| 11 | [use() API 활용](advanced/11-use-api.md) | Promise/Context 읽기 |
| 12 | [Server Components](advanced/12-server-components.md) | RSC, cache(), Server Actions |
| 13 | [성능 최적화](advanced/13-performance.md) | Resource Hints, 최적화 패턴 |
| 14 | [React Compiler](advanced/14-react-compiler.md) | 자동 메모이제이션 |
| 15 | [Suspense와 에러 처리](advanced/15-suspense-error-handling.md) | Error Boundary, 에러 처리 |
| 16 | [Server-Side Rendering](advanced/16-ssr.md) | Streaming SSR, hydrateRoot |
| 17 | [테스팅](advanced/17-testing.md) | Vitest, Testing Library |
| 18 | [실전 패턴과 아키텍처](advanced/18-patterns-architecture.md) | 디자인 패턴, 폴더 구조 |
| 19 | [실험적 기능](advanced/19-experimental-features.md) | Activity, ViewTransition |
| 20 | [마이그레이션 가이드](advanced/20-migration-guide.md) | React 18 → 19 전환 |

---

## 🆕 React 19의 주요 새로운 기능

이 전자책에서 다루는 React 19의 핵심 기능들:

### 새로운 Hooks
- **useActionState**: Form Actions 상태 관리 (이전: useFormState)
- **useOptimistic**: 낙관적 UI 업데이트
- **use()**: Promise와 Context를 조건부로 읽기
- **useEffectEvent**: Effect에서 비반응형 로직 추출

### Actions & Transitions
- **Async Transitions**: startTransition이 async 함수 지원
- **Form Actions**: `<form action={}>` 네이티브 폼 통합
- **Server Actions**: 'use server' 지시어

### Server Features
- **Server Components**: 서버 측 React 컴포넌트
- **cache()**: 요청별 메모이제이션
- **Streaming SSR**: 점진적 서버 렌더링

### Performance
- **Resource Hints**: preload, preinit 등
- **React Compiler**: 자동 메모이제이션
- **useMemoCache**: 컴파일러 런타임

### API 개선
- **ref as prop**: forwardRef 불필요
- **Context 단순화**: `<Context>` 직접 사용
- **Activity 컴포넌트**: UI 상태 숨기기/복원
- **ViewTransition**: 페이지 전환 애니메이션

---

## 💻 개발 환경

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn 또는 pnpm

### 기술 스택
- React 19.3.0
- TypeScript 5.x
- Vite 6.x
- React Router 7.x
- Tailwind CSS 4.x
- Vitest + React Testing Library

---

## 🏃 시작하기

### 1. 저장소 클론
```bash
git clone <repository-url>
cd ebook
```

### 2. 챕터별로 학습
각 챕터는 독립적인 마크다운 파일로 구성되어 있습니다.

```bash
# 기본편부터 시작
cat basic/01-getting-started.md

# 코드 샘플 확인
cd code-samples/taskflow
```

### 3. 실습 프로젝트 실행
```bash
cd code-samples/taskflow
npm install
npm run dev
```

---

## 📖 학습 방법

### 권장 학습 순서

1. **순차적 학습** (권장)
   - Chapter 1부터 순서대로 학습
   - 각 챕터의 코드를 직접 작성하며 진행
   - 연습 문제를 풀어보기

2. **주제별 학습**
   - 특정 기능이 필요한 경우 해당 챕터로 이동
   - 전체 계획 문서를 참고하여 관련 챕터 찾기

3. **참조 자료로 활용**
   - 프로젝트 진행 중 필요한 패턴 검색
   - 코드 샘플을 프로젝트에 적용

### 각 챕터 구성

- **📖 개요**: 챕터 소개
- **🎯 구현할 기능**: TaskFlow에 추가할 기능
- **💡 핵심 개념**: 이론 설명
- **🛠️ 실습**: 단계별 코드 작성
- **✅ 완성 코드**: 전체 코드
- **🔍 코드 분석**: 심층 분석
- **⚠️ 주의사항**: 흔한 실수
- **💪 실전 팁**: 프로덕션 팁
- **🧪 테스트**: 테스트 코드
- **🎓 연습 문제**: 실습 과제

---

## 🎯 학습 목표 달성

이 전자책을 완료하면 다음을 할 수 있습니다:

- ✅ React 19의 모든 주요 기능을 이해하고 활용
- ✅ 프로덕션 레벨의 React 앱 개발
- ✅ 성능 최적화 및 모범 사례 적용
- ✅ Server Components와 SSR 구현
- ✅ React Compiler 활용
- ✅ 기존 React 18 프로젝트를 19로 마이그레이션

---

## 📁 프로젝트 구조

```
ebook/
├── README.md                   # 이 파일
├── 00-전체-계획.md              # 전체 계획 문서
│
├── basic/                      # 기본편 (Chapter 1-8)
│   ├── 01-getting-started.md
│   ├── 02-components-and-props.md
│   ├── 03-state-and-hooks.md
│   ├── 04-forms-and-input.md
│   ├── 05-context-and-state.md
│   ├── 06-lists-and-conditional.md
│   ├── 07-routing.md
│   └── 08-styling.md
│
├── advanced/                   # 고급편 (Chapter 9-20)
│   ├── 09-transitions-async.md
│   ├── 10-optimistic-updates.md
│   ├── 11-use-api.md
│   ├── 12-server-components.md
│   ├── 13-performance.md
│   ├── 14-react-compiler.md
│   ├── 15-suspense-error-handling.md
│   ├── 16-ssr.md
│   ├── 17-testing.md
│   ├── 18-patterns-architecture.md
│   ├── 19-experimental-features.md
│   └── 20-migration-guide.md
│
└── code-samples/               # 완성 코드 및 예제
    ├── taskflow/               # TaskFlow 프로젝트
    └── snippets/               # 챕터별 코드 조각
```

---

## 🤝 기여하기

오타, 기술적 오류, 개선 제안 등이 있다면 이슈를 열어주세요!

---

## 📄 라이선스

이 전자책은 React 공식 소스 코드(버전 19.3.0)를 기반으로 작성되었습니다.

---

## 🔗 유용한 링크

- [React 공식 문서](https://react.dev)
- [React 19 릴리스 노트](https://react.dev/blog)
- [React GitHub](https://github.com/facebook/react)
- [React Compiler](https://react.dev/learn/react-compiler)

---

## 📞 문의

질문이나 피드백이 있으시면 언제든지 연락주세요!

---

**준비되셨나요? [Chapter 1: React 19 시작하기](basic/01-getting-started.md)부터 시작해보세요!** 🚀
