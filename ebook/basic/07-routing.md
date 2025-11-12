# Chapter 7: 라우팅 (React Router v7)

> **학습 목표**: React Router v7를 사용하여 SPA 라우팅을 구현하고 고급 패턴을 마스터한다
> **소요 시간**: 120분
> **난이도**: 중급

## 📖 개요

Single Page Application(SPA)에서 라우팅은 필수 기능입니다. React Router v7은 최신 React 기능과 완벽하게 통합되며, Data Router API를 통해 데이터 로딩과 폼 제출을 선언적으로 처리할 수 있습니다.

이 챕터에서는 TaskFlow의 페이지 네비게이션을 구현하면서 React Router의 핵심 기능을 학습합니다.

## 🎯 이번 챕터에서 구현할 기능

- ✅ 기본 라우팅 설정
- ✅ 중첩 라우팅 (Nested Routes)
- ✅ 동적 라우팅 (Dynamic Routes)
- ✅ Loader로 데이터 페칭
- ✅ Action으로 데이터 변경
- ✅ Protected Routes

---

## 💡 핵심 개념

### 1. React Router 설치 및 설정

```bash
npm install react-router-dom
```

**src/main.tsx**:

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from './contexts/AppProviders';
import './styles/index.css';

// 라우트 정의
const router = createBrowserRouter([
  {
    path: '/',
    element: <h1>홈</h1>,
  },
  {
    path: '/about',
    element: <h1>소개</h1>,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
);
```

### 2. 기본 라우팅

**src/App.tsx**:

```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { TaskDetail } from './pages/TaskDetail';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/projects',
    element: <ProjectList />,
  },
  {
    path: '/projects/:projectId',
    element: <ProjectDetail />,
  },
  {
    path: '/tasks/:taskId',
    element: <TaskDetail />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
```

### 3. Link와 NavLink

```typescript
import { Link, NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav>
      {/* 기본 링크 */}
      <Link to="/">홈</Link>
      <Link to="/projects">프로젝트</Link>

      {/* 활성 상태 스타일링 */}
      <NavLink
        to="/projects"
        className={({ isActive }) =>
          isActive ? 'text-blue-600 font-bold' : 'text-gray-600'
        }
      >
        프로젝트
      </NavLink>
    </nav>
  );
}
```

### 4. 중첩 라우팅 (Nested Routes)

```typescript
import { Outlet } from 'react-router-dom';

// 레이아웃 컴포넌트
function RootLayout() {
  return (
    <div>
      <Header />
      <Outlet /> {/* 자식 라우트가 여기에 렌더링됨 */}
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true, // path: ''와 동일
        element: <Dashboard />,
      },
      {
        path: 'projects',
        element: <ProjectList />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetail />,
      },
    ],
  },
]);
```

### 5. 동적 라우팅

```typescript
import { useParams } from 'react-router-dom';

function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();

  return <div>프로젝트 ID: {projectId}</div>;
}
```

### 6. Loader - 데이터 페칭

```typescript
import { useLoaderData, LoaderFunctionArgs } from 'react-router-dom';

// Loader 함수
async function projectLoader({ params }: LoaderFunctionArgs) {
  const response = await fetch(`/api/projects/${params.projectId}`);
  if (!response.ok) {
    throw new Response('Not Found', { status: 404 });
  }
  return response.json();
}

// 라우트 설정
const router = createBrowserRouter([
  {
    path: '/projects/:projectId',
    element: <ProjectDetail />,
    loader: projectLoader,
  },
]);

// 컴포넌트에서 사용
function ProjectDetail() {
  const project = useLoaderData() as Project;

  return <div>{project.name}</div>;
}
```

### 7. Action - 데이터 변경

```typescript
import { Form, redirect, ActionFunctionArgs } from 'react-router-dom';

// Action 함수
async function createProjectAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const project = {
    name: formData.get('name'),
    description: formData.get('description'),
  };

  const response = await fetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });

  return redirect('/projects');
}

