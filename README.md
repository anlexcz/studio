# Metrobus studio

Outro: https://anlexcz.github.io/studio/outro/outro.html

## OBS

- Zdroj prohlížeče, 1920 × 1080.
- Zapnout obnovení prohlížeče při aktivaci scény.
- Animace začne po načtení dat; po zhruba minutě zmizí.

## Aktualizace podporovatelů

Nahraj CSV `podporovatele-metrobuscz-RRRR-MM-DD.csv` do složky `outro/`
(nebo kořene repozitáře), potvrď změnu do větve `main` a počkej na
úspěšné dokončení akce Publish studio. Vybere se nejnovější datum v názvu.
Při opravě exportu téhož dne nahraď stávající soubor. Při přidání nového
exportu můžeš starší soubory ponechat. Nedávej tentýž nejnovější export do obou složek.

Repozitář je veřejný: před nahráním odstraň z exportu e-maily a ostatní
soukromé sloupce. Potřebujeme pouze `Jméno`, `Handle`, `Předplatné`.
Počáteční export už je takto očištěný. Prázdné jméno se nahradí hodnotou Handle.
Export považujeme za seznam aktuálních podporovatelů; nerozlišuje stav zaplacení.
Podporovaná předplatná: Standard a Midibus, v tomto pořadí.

Publikovaný web dostává jen jména a typ předplatného v `supporters.json`.
Soubor se načítá při každém spuštění outra s parametrem proti cache.
Nová verze se projeví po nasazení a obnovení zdroje v OBS.

## Nastavení GitHub Pages

Settings → Pages → Build and deployment → Source: **GitHub Actions**.
Pak případně spusť znovu Publish studio v záložce Actions.

## Texty a vzhled

Texty a hosté: `outro/config.js`. Vzhled: `outro/outro.css`.
Easter egg hlášky: `outro/easteregg.csv`.
Lokální sestavení: `python3 scripts/build_site.py`;
pro náhled spusť HTTP server ve složce `_site`.
