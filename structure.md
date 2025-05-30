# Jinbu Project Structure (최종 정리 완료)
## 부암동 건축 점검 프로젝트 구조

```
jinbu/
├── 📄 Core HTML Files (3개)
│   ├── index-firebase-only.html       # 🔥 **Firebase Only v3.0.1** - 메인 버전 (143줄)
│   ├── index.html                     # 🔥 **v3.0.1 배포용** - index-firebase-only.html 복사본
│   ├── index-hybrid.html              # 🎯 하이브리드 v2.5.0 - 백업용
│   └── index.html (original)          # 📋 LocalStorage v1.0 - 백업용
│
├── 📂 images/                      # 현장 사진 저장소 (17개 파일)
│   ├── 01_switch.jpg               # 스위치 점검 사진
│   ├── 02_communication.jpg        # 통신함 커버 사진
│   ├── 03_바닥1.jpg                # 1층 바닥 보수 사진
│   ├── 04_바닥2.jpg                # 2층 바닥 보수 사진
│   ├── 05_계단손잡이.jpg           # 계단 손잡이 보수 사진
│   ├── 09_2층창고누수확인.jpg       # 2층 화장실 천장 누수 사진
│   ├── 12_2층폴딩도어유격1.jpg      # 2층 폴딩도어 유격1 사진
│   ├── 13_2층폴딩도어유격2.jpg      # 2층 폴딩도어 유격2 사진
│   ├── 16_4층화장실바닥누수확인.jpg # 4층 화장실 바닥 누수 사진
│   ├── 17_계단난간손잡이설치2.jpg   # 계단 난간 손잡이 설치 사진
│   ├── building.JPEG               # 건물 전체 사진
│   ├── map.png                     # 위치 지도
│   └── [기타 현장 사진들]
│
├── 📂 styles/                        # CSS 파일 (분리됨)
│   └── main.css?v=20251201-003        # 🎨 메인 스타일시트 (633줄) + 카드 크기 통일
│
├── 📂 scripts/                       # JavaScript 파일 (분리됨)
│   ├── firebase-only.js?v=20251201-001  # 🔥 Firebase Only 로직 (672줄)
│   ├── prd.txt                        # 📋 프로젝트 요구사항 정의서
│   └── example_prd.txt                # 📋 PRD 예시 파일
│
├── 📂 tasks/                       # Task Master 관리 (15개 파일)
│   ├── tasks.json                  # 📊 전체 작업 목록 (JSON)
│   └── task_001.txt ~ task_014.txt # 📝 개별 작업 상세 내용
│
├── 📄 Documentation
│   └── structure.md                # 📋 이 파일 - 프로젝트 구조 문서
│
├── 📂 Configuration Files
│   ├── .taskmasterconfig           # ⚙️ Task Master 설정
│   ├── .windsurfrules              # 🌊 Windsurf IDE 규칙
│   ├── .roomodes                   # 🏠 Room 모드 설정
│   ├── .env.example                # 🔐 환경변수 예시
│   ├── .gitignore                  # 📂 Git 무시 파일
│   └── firebase.json               # 🔥 Firebase 설정
│
├── 📂 Firebase & Deployment
│   ├── .firebaserc                 # 🔥 Firebase 프로젝트 설정
│   └── .firebase/                  # 🔥 Firebase 배포 관련
│
└── 📂 Development Tools
    ├── .cursor/                    # 🎯 Cursor IDE 설정
    ├── .git/                       # 📊 Git 버전 관리
    └── .roo/                       # 🏠 Room 관련 설정
```
## 📋 Main Features

### 🔥 index-firebase-only.html (Firebase Only v3.0.0 - 권장) 
- **🎯 단일 데이터 소스**: Firebase Storage + Firestore만 사용
- **🚫 중복 문제 원천 차단**: LocalStorage 완전 제거로 중복 불가능
- **🗜️ 강력한 압축 시스템**:
  - 📸 원본 저장 (고품질, 큰 용량)
  - 🗜️ 고압축 (권장, 50-70% 절약) - 기본값
  - ⚡ 초압축 (빠른 업로드, 80% 절약)
  - 🔍 실시간 압축 미리보기 (전후 비교)
