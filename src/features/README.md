# Features 디렉토리 구조

각 기능별로 독립적인 모듈로 구성되어 있습니다.

## 디렉토리 구조 규칙

각 feature는 다음과 같은 구조를 따릅니다:

```
features/
└── [feature-name]/
    ├── components/     # UI 컴포넌트
    ├── hooks/          # 커스텀 훅 (비즈니스 로직)
    ├── api/            # API 호출 함수
    ├── types/          # 해당 기능의 타입 정의
    └── utils/          # 유틸리티 함수
```

## Hook 인터페이스 예시

### useAuth
```typescript
interface UseAuth {
  user: User | null
  loading: boolean
  signIn: (credentials: LoginInput) => Promise<void>
  signUp: (data: SignupInput) => Promise<void>
  signOut: () => Promise<void>
}
```

### useGroups
```typescript
interface UseGroups {
  groups: Group[]
  loading: boolean
  error: Error | null
  createGroup: (data: CreateGroupInput) => Promise<Group>
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  joinGroup: (id: string) => Promise<void>
  leaveGroup: (id: string) => Promise<void>
}
```

### usePosts
```typescript
interface UsePosts {
  posts: Post[]
  loading: boolean
  hasMore: boolean
  error: Error | null
  loadMore: () => Promise<void>
  createPost: (data: CreatePostInput) => Promise<Post>
  updatePost: (id: string, data: Partial<Post>) => Promise<void>
  deletePost: (id: string) => Promise<void>
}
```

### useChat
```typescript
interface UseChat {
  messages: Message[]
  onlineUsers: PresenceState
  loading: boolean
  sendMessage: (content: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
}
```

## API 함수 예시

```typescript
// api/groups.ts
export const groupsApi = {
  list: (filters?: GroupFilters) => Promise<Group[]>,
  get: (id: string) => Promise<Group>,
  create: (data: CreateGroupInput) => Promise<Group>,
  update: (id: string, data: Partial<Group>) => Promise<void>,
  delete: (id: string) => Promise<void>,
  join: (id: string) => Promise<void>,
  leave: (id: string) => Promise<void>,
  members: (id: string) => Promise<GroupMember[]>
}
```