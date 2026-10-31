# Kavárna DRBárna – web

Statický web (HTML, CSS, JS) připravený pro **GitHub Pages**. Nepotřebuje žádný build ani server.

## Nasazení na GitHub Pages

1. Vytvořte nový repozitář na GitHubu (např. `kavarna-drbarna`).
2. Nahrajte do něj **obsah této složky** (soubor `index.html` musí být v kořeni repozitáře).
   - přes web: *Add file → Upload files*, přetáhnout všechny soubory a složky
   - nebo přes git:
     ```
     git init
     git add .
     git commit -m "Web Kavárna DRBárna"
     git branch -M main
     git remote add origin https://github.com/UZIVATEL/kavarna-drbarna.git
     git push -u origin main
     ```
3. V repozitáři otevřete **Settings → Pages**.
4. V části *Build and deployment* zvolte **Source: Deploy from a branch**, větev **main** a složku **/ (root)**, uložte.
5. Za minutu až dvě poběží web na `https://UZIVATEL.github.io/kavarna-drbarna/`.

Vlastní doména (např. `www.kavarnadrbarna.cz`): v *Settings → Pages → Custom domain* zadejte doménu
a u registrátora nastavte CNAME záznam na `UZIVATEL.github.io`.

## Struktura

```
index.html        celý web (stránky se přepínají přes #odkazy, např. #firemni-akce)
404.html          přesměrování na úvod
css/style.css     styly
js/app.js         animace, přepínání stránek, kalkulačka firemní akce
fonts/            písmo Archivo (SIL Open Font License)
img/              fotografie a loga
.nojekyll         vypne zpracování Jekyllem na GitHub Pages
```

## Odkazy na jednotlivé stránky

- `#domu` úvod, `#nabidka`, `#pro-divaky`, `#firemni-akce`, `#galerie`, `#kontakt`

## Co je potřeba doplnit před spuštěním

- Formuláře (kalkulačka firemní akce a kontakt) zatím nic neodesílají. GitHub Pages neumí zpracovat formulář,
  napojte je například na Formspree, Basin nebo vlastní endpoint (v `js/app.js` u odeslání formuláře).
- Fotky v plném rozlišení (aktuální jsou převzaté ze současného webu a mají šířku cca 1100–1700 px).
- Nápojový lístek a ceny na stránce Nabídka, loga a citace klientů.
- Pro náhledy při sdílení (Facebook, LinkedIn) doplňte do `index.html` značku
  `<meta property="og:image" content="https://VASE-DOMENA/img/lounge-long.webp">` s plnou adresou.
