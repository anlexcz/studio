# Metrobus · Přestávková obrazovka

Editor: https://anlexcz.github.io/studio/service/

Transparentní zdroj do OBS: https://anlexcz.github.io/studio/service/pause.html

OBS: Browser Source 1920 × 1080, pod ním může zůstat živé video. Overlay vykresluje průhledné barevné glowy, částečné ztmavení a text. Blur zdroje OBS nezajistí CSS v Browser Source: pro skutečný blur videa použij filtr zdroje v OBS (například Shaderfilter) nebo samostatnou scénu s rozmazaným obrazem.

## Editace
Texty, viditelnost loga, intenzitu glow, ztmavení a rychlost lze změnit v editoru `service/index.html`. Editor zobrazuje změny průběžně v náhledu přes postMessage; veřejný OBS overlay čte jen publikované `service/settings.json`. Tlačítko Uložit na GitHub vyžaduje fine-grained personal access token omezený na repozitář `anlexcz/studio` s oprávněním Contents: Read and write. Token se neukládá do localStorage ani do repozitáře.

Po uložení vyčkej na úspěšné dokončení workflow Publish studio a obnov zdroj v OBS. Pro nové stránky už build skript kopíruje celou složku `service`.

Animace respektuje systémové nastavení Reduced motion. Žádné přepínání OBS scén se z této statické stránky neprovádí.
