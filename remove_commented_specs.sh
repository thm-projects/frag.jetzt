#!/bin/bash

# Skript zum Entfernen von vollständig auskommentierten .spec.ts-Dateien

# Projektverzeichnis definieren (aktuelles Verzeichnis als Standard)
PROJECT_DIR="."

# Zähler für gefundene und gelöschte Dateien
FOUND=0
REMOVED=0

# Farben für die Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Suche nach auskommentierten .spec.ts-Dateien...${NC}"

# Alle .spec.ts-Dateien im Projekt finden
find "$PROJECT_DIR" -name "*.spec.ts" | while read -r file; do
  FOUND=$((FOUND+1))
  
  # Prüfen, ob die Datei vollständig auskommentiert ist
  # 1. Leere Zeilen entfernen
  # 2. Zeilen mit nur Kommentaren zählen
  # 3. Vergleichen mit der Gesamtzahl der nicht-leeren Zeilen
  
  NON_EMPTY_LINES=$(grep -v '^\s*$' "$file" | wc -l)
  COMMENT_LINES=$(grep -v '^\s*$' "$file" | grep -E '^\s*(//|/\*|\*|\*/)' | wc -l)
  
  if [ "$NON_EMPTY_LINES" -eq "$COMMENT_LINES" ] && [ "$NON_EMPTY_LINES" -gt 0 ]; then
    echo -e "${YELLOW}Entferne auskommentierte Spec-Datei: ${file}${NC}"
    rm "$file"
    REMOVED=$((REMOVED+1))
  fi
done

echo -e "${GREEN}Fertig! ${FOUND} .spec.ts-Dateien gefunden, ${REMOVED} auskommentierte Dateien entfernt.${NC}"