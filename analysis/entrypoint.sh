#!/bin/bash

if [[ $(curl -s -o /dev/null -w "%{http_code}" http://sonarqube:9000/api/system/ping) = '000' ]]; then
  echo "SonarQube is not started."
  echo "Take a look at http://localhost:9000"
  echo "Please try again later..."
  exit 0
fi

echo "Waiting for SonarQube..."
while [[ $(curl -s -o /dev/null -w "%{http_code}" http://sonarqube:9000/api/system/ping) = 404 ]]; do
  sleep 2
done

if [[ $(curl -s -u admin:password -o /dev/null -w "%{http_code}" http://sonarqube:9000/api/system/ping) = 401 ]]; then 
  echo "Changing Admin password to password:"

  # reset admin password
  curl -s -o /dev/null -w "  - Change Admin password: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'login=admin' -F 'password=password' -F 'previousPassword=admin' \
    http://sonarqube:9000/api/users/change_password

  # disable authentication
  curl -s -o /dev/null -w "  - Disable Authentication: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'key=sonar.forceAuthentication' -F 'value=false' \
    http://sonarqube:9000/api/settings/set
fi

if ! curl -s -u admin:password -X POST http://sonarqube:9000/api/plugins/installed | grep '"key":"cnesreport"' >/dev/null 2>&1; then
  echo "Installing CNES Plugin"

  # install cnesreport
  curl -s -o /dev/null -w "  - Consent plugins: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'key=sonar.plugins.risk.consent' -F 'value=ACCEPTED' \
    http://sonarqube:9000/api/settings/set

  curl -s -o /dev/null -w "  - Install CNES Report Plugin: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'key=cnesreport' \
    http://sonarqube:9000/api/plugins/install

  # restarting sonarqube
  curl -s -o /dev/null -w "  - Restart Sonarqube: %{http_code}\n" \
    -u admin:password -X POST \
    http://sonarqube:9000/api/system/restart
  
  echo 'Waiting for Sonarqube to restart...'

  while ! curl -s -u admin:password http://sonarqube:9000/api/system/status | grep '"status":"UP"' >/dev/null 2>&1; do
    sleep 2
  done
fi

if [[ $(curl -s -o /dev/null -w "%{http_code}" -u admin:password -X POST -F 'name=frag.jetzt' http://sonarqube:9000/api/qualitygates/show) == 404 ]]; then

  # quality gate does not yet exist
  echo "Quality Gate not yet existing. Going to create..."

  # create the gate
  curl -s -o /dev/null -w "  - Creating gate: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'name=frag.jetzt' \
    http://sonarqube:9000/api/qualitygates/create

  # create the conditions
  curl -s -o /dev/null -w "  - Add coverage condition: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'error=80' -F 'gateName=frag.jetzt' -F 'metric=coverage' -F 'op=LT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add duplicated lines condition: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'error=3' -F 'gateName=frag.jetzt' -F 'metric=duplicated_lines_density' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add sqale rating condition: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'error=1' -F 'gateName=frag.jetzt' -F 'metric=sqale_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add reliability rating condition: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'error=1' -F 'gateName=frag.jetzt' -F 'metric=reliability_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add security rating condition: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'error=1' -F 'gateName=frag.jetzt' -F 'metric=security_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  # set newly created gate as default
  curl -s -o /dev/null -w "  - Setting newly created gate as default: %{http_code}\n" \
    -u admin:password -X POST \
    -F 'name=frag.jetzt' \
    http://sonarqube:9000/api/qualitygates/set_as_default

  echo "done."

fi

npm i

npm test

sonar-scanner
