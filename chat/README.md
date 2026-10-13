# Metrobus chat — demo

Tři vrstvy: běžící chat, ručně zvýrazněný komentář a fronta popupů pro Super Chat/členství. Původní CSS, grafické tokeny a animační funkce z dodaného overlaye; odstraněna promo vrstva a původní serverový transport. Ovládání neobsahuje promo, exporty, hvězdičky ani evidenci vyřízení.

Panel `/studio/chat/`, overlay `/studio/chat/overlay/`, samostatné OBS demo `/studio/chat/overlay/?demo=1` (1920 × 1080). Testovací data bez YouTube API. Náhled se řídí přes postMessage; další okna stejného browser profilu přes storage event. OBS/mobil má oddělené prostředí, propojení vyžaduje backend.

core.js: omezená historie a popup fronta, validace, časování, adaptér dat na původní renderer. renderer.js: původní animace a layout; overlay.js: lokální demo transport. Nastavení obsahuje jen počet zpráv a doby zobrazení.
