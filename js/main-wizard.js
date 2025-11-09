// js/main-wizard.js

// === ZMENA: Importujeme aj POSTOVNE ako východziu hodnotu ===
import { TEMPLATE_PATHS, TEMPLATE_DOWNLOAD_FILES, POSTOVNE } from './config.js';
// ==========================================================

import { Asistent, showErrorModal, showModal, formatBytes } from './ui.js';
import { agendaConfigs } from './agendaConfigFactory.js';
import { DocumentProcessor } from './DocumentProcessor.js';
import { startGuidedTour } from './tour.js';
import { getHelpCenterHTML } from './helpContent.js';

// Globálny stav aplikácie
const AppState = {
    selectedOU: null,
    okresData: null,
    spis: null, 
    selectedAgendaKey: null,
    processor: null,
    files: {}, 
    municipalitiesMailContent: {}, 
    zoznamyPreObceGenerated: false,
    currentView: 'welcome', // 'welcome', 'agenda' (už nie 'help')
    tempMailContext: {},

    // === ZMENA: Pridaná hodnota poštovného do stavu ===
    // Načíta z localStorage, ak neexistuje, použije východziu z config.js
    postovne: parseFloat(localStorage.getItem('krokr-postovne')) || POSTOVNE
    // ===============================================
};

// === NOVÉ KONŠTANTY PRE UVÍTACIE SPRÁVY ===
const WELCOME_HEADING_TEXT = 'Vitajte v aplikácii.';
const WELCOME_PROMPT_DEFAULT = 'Prosím, začnite výberom okresného úradu v hornom paneli.';
const WELCOME_PROMPT_OU_SELECTED = 'Prosím, začnite výberom agendy v paneli vľavo.';
// ===========================================

// Načítanie statických JSON dát
async function loadStaticData() {
    try {
        const [ouResponse, emailResponse] = await Promise.all([
            fetch('DATA/okresne_urady.json'),
            fetch('DATA/emaily_obci.json')
        ]);

        if (!ouResponse.ok) throw new Error(`Nepodarilo sa načítať okresne_urady.json: ${ouResponse.statusText}`);
        if (!emailResponse.ok) throw new Error(`Nepodarilo sa načítať emaily_obci.json: ${emailResponse.statusText}`);

        const ouData = await ouResponse.json();
        const emailData = await emailResponse.json();
        
        return { ouData, emailData };
    } catch (error) {
        console.error("Chyba pri načítaní statických dát:", error);
        if (typeof showErrorModal === 'function') {
            showErrorModal({ 
                title: 'Kritická chyba aplikácie', 
                message: 'Nepodarilo sa načítať základné konfiguračné súbory (dáta OÚ alebo e-maily obcí). Aplikácia nemôže pokračovať. Skúste obnoviť stránku (F5).',
                details: error.message
            });
        } else {
            alert(`Kritická chyba: Nepodarilo sa načítať dáta. ${error.message}`);
        }
        return null;
    }
}

/**
 * Naformátuje číslo spisu do tvaru OU-ID-OKR-cisloSpisu.
 * @param {string} spisValue - čisté číslo spisu od používateľa (napr. 2025/123456).
 * @param {object} okresData - dáta vybraného OÚ (musia obsahovať AppState.selectedOU a AppState.okresData.OKR).
 * @returns {string} Naformátované číslo spisu alebo null, ak chýbajú dáta.
 */
function formatSpisNumber(spisValue, okresData) {
    if (!spisValue || !okresData || !okresData.OKR || !AppState.selectedOU) {
        return null;
    }
    // Používame AppState.selectedOU (ID) a AppState.okresData.OKR (OKR)
    return `OU-${AppState.selectedOU}-${okresData.OKR}-${spisValue}`;
}

// Controller pre listenery viazané na #agenda-view
let agendaViewListenersController = new AbortController();

