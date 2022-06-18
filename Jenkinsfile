pipeline {
    agent any
    options {
      // This is required if you want to clean before build
      skipDefaultCheckout(true)
    }
    environment {
      APP_NAME = "${env.APPLICATION_NAME}"
      ENVIRONMENT = "${env.NODE_ENV == "production" ? "prod" : "qa"}"
      APP_VERSION = ""
      BRANCH = env.BRANCH_TO_BUILD.replaceAll("origin/", "")
    }

    stages {

        stage("Proceed to deploy?") {
          steps {
            cleanWs()
            deleteDir()
            print 'Workspace cleaned up'
            
            timeout(time: 30, unit: "MINUTES") {
              input("Deseja proceder com o Deploy no ambiente de ${ENVIRONMENT}?")
            }
          }
        }

        stage ("Checkout"){
          steps {
            checkout scm
          }
        }

        stage("Update version") {
          steps {
            script {
              APP_VERSION = getPackageJsonVersion(env.UPDATE_TYPE)
              updatePackageJsonVersion(APP_VERSION)
            }
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

        stage("Create commit") {
          steps {
            script {
              if (env.UPDATE_TYPE != 'NONE') {
                sh "git checkout -B ${BRANCH}"
                sh "git add package.json"
                sh "git commit -m 'chore(jenkins): update version to ${APP_VERSION}'"
              } else {
                print "this step will be performed if the version is changed"
              }
            }
          }
        }

        stage("Push to github"){
          steps {
            script {
              if (env.UPDATE_TYPE != 'NONE') {
                sshagent([env.CREDENTIAL_SSH_ID]) {
                  sh('''
                      #!/usr/bin/env bash
                      set +x
                      # If no host key verification is needed, use the option `-oStrictHostKeyChecking=no`
                      export GIT_SSH_COMMAND="ssh -oStrictHostKeyChecking=no"
                      git push -u origin $BRANCH
                  ''')
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
                sshagent(['$CREDENTIAL_SSH_ID']) {
                  sh('''
                      #!/usr/bin/env bash
                      set +x
                      # If no host key verification is needed, use the option `-oStrictHostKeyChecking=no`
                      export GIT_SSH_COMMAND="ssh -oStrictHostKeyChecking=no"
                      git push --tags
                  ''')
                }
              } else {
                print "this step will be performed if the version is changed on main branch"
              }
            }
          }
        }

        stage("Replace develop branch") {
          steps {
            script {
              if (BRANCH == "main" && ENVIRONMENT == "prod") {
                sshagent(['$CREDENTIAL_SSH_ID']) {
                  sh('''
                      #!/usr/bin/env bash
                      set +x
                      # If no host key verification is needed, use the option `-oStrictHostKeyChecking=no`
                      export GIT_SSH_COMMAND="ssh -oStrictHostKeyChecking=no"
                      
                      # Delete develop branch in the remote
                      git push origin --delete develop
                      
                      # Create and publish develop branch in the remote
                      git checkout -b develop
                      git push -u origin develop
                  ''')
                }
              } else {
                print "this stage will be executed only in the production builds..."
              }
            }
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
