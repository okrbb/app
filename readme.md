index.html
Hlavný súbor aplikácie, ktorý definuje celú viditeľnú štruktúru stránky. Obsahuje kostru pre bočný panel (.dashboard-sidebar) a hlavný obsah (.dashboard-content). Taktiež načítava všetky potrebné CSS štýly a JavaScriptové knižnice a skripty.
_______________
main-wizard.js	
Toto je "mozog" celej aplikácie. Spúšťa sa po načítaní stránky a riadi globálny stav (AppState). Načítava dáta z JSON súborov, obsluhuje hlavné udalosti (výber OÚ, výber agendy, reset, zobrazenie nápovedy), inicializuje DocumentProcessor pre aktuálnu agendu a spravuje prepínanie medzi zobrazeniami (uvítacia obrazovka, agenda, nápoveda).
_______________
DocumentProcessor.js
Kľúčová trieda, ktorá riadi celý proces spracovania a generovania dokumentov pre zvolenú agendu. Je zodpovedná za načítanie šablón (podľa potreby, "lazy-loading"), spracovanie nahratých súborov, zobrazenie náhľadu dát a samotné generovanie .docx alebo .xlsx súborov (po riadkoch, v dávkach alebo po skupinách).
_______________
config.js
slúži ako centrálne úložisko pre globálne konštanty aplikácie, ktoré sa nemenia pri behu
_______________
agendaConfigFactory.js
Definuje špecifickú logiku a nastavenia pre každú agendu (Vecné prostriedky, Pracovná povinnosť, atď.). Určuje, aké vstupné súbory sú potrebné, ktorý dátový procesor sa má použiť (napr. vpDataProcessor) a ako sa majú mapovať dáta pre každý generátor dokumentov.
_______________
helpContent.js	
obsahuje statický HTML obsah pre jednotlivé karty v Centre nápovedy (ktoré sa zobrazuje v modálnom okne)
_______________
tour.js
Inicializuje a spravuje interaktívneho sprievodcu aplikáciou pomocou knižnice Shepherd.js. Definuje jednotlivé kroky sprievodcu, ich texty a prvky, na ktoré sa majú zamerať. Ukladá do localStorage, či už bol sprievodca dokončený.
_______________
ui.js
spravuje rôzne aspekty používateľského rozhrania (UI), najmä modálne okná, spinner a históriu udalostí
_______________
Validator.js
modul určený na validáciu (kontrolu správnosti) dátových riadkov pochádzajúcich z nahraných Excel súborov
_______________
vpProcessor.js
Dátový procesor pre agendu "Vecné prostriedky". Načíta dáta zo súborov 'subjekty' a 'psc', spojí ich a vygeneruje nové stĺpce ako ADRESA, PCRD_short a PSC_long.
_______________
ppProcessor.js	
Dátový procesor pre agendu "Pracovná povinnosť". Nájde v Exceli riadok s hlavičkou (hľadá 'por. číslo') a extrahuje dáta, pričom pridáva nový stĺpec Obec na základe adresy.
_______________
ubProcessor.js
Dátový procesor pre agendu "Ubytovanie". Nájde v Exceli riadok s hlavičkou (hľadá 'por. č.') a extrahuje dáta, pričom pridáva nový stĺpec Obec na základe adresy.
_______________
drProcessor.js
Dátový procesor pre agendu "Doručovatelia". Nájde v Exceli riadok s hlavičkou (hľadá 'Por. č.') a extrahuje dáta, pričom pridáva nový stĺpec Obec na základe adresy trvalého pobytu.
 _______________
styles.css
Hlavný súbor CSS. Neobsahuje priame štýly, ale pomocou @import postupne načítava všetky ostatné súbory CSS v správnom poradí.
_______________
_variables.css
Definuje globálne premenné (CSS Custom Properties) pre celú aplikáciu. Obsahuje paletu farieb (--primary-color, --accent-color), veľkosti tieňov (--box-shadow), zaoblenie rohov (--border-radius) a rýchlosť animácií (--transition).
_______________
_layout.css
Definuje základné rozloženie (layout) aplikácie. Štýluje hlavný kontajner (.dashboard-container), bočný panel (.dashboard-sidebar), oblasť s obsahom (.dashboard-content) a štruktúru tabov (.agenda-tabs-container).
_______________
_components.css
Obsahuje štýly pre všetky opakovane použiteľné komponenty. Patria sem tlačidlá (.btn), formulárové prvky (.form-input), zóny na nahrávanie súborov (.file-drop-zone), náhľadové tabuľky (.data-preview-table-wrapper), modálne okná (.modal-overlay) a nové karty pre centrum nápovedy (.accordion-card).
_______________
_notifications.css
Definuje vzhľad všetkých notifikácií. Štýluje vyskakovacie "toast" notifikácie (.notification) a panel centra notifikácií, ktorý sa zobrazí po kliknutí na zvonček (.notification-center-panel).
_______________
_tour.css
Poskytuje vlastné CSS štýly pre knižnicu Shepherd.js, aby vizuál sprievodcu (hlavička, text, tlačidlá) zodpovedal dizajnu aplikácie.
_______________
okresne_urady.json
Statický dátový súbor vo formáte JSON. Obsahuje zoznam všetkých okresných úradov, ich adresy, kontaktné údaje a mená vedúcich, mapované podľa skratky (napr. "BB", "BS").
_______________
emaily_obci.json
Statický dátový súbor vo formáte JSON. Obsahuje zoznam e-mailových adries pre jednotlivé obce, roztriedený podľa príslušného okresného úradu (napr. "BB", "BS").