document.addEventListener('DOMContentLoaded', async () => {
    
    const spinner = document.getElementById('spinner-overlay');
    if (spinner) spinner.style.display = 'flex';

    // Inicializácia dát
    const staticData = await loadStaticData();
    if (!staticData) {
         if (spinner) spinner.style.display = 'none';
         return; 
    }
    
    const OKRESNE_URADY = staticData.ouData;
    const MUNICIPALITY_EMAILS = staticData.emailData;
    
    const agendaNav = document.getElementById('agenda-navigation');
    const agendaLinks = agendaNav.querySelectorAll('.nav-link');
    const dashboardContent = document.getElementById('dashboard-content');
    
    const resetAppBtn = document.getElementById('reset-app-btn');
    const helpCenterBtn = document.getElementById('show-help-center');
    const resetTourBtn = document.getElementById('reset-tour-btn');

    const notificationList = document.getElementById('notification-list');
    const headerClearNotificationsBtn = document.getElementById('header-clear-notifications-btn');

    // Inicializácia
    populateOkresnyUradSelect(OKRESNE_URADY); 
    
    setWelcomeMessages(WELCOME_HEADING_TEXT, WELCOME_PROMPT_DEFAULT); 

    Asistent.init(notificationList);
    Asistent.log('Asistent bol inicializovaný.');
    
    initializeFromLocalStorage();
    startGuidedTour();
    updateUIState(); 

    // Pripojenie statických listenerov
    setupStaticListeners();
    
    if (spinner) spinner.style.display = 'none';

    /**
     * Nastaví texty pre uvítaciu obrazovku.
     * @param {string} heading - Nadpis (H2)
     * @param {string} prompt - Podnadpis (P)
     */
    function setWelcomeMessages(heading, prompt) {
        const welcomeHeading = document.getElementById('welcome-heading');
        const welcomePrompt = document.getElementById('welcome-prompt');

        if (welcomeHeading) {
            welcomeHeading.textContent = heading;
        }
        if (welcomePrompt) {
            welcomePrompt.textContent = prompt;
        }
    }
    
    /**
     * Pripája listenery, ktoré sa nemenia.
     */
    function setupStaticListeners() {
        if (headerClearNotificationsBtn) {
            headerClearNotificationsBtn.addEventListener('click', () => { 
                Asistent.clear();
            });
        }
        
        // Vlastný select pre OÚ (bez zmeny)
        const ouSelectWrapper = document.getElementById('ou-select-wrapper');
        const ouTrigger = document.getElementById('okresny-urad-trigger');
        const ouOptions = document.getElementById('okresny-urad-options');
        const ouLabel = document.getElementById('okresny-urad-label');
        if (ouTrigger && ouOptions && ouSelectWrapper && ouLabel) {
            ouTrigger.addEventListener('click', (e) => { e.stopPropagation(); const isOpen = ouOptions.classList.toggle('active'); ouSelectWrapper.classList.toggle('is-open', isOpen); ouTrigger.setAttribute('aria-expanded', isOpen); });
            ouOptions.addEventListener('click', (e) => { const targetOption = e.target.closest('.custom-select-option'); if (!targetOption) return; const selectedValue = targetOption.dataset.value; const selectedText = targetOption.textContent; ouLabel.textContent = selectedText; ouOptions.classList.remove('active'); ouSelectWrapper.classList.remove('is-open'); ouTrigger.setAttribute('aria-expanded', 'false'); ouOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected')); targetOption.classList.add('selected'); if (AppState.selectedOU !== selectedValue) { setOkresnyUrad(selectedValue); } });
            document.addEventListener('click', (e) => { if (ouOptions && !ouSelectWrapper.contains(e.target)) { ouOptions.classList.remove('active'); ouSelectWrapper.classList.remove('is-open'); if(ouTrigger) ouTrigger.setAttribute('aria-expanded', 'false'); } });
        }

        // Hlavná navigácia a ovládacie prvky
        agendaLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (link.classList.contains('disabled')) { Asistent.warn("Najprv prosím vyberte okresný úrad."); return; }
                if (link.classList.contains('active')) return;
                if (dashboardContent) dashboardContent.scrollTo({ top: 0, behavior: 'smooth' });
                const agendaKey = link.dataset.agenda;
                renderAgendaView(agendaKey);
            });
        });
        resetAppBtn.addEventListener('click', () => { if (confirm("Naozaj chcete resetovať aplikáciu? Stratíte všetky neuložené dáta a výbery.")) { resetApp(); } });
        
        helpCenterBtn.addEventListener('click', () => {
             if (dashboardContent) dashboardContent.scrollTo({ top: 0, behavior: 'smooth' });
             showHelpCenterModal(); // Namiesto renderHelpCenterView
        });
        
        resetTourBtn.addEventListener('click', () => { localStorage.removeItem('krokr-tour-completed'); startGuidedTour(); });

        // === ZMENA: Pridaný listener pre pole s poštovným ===
        const postovneInput = document.getElementById('postovne-input');
        if (postovneInput) {
            // Nastavíme počiatočnú hodnotu poľa z AppState
            postovneInput.value = AppState.postovne.toFixed(2);
            
            // Pri zmene (keď používateľ odíde z poľa)
            postovneInput.addEventListener('change', (e) => {
                const newValue = parseFloat(e.target.value);
                
                // Overíme, či je to platné číslo
                if (!isNaN(newValue) && newValue >= 0) {
                    AppState.postovne = newValue;
                    localStorage.setItem('krokr-postovne', newValue.toString());
                    Asistent.success(`Poštovné bolo nastavené na ${newValue.toFixed(2)} €.`);
                } else {
                    // Ak je vstup neplatný, vrátime ho na pôvodnú hodnotu
                    e.target.value = AppState.postovne.toFixed(2);
                    Asistent.warn('Prosím, zadajte platnú číselnú hodnotu pre poštovné.');
                }
            });
        }
        // === KONIEC ZMENY ===

        // Listenery pre modálne okná 
        const modalContainer = document.getElementById('modal-container');
        
        // --- NOVÝ EVENT PRE ZATVORENIE MODÁLU ---
        modalContainer.addEventListener('modal-close', (e) => {
             if (AppState.selectedAgendaKey && !AppState.spis) {
                 Asistent.warn('Číslo spisu nebolo zadané. Pre nahrávanie dát je číslo spisu povinné.');
                 updateUIState();
             }
        });
        
        // --- KLIK NA ULOŽENIE SPISU ---
        modalContainer.addEventListener('click', (e) => { 
             const target = e.target.closest('#modal-save-spis-btn'); 
             if (!target) return; 
             
             const modalInput = modalContainer.querySelector('#modal-spis-input'); 
             const contextKeyEl = modalContainer.querySelector('#modal-spis-context-key'); 
             const contextChangingEl = modalContainer.querySelector('#modal-spis-context-changing'); 
             const contextExistingEl = modalContainer.querySelector('#modal-spis-context-existing'); 
             
             if (!modalInput || !contextKeyEl || !contextChangingEl || !contextExistingEl) { 
                 console.error("Spis modal save failed: Could not find context elements."); 
                 return; 
             } 
             
             const agendaKey = contextKeyEl.value; 
             const isChanging = contextChangingEl.value === 'true'; 
             const existingValue = contextExistingEl.value; 
             const spisValue = modalInput.value.trim(); 
             
             if (spisValue) { 
                 if (isChanging && spisValue === existingValue) { 
                     document.querySelector('.modal-overlay .modal-close-btn')?.click(); 
                     return; 
                 } 
                 
                 AppState.spis = spisValue; 
                 localStorage.setItem(`krokr-spis`, spisValue); 
                 document.querySelector('.modal-overlay .modal-close-btn')?.click(); 
                 
                 if (isChanging) { 
                     const spisDisplaySpan = document.getElementById('agenda-view')?.querySelector('.spis-display span'); 
                     if (spisDisplaySpan && AppState.okresData) { 
                        spisDisplaySpan.textContent = formatSpisNumber(spisValue, AppState.okresData); 
                     }
                     Asistent.success(`Číslo spisu bolo zmenené na ${spisValue}.`); 
                 } else { 
                     Asistent.success(`Číslo spisu ${spisValue} bolo uložené.`); 
                     const agendaConfig = agendaConfigs[agendaKey]; 
                     if (agendaConfig) { 
                        initializeDocumentProcessor(agendaConfig);
                     } 
                 }
                 updateUIState();
             } else { 
                 Asistent.warn("Prosím, zadajte platné číslo spisu."); 
             } 
         });
        
        modalContainer.addEventListener('click', (e) => { const target = e.target.closest('.prepare-mail-to-obec-btn'); if (!target) return; const obecName = decodeURIComponent(target.dataset.obec); showEmailPreviewModal(obecName); });
        modalContainer.addEventListener('keyup', (e) => { if (e.key !== 'Enter') return; const target = e.target.closest('#modal-spis-input'); if (!target) return; const saveButton = modalContainer.querySelector('#modal-save-spis-btn'); if (saveButton) { saveButton.click(); } });
        modalContainer.addEventListener('click', async (e) => { const target = e.target.closest('#copy-and-open-mail-btn'); if (!target) return; const { htmlBody, recipient, subject, rowCount } = AppState.tempMailContext; if (!htmlBody) { showErrorModal({ message: 'Chyba: Nenašiel sa kontext e-mailu.' }); return; } try { const blob = new Blob([htmlBody], { type: 'text/html' }); const clipboardItem = new ClipboardItem({ 'text/html': blob }); await navigator.clipboard.write([clipboardItem]); Asistent.success(`Telo e-mailu (${rowCount} riadkov) bolo skopírované!`); const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}`; window.location.href = mailtoLink; } catch (err) { showErrorModal({ message: 'Nepodarilo sa automaticky skopírovať obsah.', details: 'Prosím, označte text v náhľade manuálne (Ctrl+A, Ctrl+C) a pokračujte. Chyba: ' + err.message }); } });
        modalContainer.addEventListener('click', (e) => { const target = e.target.closest('#show-partial-preview-btn'); if (!target) return; const { htmlBody } = AppState.tempMailContext; const partialPreviewContainer = modalContainer.querySelector('#email-partial-preview'); if (!htmlBody || !partialPreviewContainer) return; const tempDiv = document.createElement('div'); tempDiv.innerHTML = htmlBody; const table = tempDiv.querySelector('table'); if (table) { const rows = Array.from(table.querySelectorAll('tbody > tr')); const previewRows = rows.slice(0, 10); const newTbody = document.createElement('tbody'); previewRows.forEach(row => newTbody.appendChild(row.cloneNode(true))); table.querySelector('tbody').replaceWith(newTbody); partialPreviewContainer.innerHTML = tempDiv.innerHTML; partialPreviewContainer.style.display = 'block'; target.style.display = 'none'; } });
        
        // Statické taby pre #agenda-view (iba prepínanie)
        const agendaView = document.getElementById('agenda-view');
        if (agendaView) setupTabListeners(agendaView);
    }

    // Riadenie stavu UI (upravené pre stav spisu)
    function updateUIState() { 
        const ouSelected = !!AppState.selectedOU; 
        
        agendaLinks.forEach(link => { 
            link.classList.toggle('disabled', !ouSelected); 
            link.classList.toggle('active', link.dataset.agenda === AppState.selectedAgendaKey && AppState.currentView === 'agenda'); 
        }); 
        
        if (AppState.processor) AppState.processor.checkAllButtonsState(); 
        
        const agendaView = document.getElementById('agenda-view'); 
        const genTab = agendaView?.querySelector('.agenda-tab[data-tab="generovanie"]'); 
        
        const spisPresent = !!AppState.spis;
        const filesReady = AppState.selectedAgendaKey && agendaConfigs[AppState.selectedAgendaKey].dataInputs.every(input => AppState.files[input.id]); 
        const hasErrors = AppState.processor?.state?.hasValidationErrors || false;

        const dropZones = agendaView?.querySelectorAll('.file-drop-zone');
        const fileInputs = agendaView?.querySelectorAll('.file-input');
        if (dropZones) {
             dropZones.forEach(dz => {
                 dz.classList.toggle('disabled-overlay', !spisPresent);
             });
        }
        if (fileInputs) {
            fileInputs.forEach(input => {
                input.disabled = !spisPresent;
            });
        }
        
        const shouldBeDisabled = !spisPresent || !filesReady || (filesReady && hasErrors);

        if (genTab) { 
            genTab.classList.toggle('is-disabled', shouldBeDisabled); 
        } 
        
        // Aktualizácia stavu spisu v hlavičke
        const spisDisplay = agendaView?.querySelector('.spis-display');
        const spisSpan = spisDisplay ? spisDisplay.querySelector('span') : null;

        if (spisDisplay && spisSpan) {
            if (AppState.spis && AppState.okresData) {
                const formattedSpis = formatSpisNumber(AppState.spis, AppState.okresData);
                spisSpan.textContent = formattedSpis || 'Chyba formátu spisu!';
                spisDisplay.classList.remove('spis-display--error');
            } else {
                spisSpan.textContent = 'Nie je zadané číslo spisu !';
                spisDisplay.classList.add('spis-display--error');
            }
        }
        
        const mailBtnVp = agendaView?.querySelector('#send-mail-btn-vp'); 
        if (mailBtnVp) { 
            const showMailBtn = AppState.zoznamyPreObceGenerated && AppState.selectedAgendaKey === 'vp'; 
            mailBtnVp.style.display = showMailBtn ? 'block' : 'none'; 
        } 
    }

    /**
     * Prepne aktívne zobrazenie v <main> kontajneri.
     */
    function showView(viewName) {
        AppState.currentView = viewName;
        
        const welcomeView = document.getElementById('welcome-view');
        const agendaView = document.getElementById('agenda-view');

        if (welcomeView) welcomeView.classList.remove('active');
        if (agendaView) agendaView.classList.remove('active');
        
        switch (viewName) {
            case 'welcome':
                if (welcomeView) welcomeView.classList.add('active');
                break;
            case 'agenda':
                if (agendaView) agendaView.classList.add('active');
                break;
        }
        
        updateUIState();
    }
    
    // Hlavná logika a funkcie
    function resetAgendaState() { 
        localStorage.removeItem('krokr-spis'); 
        Object.assign(AppState, { 
            spis: null, 
            selectedAgendaKey: null, 
            processor: null, 
            files: {}, 
            municipalitiesMailContent: {}, 
            zoznamyPreObceGenerated: false, 
        }); 
        showWelcomeMessage(); 
    }
    
    function resetApp() { 
        localStorage.removeItem('krokr-lastOU'); 
        localStorage.removeItem('krokr-lastAgenda'); 
        
        // === ZMENA: Resetujeme aj poštovné z localStorage ===
        localStorage.removeItem('krokr-postovne');
        // =================================================

        resetAgendaState(); 
        AppState.selectedOU = null; 
        AppState.okresData = null; 
        
        // === ZMENA: Pri resete nastavíme AppState.postovne na východziu hodnotu ===
        AppState.postovne = POSTOVNE;
        const postovneInput = document.getElementById('postovne-input');
        if (postovneInput) {
            postovneInput.value = AppState.postovne.toFixed(2);
        }
        // =====================================================================

        const ouLabel = document.getElementById('okresny-urad-label'); 
        const ouOptions = document.getElementById('okresny-urad-options'); 
        if (ouLabel) ouLabel.textContent = 'Prosím, vyberte OÚ'; 
        if (ouOptions) { 
            ouOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected')); 
            const placeholder = ouOptions.querySelector('.custom-select-option[data-value=""]'); 
            if (placeholder) placeholder.classList.add('selected'); 
        } 
        
        setWelcomeMessages(WELCOME_HEADING_TEXT, WELCOME_PROMPT_DEFAULT);
        
        Asistent.clear();
        Asistent.log('Aplikácia bola resetovaná.');
        
        updateUIState(); 
    }

    function setOkresnyUrad(ouKey) {
        const ouLabel = document.getElementById('okresny-urad-label'); 
        const ouOptions = document.getElementById('okresny-urad-options');
        if (!ouKey) { resetApp(); return; }
        const hasData = Object.keys(AppState.files).length > 0 || AppState.spis !== null; 
        if (AppState.selectedOU && AppState.selectedOU !== ouKey && hasData) { 
            if (!confirm("Zmenou okresného úradu prídete o všetky rozpracované dáta (nahraté súbory a spis). Naozaj chcete pokračovať?")) { 
                const previousOption = ouOptions.querySelector(`.custom-select-option[data-value="${AppState.selectedOU}"]`); 
                if (previousOption) { ouLabel.textContent = previousOption.textContent; ouOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected')); previousOption.classList.add('selected'); } 
                return; 
            } 
            resetAgendaState(); 
        }
        const selectedOption = ouOptions.querySelector(`.custom-select-option[data-value="${ouKey}"]`); 
        if (selectedOption) { ouLabel.textContent = selectedOption.textContent; ouOptions.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected')); selectedOption.classList.add('selected'); }
        AppState.selectedOU = ouKey; 
        AppState.okresData = OKRESNE_URADY[ouKey]; 
        localStorage.setItem('krokr-lastOU', ouKey);
        
        const vedOdboruSpan = document.getElementById('veduci-odboru-span');
        if (vedOdboruSpan && AppState.okresData && AppState.okresData.veduci) {
             vedOdboruSpan.textContent = AppState.okresData.veduci;
        } else if (vedOdboruSpan) {
             vedOdboruSpan.textContent = 'Neuvedené';
        }

        if (!hasData) Asistent.success(`Vybraný OÚ: ${AppState.okresData.Okresny_urad}`);
        
        if (AppState.currentView === 'agenda') {
             const agendaView = document.getElementById('agenda-view');
             const summarySpan = agendaView?.querySelector('.selection-summary strong');
             if (summarySpan) summarySpan.nextSibling.textContent = ` ${AppState.okresData.Okresny_urad}`;
        }

        setWelcomeMessages("", WELCOME_PROMPT_OU_SELECTED);

        updateUIState();
    }

    function showWelcomeMessage() { showView('welcome'); }

    /**
     * Zobrazí #agenda-view a pripojí naň čerstvé listenery.
     */
    function renderAgendaView(agendaKey) {
        const agendaConfig = agendaConfigs[agendaKey]; if (!agendaConfig) return;
        agendaViewListenersController.abort(); agendaViewListenersController = new AbortController();
        
        Asistent.clear();

        AppState.files = {}; 
        AppState.municipalitiesMailContent = {}; 
        AppState.zoznamyPreObceGenerated = false; 
        AppState.processor = null;

        AppState.selectedAgendaKey = agendaKey; 
        localStorage.setItem('krokr-lastAgenda', agendaKey);
        showView('agenda'); 
        
        const currentAgendaView = document.getElementById('agenda-view'); 
        if (currentAgendaView) { 
             setupAgendaViewListeners(currentAgendaView, agendaViewListenersController.signal); 
        }
        
        renderAgendaTabs(agendaKey, agendaConfig);
        
        const globalSpis = localStorage.getItem(`krokr-spis`); 
        if (globalSpis) { 
            AppState.spis = globalSpis; 
            initializeDocumentProcessor(agendaConfig);
        } else { 
            AppState.spis = null;
            showSpisModal(agendaKey, agendaConfig); 
        }
        
        updateUIState();
    }

    function showSpisModal(agendaKey, agendaConfig, existingValue = '') { 
        const isChanging = !!existingValue; 
        const titleText = isChanging ? 'Zmeniť číslo spisu' : 'Nastaviť číslo spisu'; 
        const subtitleText = isChanging ? 'Môžete upraviť existujúce číslo spisu.' : 'Prosím, zadajte číslo spisu, pod ktorým chcete pracovať.'; 
        const buttonText = isChanging ? 'Uložiť zmeny' : 'Uložiť a pokračovať'; 
        const title = `<div class="help-center-header"><i class="fas ${isChanging ? 'fa-edit' : 'fa-folder-open'}"></i><div class="title-group"><h3>${titleText}</h3><span>${subtitleText}</span></div></div>`; 
        const content = `<p>Číslo spisu je povinné pre generovanie dokumentov a bude rovnaké pre všetky agendy. Bude automaticky vložené do všetkých exportov.<b style="color: #FF9800;"> Zadávajte len ROK/číslo spisu.</b></p><div class="spis-input-group" style="margin-top: 1.5rem; max-width: none;"><input type="text" id="modal-spis-input" class="form-input" placeholder="Napr. 2025/123456" value="${existingValue}"><button id="modal-save-spis-btn" class="btn btn--primary"><i class="fas fa-save"></i> ${buttonText}</button></div><input type="hidden" id="modal-spis-context-key" value="${agendaKey}"><input type="hidden" id="modal-spis-context-changing" value="${isChanging ? 'true' : 'false'}"><input type="hidden" id="modal-spis-context-existing" value="${existingValue}">`; 
        showModal({ title, content, autoFocusSelector: '#modal-spis-input' }); 
    }

    /**
     * Vypĺňa pracovnú plochu dátami.
     */
    function renderAgendaTabs(agendaKey, agendaConfig) {
        const agendaView = document.getElementById('agenda-view'); if (!agendaView) { console.error("Kritická chyba: Element #agenda-view nebol nájdený počas renderAgendaTabs."); return; }
        agendaView.querySelector('.content-header h2').textContent = agendaConfig.title; 
        agendaView.querySelector('.selection-summary strong').nextSibling.textContent = ` ${AppState.okresData.Okresny_urad}`;
        
        const vedOdboruSpan = document.getElementById('veduci-odboru-span');
        if (vedOdboruSpan && AppState.okresData && AppState.okresData.veduci) {
             vedOdboruSpan.textContent = AppState.okresData.veduci;
        } else if (vedOdboruSpan) {
             vedOdboruSpan.textContent = 'Neuvedené';
        }

        const spisDisplay = agendaView.querySelector('.spis-display');
        const spisSpan = spisDisplay ? spisDisplay.querySelector('span') : null;

        if (spisDisplay && spisSpan) {
            if (AppState.spis && AppState.okresData) {
                const formattedSpis = formatSpisNumber(AppState.spis, AppState.okresData);
                spisSpan.textContent = formattedSpis || 'Chyba formátu spisu!';
                spisDisplay.classList.remove('spis-display--error');
            } else {
                spisSpan.textContent = 'Nie je zadané číslo spisu !';
                spisDisplay.classList.add('spis-display--error');
            }
        }
        
        const fileInputsHTML = agendaConfig.dataInputs.map(inputConf => `<div class="file-input-wrapper"><div class="file-drop-zone ${AppState.spis ? '' : 'disabled-overlay'}" id="drop-zone-${inputConf.id}"><div class="file-drop-zone__prompt"><i class="fas fa-upload"></i><p><strong>${inputConf.label}</strong></p><span>Presuňte súbor sem alebo kliknite</span></div><div class="file-details"><div class="file-info"><i class="far fa-file-excel"></i><div><div class="file-name"></div><div class="file-size"></div></div><button class="btn-remove-file" data-input-id="${inputConf.id}">&times;</button></div></div></div><input type="file" id="${inputConf.id}" accept=".xlsx,.xls" class="file-input" data-dropzone-id="drop-zone-${inputConf.id}" ${AppState.spis ? '' : 'disabled'}></div>`).join(''); 
        
        agendaView.querySelector('#file-inputs-container').innerHTML = fileInputsHTML;
        const generatorsHTML = Object.keys(agendaConfig.generators).map(genKey => { const genConf = agendaConfig.generators[genKey]; const isXlsx = genConf.outputType === 'xlsx'; const buttonText = isXlsx ? 'Exportovať (.xlsx)' : 'Generovať (.docx)'; let mailButtonHTML = ''; if (agendaKey === 'vp' && genKey === 'zoznamyObce') mailButtonHTML = `<div class="generator-group"><button id="send-mail-btn-vp" class="btn btn--primary" style="display: none; margin-top: 0.5rem;"><i class="fas fa-paper-plane"></i> Pripraviť e-maily obciam</button></div>`; return `<div class="doc-box"><h4>${genConf.title}</h4><p class="doc-box__description">${isXlsx ? 'Tento export vygeneruje súbor .xlsx.' : 'Generuje dokumenty na základe šablóny.'}</p><button id="${genConf.buttonId}" class="btn btn--accent" data-generator-key="${genKey}" disabled><i class="fas fa-cogs"></i> <span class="btn-text">${buttonText}</span></button>${mailButtonHTML}</div>`; }).join(''); agendaView.querySelector('#generators-container').innerHTML = generatorsHTML;
        agendaView.querySelector('#preview-container').innerHTML = `<div class="empty-state-placeholder"><i class="fas fa-file-import"></i><h4>Náhľad sa zobrazí po nahratí súborov</h4><p>Začnite nahratím vstupných súborov.</p></div>`;
        agendaView.querySelectorAll('.agenda-tab').forEach((tab, index) => { tab.classList.toggle('active', index === 0); if (tab.dataset.tab === 'generovanie') tab.classList.add('is-disabled'); }); agendaView.querySelectorAll('.agenda-tab-content').forEach((content, index) => { content.classList.toggle('active', index === 0); });
        
        if (AppState.spis && !AppState.processor) {
             initializeDocumentProcessor(agendaConfig);
        }

        updateUIState();
    }
    
    function initializeDocumentProcessor(baseConfig) { 
        if (AppState.processor) return;
        
        const fullConfig = { 
            sectionPrefix: AppState.selectedAgendaKey,
            appState: AppState, 
            dataInputs: baseConfig.dataInputs, 
            previewElementId: 'preview-container', 
            dataProcessor: baseConfig.dataProcessor, 
            generators: baseConfig.generators, 
            onDataProcessed: () => { 
                const agendaView = document.getElementById('agenda-view'); 
                const genTab = agendaView?.querySelector('.agenda-tab[data-tab="generovanie"]');
                
                const hasErrors = AppState.processor?.state?.hasValidationErrors || false;

                if (genTab) { 
                    const filesReady = baseConfig.dataInputs.every(input => AppState.files[input.id]); 
                    const shouldBeDisabled = !AppState.spis || !filesReady || hasErrors;
                    genTab.classList.toggle('is-disabled', shouldBeDisabled); 
                }
                
                AppState.processor.config.dataInputs.forEach(inputConf => {
                    const dropZone = document.getElementById(`drop-zone-${inputConf.id}`);
                    if (dropZone) {
                        dropZone.classList.toggle('loaded', AppState.files[inputConf.id] && !hasErrors);
                    }
                });
                
                updateUIState(); 
            }, 
            onMailGenerationStart: () => { 
                AppState.municipalitiesMailContent = {}; 
                AppState.zoznamyPreObceGenerated = false; 
            }, 
            onMailDataGenerated: (groupKey, mailData) => { 
                AppState.municipalitiesMailContent[groupKey] = mailData; 
            }, 
            onMailGenerationComplete: () => { 
                AppState.zoznamyPreObceGenerated = true; 
                Asistent.log('Dáta pre e-maily obciam sú pripravené.');
                updateUIState(); 
            } 
        }; 
        AppState.processor = new DocumentProcessor(fullConfig); 
        AppState.processor.loadTemplates(); 
        if (AppState.selectedAgendaKey === 'vp') loadPscFile(); 
    }
    
    async function loadPscFile() { 
        try { 
            const response = await fetch(TEMPLATE_PATHS.pscFile); 
            if (!response.ok) throw new Error(`Súbor PSČ sa nepodarilo načítať: ${response.statusText}`); 
            const arrayBuffer = await response.arrayBuffer(); 
            AppState.processor.state.data.psc = arrayBuffer; 
            AppState.processor.checkAndProcessData(); 
        } catch (error) { 
            Asistent.error('Chyba pri automatickom načítaní súboru PSČ.', error.message);
            showErrorModal({ message: 'Chyba pri automatickom načítaní súboru PSČ.', details: error.message }); 
        } 
    }
    
    // Logika pre odosielanie mailov (bez zmeny)
    const PREVIEW_THRESHOLD = 20; const PARTIAL_PREVIEW_COUNT = 10;
    function showMailListModal() { 
        if (!AppState.zoznamyPreObceGenerated) { 
            Asistent.warn("Táto možnosť je dostupná až po vygenerovaní zoznamov pre obce.");
            return; 
        } 
        const mailContent = AppState.municipalitiesMailContent; const ouEmails = MUNICIPALITY_EMAILS[AppState.selectedOU] || {}; let listHTML = '<ul style="list-style-type: none; padding: 0;">'; let hasContent = false; for (const obecName in mailContent) { hasContent = true; const recipientEmail = ouEmails[obecName]; const rowCount = mailContent[obecName].count; listHTML += `<li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;"><span><i class="fas fa-building" style="margin-right: 10px; color: #555;"></i>${obecName} <small>(${rowCount} záznamov)</small></span>`; if (recipientEmail) listHTML += `<button class="btn btn--primary prepare-mail-to-obec-btn" data-obec="${encodeURIComponent(obecName)}"><i class="fas fa-envelope"></i> Pripraviť e-mail</button>`; else listHTML += `<span style="color: var(--danger-color); font-size: 0.9em;"><i class="fas fa-exclamation-triangle"></i> Email nenájdený</span>`; listHTML += `</li>`; } listHTML += '</ul>'; if (!hasContent) { showModal({ title: 'Odoslanie pošty', content: '<p>Nenašli sa žiadne vygenerované dáta pre odoslanie.</p>'}); return; } showModal({ title: 'Odoslať zoznamy obciam', content: listHTML }); }
    const showEmailPreviewModal = (obecName) => { const mailContent = AppState.municipalitiesMailContent; const ouEmails = MUNICIPALITY_EMAILS[AppState.selectedOU] || {}; const emailData = mailContent[obecName]; if (!emailData) { showErrorModal({ message: 'Nenašli sa dáta pre e-mail pre zvolenú obec.'}); return; } const { html: htmlBody, count: rowCount } = emailData; const recipient = ouEmails[obecName]; const subject = `Zoznam subjektov pre obec ${obecName}`; AppState.tempMailContext = { htmlBody, recipient, subject, rowCount }; const modalTitle = `<div class="help-center-header"><i class="fas fa-envelope-open-text"></i><div class="title-group"><h3>Náhľad e-mailu</h3><span>Skontrolujte obsah a skopírujte ho do e-mailového klienta.</span></div></div>`; let previewContentHTML; if (rowCount > PREVIEW_THRESHOLD) previewContentHTML = `<div id="email-preview-content" style="border: 1px solid #e0e0e0; padding: 1rem; border-radius: 8px; background-color: #f9f9f9;"><p>Náhľad e-mailu pre obec <strong>${obecName}</strong> obsahuje veľký počet záznamov (<strong>${rowCount} riadkov</strong>).</p><p>Zobrazenie celej tabuľky by mohlo spomaliť Váš prehliadač. Tlačidlo nižšie skopírujte <strong>kompletné dáta</strong>.</p><button id="show-partial-preview-btn" class="btn btn--secondary" style="margin-top: 0.5rem;"><i class="fas fa-eye"></i> Zobraziť ukážku prvých ${PARTIAL_PREVIEW_COUNT} riadkov</button><div id="email-partial-preview" style="display: none; margin-top: 1rem; max-height: 25vh; overflow-y: auto;"></div></div>`; else previewContentHTML = `<div id="email-preview-content" style="border: 1px solid #e0e0e0; padding: 1rem; border-radius: 8px; background-color: #f9f9f9; max-height: 40vh; overflow-y: auto;">${htmlBody}</div>`; const modalContent = `<div style="font-size: 0.9em; display: flex; flex-direction: column; gap: 1rem;"><p><strong>Príjemca:</strong> ${recipient}</p><p><strong>Predmet:</strong> ${subject}</p><p><strong>Telo e-mailu:</strong></p>${previewContentHTML}<div style="background-color: var(--primary-color-light); padding: 1rem; border-radius: 8px; text-align: center;"><p style="margin-bottom: 0.75rem;">Kliknutím na tlačidlo sa <strong>celé telo e-mailu</strong> (všetkých ${rowCount} riadkov) skopíruje a otvorí sa Váš predvolený e-mailový program. Následne stačí obsah do tela e-mailu iba vložiť (Ctrl+V).</p><button id="copy-and-open-mail-btn" class="btn btn--primary"><i class="fas fa-copy"></i> Skopírovať telo a otvoriť e-mail</button></div></div>`; showModal({ title: modalTitle, content: modalContent, autoFocusSelector: '#copy-and-open-mail-btn' }); };

    /**
     * Zobrazí Centrum nápovedy v modálnom okne.
     */
    function showHelpCenterModal() {
        const downloadListHTML = Object.entries(TEMPLATE_DOWNLOAD_FILES).map(([fileName, path]) => `
            <li class="download-item">
                <i class="fas fa-file-excel"></i>
                <span>${fileName}</span>
                <a href="${path}" download="${fileName}" class="btn btn--primary" style="padding: 0.4rem 1rem; margin-left: auto;">
                    <i class="fas fa-download"></i> Stiahnuť
                </a>
            </li>
        `).join('');
        const okresName = AppState.okresData ? AppState.okresData.Okresny_urad : 'Nevybraný';

        const modalBodyContent = getHelpCenterHTML({ 
            okresName: okresName,
            downloadListHTML: downloadListHTML 
        }); 

        const modalTitle = `
            <div class="help-center-header">
                <i class="fas fa-life-ring" style="color: var(--primary-color);"></i>
                <div class="title-group">
                    <h3>Centrum nápovedy</h3>
                    <span>${okresName}</span>
                </div>
            </div>`;

        showModal({ title: modalTitle, content: modalBodyContent });

        const modalContainer = document.getElementById('modal-container');
        const modalBody = modalContainer.querySelector('.modal-body');
        if (modalBody) {
            setupTabListeners(modalBody);
            setupAccordionListeners(modalBody);
        }
    }
    
    function setupTabListeners(parentElement = document) { if (!parentElement) return; const tabs = parentElement.querySelectorAll('.agenda-tab'); const contents = parentElement.querySelectorAll('.agenda-tab-content'); if (tabs.length === 0) return; tabs.forEach(tab => { tab.addEventListener('click', () => { if (tab.classList.contains('is-disabled')) { Asistent.warn('Táto karta bude dostupná po nahratí a spracovaní súborov.'); return; } tabs.forEach(t => t.classList.remove('active')); contents.forEach(c => c.classList.remove('active')); tab.classList.add('active'); const contentEl = parentElement.querySelector(`#tab-${tab.dataset.tab}`); if (contentEl) contentEl.classList.add('active'); }); }); }
    function setupAccordionListeners(parentElement = document) { if (!parentElement) return; const accordionItems = parentElement.querySelectorAll(`.accordion-card`); if (accordionItems.length === 0) return; accordionItems.forEach(item => { const header = item.querySelector('.accordion-header'); header.addEventListener('click', () => { item.classList.toggle('active'); }); }); }

    /**
     * Pripája VŠETKY delegované listenery na #agendaView.
     */
    function setupAgendaViewListeners(view, signal) {
        if (!view) return;

        // --- 1. Zjednotený CLICK listener ---
        view.addEventListener('click', (e) => {
            const removeButton = e.target.closest('.btn-remove-file'); 
            if (removeButton) {
                 e.stopPropagation(); 
                 const inputId = removeButton.dataset.inputId; 
                 const input = document.getElementById(inputId); 
                 if (!input) return; 
                 const dropZone = document.getElementById(input.dataset.dropzoneId); 
                 
                 delete AppState.files[inputId]; 
                 input.value = ''; 
                 
                 if(dropZone) dropZone.classList.remove('loaded'); 

                 if (AppState.processor) { 
                    const inputConf = agendaConfigs[AppState.selectedAgendaKey]?.dataInputs.find(i => i.id === inputId); 
                    const stateKey = inputConf ? inputConf.stateKey : null; 
                    if (stateKey) delete AppState.processor.state.data[stateKey]; 
                    
                    AppState.processor.state.processedData = null;
                    AppState.processor.state.hasValidationErrors = false;
                    
                    const previewContainer = document.getElementById('preview-container'); 
                    if (previewContainer) previewContainer.innerHTML = `<div class="empty-state-placeholder"><i class="fas fa-eye-slash"></i><h4>Náhľad dát bol vymazaný</h4><p>Prosím, nahrajte vstupné súbory na zobrazenie náhľadu.</p></div>`; 
                    
                    Asistent.log('Náhľad dát bol vymazaný.'); 
                    AppState.processor.checkAllButtonsState(); 
                } 
                updateUIState(); 
                return; 
            }
            
            // === ZMENA: Úprava odovzdávania kontextu ===
            const genButton = e.target.closest('button[data-generator-key]:not(:disabled)'); 
            if (genButton) { 
                 e.stopPropagation(); 
                 if (!AppState.processor || !AppState.spis) { 
                     Asistent.error('Chyba: Procesor alebo číslo spisu chýba.'); 
                     return; 
                 } 
                 const genKey = genButton.dataset.generatorKey; 
                 const genConf = agendaConfigs[AppState.selectedAgendaKey]?.generators[genKey]; 
                 
                 // Vytvoríme čistý kontextový objekt
                 const context = {
                     spis: AppState.spis,
                     okresData: AppState.okresData,
                     selectedOU: AppState.selectedOU,
                     // === ZMENA: Pridali sme poštovné do kontextu ===
                     postovne: AppState.postovne
                     // ============================================
                 };

                 if (genConf) { 
                     switch (genConf.type) { 
                         case 'row': AppState.processor.generateRowByRow(genKey, context); break; 
                         case 'batch': AppState.processor.generateInBatches(genKey, context); break; 
                         case 'groupBy': AppState.processor.generateByGroup(genKey, context); break; 
                         default: Asistent.error(`Neznámy typ generátora: ${genConf.type}`); showErrorModal({ message: `Neznámy typ generátora: ${genConf.type}` }); 
                     } 
                 } 
                 return; 
            }
            // === KONIEC ZMENY ===

            const mailButton = e.target.closest('#send-mail-btn-vp'); 
            if (mailButton) {
                 e.stopPropagation(); showMailListModal(); return; 
            }
            const spisDisplay = e.target.closest('.spis-display--editable'); 
            if (spisDisplay) {
                 e.stopPropagation(); 
                 const agendaKey = AppState.selectedAgendaKey; 
                 if (!agendaKey) return; 
                 const agendaConfig = agendaConfigs[agendaKey]; 
                 const currentValue = AppState.spis || ''; 
                 showSpisModal(agendaKey, agendaConfig, currentValue); 
                 return; 
            }
            
            const disabledDropZone = e.target.closest('.file-drop-zone.disabled-overlay');
            if (disabledDropZone) {
                e.preventDefault();
                e.stopPropagation();
                Asistent.warn('Nahrávanie dát je zablokované. Prosím, najprv zadajte číslo spisu.');
                return;
            }

        }, { signal }); 

        
        // --- 2. Listenery pre nahrávanie súborov ---
        const getFileConfig = (target) => { 
             const agendaConfig = agendaConfigs[AppState.selectedAgendaKey]; 
             if (!agendaConfig) return null; 
             const inputWrapper = target.closest('.file-input-wrapper'); 
             if (!inputWrapper) return null; 
             const input = inputWrapper.querySelector('.file-input'); 
             if (!input) return null; 
             const inputId = input.id; 
             const dropZone = document.getElementById(input.dataset.dropzoneId); 
             const fileNameEl = dropZone?.querySelector('.file-name'); 
             const fileSizeEl = dropZone?.querySelector('.file-size'); 
             const inputConf = agendaConfig.dataInputs.find(conf => conf.id === inputId); 
             const stateKey = inputConf ? inputConf.stateKey : null; 
             
             if (!AppState.spis) return null;

             return { input, inputId, dropZone, fileNameEl, fileSizeEl, stateKey }; 
        };
        
        const handleFile = (file, config) => { 
            if (!file || !config || !config.stateKey) return; 
            
            const { input, inputId, dropZone, fileNameEl, fileSizeEl, stateKey } = config; 
            
            AppState.files[inputId] = file; 
            
            if(dropZone) dropZone.classList.remove('loaded'); 
            
            if(fileNameEl) fileNameEl.textContent = file.name; 
            if(fileSizeEl) fileSizeEl.textContent = formatBytes(file.size); 
            
            if (AppState.processor) AppState.processor.processFile(file, stateKey); 
        };

        view.addEventListener('change', (e) => { 
             const input = e.target.closest('.file-input'); 
             if (!input) return; 
             const config = getFileConfig(input); 
             if (config && e.target.files.length > 0) handleFile(e.target.files[0], config); 
        }, { signal }); 
        
        view.addEventListener('dragover', (e) => { 
             e.preventDefault(); 
             const dropZone = e.target.closest('.file-drop-zone'); 
             if (dropZone && AppState.spis) dropZone.classList.add('active'); 
        }, { signal }); 
        
        view.addEventListener('dragleave', (e) => { 
             const dropZone = e.target.closest('.file-drop-zone'); 
             if (dropZone) dropZone.classList.remove('active'); 
        }, { signal }); 
        
        view.addEventListener('drop', (e) => { 
             e.preventDefault(); 
             const dropZone = e.target.closest('.file-drop-zone'); 
             if (!dropZone) return; 
             dropZone.classList.remove('active'); 
             const config = getFileConfig(dropZone); 
             if (config && e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0], config); 
        }, { signal }); 
    }
    
    // Inicializácia z localStorage (bez zmeny)
    function initializeFromLocalStorage() { 
        const lastOU = localStorage.getItem('krokr-lastOU'); 
        if (lastOU) { 
            setOkresnyUrad(lastOU); 
            const lastAgenda = localStorage.getItem('krokr-lastAgenda'); 
            if (lastAgenda) setTimeout(() => { renderAgendaView(lastAgenda); }, 100); 
        } 
    }
});

// populateOkresnyUradSelect (bez zmeny)
function populateOkresnyUradSelect(ouData) { const optionsContainer = document.getElementById('okresny-urad-options'); if (!optionsContainer) return; optionsContainer.innerHTML = ''; const placeholderOption = document.createElement('div'); placeholderOption.className = 'custom-select-option selected'; placeholderOption.textContent = ''; placeholderOption.dataset.value = ''; optionsContainer.appendChild(placeholderOption); Object.keys(ouData).forEach(key => { const option = document.createElement('div'); option.className = 'custom-select-option'; option.textContent = ouData[key].Okresny_urad; option.dataset.value = key; optionsContainer.appendChild(option); }); }