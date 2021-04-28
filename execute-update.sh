npm audit fix
npm audit fix # Komischerweise nimmt er manchmal erst mehrere Fehler nach dem zweiten Aufruf weg
ng update
npm uninstall ngx-matomo ngx-markdown codelyzer tslint-eslint-rules angularx-qrcode
git add .
git commit -m "Executed first angular update"
#ng update @angular/core@10 @angular/cli@10 # Hat nicht geklappt
ng update @angular/core@11 @angular/cli@11 # Scheint zu klappen
git add .
git commit -m "Executed second angular update"
npm uninstall @angular/flex-layout
git add .
git commit -m "Unistalled module"
ng update @angular/material@11
npm i ngx-matomo-v9 ngx-markdown codelyzer angularx-qrcode @angular/flex-layout
npm audit fix
npm audit fix
git add .
sed -i "s/'ngx-matomo'/'ngx-matomo-v9'/" ./src/app/app.component.ts
sed -i "s/'ngx-matomo'/'ngx-matomo-v9'/" ./src/app/app.module.ts
git commit -m "Finished angular updates"

