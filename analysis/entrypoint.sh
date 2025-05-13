#!/bin/sh

echo "Waiting for SonarQube..."
counter=0
while [[ $(curl -s -o /dev/null -w "%{http_code}" http://sonarqube:9000/api/system/ping) = '000' && $counter -lt 100 ]]; do
  sleep 2
  ((counter++))
done

if [[ $counter -ge 30 ]]; then
  echo "SonarQube is not started."
  echo "Take a look at http://localhost:9000"
  echo "Please try again later..."
  exit 0
fi

while [[ $(curl -s -o /dev/null -w "%{http_code}" http://sonarqube:9000/api/system/ping) = 404 ]]; do
  sleep 2
done

if [[ $(curl -s -u 'admin:!AdminAdmin1' -o /dev/null -w "%{http_code}" http://sonarqube:9000/api/system/ping) = 401 ]]; then
  echo "Changing Admin password to !AdminAdmin1:"

  # reset admin password
  first_request = $(curl -s -o /dev/null -w "%{http_code}\n" \
    -u admin:admin -X POST \
    -F 'login=admin' -F 'password=!AdminAdmin1' -F 'previousPassword=admin' \
    http://sonarqube:9000/api/users/change_password)
  
  if [[ "$first_request" != "204" ]]; then
    echo "  - First request failed with code $first_request"
    echo ""
    echo "Please run 'sudo docker compose down -v' and 'sudo docker compose up -d sonarqube' to reset the database."
    echo "Then run this script again."
    exit 1
  else
    echo "  - Change Admin password to '!AdminAdmin1': $first_request"
  fi

  # disable authentication
  curl -s -o /dev/null -w "  - Disable Authentication: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'key=sonar.forceAuthentication' -F 'value=false' \
    http://sonarqube:9000/api/settings/set

  # add global project creation
  curl -s -o /dev/null -w "  - Allow project creation: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'groupName=Anyone' -F 'permission=provisioning' \
    http://sonarqube:9000/api/permissions/add_group

  # add global analysis creation
  curl -s -o /dev/null -w "  - Allow analysis creation: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'groupName=Anyone' -F 'permission=scan' \
    http://sonarqube:9000/api/permissions/add_group
fi

if [[ $(curl -s -o /dev/null -w "%{http_code}" -u 'admin:!AdminAdmin1' -X POST -F 'name=frag.jetzt' http://sonarqube:9000/api/qualitygates/show) == 404 ]]; then

  # quality gate does not yet exist
  echo "Quality Gate not yet existing. Going to create..."

  # create the gate
  curl -s -o /dev/null -w "  - Creating gate: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'name=frag.jetzt' \
    http://sonarqube:9000/api/qualitygates/create

  # create the conditions
  curl -s -o /dev/null -w "  - Add coverage condition: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'error=80' -F 'gateName=frag.jetzt' -F 'metric=coverage' -F 'op=LT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add duplicated lines condition: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'error=3' -F 'gateName=frag.jetzt' -F 'metric=duplicated_lines_density' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add sqale rating condition: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'error=1' -F 'gateName=frag.jetzt' -F 'metric=sqale_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add reliability rating condition: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'error=1' -F 'gateName=frag.jetzt' -F 'metric=reliability_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add security rating condition: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'error=1' -F 'gateName=frag.jetzt' -F 'metric=security_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  # set newly created gate as default
  curl -s -o /dev/null -w "  - Setting newly created gate as default: %{http_code}\n" \
    -u 'admin:!AdminAdmin1' -X POST \
    -F 'name=frag.jetzt' \
    http://sonarqube:9000/api/qualitygates/set_as_default

  echo "done."

fi

test -d node_modules || npm ci --legacy-peer-deps

npm test

sonar-scanner
