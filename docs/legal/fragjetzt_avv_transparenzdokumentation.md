# Erklärung zur Auftragsverarbeitung – frag.jetzt

_Hinweis: Dieses Dokument dient der transparenten Darstellung der datenschutzrechtlichen und technischen Rahmenbedingungen der Open-Source-Plattform „frag.jetzt“. Es stellt keine rechtlich verbindliche Vereinbarung dar._

## 1. Öffentliche Erklärung (gemäß DSGVO)

**Betreiber:**  
Prof. Dr. Klaus Quibeldey-Cirkel  
Heinrich-Heine-Str. 46  
D-35039 Marburg  
E-Mail: klaus.quibeldey@gmail.com

**Betriebsmodell:**  
Software-as-a-Service (SaaS)  
Hosting bei: Hetzner Online GmbH, Deutschland (ISO/IEC 27001-zertifiziert)

**Datenschutzkonformität:**

- DSGVO-konforme Datenverarbeitung
- Keine Registrierung erforderlich (außer Moderation)
- IP-Adressen werden anonymisiert
- Lokale Matomo-Analyse
- Optional: KI-Moderation (lokal oder extern via OpenAI)

## 2. Beschreibung der typischen Auftragsverarbeitung

Im Rahmen eines möglichen Auftragsverhältnisses verarbeitet „frag.jetzt“ personenbezogene Daten ausschließlich im Auftrag und nach Weisung der nutzenden Institution.

Die Verarbeitung erfolgt insbesondere zum Zweck der Bereitstellung eines anonymen Fragenforums sowie interaktiver Feedback- und Moderationsfunktionen im Kontext von Lehrveranstaltungen und Konferenzen.

Registrierung ist nur für Moderator:innen erforderlich. E-Mail-Adressen werden nicht mit Nutzerinhalten verknüpft.

## 3. Funktionsübersicht

| Funktionsgruppe           | Beschreibung                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Fragen-Forum              | Anonymes Stellen, Bewerten und Kommentieren von Fragen in Echtzeit                   |
| Moderation                | Live-Moderation durch Raumverantwortliche, Freigabemodus, automatische KI-Moderation |
| Bonus-System              | Vergabe von Sternen und Bonuspunkten über Token-System, Archivierung der Vergabe     |
| Blitzumfragen             | Single-Choice-Feedback in Echtzeit mit Markdown und Bildunterstützung                |
| Quiz & Brainstorming      | Integration von arsnova.click für Quizspiele und KI-unterstütztes Brainstorming      |
| Filter & Sortieroptionen  | Filter nach Status, Label, Bewertung; Sortierung nach Zeit, Relevanz, Kontroverse    |
| Kontroversitätsanalyse    | Automatische Berechnung und Sortierung nach Meinungsdivergenz                        |
| Wortwolken (Fragen-Radar) | Visualisierung häufiger Themen durch NER und Gewichtung von Begriffen                |
| Mail-Reminder             | Zeitgesteuerte Benachrichtigungen über neue Inhalte für registrierte Nutzer:innen    |
| PWA und Barrierefreiheit  | Plattform als Progressive Web App (PWA), barrierearm nach WCAG 2.1 AA                |
| Nutzung und Hosting       | Betrieb als SaaS in Deutschland, quelloffen, Docker-basiert, datensparsam            |

## 4. Technische und organisatorische Maßnahmen (TOM)

### Zugriffskontrolle

Admin-Zugriff nur via SSH mit Public-Key-Verfahren. Webzugriff TLS-gesichert (HTTPS). Keine öffentlich erreichbare Datenbank.

### Zugangskontrolle

Benutzerzugang über Sessions oder registrierte Konten mit abgesicherten Passwörtern (bcrypt). Moderationsrechte rollenbasiert.

### Datenminimierung

Nur E-Mail-Adresse (bei Registrierung), keine Klarnamenspflicht, IP-Adressen werden anonymisiert gespeichert.

### Pseudonymisierung

Anonyme Fragenstellung ohne personenbezogene Rückverfolgbarkeit durch Nutzer-ID.

### Verschlüsselung

TLS 1.3 für Transportverschlüsselung, verschlüsselte Backups (GPG) bei Hetzner.

### Speicherung

Backups täglich, Speicherung lokal auf getrenntem Volume, Löschung nach 30 Tagen.

### Verfügbarkeit

Regelmäßige Wiederherstellungstests, Containerbasiertes Deployment mit Rollback-Möglichkeit.

### Monitoring

Fehler- und Zugriffserfassung mit Logrotation, Monitoring durch Prometheus/Grafana.

### Updates

Wöchentliche Aktualisierung der Softwarebasis, sicherheitsrelevante Patches sofort.

### Subunternehmerkontrolle

Hetzner unter AVV. Keine weiteren Auftragsverarbeiter ohne schriftliche Zustimmung.