// 라우트 설정
const router = createBrowserRouter([
  {
    path: '/projects/new',
    element: <NewProject />,
    action: createProjectAction,
  },
]);

// 컴포넌트에서 사용
function NewProject() {
  return (
    <Form method="post">
      <input name="name" required />
      <textarea name="description" />
      <button type="submit">생성</button>
    </Form>
  );
}
```

---

## 🛠️ 실습: TaskFlow 라우팅 구조

### Step 1: 레이아웃 컴포넌트

**src/components/layout/RootLayout.tsx**:

```typescript
import { Outlet, Link, NavLink, useNavigation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function RootLayout() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const isLoading = navigation.state === 'loading';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 로고 */}
            <Link to="/" className="text-xl font-bold text-blue-600">
              TaskFlow
            </Link>

            {/* 네비게이션 */}
            <nav className="flex gap-4">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                대시보드
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                프로젝트
              </NavLink>
            </nav>

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm text-red-600 hover:underline"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 로딩 표시 */}
      {isLoading && (
        <div className="h-1 bg-blue-600 animate-pulse" />
      )}

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* 푸터 */}
      <footer className="bg-white dark:bg-gray-800 shadow mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-600">
            © 2025 TaskFlow. React 19로 구동중.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### Step 2: 라우트 정의

**src/router/index.tsx**:

```typescript
import { createBrowserRouter, redirect } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { ProjectList } from '@/pages/ProjectList';
import { ProjectDetail } from '@/pages/ProjectDetail';
import { NewProject } from '@/pages/NewProject';
import { EditProject } from '@/pages/EditProject';
import { TaskDetail } from '@/pages/TaskDetail';
import { NotFound } from '@/pages/NotFound';

// Loaders
import { projectListLoader } from '@/pages/ProjectList.loader';
import { projectDetailLoader } from '@/pages/ProjectDetail.loader';
import { taskDetailLoader } from '@/pages/TaskDetail.loader';

// Actions
import { createProjectAction } from '@/pages/NewProject.action';
import { updateProjectAction } from '@/pages/EditProject.action';
import { deleteProjectAction } from '@/pages/ProjectDetail.action';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // 공개 라우트
      {
        path: 'login',
        element: <Login />,
      },

      // 보호된 라우트
      {
        path: '',
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'projects',
            children: [
              {
                index: true,
                element: <ProjectList />,
                loader: projectListLoader,
              },
              {
                path: 'new',
                element: <NewProject />,
                action: createProjectAction,
              },
              {
                path: ':projectId',
                element: <ProjectDetail />,
                loader: projectDetailLoader,
                action: deleteProjectAction,
              },
              {
                path: ':projectId/edit',
                element: <EditProject />,
                loader: projectDetailLoader,
                action: updateProjectAction,
              },
            ],
          },
          {
            path: 'tasks/:taskId',
            element: <TaskDetail />,
            loader: taskDetailLoader,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
```

### Step 3: Loader 구현

**src/pages/ProjectDetail.loader.ts**:

```typescript
import { LoaderFunctionArgs } from 'react-router-dom';
import { Project } from '@/types/project';

export async function projectDetailLoader({ params }: LoaderFunctionArgs) {
  const { projectId } = params;

  if (!projectId) {
    throw new Response('Project ID is required', { status: 400 });
  }

  // API 호출 (시뮬레이션)
  const project = await fetchProjectById(projectId);

  if (!project) {
    throw new Response('Project not found', { status: 404 });
  }

  // 관련 tasks도 함께 로드
  const tasks = await fetchTasksByProjectId(projectId);

  return { project, tasks };
}

async function fetchProjectById(id: string): Promise<Project | null> {
  // 실제로는 API 호출
  const savedProjects = localStorage.getItem('taskflow-projects');
  if (!savedProjects) return null;

  const projects: Project[] = JSON.parse(savedProjects);
  return projects.find(p => p.id === id) || null;
}

async function fetchTasksByProjectId(projectId: string) {
  const savedTasks = localStorage.getItem('taskflow-tasks');
  if (!savedTasks) return [];

  const tasks = JSON.parse(savedTasks);
  return tasks.filter((t: any) => t.projectId === projectId);
}
```

