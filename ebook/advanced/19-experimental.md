# Chapter 19: 실험적 기능

## 개요

React 19에는 아직 실험 단계이지만 미래의 React 개발 방향을 보여주는 흥미로운 기능들이 있습니다. 이 장에서는 이러한 실험적 기능들을 탐구하고, 프로덕션 준비가 되었을 때를 대비합니다.

**⚠️ 주의:** 이 장의 기능들은 실험적이며 API가 변경될 수 있습니다. 프로덕션 사용 전 신중히 평가하세요.

**이 장에서 다룰 내용:**
- Activity API (실험적)
- Cache API 심화
- Taint API (보안)
- Offscreen API
- 향후 로드맵

## 핵심 개념

### 1. Activity API (실험적)

사용자의 활동 상태를 추적하고 반응하는 API입니다.

```typescript
import { unstable_Activity as Activity } from 'react';

function ChatApp() {
  return (
    <Activity
      onActivity={(type) => {
        console.log('User activity:', type);
        // 'focus', 'blur', 'visible', 'hidden'
      }}
    >
      <ChatInterface />
    </Activity>
  );
}
```

**활용 예시:**
```typescript
'use client';

import { useState, useEffect } from 'react';

function useUserActivity() {
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      setIsActive(true);
      setLastActivity(Date.now());
    };

    const handleInactive = () => {
      setIsActive(false);
    };

    // 활동 이벤트
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // 비활동 타이머
    let inactiveTimer: NodeJS.Timeout;
    const resetInactiveTimer = () => {
      clearTimeout(inactiveTimer);
      inactiveTimer = setTimeout(handleInactive, 5 * 60 * 1000); // 5분
    };

    document.addEventListener('mousemove', resetInactiveTimer);
    resetInactiveTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('mousemove', resetInactiveTimer);
      clearTimeout(inactiveTimer);
    };
  }, []);

  return { isActive, lastActivity };
}

// 사용
function TaskDashboard() {
  const { isActive, lastActivity } = useUserActivity();

  useEffect(() => {
    if (!isActive) {
      console.log('User inactive, pausing real-time updates');
      // WebSocket 연결 일시 중지 등
    }
  }, [isActive]);

  return (
    <div>
      <div className="activity-indicator">
        {isActive ? '🟢 활성' : '⚪ 비활성'}
      </div>
      <TaskList pauseUpdates={!isActive} />
    </div>
  );
}
```

### 2. Cache API 심화

React의 `cache()` 함수는 서버 컴포넌트에서 중복 요청을 방지합니다.

```typescript
import { cache } from 'react';
import { db } from './db';

// 단일 렌더링 내에서 같은 인자로 여러 번 호출해도 한 번만 실행
export const getUser = cache(async (userId: string) => {
  console.log('Fetching user:', userId); // 한 번만 출력

  return db.query.users.findFirst({
    where: eq(users.id, userId)
  });
});

// 컴포넌트에서 사용
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <div>{user.name}</div>;
}

async function UserAvatar({ userId }: { userId: string }) {
  const user = await getUser(userId); // 캐시된 결과 사용
  return <img src={user.avatar} />;
}

async function UserPage({ userId }: { userId: string }) {
  return (
    <div>
      <UserProfile userId={userId} />
      <UserAvatar userId={userId} />
      {/* getUser는 한 번만 호출됨 */}
    </div>
  );
}
```

**고급 캐싱 패턴:**
```typescript
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

// React cache - 렌더링 동안만 유지
export const getUserRender = cache(async (id: string) => {
  return fetch(`/api/users/${id}`).then(r => r.json());
});

// Next.js cache - 여러 요청에 걸쳐 유지
export const getUserPersistent = unstable_cache(
  async (id: string) => {
    return fetch(`/api/users/${id}`).then(r => r.json());
  },
  ['user-cache'],
  {
    revalidate: 60, // 60초
    tags: ['users']
  }
);

// 조합 사용
export const getUser = cache(async (id: string) => {
  // React cache로 렌더링 중 중복 제거
  // Next.js cache로 장기 캐싱
  return getUserPersistent(id);
});
```

### 3. Taint API (보안)

민감한 데이터가 클라이언트로 전송되는 것을 방지합니다.

```typescript
import { experimental_taintObjectReference } from 'react';

// 서버 전용 객체 표시
export async function getUser(id: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, id)
  });

  // 이 객체는 클라이언트로 직렬화할 수 없음
  experimental_taintObjectReference(
    'Do not pass user object to client',
    user
  );

  return user;
}

// ❌ 에러 발생
async function ServerComponent() {
  const user = await getUser('123');
  return <ClientComponent user={user} />; // Error: Tainted object!
}

// ✅ 필요한 데이터만 전달
async function ServerComponent() {
  const user = await getUser('123');
  return <ClientComponent userName={user.name} />; // OK
}
```

