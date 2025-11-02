// js/helpContent.js

/**
 * Statický HTML obsah pre Centrum nápovedy.
 */

const FAQ_HTML = `
<div id="tab-faq" class="agenda-tab-content active" style="max-width: 800px; margin: 0 auto;">
    <div class="accordion-group">
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Prečo sú tlačidlá "Generovať" neaktívne?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                Tlačidlá na karte "Generovanie" sa automaticky aktivujú, keď sú splnené všetky nasledujúce podmienky:
                <ul>
                    <li>je vybraný okresný úrad</li>
                    <li>je zvolená agenda</li>
                    <li>je zadané a uložené <b>číslo spisu</b></li>
                    <li>na karte "Spracovanie" je nahratý a úspešne spracovaný <b>vstupný .xlsx súbor</b></li>
                </ul>
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Prečo nie je výber okresného úradu zablokovaný?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                Aplikácia vám umožňuje prepínať medzi okresnými úradmi.
                <p style="margin: 1rem 0;"><b>POZOR:</b> Ak máte rozpracované dáta (nahraté súbory alebo zadaný spis) a zmeníte OÚ, aplikácia vás upozorní. Ak zmenu potvrdíte, <b>prídete o všetky rozpracované dáta</b> pre predchádzajúci OÚ.</p>
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Aké voľby si pamätá aplikácia?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                <ul>
                    <li><b>Číslo spisu:</b> Pre každú agendu si aplikácia pamätá zadané číslo spisu, kým ho manuálne nezmeníte alebo neresetujete aplikáciu.</li>
                    <li>Posledný vybraný okresný úrad.</li>
                    <li>Posledná zvolená agenda.</li>
                    <li>Dokončenie úvodného sprievodcu.</li>
                </ul>
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Kde nájdem tlačidlo na odoslanie mailov obciam?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                Táto funkcia je dostupná len pre agendu <b>Vecné prostriedky</b>.
                <ol style="padding-left: 20px; margin-top: 1rem;">
                    <li>Prepnite sa na kartu <b>"Generovanie"</b>.</li>
                    <li>Nájdite generátor <b>"Export zoznamov pre obce"</b>.</li>
                    <li>Najprv musíte kliknúť na tlačidlo "Exportovať (.xlsx)".</li>
                    <li>Po dokončení exportu sa hneď pod týmto tlačidlom automaticky objaví tlačidlo <b>"Pripraviť e-maily obciam"</b>.</li>
                </ol>
            </div>
        </div>
    </div>
</div>
`;

const ASSISTANT_HTML = `
<div id="tab-assistant" class="agenda-tab-content" style="max-width: 800px; margin: 0 auto;">
    <div class="accordion-group">
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Akú úlohu má Asistent?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                 <ul>
                    <li>poskytuje spätnú väzbu o stave spracovania dát (začiatok/koniec, pripravené šablóny)</li>
                    <li>potvrdzuje úspešné akcie (uloženie spisu, dokončenie generovania)</li>
                    <li>hlásenie kritických chýb (napr. chyba pri načítaní šablóny) a nekritických problémov (napr. pokus o generovanie s chybami v dátach)</li>
                    <li>zobrazuje detailný výpis chýb nájdených v náhľade (napr. "Riadok 12: Chýbajúca Ulica.")</li>
                    <li>jasne upozorňuje, že <b>generovanie je zablokované</b>, kým sa v dátach nachádzajú chyby (označené červenou v náhľade)</li>
                </ul>
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Aké dáta kontroluje v agende Vecné prostriedky?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; margin-top: 1rem; padding: 10px; background-color: #f7f7f7; border-radius: 8px; font-weight: bold;">
                    <span>Kategória</span>
                    <span>Kontrolované dáta</span>
                    <span>Typ kontroly</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; padding: 10px; border-bottom: 1px solid #eee;">
                    <span>dodávateľ</span>
                    <span>názov dodávateľ</span>
                    <span>existencia</span>
                    <span></span>
                    <span>adresa</span>
                    <span>existencia</span>
                    <span></span>
                    <span>okres</span>
                    <span>existencia</span>
                    <span></span>
                    <span>IČO</span>
                    <span>existencia a formátová validácia (8 číslic)</span>
                    <span>prostriedok</span>
                    <span>značka a typ karosérie</span>
                    <span>existencia</span>
                    <span></span>
                    <span>EVČ</span>
                    <span>existencia</span>
                    <span></span>
                    <span>PČRD</span>
                    <span>existencia</span>
                </div>
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Aké dáta kontroluje v agende Pracovná povinnosť?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; margin-top: 1rem; padding: 10px; background-color: #f7f7f7; border-radius: 8px; font-weight: bold;">
                    <span>Kategória</span>
                    <span>Kontrolované dáta</span>
                    <span>Typ kontroly</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; padding: 10px; border-bottom: 1px solid #eee;">
                    <span>identifikácia</span>
                    <span>meno a priezvisko</span>
                    <span>existencia</span>
                    <span></span>
                    <span>rodné číslo</span>
                    <span>existencia a formátová validácia (123456/1234 alebo 123456/123)</span>
                    <span></span>
                    <span>adresa</span>
                    <span>existencia</span>
                    <span>lokalita</span>
                    <span>okresný úrad</span>
                    <span>existencia</span>
                    <span></span>
                    <span>miesto nástupu k VÚ</span>
                    <span>existencia</span>
                    <span></span>
                    <span>požadované vzdelanie</span>
                    <span>existencia</span>
                </div>
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Aké dáta kontroluje v agende Ubytovanie?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; margin-top: 1rem; padding: 10px; background-color: #f7f7f7; border-radius: 8px; font-weight: bold;">
                    <span>Kategória</span>
                    <span>Kontrolované dáta</span>
                    <span>Typ kontroly</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; padding: 10px; border-bottom: 1px solid #eee;">
                    <span>údaje o vlastníkovi</span>
                    <span>názov / meno a priezvisko</span>
                    <span>existencia</span>
                    <span></span>
                    <span>adresa</span>
                    <span>existencia</span>
                    <span></span>
                    <span>IČO / rodné číslo</span>
                    <span>existencia a formátová validácia<br>(IČO - 8 číslic, rodné číslo v tvare 123456/1234 alebo 123456/123)</span>
                    <span>údaje o nehnuteľnosti</span>
                    <span>názov nehnuteľnosti</span>
                    <span>existencia</span>
                    <span></span>
                    <span>adresa nehnuteľnosti</span>
                    <span>existencia</span>
                    <span>údaje o žiadateľovi</span>
                    <span>názov žiadateľa</span>
                    <span>existencia</span>
                    <span></span>
                    <span>adresa žiadateľa</span>
                    <span>existencia</span>
                </div>
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-question-circle accordion-header-icon"></i> Aké dáta kontroluje v agende Doručovatelia?</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; margin-top: 1rem; padding: 10px; background-color: #f7f7f7; border-radius: 8px; font-weight: bold;">
                    <span>Kategória</span>
                    <span>Kontrolované dáta</span>
                    <span>Typ kontroly</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 2fr 2fr; gap: 10px; padding: 10px; border-bottom: 1px solid #eee;">
                    <span>identifikácia</span>
                    <span>meno a priezvisko</span>
                    <span>existencia</span>
                    <span></span>
                    <span>adresa</span>
                    <span>existencia</span>
                    <span></span>
                    <span>rodné číslo</span>
                    <span>existencia a formátová validácia<br>(rodné číslo v tvare 123456/1234 alebo 123456/123)</span>
                    <span>lokalita</span>
                    <span>miesot nástupu na plenie PP</span>
                    <span>existencia</span>
                </div>
            </div>
        </div>
        
    </div>
</div>
`;

