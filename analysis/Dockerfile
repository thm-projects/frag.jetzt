FROM sonarsource/sonar-scanner-cli:11

USER root

RUN dnf update && dnf install -y flatpak && \
  flatpak remote-add --if-not-exists flathub 'https://flathub.org/repo/flathub.flatpakrepo' && \
  flatpak install flathub org.chromium.Chromium -y && \
  dnf clean all && \
  mkdir -p /tmp/.cache/Cypress && chmod -R 777 /tmp && chmod +t /tmp

USER scanner-cli

ENV CHROME_BIN=/usr/bin/chromium-browser
