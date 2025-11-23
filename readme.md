# Dokumentový Automat – Systém pre Správu Administratívnych Dokumentov

Moderná webová aplikácia pre automatizované generovanie administratívnych dokumentov v oblasti obrany a civilnej ochrany na Slovensku. Aplikácia umožňuje spracovanie údajov, validáciu, hromadné generovanie dokumentov z šablón a manažment distribúcie zasielok.

## 📋 Obsah

- [Funkcie](#-funkcie)
- [Technológie](#-technológie)
- [Inštalácia](#-inštalácia)
- [Štruktúra projektu](#-štruktúra-projektu)
- [Používanie](#-používanie)
- [Agendy](#-agendy)
- [Konfigurácia](#-konfigurácia)
- [Firebase integrácia](#-firebase-integrácia)
- [Rozšírenie](#-rozšírenie)

## ✨ Funkcie

### Hlavné funkcionality

- **Spracovanie XLSX súborov** – Import a validácia údajov zo súborov Excel
- **Hromadné generovanie dokumentov** – Automatická tvorba rozhodnutí, obálok a podacích hárkov z DOCX šablón
- **Validácia dát** – Real-time kontrola povinných polí, formátov a integrity údajov
- **Export dokumentov** – Generovanie ZIP archívov s hromadnými dokumentmi
- **Manažment distribúcie** – Zoznam zasielok na doručenie, export pre obce, e-mailové šablóny
- **Firebase integrácia** – Cloudová databáza pre konfiguráciu, dynamické načítavanie poštovného
- **Interaktívna nápoveda** – Vstavaný tour a centrum nápovedy s návodmi
- **Responzívne UI** – Moderný dizajn s dark/light režimom a skeleton loadingom

### Podporované agendy

1. **Vecné prostriedky (VP)** – Evidencia vozidiel a techniky
2. **Pracovná povinnosť (PP)** – Správa pracovnej povinnosti fyzických osôb
3. **Ubytovanie (UB)** – Správa nehnuteľností na ubytovanie
4. **Doručovatelia (DR)** – Evidencia doručovateľov

## 🛠 Technológie

### Frontend
- **Vanilla JavaScript (ES6+)** – Modulárna architektúra bez frameworku
- **CSS3** – Custom properties, Grid, Flexbox
- **Markdown** – Formátovanie obsahu a nápovedy

### Backend & Služby
- **Firebase Firestore** – Cloudová databáza pre konfiguráciu
- **Firebase Authentication** – Autentifikácia používateľov (pripravené)

### Knižnice
- **docxtemplater** – Generovanie DOCX dokumentov zo šablón
- **PizZip** – Práca so ZIP archívmi
- **SheetJS (xlsx)** – Spracovanie Excel súborov
- **marked.js** – Konverzia Markdown na HTML
- **DOMPurify** – Sanitizácia HTML obsahu


## 🚀 Používanie

### 1. Výber okresného úradu

Pri prvom spustení vyberte okresný úrad z rozbaľovacieho zoznamu v hornej lište. Táto informácia sa automaticky doplní do všetkých generovaných dokumentov.

### 2. Zadanie čísla spisu

Zadajte číslo spisu vo formáte `ROK/číslo` (napr. `2025/123`). Toto číslo bude použité vo všetkých generovaných dokumentoch.

### 3. Nahratie súborov

Pre každú agendu nahrajte príslušný XLSX súbor:
- Kliknite na upload zónu alebo presuňte súbor
- Aplikácia automaticky validuje štruktúru a údaje
- Zobrazí sa náhľad s označením chybných riadkov

### 4. Generovanie dokumentov

Po úspešnom nahratí a validácii:
- Kliknite na tlačidlo príslušného generátora (Rozhodnutia, Obálky, Podacie hárky, atď.)
- Dokumenty sa vygenerujú a automaticky stiahnu ako ZIP archív
- Progress bar ukazuje priebeh generovania

### 5. E-mailová distribúcia

Pre export zoznamov pre obce:
- Vygenerujte export cez tlačidlo "Export zoznamov pre obce"
- Kliknite na ikonu obálky vedľa názvu obce
- Skopírujte obsah e-mailu a odošlite cez váš e-mailový klient

## 📋 Agendy

### Vecné prostriedky (VP)

**Účel:** Správa vozidiel a techniky určenej na plnenie úloh obrany štátu.

**Generované dokumenty:**
- Rozhodnutia o povinnosti poskytnúť vecné prostriedky
- Obálky na doručenie
- Podacie hárky (po 8 záznamoch)
- Zoznamy na doručovanie (zoskupené podľa obcí)
- Export pre obce (XLSX)

**Povinné polia v XLSX:**
- P.Č., DODÁVATEĽ, ADRESA, PSC_long, IČO, EČV, TOVÁRENSKÁ ZNAČKA, DRUH KAROSÉRIE, ÚTVAR, MIESTO DODANIA, PCRD_short, MESTO (OBEC)

### Pracovná povinnosť (PP)

**Účel:** Evidencia fyzických osôb s pracovnou povinnosťou.

**Generované dokumenty:**
- Rozhodnutia o pracovnej povinnosti
- Obálky na doručenie
- Podacie hárky
- Zoznamy na doručovanie

**Povinné polia v XLSX:**
- Por. číslo, Titul, Meno, Priezvisko, Rodné číslo, Miesto pobytu / Adresa trvalého pobytu, Miesto nástupu k vojenskému útvaru, Obec

### Ubytovanie (UB)

**Účel:** Správa nehnuteľností určených na ubytovanie.

**Generované dokumenty:**
- Rozhodnutia o poskytnutí ubytovania
- Obálky
- Podacie hárky
- Zoznamy na doručovanie

**Povinné polia v XLSX:**
- obchodné meno alebo názov alebo meno a priezvisko, IČO alebo rodné číslo, sídlo alebo miesto pobytu, názov (identifikácia) nehnuteľnosti, adresa, na ktorej sa nehnuteľnosť nachádza, názov žiadateľa, adresa žiadateľa, Obec

### Doručovatelia (DR)

**Účel:** Evidencia doručovateľov.

**Generované dokumenty:**
- Rozhodnutia
- Obálky
- Podacie hárky
- Zoznamy na doručovanie

## ⚙ Konfigurácia

### Poštovné

Poštovné sa načítava dynamicky z Firebase databázy z cesty `config/postovne`. Predvolená hodnota (fallback) je nastavená v `js/config.js` na **4.35 €**.