**값 Tainting:**
```typescript
import { experimental_taintUniqueValue } from 'react';

export async function getApiKey() {
  const apiKey = process.env.SECRET_API_KEY;

  // 이 값은 클라이언트로 전송할 수 없음
  experimental_taintUniqueValue(
    'Do not pass API key to client',
    globalThis,
    apiKey
  );

  return apiKey;
}
```

### 4. Offscreen API (실험적)

화면 밖 컴포넌트의 렌더링을 제어합니다.

```typescript
import { unstable_Offscreen as Offscreen } from 'react';

function TabPanel({ isActive, children }: {
  isActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <Offscreen mode={isActive ? 'visible' : 'hidden'}>
      {children}
    </Offscreen>
  );
}

// 사용
function TabbedInterface() {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab('tasks')}>Tasks</button>
        <button onClick={() => setActiveTab('projects')}>Projects</button>
      </div>

      {/* 모든 탭 렌더링, 하지만 비활성 탭은 hidden */}
      <TabPanel isActive={activeTab === 'tasks'}>
        <TaskList /> {/* 상태 유지됨 */}
      </TabPanel>

      <TabPanel isActive={activeTab === 'projects'}>
        <ProjectList /> {/* 상태 유지됨 */}
      </TabPanel>
    </div>
  );
}
```

**장점:**
- 탭 전환 시 상태 유지
- 빠른 전환 (이미 렌더링됨)
- 스크롤 위치 보존

### 5. useEffectEvent (실험적)

Effect 내에서 최신 값에 접근하되 의존성에 포함하지 않습니다.

```typescript
import { useEffect, experimental_useEffectEvent as useEffectEvent } from 'react';

function Chat({ roomId, onMessage }: {
  roomId: string;
  onMessage: (msg: string) => void;
}) {
  // onMessage가 변경되어도 Effect 재실행 안 함
  const handleMessage = useEffectEvent((msg: string) => {
    onMessage(msg); // 항상 최신 onMessage 사용
  });

  useEffect(() => {
    const socket = connectToRoom(roomId);

    socket.on('message', handleMessage);

    return () => socket.disconnect();
  }, [roomId]); // onMessage는 의존성 아님

  return <div>Chat</div>;
}
```

## 실습: 실험적 기능 활용

### 1. 고급 캐싱 전략

```typescript
// lib/cache-strategies.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

interface CacheOptions {
  revalidate?: number;
  tags?: string[];
}

/**
 * 다층 캐싱: React cache + Next.js cache
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions = {}
): T {
  // Next.js cache (영구)
  const persistentCached = unstable_cache(
    fn,
    [fn.name],
    {
      revalidate: options.revalidate,
      tags: options.tags
    }
  );

  // React cache (렌더링 동안)
  return cache(persistentCached) as T;
}

// 사용
export const getProject = createCachedFunction(
  async (projectId: string) => {
    return db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });
  },
  {
    revalidate: 60,
    tags: ['projects']
  }
);

export const getTasks = createCachedFunction(
  async (projectId: string) => {
    return db.query.tasks.findMany({
      where: eq(tasks.projectId, projectId)
    });
  },
  {
    revalidate: 30,
    tags: ['tasks']
  }
);
```

### 2. Taint를 사용한 보안 강화

```typescript
// lib/secure-data.ts
import { experimental_taintObjectReference, experimental_taintUniqueValue } from 'react';

export interface SecureUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Tainted!
  apiToken: string; // Tainted!
}

export async function getSecureUser(userId: string): Promise<SecureUser> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  // 민감한 필드 taint
  experimental_taintUniqueValue(
    'Password hash must not be sent to client',
    user,
    user.passwordHash
  );

  experimental_taintUniqueValue(
    'API token must not be sent to client',
    user,
    user.apiToken
  );

  return user;
}

// 안전한 공개 데이터
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export async function getPublicUser(userId: string): Promise<PublicUser> {
  const user = await getSecureUser(userId);

  // 안전한 필드만 반환
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar
  };
}

// 서버 컴포넌트
async function UserProfile({ userId }: { userId: string }) {
  const user = await getPublicUser(userId);

  // ✅ 안전 - 민감한 데이터 없음
  return <ClientUserProfile user={user} />;
}
```

### 3. Offscreen으로 탭 최적화

