#!/bin/bash
sed -ri 's/([^\}\{,\[]*)\[class\*=language-\][^,\{]*,/\0\1[class*=lang-],/g' node_modules/prismjs/themes/*.min.css
sed -ri 's/([^\}\{,\[]*)\[class\*=language-\][^,\{]*\{/\1[class*=lang-],\0/g' node_modules/prismjs/themes/*.min.css
