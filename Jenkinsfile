pipeline {
    agent any
    // agent {
    //   docker {
    //     image "node:16-alpine"
    //   }
    // }
    environment {
      APP_NAME = "${env.APPLICATION_NAME}"
      ENVIRONMENT = "${env.NODE_ENV == "production" ? "prod" : "qa"}"
      APP_VERSION = getPackageJsonVersion(env.UPDATE_TYPE)
      BRANCH = env.BRANCH_TO_BUILD.replaceAll("origin/", "")
    }

    stages {

        stage("Proceed to deploy?") {
          steps {
            timeout(time: 30, unit: "MINUTES") {
              input("Deseja proceder com o Deploy no ambiente de ${ENVIRONMENT}?")
            }
          }
        }

        stage("Update version") {
          steps {
            updatePackageJsonVersion(APP_VERSION)
          }
        }

        stage("Create docker image") {
          steps {
            sh "docker build ${getBuildArgs()} -t ${APP_NAME.toLowerCase()}:${APP_VERSION} ."
          }
        }

        stage("Delete container") {
          steps {
            sh "docker container rm -f ${APP_NAME.toLowerCase()}"
          }
        }

        stage("Create container") {
          steps {
            sh "docker run -d --name ${APP_NAME.toLowerCase()} -p ${env.PORT}:${env.PORT} ${APP_NAME.toLowerCase()}:${APP_VERSION}"
          }
        }

        stage("Push new version") {
          steps {
            script {
              if (env.UPDATE_TYPE != 'NONE') {
                withCredentials([usernamePassword(credentialsId: '03c6ff66-872c-4a1a-825e-55a6175d54b6', passwordVariable: 'GIT_PASSWORD', usernameVariable: 'GIT_USERNAME')]) {
                  def encodedPassword = URLEncoder.encode("${GIT_PASSWORD}",'UTF-8')
                  sh "git checkout -b develop1"
                  sh "git add package.json"
                  sh "git commit -m 'chore(jenkins): update version to ${APP_VERSION}'"
                  sh 'cat package.json'
                  // sh "git push https://${GIT_USERNAME}:${encodedPassword}@github.com/${GIT_USERNAME}/jenkins-express-poc.git ${BRANCH}"
                  sh "git push -u https://${GIT_USERNAME}:${encodedPassword}@github.com/${GIT_USERNAME}/jenkins-express-poc.git origin develop1"
                }
              } else {
                print "this step will be performed if the version is changed"
              }
            }
          }
        }

        stage("Add version tag") {
          steps {
            script { 
              if (env.UPDATE_TYPE != 'NONE' && BRANCH == 'main') {
                sh "git tag v${APP_VERSION}"
                sh "git push ${env.REPO_URL} --tags"
              } else {
                print "this step will be performed if the version is changed"
              }
            }
          }
        }

        stage("Replace develop branch") {
          steps {
            script {
              if (BRANCH == "main" && ENVIRONMENT == "prod") {
                // delete develop branch in the remote
                sh "git push origin --delete develop"

                // create and publish develop branch
                sh "git checkout -b develop"
                sh "git push -u origin develop"
              } else {
                print "this stage will be executed only in the production builds..."
              }
            }
          }
        }

        stage("Cleanup workspace"){
          steps {
            deleteDir()
            print 'Workspace cleaned up'
          }
        }

    }
}

def getBuildArgs() {
  def envArgs = [
    APPLICATION_NAME_ARG: env.APPLICATION_NAME,
    PORT_ARG: env.PORT,
  ]

  def str = new StringBuilder()
        
  envArgs.each{ key, value -> 
    str.append(" --build-arg ${key}='${value}' ")
  }

  return str
}

def getPackageJsonVersion(updateType) {
  def fileContent = readFile("package.json")

  def packageJson = new groovy.json.JsonSlurper().parseText(fileContent)

  if (updateType == 'NONE') {
    print "version not changed: ${packageJson.version}"
    return packageJson.version
  }

  def versionArray = packageJson.version.tokenize('.')

  if (updateType == 'MAJOR') {
    versionArray[0] = versionArray[0].toInteger() + 1
    versionArray[1] = 0
    versionArray[2] = 0
  }

  if (updateType == 'MINOR') {
    versionArray[1] = versionArray[1].toInteger() + 1
    versionArray[2] = 0
  }

  if (updateType == 'PATCH') {
    versionArray[2] = versionArray[2].toInteger() + 1
  }

  print "version changed: ${versionArray.join('.')}"

  return versionArray.join(".")
}

def updatePackageJsonVersion(version) {
  def fileContent = readFile("package.json")

  def updatedContent = fileContent.replaceAll('"version": "\\d+\\.\\d+\\.\\d+"', '"version": "' + version + '"')

  writeFile(file: 'package.json', text: updatedContent)
}