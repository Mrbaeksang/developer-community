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
- heading "회원가입" [level=3]
- paragraph: 새로운 계정을 만들어보세요
- text: 이메일
- textbox "이메일"
- text: 사용자명
- textbox "사용자명"
- text: 표시 이름
- textbox "표시 이름"
- text: 비밀번호
- textbox "비밀번호"
- paragraph: 최소 8자, 대문자, 소문자, 숫자 포함
- text: 비밀번호 확인
- textbox "비밀번호 확인"
- button "가입하기"
- text: 이미 계정이 있으신가요?
- link "로그인":
  - /url: /auth/login
- alert
```