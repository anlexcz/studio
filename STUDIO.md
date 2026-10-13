# Metrobus Studio · první základ

## Webový náhled

https://anlexcz.github.io/studio/control/

Čtyři samostatné moduly: Diváci (chat, featured, příspěvky/členství), Info
(jmenovky a oznámení), Outro, Odpočet/pauza. Jeden panel, oddělené rozbalovací
sekce nastavení. Původní editor outra a chat demo zůstávají dostupné.

Na GitHub Pages se stav ukládá pouze v prohlížeči. Náhled i další okna stejného
browser profilu se synchronizují. GitHub Pages nepropojí tento stav s OBS,
mobilem nebo jiným počítačem. Tento režim panel výslovně označuje.

## Skutečné ovládání OBS v první verzi

1. Stáhni repozitář jako ZIP přes Code → Download ZIP a rozbal jej.
2. Nainstaluj Node.js LTS (verze 20 nebo novější), pokud ho nemáš.
3. Ve Windows spusť `Start-Studio.cmd`. Na jiném systému spusť
   `node scripts/studio-server.cjs` ze složky projektu.
4. Otevři http://127.0.0.1:8787/control/ a nech server běžet.
5. Z panelu zkopíruj čtyři adresy do OBS jako samostatné Zdroje prohlížeče,
   všechny s rozměrem 1920 × 1080. Použij adresy z LOKÁLNÍHO panelu.
6. V OBS vypni „Vypnout zdroj, když není viditelný“. Všechny vrstvy odebírají
   společný stav, po obnovení načtou aktuální obsah. Outro se restartuje při
   obnovení zdroje, proto u něj vypni také automatické obnovení při aktivaci scény.

Node server nemá externí balíčky ani potřebu Pythonu. Je dostupný jen na tomto
počítači a neposkytuje vzdálený přístup. Stav a profily ukládá do `.studio-data/`
(mimo git). Webový náhled a lokální server mají vlastní oddělená data.

## Běžné ovládání

- Texty jsou rozpracované do kliknutí na Zobrazit / Spustit. Nastavení ukládej
  samostatně, pro uchování v profilu klikni Uložit do vybraného profilu.
- Použít profil načte jeho nastavení. Živé texty se změní až dalším Zobrazit.
- Příspěvky a členství se řadí do fronty. Historie má limit 200 zpráv a fronta 30.
- Při featured komentáři se jmenovky přesunou nad něj; chat zůstává vpravo.
- Pauza a outro dočasně potlačí Diváky i Info. Po jejich skrytí se původní vrstvy
  vrátí; expirace komentářů pokračuje. Skrýt vše je vyčistí a skryje všechny vrstvy.
- Odpočet po doběhnutí zůstane s koncovým textem do ručního ukončení.
- Outro načítá současný publikovaný vzhled a podporovatele, název pořadu
  a účinkující bere ze studia. Podrobný editor zůstává původní.

## Chat ze Social Stream Ninja

Připoj rozšíření a nech otevřený zdrojový chat. V sekci Diváci vlož dock odkaz
ze Social Stream Ninja a klikni Připojit. Zprávy vybereš tlačítkem Zobrazit
přímo ve studiu. Pro sběr chatu musí zůstat otevřená tato režie; více připojených
režií současně může zdroj zachytávat vícekrát. Duplicity se omezují podle ID.
Ninja odkaz se uchovává jen v paměti stránky a při obnovení se připojuje znovu.
Není součástí profilů ani veřejného repozitáře.

## Hranice první verze

- Vzdálené ovládání a sdílený online backend nejsou součástí této verze.
- Ninja bridge navazuje na dosavadní integraci; funkci proti konkrétnímu živému
  chatu ověř testovací zprávou před vysíláním.
- Kolize řeší základní pevné rozložení pro dvě jmenovky. Libovolné pozice,
  více účinkujících a detailní editace vzhledu zatím nejsou přidané.
- Profily ukládají nastavení modulů a barvu; neukládají rozložení panelu,
  historii chatu, runtime stav ani připojení Ninja.
