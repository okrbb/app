1. Refaktoring agendaConfigFactory.js (Vysoká priorita)
Problém: Súbor agendaConfigFactory.js je "srdcom" aplikácie, ale je zároveň aj jej najväčším a najkomplexnejším súborom (cez 700 riadkov). Funkcie dataProcessor pre každú agendu sú veľmi rozsiahle a obsahujú zložitú biznis logiku priamo vnútri konfiguračného objektu. To sťažuje čitateľnosť, údržbu a testovanie.

Návrh: Extrahujte každú funkciu dataProcessor (a potenciálne aj dataMapper funkcie) do samostatných súborov.

Vytvorte nový priečinok, napr. js/processors/.

Vytvorte súbory ako vpProcessor.js, ppProcessor.js, ubProcessor.js a drProcessor.js.

Do každého súboru presuňte príslušnú dataProcessor funkciu a exportujte ju.

_________________________

2. Externalizácia statických dát (Vysoká priorita)
Problém: Súbor mail-config.js obsahuje obrovský objekt MUNICIPALITY_EMAILS. Podobne config.js obsahuje OKRESNE_URADY. Tieto dáta sú "vypálené" priamo do JavaScriptového kódu. Ak sa zmení jeden e-mail alebo meno vedúceho, je nutné upraviť kód, znovu zostaviť (ak sa používa build proces) a nasadiť celú aplikáciu.

Návrh: Premeňte tieto súbory na .json a načítajte ich dynamicky pri štarte aplikácie.

Presuňte mail-config.js do priečinka DATA/ (kde už máte šablóny) a premenujte ho na emaily_obci.json. Upravte jeho formát na platný JSON (odstráňte export const MUNICIPALITY_EMAILS = a uistite sa, že všetky kľúče sú v úvodzovkách).

Rovnako presuňte OKRESNE_URADY z config.js do DATA/okresne_urady.json.

V main-wizard.js ich načítajte pomocou fetch pri inicializácii.

_________________________

3. Oddelenie (Decoupling) DocumentProcessor od AppState
Problém: Trieda DocumentProcessor je dobre navrhnutá, ale má vedľajší efekt: priamo modifikuje globálny AppState v main-wizard.js (napr. this.state.appState.municipalitiesMailContent = ... a this.state.appState.zoznamyPreObceGenerated = true). To vytvára tesné prepojenie a sťažuje prehľad o tom, kto a kedy mení stav.

Návrh: Použite "callback" funkcie. main-wizard.js pri vytváraní DocumentProcessor-a poskytne funkcie, ktoré sa majú zavolať po dokončení špecifických úloh.

_________________________

4. Vylepšenie robustnosti UI
Problém: Aplikácia často nahrádza celý obsah pracovnej plochy pomocou dashboardContent.innerHTML = ... (napr. v renderAgendaTabs alebo renderHelpCenterView). To je síce rýchle na implementáciu, ale má nevýhodu: všetky existujúce event listenery na prvkoch vnútri dashboardContent sa stratia. Preto musíte po každom renderovaní manuálne volať funkcie ako setupTabListeners(), setupAccordionListeners(), setupFileInputListeners() atď.

Návrh: Zmeňte prístup z "nahradiť všetko" na "cielenú aktualizáciu".

V index.html majte stabilnejšiu štruktúru. Namiesto prázdneho <main id="dashboard-content"> tam majte predpripravené "kontajnery".

V main-wizard.js pri zmene agendy alebo zobrazenia nemeňte celý innerHTML, ale len obsah týchto špecifických kontajnerov.

_________________________

5. Organizácia CSS
Problém: Súbor styles.css je monolitický (cez 700 riadkov). Obsahuje všetko od layoutu, cez komponenty (tlačidlá, modály) až po špecifické štýly pre knižnice (Shepherd).

Návrh: Rozdeľte styles.css na menšie, logické časti. V dnešnej dobe by sa to riešilo cez SASS/SCSS a @import, ale aj v čistom CSS môžete mať viac súborov a spojiť ich (buď pri "builde" alebo historicky cez @import na začiatku hlavného CSS súboru).

Štruktúra:

/css/
  |- styles.css         (Hlavný súbor, ktorý importuje ostatné)
  |- _variables.css     (:root premenné)
  |- _layout.css        (.dashboard-container, .sidebar, .content)
  |- _components.css    (.btn, .modal-content, .doc-box, .accordion-card)
  |- _tour.css          (Shepherd.js štýly)
  |- _notifications.css (.notification, .notification-center-panel)
