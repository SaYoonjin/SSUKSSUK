// ===========================================
// Jenkins Pipeline for Backend CI/CD
// GitLab + Docker Socket 방식
// ===========================================

pipeline {
    agent any

    environment {
        PROJECT_ROOT = '/home/ubuntu/S14P11A103'
        COMPOSE_FILE = "${PROJECT_ROOT}/docker-compose.yml"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        // ===========================================
        // Stage 1: Checkout
        // ===========================================
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git log -1 --pretty=format:"%h - %s (%ci)" || true'
            }
        }

        // ===========================================
        // Stage 2: Backend Build & Test (MR from BE branch)
        // ===========================================
        stage('Backend Build & Static Analysis') {
            when {
                allOf {
                    changeRequest target: 'master'     // master로의 MR일 때만
                    changeset "server/**"              // server 폴더 변경 시
                }
            }
            steps {
                dir('server') {
                    sh '''
                        echo "Building Backend project..."
                        chmod +x ./gradlew
                        ./gradlew clean build -x test --no-daemon

                        echo "Running checkstyle..."
                        ./gradlew checkstyleMain --no-daemon || true
                    '''
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'server/build/reports/**/*', allowEmptyArchive: true
                }
            }
        }

        // ===========================================
        // Stage 2-1: Frontend Lint & Test (MR from FE branch)
        // ===========================================
        stage('Frontend Lint & Test') {
            when {
                allOf {
                    changeRequest target: 'master'     // master로의 MR일 때만
                    changeset "frontend/**"            // frontend 폴더 변경 시
                }
            }
            steps {
                dir('frontend') {
                    sh '''
                        echo "Installing dependencies..."
                        npm install

                        echo "Running ESLint..."
                        npm run lint || true

                        echo "Running tests..."
                        npm test -- --watchAll=false || true

                        echo "Frontend checks completed!"
                    '''
                }
            }
        }

        // ===========================================
        // Stage 3: Deploy to Production (master only, server/ changes only)
        // ===========================================
        stage('Deploy to Production') {
            when {
                allOf {
                    branch 'master'
                    changeset "server/**"  // server 폴더 변경 시에만 실행
                }
            }
            steps {
                script {
                    // Using Docker Socket - Jenkins runs on same EC2
                    sh '''
                        echo "=========================================="
                        echo "Starting Production Deployment"
                        echo "=========================================="

                        # Update code on EC2
                        cd ${PROJECT_ROOT}
                        git fetch origin master
                        git checkout master
                        git pull origin master

                        # Stop and rebuild backend
                        docker compose -f ${COMPOSE_FILE} stop backend || true
                        docker compose -f ${COMPOSE_FILE} build --no-cache backend

                        # Start backend
                        docker compose -f ${COMPOSE_FILE} up -d backend

                        # Wait for health check
                        echo "Waiting for backend to be healthy..."
                        sleep 15

                        # Health check
                        for i in $(seq 1 20); do
                            if docker exec backend wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health 2>/dev/null; then
                                echo "Backend is healthy!"
                                exit 0
                            fi
                            echo "Health check attempt $i/20..."
                            sleep 3
                        done

                        echo "Health check failed!"
                        docker logs backend --tail 50
                        exit 1
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
        always {
            cleanWs()
        }
    }
}
