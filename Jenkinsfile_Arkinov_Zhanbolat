pipeline {
  agent any

  environment {
    NODE_ENV = "production"
    IMAGE_NAME = "municipalist/todo-app"
    IMAGE_TAG = "latest"
    REGISTRY_CREDENTIALS = "docker-hub" // Jenkins credentials ID
  }

  options {
    ansiColor("xterm")
  }

  stages {
    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install") {
      steps {
        sh "npm ci"
      }
    }

    stage("Test") {
      steps {
        sh "npm test"
      }
    }

    stage("Build") {
      steps {
        sh "npm run build"
      }
    }

    stage("Docker Build") {
      steps {
        sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ."
      }
    }

    stage("Push") {
      steps {
        withCredentials([usernamePassword(
          credentialsId: REGISTRY_CREDENTIALS,
          usernameVariable: "DOCKER_USER",
          passwordVariable: "DOCKER_PASS"
        )]) {
          sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
          sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
        }
      }
    }
  }

  post {
    always {
      sh "docker logout || true"
      cleanWs()
    }
  }
}

