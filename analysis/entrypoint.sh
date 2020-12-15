#!/bin/bash

if [[ $(curl -s -o /dev/null -w "%{http_code}" -u admin:admin -X POST http://sonarqube:9000/api/qualitygates/list) != 200 ]]; then
  echo "Sonarqube has not finished startup yet."
  echo "check http://localhost:9000 for progress."
  echo "Please try again later..."
  exit 0
fi

if [[ $(curl -s -o /dev/null -w "%{http_code}" -u admin:admin -X POST -F 'id=2' http://sonarqube:9000/api/qualitygates/show) == 404 ]]; then

  # quality gate does not yet exist
  echo "Quality Gate not yet existing. Going to create..."

  # create the gate
  curl -s -o /dev/null -w "  - Creating gate: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'name=cards' \
    http://sonarqube:9000/api/qualitygates/create

  # create the conditions
  curl -s -o /dev/null -w "  - Add coverage condition: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'error=80' -F 'gateId=2' -F 'metric=coverage' -F 'op=LT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add duplicated lines condition: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'error=3' -F 'gateId=2' -F 'metric=duplicated_lines_density' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add sqale rating condition: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'error=1' -F 'gateId=2' -F 'metric=sqale_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add reliability rating condition: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'error=1' -F 'gateId=2' -F 'metric=reliability_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  curl -s -o /dev/null -w "  - Add security rating condition: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'error=1' -F 'gateId=2' -F 'metric=security_rating' -F 'op=GT' \
    http://sonarqube:9000/api/qualitygates/create_condition

  # set newly created gate as default
  curl -s -o /dev/null -w "  - Setting newly created gate as default: %{http_code}\n" \
    -u admin:admin -X POST \
    -F 'id=2' \
    http://sonarqube:9000/api/qualitygates/set_as_default

  echo "done."

fi

gradle sonarqube -Dsonar.host.url=http://sonarqube:9000
