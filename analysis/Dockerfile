FROM amazoncorretto:17-alpine-jdk

USER root

RUN <<EOF
set -e
apk update
apk add --no-cache flatpak unzip curl npm
flatpak remote-add --if-not-exists flathub 'https://flathub.org/repo/flathub.flatpakrepo'
flatpak install flathub org.chromium.Chromium -y
flatpak uninstall --unused
rm -rf ~/.var/cache/flatpak
rm -rf ~/.cache/flatpak

VERSION=$(curl -LsI -w %{url_effective} https://github.com/SonarSource/sonar-scanner-cli/releases/latest | tail -n 1)
VERSION=${VERSION##*/}
curl -L -o sonar-scanner.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-$VERSION.zip
unzip sonar-scanner.zip
rm sonar-scanner.zip
mkdir -p /opt
mv sonar-scanner-* sonar-scanner
mv sonar-scanner /opt/
chmod +x /opt/sonar-scanner/bin/sonar-scanner

apk del unzip
rm -rf /var/cache/apk/*

addgroup -g 1000 sonar-cli
adduser -D -H -u 1000 -G sonar-cli -s /bin/sh -h /opt/sonar-scanner/bin sonar-cli
chown -R sonar-cli:sonar-cli /opt/sonar-scanner
EOF

USER sonar-cli

ENV PATH="$PATH:/opt/sonar-scanner/bin"
ENV CHROME_BIN=/var/lib/flatpak/app/org.chromium.Chromium/current/active
CMD ["sonar-scanner"]