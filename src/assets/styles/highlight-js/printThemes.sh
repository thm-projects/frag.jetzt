find . -type f -name "*.css" -exec expr substr "{}" 3 1000 \; > themes.txt