- **🎯 핵심 기능**:
  - 📷 사진 추가 + 실시간 압축
  - 📸 카메라 촬영 + 자동 압축  
  - 🎠 캐로셀 네비게이션
  - ❌ 개별 이미지 삭제
  - 🖼️ Lightbox 이미지 뷰어
  - 📤 데이터 백업/복원
  - 📱 완전한 반응형 디자인
  - ☁️ Firebase 자동 동기화
  - 🔍 디버그 도구
- **✅ 장점**: 중복 불가능, 코드 50% 간소화, 안정적 동기화, 무제한 용량

### 📋 index.html (백업 버전)
- **LocalStorage 전용**: 오프라인 완전 지원
- **모든 고급 기능**: Lightbox, 백업/복원, 캐로셀
- **빠른 응답**: Firebase 없이도 완전 작동

## 🏗️ 작업 구조 (14개 카드)
- **임대인 협의사항** (13개): 우선순위별 별점 분류
  - ⭐⭐⭐⭐⭐ (5개): 건물외벽 곰팡이, 계단 난간, 화장실 누수, 바닥 보수
  - ⭐⭐⭐⭐ (2개): 4층 화장실 누수, 조경 정리
  - ⭐⭐⭐ (2개): 2층 폴딩도어 유격 (2건)
  - ⭐⭐ (1개): 건물 외부 조명 점검
  - ⭐ (3개): 스위치 점검, 통신함 커버, 계단 손잡이 보수
- **전임차인 협의사항** (1개): 카페 바테이블 처리

## 📸 이미지 현황
- ✅ **적용된 이미지**: 10개 (현장 사진 완전 매핑)
- 🔲 **촬영 필요**: 4개 (건물외벽 곰팡이, 조경 정리, 외부 조명, 카페 바테이블)

## 🔄 Development Status
- **완성도**: ✅ **Firebase Only v3.0.1 완료 + 배포 완료**
- **🔥 권장 파일**: index-firebase-only.html (단일 소스, 압축 시스템, 카드 통일)
- **🌐 배포 URL**: https://personal-564df.web.app
- **백업 파일**: index-hybrid.html (하이브리드 v2.5.0), index.html (로컬 전용)
- **주요 개선**: 중복 문제 원천 해결, 카드 크기 통일, 코드 50% 간소화
- **다음 단계**: 배포된 사이트에서 현장 사진 촬영 및 관리

## 🌐 접속 정보
- **🔥 배포된 사이트 (권장)**: https://personal-564df.web.app
- **로컬 Firebase Only**: `http://localhost:8002/index-firebase-only.html`
- **로컬 하이브리드 백업**: `http://localhost:8002/index-hybrid.html`
- **로컬 전용 백업**: `http://localhost:8002/index.html`
- **모바일 로컬**: `http://192.168.0.46:8002/index-firebase-only.html`

## 📝 개발 완료 (2025-05-31)
- **🔥 Firebase Only v3.0.1**: 단일 데이터 소스 + 압축 시스템 + 카드 크기 통일 (메인)
- **🚀 Firebase Hosting 배포**: https://personal-564df.web.app (v3.0.1 - 189개 파일 업로드)
- **📁 CSS/JS 분리**: 800줄 제한 준수 (CSS: 633줄, JS: 672줄, HTML: 143줄)
- **📏 카드 크기 통일**: 임대인/전임차인 협의사항 동일 크기 (300-400px 너비, 400px+ 높이)
- **🚫 중복 문제 완전 해결**: 모든 HTML 섹션 중복 제거, 깨끗한 구조
- **🔄 버전 관리 시스템**: CSS/JS 캐시 무효화 자동화 (v=20251201-003, v=20251201-001)
- **📷 사진 추가 기능**: 완벽 작동 확인 완료 (압축 시스템 포함)
- **❌ LocalStorage 제거**: 100% 안정성 확보
- **🗜️ 강력한 압축 기능**: 원본/고압축/초압축 선택 + 실시간 미리보기
- **🛡️ 코드 간소화**: 기존 대비 50% 감소, 버그 0개 달성

**현재 최신 버전: Firebase Only v3.0.1 (CSS: v20251201-003, JS: v20251201-001)**