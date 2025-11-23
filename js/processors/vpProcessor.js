// js/processors/vpProcessor.js

/**
 * Spracováva vstupné dáta pre agendu Vecné Prostriedky (VP).
 * Očakáva 'subjekty' (XLSX) a 'psc' (JSON array) v objekte data.
 * Pridáva stĺpce ADRESA, PCRD_short a PSC_long.
 */
export const vpDataProcessor = (data) => {
    // ZMENA: data.psc teraz nie je súbor, ale JSON objekt (pole) z databázy
    if (!data || !data.subjekty || !data.psc) {
        throw new Error("Chýbajú vstupné dáta. Zoznam subjektov je nutné nahrať a dáta PSČ by sa mali načítať automaticky z databázy.");
    }

    const wbSubjekty = XLSX.read(data.subjekty, { type: 'array' });
    const wsSubjekty = wbSubjekty.Sheets[wbSubjekty.SheetNames[0]];

    let jsonSubjekty = XLSX.utils.sheet_to_json(wsSubjekty, { header: 1, defval: '', blankrows: false });
    
    // === NOVÁ LOGIKA PRE PSČ (JSON namiesto XLSX) ===
    const pscList = data.psc; // Toto je pole objektov z Firebase
    const pscMap = new Map();

    // Iterujeme cez pole objektov
    if (Array.isArray(pscList)) {
        pscList.forEach(item => {
            if (item.OBEC) {
                pscMap.set(String(item.OBEC).toUpperCase(), { 
                    psc: item.PSC, 
                    dposta: item.DPOSTA 
                });
            }
        });
    } else {
        // Fallback ak by to prišlo ako objekt s kľúčmi (ak by import zlyhal)
        Object.values(pscList).forEach(item => {
             if (item.OBEC) {
                pscMap.set(String(item.OBEC).toUpperCase(), { 
                    psc: item.PSC, 
                    dposta: item.DPOSTA 
                });
            }
        });
    }
    // === KONIEC NOVEJ LOGIKY ===
    
    let headerRowIndex = jsonSubjekty.findIndex(row => row.some(cell => String(cell).trim() === 'P.Č.'));
    if (headerRowIndex === -1) throw new Error('Nenašiel sa riadok s hlavičkou "P.Č."');

    const mainHeaderRow = jsonSubjekty[headerRowIndex];
    const subHeaderRow = jsonSubjekty[headerRowIndex + 1];

    let pcIndex = mainHeaderRow.findIndex(c => c === 'P.Č.');
    let dodavatelIndex = mainHeaderRow.findIndex(c => c === 'DODÁVATEĽ');
    let okresIndex = mainHeaderRow.findIndex(c => c === 'OKRES');
    let pcrdIndex = mainHeaderRow.findIndex(c => c === 'PČRD');
    let ulicaIndex = subHeaderRow.findIndex(c => c === 'ULICA');
    let popisneIndex = subHeaderRow.findIndex(c => c === 'Č. POPISNÉ');
    let mestoObecIndex = subHeaderRow.findIndex(c => c === 'MESTO (OBEC)');
    let icoIndex = mainHeaderRow.findIndex(c => c === 'IČO');
    let znackaIndex = mainHeaderRow.findIndex(c => c === 'TOVÁRENSKÁ ZNAČKA');
    let karoseriaIndex = mainHeaderRow.findIndex(c => c === 'DRUH KAROSÉRIE');
    let ecvIndex = mainHeaderRow.findIndex(c => c === 'EČV');
    let utvarIndex = mainHeaderRow.findIndex(c => c === 'ÚTVAR');
    let miestoDodaniaIndex = mainHeaderRow.findIndex(c => c === 'MIESTO DODANIA');

    const newHeader = ['P.Č.', 'DODÁVATEĽ', 'ULICA', 'Č. POPISNÉ', 'MESTO (OBEC)', 'OKRES', 'ADRESA', 'IČO', 'TOVÁRENSKÁ ZNAČKA', 'DRUH KAROSÉRIE', 'EČV', 'ÚTVAR', 'MIESTO DODANIA', 'PCRD_short', 'PSC_long'];
    const processedData = [newHeader];
    
    const dataRows = jsonSubjekty.slice(headerRowIndex + 2);

    for (const row of dataRows) {
        if(!row[pcIndex]) continue;

        let ulica = row[ulicaIndex] || '';
        let popisne = row[popisneIndex] || '';
        let mesto = row[mestoObecIndex] || '';
        let adresa = `${ulica} ${popisne}`.trim();
        
        let pcrd_short = '';
        const pcrdValue = row[pcrdIndex];
        if (pcrdValue && typeof pcrdValue === 'string' && pcrdValue.includes('-')) {
            pcrd_short = pcrdValue.split('-')[0];
        } else {
            pcrd_short = pcrdValue;
        }

        let psc_long = '';
        if (mesto && pscMap.has(String(mesto).toUpperCase())) {
            const pscInfo = pscMap.get(String(mesto).toUpperCase());
            psc_long = `${pscInfo.psc} ${pscInfo.dposta}`;
        }

        const newRow = new Array(newHeader.length).fill('');
        newRow[0] = row[pcIndex];
        newRow[1] = row[dodavatelIndex];
        newRow[2] = ulica;
        newRow[3] = popisne;
        newRow[4] = mesto;
        newRow[5] = row[okresIndex];
        newRow[6] = adresa;
        newRow[7] = row[icoIndex];
        newRow[8] = row[znackaIndex];
        newRow[9] = row[karoseriaIndex];
        newRow[10] = row[ecvIndex];
        newRow[11] = row[utvarIndex];
        newRow[12] = row[miestoDodaniaIndex];
        newRow[13] = pcrd_short;
        newRow[14] = psc_long;

        processedData.push(newRow);
    }

    if (processedData.length <= 1) {
        throw new Error("Spracovaním nevznikli žiadne dáta. Skontrolujte formát vstupného súboru.");
    }
    return processedData;
};