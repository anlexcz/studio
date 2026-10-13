# Chat studio — statické demo

- Ovládání: `/studio/chat/`
- Průhledný overlay: `/studio/chat/overlay/`
- Samostatné automatické demo pro OBS: `/studio/chat/overlay/?demo=1`
- OBS rozměry: 1920 × 1080.

Zprávy jsou smyšlené. Žádné YouTube API ani přihlášení. Náhled používá postMessage s kontrolou originu a zdroje. Samostatná okna stejného browser profilu synchronizuje localStorage/storage event. OBS a mobil nesdílí storage — plné dálkové ovládání vyžaduje backend. Demo v OBS běží samostatně a nesleduje panel.

Frontend bez build závislostí. core.js: datový kontrakt, validace, vykreslení; panel.js: ovládání a lokální transport; overlay/overlay.js: plátno a demo. Budoucí síťový transport má nahradit lokální synchronizaci. Export obsahuje pouze nastavení, nikoli zprávy či tokeny.
