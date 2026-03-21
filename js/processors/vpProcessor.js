// js/processors/vpProcessor.js

/**
 * Spracováva vstupné dáta pre agendu Vecné Prostriedky (VP).
 * Očakáva 'subjekty' (XLSX) a 'psc' (XLSX) v objekte data.
 * Pridáva stĺpce ADRESA, PCRD_short a PSC_long.
 *
 * Podporuje dva formáty hlavičky:
 *  - FORMÁT A (dvojriadkový): riadok 7 = hlavné stĺpce, riadok 8 = podhlavička (ULICA, Č. POPISNÉ, MESTO (OBEC))
 *  - FORMÁT B (jednoriadkový): všetky stĺpce vrátane ULICA, Č. POPISNÉ, MESTO (OBEC) sú v jednom riadku
 *
 * Stĺpec OKRES je voliteľný – ak chýba vo vstupnom súbore, okres sa dohľadá
 * automaticky z PSC.xlsx podľa názvu mesta/obce.
 */
export const vpDataProcessor = (data) => {
    if (!data || !data.subjekty || !data.psc) {
        throw new Error("Chýbajú vstupné súbory. Zoznam subjektov je nutné nahrať a súbor PSČ by sa mal načítať automaticky.");
    }

    const wbSubjekty = XLSX.read(data.subjekty, { type: 'array' });
    const wbPsc = XLSX.read(data.psc, { type: 'array' });

    const wsSubjekty = wbSubjekty.Sheets[wbSubjekty.SheetNames[0]];
    const wsPsc = wbPsc.Sheets[wbPsc.SheetNames[0]];

    let jsonSubjekty = XLSX.utils.sheet_to_json(wsSubjekty, { header: 1, defval: '', blankrows: false });
    const jsonPsc = XLSX.utils.sheet_to_json(wsPsc, { header: 1, defval: '', blankrows: false });

    // --- Zostavenie PSČ mapy (PSC, DPOSTA a voliteľne OKRES) ---
    const pscMap = new Map();
    const pscHeaderRow = jsonPsc[0];
    const obecIndexPsc  = pscHeaderRow.findIndex(h => h === 'OBEC');
    const pscIndexPsc   = pscHeaderRow.findIndex(h => h === 'PSC');
    const dpostaIndexPsc = pscHeaderRow.findIndex(h => h === 'DPOSTA');
    // OKRES je v PSC.xlsx voliteľný – ak stĺpec neexistuje, bude -1
    const okresIndexPsc = pscHeaderRow.findIndex(h => String(h).trim().toLowerCase() === 'okres');

    for (let i = 1; i < jsonPsc.length; i++) {
        const row = jsonPsc[i];
        if (row[obecIndexPsc]) {
            pscMap.set(String(row[obecIndexPsc]).toUpperCase(), {
                psc:   row[pscIndexPsc],
                dposta: row[dpostaIndexPsc],
                okres: okresIndexPsc !== -1 ? (row[okresIndexPsc] || '') : ''
            });
        }
    }

    // --- Nájdenie riadku s hlavičkou podľa 'P.Č.' ---
    const headerRowIndex = jsonSubjekty.findIndex(row => row.some(cell => String(cell).trim() === 'P.Č.'));
    if (headerRowIndex === -1) throw new Error('Nenašiel sa riadok s hlavičkou "P.Č."');

    const mainHeaderRow = jsonSubjekty[headerRowIndex];
    const nextRow = jsonSubjekty[headerRowIndex + 1] || [];

    // --- Detekcia formátu: jednoriadkový (B) vs dvojriadkový (A) ---
    // Formát A má podhlavičku – druhý riadok obsahuje 'ULICA' alebo 'Č. POPISNÉ'
    // Formát B má tieto hodnoty priamo v mainHeaderRow
    const isDoubleHeader = nextRow.some(cell =>
        ['ULICA', 'Č. POPISNÉ', 'MESTO (OBEC)'].includes(String(cell).trim())
    );

    // --- Pomocná funkcia: hľadá index v riadku bez ohľadu na veľkosť písmen a okolité medzery ---
    const findIdx = (row, name) => {
        const normalized = name.trim().toLowerCase();
        return row.findIndex(c => String(c).trim().toLowerCase() === normalized);
    };

    // --- Indexy stĺpcov spoločné pre oba formáty (hľadáme v mainHeaderRow) ---
    const pcIndex            = findIdx(mainHeaderRow, 'P.Č.');
    const dodavatelIndex     = findIdx(mainHeaderRow, 'DODÁVATEĽ');
    const okresIndex         = findIdx(mainHeaderRow, 'OKRES'); // môže byť -1
    const pcrdIndex          = findIdx(mainHeaderRow, 'PČRD');
    const icoIndex           = findIdx(mainHeaderRow, 'IČO');
    const znackaIndex        = findIdx(mainHeaderRow, 'TOVÁRENSKÁ ZNAČKA');
    const typIndex           = findIdx(mainHeaderRow, 'TYP'); // záloha pre TOVÁRENSKÁ ZNAČKA
    const karoseriaIndex     = findIdx(mainHeaderRow, 'DRUH KAROSÉRIE');
    const ecvIndex           = findIdx(mainHeaderRow, 'EČV');
    const utvarIndex         = findIdx(mainHeaderRow, 'ÚTVAR');
    const miestoDodaniaIndex = findIdx(mainHeaderRow, 'MIESTO DODANIA');

    // --- Indexy adresných stĺpcov závisí od formátu ---
    let ulicaIndex, popisneIndex, mestoObecIndex, dataStartIndex;

    if (isDoubleHeader) {
        // FORMÁT A: adresné stĺpce sú v podhlavičke (nextRow)
        ulicaIndex     = findIdx(nextRow, 'ULICA');
        popisneIndex   = findIdx(nextRow, 'Č. POPISNÉ');
        mestoObecIndex = findIdx(nextRow, 'MESTO (OBEC)');
        dataStartIndex = headerRowIndex + 2; // preskočíme oba hlavičkové riadky
    } else {
        // FORMÁT B: adresné stĺpce sú priamo v mainHeaderRow
        ulicaIndex     = findIdx(mainHeaderRow, 'ULICA');
        popisneIndex   = findIdx(mainHeaderRow, 'Č. POPISNÉ');
        mestoObecIndex = findIdx(mainHeaderRow, 'MESTO (OBEC)');
        dataStartIndex = headerRowIndex + 1; // preskočíme len jeden hlavičkový riadok
    }

    // --- Kontrola, či sa podarilo nájsť kľúčové adresné stĺpce ---
    if (ulicaIndex === -1 || popisneIndex === -1 || mestoObecIndex === -1) {
        throw new Error(
            `Nepodarilo sa nájsť adresné stĺpce (ULICA, Č. POPISNÉ, MESTO (OBEC)). ` +
            `Skontrolujte formát vstupného súboru. Detekovaný formát: ${isDoubleHeader ? 'dvojriadkový' : 'jednoriadkový'}.`
        );
    }

    // --- Spracovanie dátových riadkov ---
    const newHeader = ['P.Č.', 'DODÁVATEĽ', 'ULICA', 'Č. POPISNÉ', 'MESTO (OBEC)', 'OKRES', 'ADRESA', 'IČO', 'TOVÁRENSKÁ ZNAČKA', 'DRUH KAROSÉRIE', 'EČV', 'ÚTVAR', 'MIESTO DODANIA', 'PCRD_short', 'PSC_long'];
    const processedData = [newHeader];

    const dataRows = jsonSubjekty.slice(dataStartIndex);

    for (const row of dataRows) {
        if (!row[pcIndex]) continue;

        const ulica   = String(row[ulicaIndex]     || '').trim();
        const popisne = String(row[popisneIndex]   || '').trim();
        const mesto   = String(row[mestoObecIndex] || '').trim();
        const adresa  = `${ulica} ${popisne}`.trim();

        let pcrd_short = '';
        const pcrdValue = row[pcrdIndex];
        if (pcrdValue && typeof pcrdValue === 'string' && pcrdValue.includes('-')) {
            pcrd_short = pcrdValue.split('-')[0];
        } else {
            pcrd_short = pcrdValue || '';
        }

        let psc_long = '';
        let okres = '';
        if (mesto && pscMap.has(mesto.toUpperCase())) {
            const pscInfo = pscMap.get(mesto.toUpperCase());
            psc_long = `${pscInfo.psc} ${pscInfo.dposta}`;
            // Ak vstupný súbor obsahuje OKRES, použijeme ho; inak dohľadáme z PSČ mapy
            okres = (okresIndex !== -1 && row[okresIndex])
                ? String(row[okresIndex]).trim()
                : pscInfo.okres;
        } else if (okresIndex !== -1) {
            // Mesto sa nenašlo v PSČ mape, ale stĺpec OKRES existuje – použijeme jeho hodnotu
            okres = String(row[okresIndex] || '').trim();
        }

        // TOVÁRENSKÁ ZNAČKA – ak stĺpec chýba, odvodí sa z TYP (hodnota po prvú čiarku)
        let znacka = '';
        if (znackaIndex !== -1 && row[znackaIndex]) {
            znacka = String(row[znackaIndex]).trim();
        } else if (typIndex !== -1 && row[typIndex]) {
            znacka = String(row[typIndex]).split(',')[0].trim();
        }


        const newRow = new Array(newHeader.length).fill('');
        newRow[0]  = row[pcIndex];
        newRow[1]  = row[dodavatelIndex];
        newRow[2]  = ulica;
        newRow[3]  = popisne;
        newRow[4]  = mesto;
        newRow[5]  = okres;
        newRow[6]  = adresa;
        newRow[7]  = row[icoIndex]           || '';
        newRow[8]  = znacka;
        newRow[9]  = row[karoseriaIndex]     || '';
        newRow[10] = row[ecvIndex]           || '';
        newRow[11] = row[utvarIndex]         || '';
        newRow[12] = row[miestoDodaniaIndex] || '';
        newRow[13] = pcrd_short;
        newRow[14] = psc_long;

        processedData.push(newRow);
    }

    if (processedData.length <= 1) {
        throw new Error("Spracovaním nevznikli žiadne dáta. Skontrolujte formát vstupného súboru.");
    }
    return processedData;
};