```typescript
'use client';

import { useState } from 'react';
import { unstable_Offscreen as Offscreen } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function OptimizedTabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="tabs-container">
      <div className="tab-buttons" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTab}
            onClick={() => setActiveTab(tab.id)}
            className={tab.id === activeTab ? 'active' : ''}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-panels">
        {tabs.map(tab => (
          <div
            key={tab.id}
            role="tabpanel"
            hidden={tab.id !== activeTab}
          >
            <Offscreen mode={tab.id === activeTab ? 'visible' : 'hidden'}>
              {tab.content}
            </Offscreen>
          </div>
        ))}
      </div>
    </div>
  );
}

// 사용
function ProjectDashboard() {
  return (
    <OptimizedTabs
      tabs={[
        {
          id: 'overview',
          label: '개요',
          content: <ProjectOverview />
        },
        {
          id: 'tasks',
          label: '태스크',
          content: <TaskList /> // 상태 유지됨
        },
        {
          id: 'analytics',
          label: '분석',
          content: <AnalyticsDashboard /> // 상태 유지됨
        }
      ]}
    />
  );
}
```

## React의 미래 로드맵

### 1. React Forget (자동 메모이제이션)

현재의 React Compiler가 발전한 형태입니다.

**목표:**
- 개발자가 `useMemo`, `useCallback` 작성 불필요
- 컴파일러가 모든 최적화 자동 처리
- 더 빠른 성능과 작은 번들 크기

### 2. Server Actions 개선

**예상 기능:**
- 더 나은 타입 안전성
- 자동 폼 검증
- 낙관적 업데이트 자동화
- 진행 상황 추적

```typescript
// 미래 예상 API
'use server';

export async function createTask(data: CreateTaskInput) {
  // 자동 검증
  // 자동 에러 처리
  // 자동 캐시 무효화
  return db.insert(tasks).values(data);
}
```

### 3. Streaming 개선

**예상 기능:**
- 더 세밀한 제어
- 선택적 hydration 개선
- 부분 렌더링 최적화

### 4. Asset Loading

```typescript
// 미래 예상 API
import { preloadImage, preloadFont } from 'react';

function ProductPage() {
  // 이미지 프리로드
  preloadImage('/hero-image.jpg', { priority: 'high' });

  // 폰트 프리로드
  preloadFont('/fonts/inter.woff2', { type: 'font/woff2' });

  return <div>...</div>;
}
```

## 실전에서 실험적 기능 사용하기

### 1. 기능 플래그 사용

```typescript
// lib/feature-flags.ts
export const featureFlags = {
  useOffscreen: process.env.NEXT_PUBLIC_USE_OFFSCREEN === 'true',
  useTaintAPI: process.env.NODE_ENV === 'production',
  useActivity: false // 아직 실험적
} as const;

// 사용
import { featureFlags } from '@/lib/feature-flags';

function MyComponent() {
  if (featureFlags.useOffscreen) {
    return <OptimizedTabs />;
  }

  return <RegularTabs />;
}
```

### 2. 점진적 도입

```typescript
// 1단계: 개발 환경에서만
if (process.env.NODE_ENV === 'development') {
  // 실험적 기능 사용
}

// 2단계: 베타 사용자에게만
if (user.isBetaTester) {
  // 실험적 기능 사용
}

// 3단계: 전체 사용자
// 안정화되면 모든 사용자에게 활성화
```

### 3. 에러 처리

```typescript
function SafeExperimentalFeature() {
  try {
    // 실험적 기능 사용
    return <ExperimentalComponent />;
  } catch (error) {
    console.error('Experimental feature failed:', error);
    // Fallback
    return <StableComponent />;
  }
}
```

## 연습 문제

### 기초
1. cache() 함수로 데이터 페칭 최적화
2. useEffectEvent로 Effect 최적화
3. 기능 플래그 시스템 구축

### 중급
4. Taint API로 민감한 데이터 보호
5. Offscreen API로 탭 성능 개선
6. Activity API로 사용자 활동 추적

### 고급
7. 다층 캐싱 전략 구현
8. 실험적 기능 안전하게 도입
9. 미래 API 예측 및 대비

## 다음 단계

마지막 장인 **마이그레이션 가이드**에서는:
- React 18에서 19로 마이그레이션
- 주요 Breaking Changes
- 코드베이스 업데이트 전략
- 테스트 및 검증

---

**핵심 요약:**
- 실험적 기능은 신중하게 사용하세요
- cache()로 서버 컴포넌트 성능을 최적화하세요
- Taint API로 보안을 강화하세요
- 기능 플래그로 점진적으로 도입하세요
- React의 미래 방향을 이해하고 준비하세요
