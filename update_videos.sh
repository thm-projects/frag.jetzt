#!/bin/bash
# Pfad zum Projektverzeichnis
PROJ_DIR="/Users/kqc/frag.jetzt/src/assets/i18n/components/_dialogs/introductions"

# Durchlaufe alle HTML-Dateien
find "$PROJ_DIR" -name "*.component.html" | while read file; do
  echo "Verarbeite Datei: $file"
  
  # Extrahiere Komponentenname und Sprache für Titel
  lang=$(echo "$file" | grep -o '\-[a-z][a-z]\.component' | cut -c2-3)
  component_path=$(dirname "$file")
  component=$(basename "$component_path" | sed 's/^introduction-//')
  
  # Bestimme Titel basierend auf Komponente und Sprache
  # [Titelzuweisungscode wie zuvor]
  
  # Temporäre Datei erstellen
  temp_file=$(mktemp)
  
  # Korrigiere YouTube-URLs und Angular-Binding-Syntax
  perl -0777 -pe '
    # YouTube-URLs korrigieren (youtu.be -> youtube.com/embed)
    s/youtu\.be\/([A-Za-z0-9_-]+)/www.youtube.com\/embed\/$1/g;
    
    # Angular-Binding mit korrekten Anführungszeichen versehen
    s/\[src\]=sanitizer\.trust\(([^\)]+)\)/[src]="sanitizer.trust($1)"/g;
    
    # Fehlerhafte HTML-Tags korrigieren
    s/^(<[^>]+>)?\s*([A-Za-z])/\<p\>\n  $2/g;
  ' "$file" > "$temp_file"
  
  # Überprüfe, ob Änderungen vorgenommen wurden
  if ! cmp -s "$file" "$temp_file"; then
    cp "$temp_file" "$file"
    echo "Erfolgreich aktualisiert: $file"
  fi
  
  rm "$temp_file"
done