const TROUBLESHOOTING_HTML = `
<div id="tab-troubleshooting" class="agenda-tab-content" style="max-width: 800px; margin: 0 auto;">
    <div class="accordion-group">
    <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-wrench accordion-header-icon"></i> Chyba: "Nahral/a som súbor a karta Generovanie sa neaktivovala."</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                Pri spracovaní dáta sa vyskytli chyby. Skontrolujte správy od Asistenta a chyby odstráňte (opravou dát vo vstupnom súbore - excel).
            </div>
        </div>
        <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-wrench accordion-header-icon"></i> Chyba: "Nenašiel sa riadok s hlavičkou..."</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                Táto chyba znamená, že aplikácia vo vašom .xlsx súbore nenašla očakávané názvy stĺpcov. Uistite sa, že stĺpce v súbore, ktorý nahrávate, majú presne rovnaké názvy ako v pripravenej predlohe pre danú agendu. Dajte pozor na preklepy, medzery navyše alebo skryté znaky. Vzory sú v karte <b>Na stiahnutie.</b>
            </div>
        </div>
            <div class="accordion-card">
            <div class="accordion-header">
                <span><i class="fas fa-wrench accordion-header-icon"></i> Náhľad dát zobrazuje nezmyselné hodnoty.</span>
                <i class="fas fa-chevron-down accordion-header-icon"></i>
            </div>
            <div class="accordion-content">
                Skontrolujte, či vo vašom .xlsx súbore nemáte zlúčené bunky. Aplikácia vyžaduje, aby každá informácia bola vo vlastnej, samostatnej bunke. Taktiež sa uistite, že dáta začínajú hneď pod riadkom s hlavičkou a nepredchádzajú im žiadne prázdne riadky.
            </div>
        </div>
    </div>
</div>
`;

const DOWNLOAD_TAB_HTML = (downloadListHTML) => `
<div id="tab-download" class="agenda-tab-content" style="max-width: 800px; margin: 0 auto;">
    <p style="margin-bottom: 1.5rem;">Tu si môžete stiahnuť vzorové vstupné .xlsx súbory. Obsahujú presné názvy stĺpcov, ktoré aplikácia očakáva pre správne spracovanie dát.</p>
    <ul class="download-list">
        ${downloadListHTML}
    </ul>
</div>
`;

export function getHelpCenterHTML({ okresName, downloadListHTML }) {

    return `
        <div class="agenda-tabs-container">
            <button class="agenda-tab active" data-tab="faq"><i class="fas fa-question-circle"></i> Časté otázky</button>
            <button class="agenda-tab" data-tab="assistant"><i class="fas fa-wave-square"></i> Asistent</button>
            <button class="agenda-tab" data-tab="troubleshooting"><i class="fas fa-wrench"></i> Riešenie problémov</button>
            <button class="agenda-tab" data-tab="download"><i class="fas fa-download"></i> Na stiahnutie</button>
        </div>

        <div class="agenda-tab-content-wrapper">
            
            ${FAQ_HTML}

            ${ASSISTANT_HTML}

            ${DOWNLOAD_TAB_HTML(downloadListHTML)}

            ${TROUBLESHOOTING_HTML}
            
        </div>
    `;
}