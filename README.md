# Sukito

> 구글 캘린더와 실시간으로 동기화되며, 내 PC의 테마와 창밖의 날씨에 따라 유동적으로 변화하는 가장 진보된 일정 관리 도구입니다.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss)

---

## 📸 미리보기

_(일정 관리와 실시간 날씨 애니메이션이 포함된 스크린샷을 여기에 추가하세요)_

---

## 📦 다운로드

[Releases](../../releases) 페이지에서 최신 버전을 다운로드하세요:

| 파일 | 설명 |
|------|------|
| `Sukito_x.x.x_x64_en-US.msi` | Windows 설치 파일 (MSI) |
| `Sukito_x.x.x_x64-setup.exe` | Windows 설치 파일 (NSIS) |

---

## 🌟 핵심 기능

### 💎 감각적인 디자인 (Glassmorphism)

- **Windows 11 Mica 효과**: 고성능 백드롭 블러(70px)와 채도 조절로 구현된 투명 유리 질감
- **시스템 강조색 동기화**: 윈도우 강조 색상(Accent Color)을 자동으로 감지하여 UI 테마에 적용
- **보더리스 직사각형 디자인**: 배경화면과 자연스럽게 어우러지는 미니멀한 레이아웃

### 📅 강력한 일정 관리

- **구글 캘린더 양방향 동기화**: 위젯 ↔ 구글 캘린더 실시간 반영, 주차별 캐싱(30분 TTL)으로 불필요한 API 호출 최소화
- **영구 로그인**: 리프레시 토큰 방식으로 최초 1회 로그인 후 세션 영구 유지
- **지능형 반복 일정**: 매주 / 격주(2주마다) 반복 지원
- **시간 흐름 인디케이터**: 오늘 하루 / 이번 달 진행률을 헤더 진행 바로 표시
- **10분 전 알림**: 일정 시작 10분 전 하프 소리 + 시스템 토스트 알림

### 🌦️ 날씨 경험

- **실시간 날씨**: Rust 백엔드를 통해 현재 위치의 날씨·온도 30분마다 갱신
- **날씨 테마 애니메이션**: 비·눈·번개 날씨에 맞는 배경 시각 효과

### 🔧 스마트 유틸리티

- **다국어 지원**: 한국어 · 日本語 · English
- **위젯 잠금**: 실수로 이동/클릭되지 않도록 잠금 기능
- **배경 투명도**: 슬라이더로 실시간 조절

---

## 🛠 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Desktop | Tauri 2 (Rust) |
| 날짜 처리 | date-fns, date-fns-tz |
| API | Google Calendar API v3, OpenWeatherMap API, ip-api |
| 기타 | winreg (Windows 레지스트리), LocalStorage |

---

## 🚀 개발 환경 설정

### 사전 준비

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri 사전 준비](https://tauri.app/start/prerequisites/)

### 설치

```bash
git clone https://github.com/Sukito/glassy-widget.git
cd glassy-widget
npm install
```

### 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 값을 채워넣습니다:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OWM_API_KEY=your_openweathermap_api_key
```

> **참고:** `.env`는 빌드 시점에 Rust 바이너리에 주입되며, 배포 파일에는 포함되지 않습니다.

### 실행 및 빌드

```bash
# 개발 모드
npm run tauri dev

# 배포 빌드
npm run tauri build
# → src-tauri/target/release/bundle/ 에 설치 파일 생성
```

---

## ⚙️ API 키 발급

### Google OAuth 2.0

1. [Google Cloud Console](https://console.cloud.google.com/) → 새 프로젝트 생성
2. **Google Calendar API** 활성화
3. 사용자 인증 정보 → **OAuth 2.0 클라이언트 ID** 생성 (데스크톱 앱)
4. 승인된 리디렉션 URI에 `http://127.0.0.1` 추가
5. 발급된 Client ID · Secret을 `.env`에 입력

### OpenWeatherMap

1. [openweathermap.org](https://openweathermap.org) 회원가입
2. API Keys 메뉴에서 키 발급 (무료 플랜으로 충분)
3. 발급된 키를 `.env`의 `OWM_API_KEY`에 입력

---

## 📝 라이선스

MIT License — 자유롭게 수정 및 배포 가능합니다.
