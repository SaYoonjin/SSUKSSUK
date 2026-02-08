# DB 덤프 파일 안내

## 파일 정보

| 항목 | 값 |
|------|----|
| 파일명 | `ssukssuk_dump.sql` |
| DBMS | MySQL 8.0 |
| Database | `ssukssuk` |
| Character Set | utf8mb4 |
| Collation | utf8mb4_unicode_ci |

## 덤프 생성 방법

서버(EC2)에서 아래 명령을 실행하여 최신 DB 덤프를 생성합니다:

```bash
# 프로젝트 루트로 이동
cd /home/ubuntu/S14P11A103

# .env 파일에서 비밀번호 읽기
source .env

# 덤프 생성
docker exec mysql mysqldump \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  --databases ssukssuk \
  --single-transaction \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  > exec/ssukssuk_dump.sql
```

## 덤프 복원 방법

```bash
# Docker 환경에서 복원
docker exec -i mysql mysql \
  -u root \
  -p${MYSQL_ROOT_PASSWORD} \
  < exec/ssukssuk_dump.sql

# 또는 로컬 MySQL에서 복원
mysql -u root -p < exec/ssukssuk_dump.sql
```

## 주의사항

- 덤프 파일에는 테이블 구조(DDL)와 데이터(DML)가 모두 포함되어 있습니다.
- Spring Boot의 `ddl-auto=update` 설정으로 엔티티 기반 자동 스키마 관리가 되므로, 빈 DB에서 앱을 실행해도 테이블이 자동 생성됩니다.
- 덤프 복원은 기존 데이터를 포함한 상태에서 시작하고 싶을 때 사용하세요.
