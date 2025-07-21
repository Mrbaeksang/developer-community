# Page snapshot

```yaml
- banner:
  - link "Dev Community":
    - /url: /
  - navigation:
    - link "게시글":
      - /url: /posts
    - link "커뮤니티":
      - /url: /communities
  - link "로그인":
    - /url: /auth/login
  - link "회원가입":
    - /url: /auth/signup
- alert
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
```