**src/pages/ProjectDetail.tsx**:

```typescript
import { useLoaderData, useNavigate, Form } from 'react-router-dom';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { TaskCard } from '@/components/task/TaskCard';
import { Button } from '@/components/common/Button';

interface ProjectDetailData {
  project: Project;
  tasks: Task[];
}

export function ProjectDetail() {
  const { project, tasks } = useLoaderData() as ProjectDetailData;
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* 프로젝트 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {project.name}
            </h1>
            <p className="text-gray-600 mt-2">{project.description}</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/projects/${project.id}/edit`)}
            >
              수정
            </Button>

            <Form method="post">
              <input type="hidden" name="action" value="delete" />
              <Button
                type="submit"
                variant="danger"
                onClick={(e) => {
                  if (!confirm('정말 삭제하시겠습니까?')) {
                    e.preventDefault();
                  }
                }}
              >
                삭제
              </Button>
            </Form>
          </div>
        </div>
      </div>

      {/* 작업 리스트 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            작업 ({tasks.length}개)
          </h2>
          <Button onClick={() => navigate('/tasks/new')}>
            작업 추가
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">아직 작업이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 4: Action 구현

**src/pages/NewProject.action.ts**:

```typescript
import { ActionFunctionArgs, redirect } from 'react-router-dom';
import { Project } from '@/types/project';

export async function createProjectAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const newProject: Project = {
    id: crypto.randomUUID(),
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    color: formData.get('color') as string,
    ownerId: 'current-user', // 실제로는 인증된 사용자 ID
    memberIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 유효성 검사
  if (!newProject.name.trim()) {
    return { error: '프로젝트 이름을 입력하세요' };
  }

  // 저장 (시뮬레이션)
  const savedProjects = localStorage.getItem('taskflow-projects');
  const projects = savedProjects ? JSON.parse(savedProjects) : [];
  projects.push(newProject);
  localStorage.setItem('taskflow-projects', JSON.stringify(projects));

  // 생성된 프로젝트 페이지로 리다이렉트
  return redirect(`/projects/${newProject.id}`);
}
```

**src/pages/NewProject.tsx**:

```typescript
import { Form, useActionData, useNavigation } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export function NewProject() {
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">새 프로젝트</h1>

      <Form method="post" className="space-y-4 bg-white rounded-lg shadow p-6">
        {actionData?.error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-lg">
            {actionData.error}
          </div>
        )}

        <Input
          name="name"
          label="프로젝트 이름"
          required
          disabled={isSubmitting}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            name="description"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            disabled={isSubmitting}
          />
        </div>

        <Input
          type="color"
          name="color"
          label="색상"
          defaultValue="#3B82F6"
          disabled={isSubmitting}
        />

        <div className="flex gap-2">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? '생성 중...' : '프로젝트 생성'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
          >
            취소
          </Button>
        </div>
      </Form>
    </div>
  );
}
```

### Step 5: Protected Route 개선

**src/components/auth/ProtectedRoute.tsx**:

```typescript
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // 로그인 후 원래 페이지로 돌아가기 위해 state에 저장
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
```

**로그인 후 리다이렉트**:

```typescript
import { useLocation, useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);

    // 이전 페이지로 이동 (없으면 대시보드로)
    const from = location.state?.from?.pathname || '/';
    navigate(from, { replace: true });
  };

  // ...
}
```

---

## ✅ 완성 코드 구조

```
src/
├── router/
│   └── index.tsx                 ✅
├── pages/
│   ├── Dashboard.tsx             ✅
│   ├── Login.tsx                 ✅
│   ├── ProjectList.tsx           ✅
│   ├── ProjectList.loader.ts     ✅
│   ├── ProjectDetail.tsx         ✅
│   ├── ProjectDetail.loader.ts   ✅
│   ├── ProjectDetail.action.ts   ✅
│   ├── NewProject.tsx            ✅
│   ├── NewProject.action.ts      ✅
│   └── NotFound.tsx              ✅
└── components/
    └── layout/
        └── RootLayout.tsx        ✅
```

---

## 🔍 코드 분석

### Loader vs useEffect

```typescript
// ❌ useEffect로 데이터 페칭 (비효율적)
function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}`)
      .then(res => res.json())
      .then(setProject)
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div>로딩중...</div>;
  return <div>{project.name}</div>;
}

// ✅ Loader 사용 (효율적)
const router = createBrowserRouter([
  {
    path: '/projects/:projectId',
    element: <ProjectDetail />,
    loader: async ({ params }) => {
      const res = await fetch(`/api/projects/${params.projectId}`);
      return res.json();
    },
  },
]);

function ProjectDetail() {
  const project = useLoaderData();
  return <div>{project.name}</div>;
}
```

**Loader의 장점**:
- 라우트 전환 전에 데이터 로딩
- 자동 로딩 상태 관리
- 에러 처리 통합
- 데이터 재검증 (revalidation)

---

## ⚠️ 주의사항

### 1. Loader는 순수 함수여야 함

```typescript
// ❌ 외부 상태에 의존
let cache = {};
async function loader({ params }) {
  if (cache[params.id]) return cache[params.id];
  // ...
}

// ✅ 독립적인 함수
async function loader({ params }) {
  return fetch(`/api/${params.id}`).then(r => r.json());
}
```

### 2. Navigate는 이벤트 핸들러에서만

```typescript
// ❌ 렌더링 중 navigate 호출
function Component() {
  const navigate = useNavigate();
  if (condition) {
    navigate('/somewhere'); // 에러!
  }
}

// ✅ useEffect나 이벤트 핸들러에서
function Component() {
  const navigate = useNavigate();

  useEffect(() => {
    if (condition) {
      navigate('/somewhere');
    }
  }, [condition]);
}
```

---

## 💪 실전 팁

### 1. Route 에러 핸들링

```typescript
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }

  return <div>알 수 없는 에러가 발생했습니다</div>;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorBoundary />,
  },
]);
```

### 2. 데이터 재검증

```typescript
import { useRevalidator } from 'react-router-dom';

function Component() {
  const revalidator = useRevalidator();

  return (
    <button onClick={() => revalidator.revalidate()}>
      새로고침
    </button>
  );
}
```

### 3. 낙관적 UI

```typescript
import { useFetcher } from 'react-router-dom';

function TaskItem({ task }) {
  const fetcher = useFetcher();

  const isCompleting = fetcher.formData?.get('status') === 'done';
  const displayStatus = isCompleting ? 'done' : task.status;

  return (
    <div>
      <p>상태: {displayStatus}</p>
      <fetcher.Form method="post">
        <input type="hidden" name="status" value="done" />
        <button type="submit">완료</button>
      </fetcher.Form>
    </div>
  );
}
```

---

## 📚 참고 자료

- [React Router v6.4+ 공식 문서](https://reactrouter.com)
- [Data Router APIs](https://reactrouter.com/en/main/routers/picking-a-router)

---

## 🎓 연습 문제

### 기본

1. **Breadcrumb 컴포넌트**를 만드세요.

2. **검색 기능**을 URL 쿼리 파라미터로 구현하세요.

3. **탭 네비게이션**을 중첩 라우트로 구현하세요.

### 도전

4. **페이지네이션**을 URL 파라미터로 관리하세요.

5. **Modal 라우트**를 구현하세요 (배경에 이전 페이지).

6. **Prefetching**을 구현하여 링크에 마우스를 올리면 데이터를 미리 로드하세요.

---

## 💡 다음 챕터 예고

다음 챕터에서는 **스타일링**을 다룹니다:

- CSS Modules
- Tailwind CSS 통합
- 다크모드 구현
- 반응형 디자인
- 애니메이션

**[Chapter 8: 스타일링 →](08-styling.md)**

---

**축하합니다!** 🎉 React Router를 마스터했습니다!
