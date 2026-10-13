# Outro Metrobusu

Nastavení: https://anlexcz.github.io/studio/outro/
Zdroj do OBS: https://anlexcz.github.io/studio/outro/outro.html
Zkušební fotka: přidej `?preview=photo`.

## Ovládání

V nastavení přidávej a odebírej účinkující a náhodné hlášky, upravuj texty
nebo přetáhni CSV z Forendors. Náhled je lokální; veřejné outro pro OBS
načítá publikovaná data. Uložení do GitHubu zapíše texty i očištěný export
v jediném commitu. Po dokončení Publish studio obnov zdroj v OBS.

Pro ukládání používej fine-grained GitHub token jen pro `anlexcz/studio`
s oprávněním `Contents: Read and write`. Návod je přímo v nastavení.
Token se posílá pouze GitHub API a zůstává jen v paměti stránky. Tlačítkem
Odpojit nebo zavřením stránky se zapomene; nepatří do chatu ani repozitáře.

Rozpracované texty a očištěný export se uchovávají v prohlížeči pro náhled.
E-maily, ceny a platební údaje se z importu zahazují před uložením návrhu.
Odebrání poslední hlášky rotaci vypne. Bez účinkujících se jejich box skryje.

## Data a animace

Publikované texty jsou v `settings.json`. Výchozí vzhled je v `outro.css`.
Export z nastavení se ukládá jako `podporovatele-metrobuscz-RRRR-MM-DD.csv`.
Při ručním vložení CSV do repozitáře odstraň soukromé sloupce předem.
Sestavení stále vybírá nejnovější datum z názvu CSV a vytváří supporters.json.
Délka animace odpovídá skutečné výšce seznamu; fadeout následuje až po všech
jménech a 3,5sekundové pauze. OBS: 1920 × 1080 a obnovit při aktivaci scény.

`?still=1` zobrazí statický náhled; `?draft=1` použije lokální rozpracovaná
nastavení. Tyto parametry nepatří do běžného zdroje OBS.
