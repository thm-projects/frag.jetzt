#!/bin/bash

echo "Suche nach *.spec.ts Dateien mit nur einfachem Komponenten-Erstellungstest..."

# Temporäre Datei für gefundene Dateien
temp_file=$(mktemp)

# Alle spec.ts-Dateien finden
find . -name "*.spec.ts" | while read file; do
  # Analysiere Dateiinhalt
  
  # 1. Anzahl der Testblöcke zählen
  it_count=$(grep -c -E '\bit\s*\(' "$file")
  test_count=$(grep -c -E '\btest\s*\(' "$file")
  total_test_count=$((it_count + test_count))
  
  # 2. Prüfen ob es ein "should create" Test ist
  has_should_create=$(grep -c -E 'should create|should be created' "$file")
  
  # 3. Prüfen ob nur ein einfacher Existenztest vorhanden ist
  has_existence_check=$(grep -c -E 'toBeTruthy\(\)|toBeTrue\(\)|expect\([^)]+\)\.toBeDefined\(\)' "$file")
  
  if [[ $total_test_count -eq 1 ]] && [[ $has_should_create -ge 1 ]] && [[ $has_existence_check -ge 1 ]]; then
    echo "$file" >> "$temp_file"
  fi
done

count=$(wc -l < "$temp_file")

if [[ $count -eq 0 ]]; then
  echo "Keine passenden Dateien gefunden."
  rm "$temp_file"
  exit 0
fi

echo "Gefunden: $count Dateien mit einfachem Komponenten-Erstellungstest."
echo "Optionen:"
echo "  [1] Alle Dateien anzeigen"
echo "  [2] Alle Dateien löschen"
echo "  [3] Dateien einzeln überprüfen und löschen"
echo "  [q] Beenden"
read -p "Ihre Wahl: " option

case $option in
  1)
    echo "Liste der gefundenen Dateien:"
    cat "$temp_file"
    ;;
  2)
    echo "Lösche alle gefundenen Dateien..."
    while read file; do
      echo "Lösche $file"
      rm "$file"
    done < "$temp_file"
    echo "$count Dateien wurden gelöscht."
    ;;
  3)
    echo "Überprüfe Dateien einzeln..."
    while read file; do
      echo "--------------------"
      echo "Datei: $file"
      echo "Inhalt:"
      cat "$file"
      echo "--------------------"
      read -p "Diese Datei löschen? (j/N): " del_answer
      if [[ $del_answer == "j" ]]; then
        echo "Lösche $file"
        rm "$file"
      else
        echo "Überspringe $file"
      fi
    done < "$temp_file"
    ;;
  q|*)
    echo "Vorgang abgebrochen."
    ;;
esac

rm "$temp_file"