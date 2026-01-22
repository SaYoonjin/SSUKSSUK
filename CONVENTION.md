# Git Convention Guide

## Branch Naming Convention

### 형식
```
<type>/<issue-number>-<short-description>
```

### Branch Types
| Type | 설명 | 예시 |
|------|------|------|
| `feature` | 새로운 기능 개발 | `feature/S14P11A103-123-user-login` |
| `fix` | 버그 수정 | `fix/S14P11A103-456-login-error` |
| `hotfix` | 긴급 버그 수정 (production) | `hotfix/S14P11A103-789-critical-fix` |
| `refactor` | 코드 리팩토링 | `refactor/S14P11A103-101-clean-service` |
| `docs` | 문서 작업 | `docs/S14P11A103-102-api-docs` |
| `test` | 테스트 코드 | `test/S14P11A103-103-unit-tests` |
| `chore` | 빌드, 설정 등 기타 | `chore/S14P11A103-104-ci-setup` |
| `infra` | 인프라 관련 | `infra/S14P11A103-105-docker-setup` |

### 주요 브랜치
| Branch | 설명 |
|--------|------|
| `master` | 배포 가능한 상태 유지 |
| `develop` | 개발 통합 브랜치 |

---

## Commit Message Convention

### 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
| Type | 설명 |
|------|------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷팅 (기능 변화 없음) |
| `refactor` | 코드 리팩토링 |
| `test` | 테스트 코드 추가/수정 |
| `chore` | 빌드, 설정 파일 수정 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 설정 변경 |

### Scope (선택)
변경된 범위를 명시합니다.
- `backend`, `frontend`, `infra`, `device`, `ai`

### Subject
- 50자 이내
- 마침표 없이
- 명령문으로 작성 (Add, Fix, Update, Remove 등)

### Body (선택)
- 무엇을, 왜 변경했는지 설명
- 72자마다 줄바꿈

### Footer (선택)
- Issue tracker ID 연결
- Breaking changes 명시

---

## Examples

### Branch
```bash
# 기능 개발
git checkout -b feature/S14P11A103-42-mqtt-integration

# 버그 수정
git checkout -b fix/S14P11A103-55-sensor-data-null

# 인프라
git checkout -b infra/S14P11A103-60-docker-compose
```

### Commit
```bash
# 간단한 커밋
git commit -m "feat(backend): MQTT 센서 데이터 수신 기능 추가"

# 상세 커밋
git commit -m "fix(backend): 센서 데이터 null 처리 오류 수정

- SensorService에서 null 체크 로직 추가
- 예외 발생 시 기본값 반환하도록 변경

Closes #55"
```

### MR/PR Title
```
[S14P11A103-42] feat(backend): MQTT 센서 데이터 수신 기능 추가
```

---

## Git Flow

```
master ─────●─────────────────●─────────────── (배포)
            │                 ↑
            │                 │ merge
            ↓                 │
develop ────●────●────●───────●──────────────── (개발 통합)
                 │    ↑
                 │    │ merge
                 ↓    │
feature ─────────●────●─────────────────────── (기능 개발)
```

1. `develop`에서 `feature` 브랜치 생성
2. 기능 개발 완료 후 MR 생성
3. 코드 리뷰 후 `develop`에 merge
4. 배포 시 `develop` → `master` merge
