# Metrobus studio

Nová společná režie: https://anlexcz.github.io/studio/control/

Čtyři samostatné overlaye a profily. Web nabízí lokální náhled; skutečné
ovládání OBS zajišťuje přiložený Node server. [Návod první verze](STUDIO.md).


Nastavení outra: https://anlexcz.github.io/studio/outro/
Zdroj do OBS: https://anlexcz.github.io/studio/outro/outro.html

## Ovládání outra

V nastavení upravuj účinkující, titulky a náhodné hlášky nebo přetáhni celý
CSV export z Forendors. E-maily a ostatní nepotřebné sloupce se zahodí ještě
před uložením. Změny publikuj tlačítkem Uložit na GitHub. Návod na připojení
je přímo na stránce; používá token jen pro studio s Contents: Read and write.

Po dokončení akce Publish studio obnov zdroj prohlížeče v OBS. Rozpracovaný
náhled je pouze v tvém prohlížeči, zatímco veřejné outro načítá publikovaná
data. Podrobnosti: [outro/README.md](outro/README.md).

## OBS

1920 × 1080, obnovit prohlížeč při aktivaci scény. Video patří do zdroje pod
outrem. Outro má průhledné pozadí s lehkou tmavou vinětací a zmizí až po
projetí všech jmen a závěrečné pauze.

Pro náhled s fotkou přidej k adrese `?preview=photo`. Do běžného OBS zdroje
tento parametr nedávej. Nastavení nabízí statický náhled i přehrání animací.

## GitHub Pages a data

Settings → Pages → Source: GitHub Actions.
Texty a hosté: `outro/settings.json`. Vzhled: `outro/outro.css`.
CSV lze také vložit ručně; v takovém případě je nutné odstranit soukromé
sloupce před nahráním do veřejného repozitáře. Sestavení vybírá nejnovější
datum v názvu `podporovatele-metrobuscz-RRRR-MM-DD.csv` a vytváří supporters.json.
Lokálně sestav `python3 scripts/build_site.py` a spusť HTTP server v `_site`.
