# Page snapshot

```yaml
- banner:
  - link "DevCom":
    - /url: /
  - navigation:
    - link "홈":
      - /url: /
    - link "지식 공유":
      - /url: /knowledge
    - link "자유게시판":
      - /url: /forum
    - link "커뮤니티":
      - /url: /communities
  - textbox "검색..."
  - text: ⌘ K
  - link "로그인":
    - /url: /auth/login
  - link "시작하기":
    - /url: /auth/signup
- main:
  - heading "로그인" [level=3]
  - paragraph: 이메일과 비밀번호를 입력하세요
  - text: 이메일
  - textbox "이메일"
  - text: 비밀번호
  - textbox "비밀번호"
  - button "로그인"
  - text: 계정이 없으신가요?
  - link "회원가입":
    - /url: /auth/signup
- button "Open Tanstack query devtools":
  - img
- alert
```