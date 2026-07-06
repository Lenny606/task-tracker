# Specifikace: Agentické ovládání aplikace (Task Tracker)

Tento dokument slouží jako příprava pro návrh a implementaci agentického ovládání v aplikaci **Task Tracker**.

## 1. Souhrn projektu (Project Summary)

**Task Tracker** je webová aplikace vyvíjená v ekosystému **TanStack Start** (postaveném na serveru Nitro a TanStack Routeru) s lokální SQLite databází (`better-sqlite3` přes `drizzle-orm`).

Hlavním cílem aplikace je:
- Sledovat odpracovaný čas na úkolech v reálném čase.
- Poskytovat přehledy práce a integrovat lokální vývojové aktivity (Git commity) pro sestavení denních reportů.
- Synchronizovat tyto aktivity s JIRA a modulem Tempo.

## 2. Dostupné AI balíčky v projektu

V `package.json` jsou připraveny následující knihovny pro práci s AI a LLM:
- **`@tanstack/ai`** (`^0.6.3`): Core knihovna pro integraci AI a modelů v rámci TanStack ekosystému.
- **`@tanstack/ai-gemini`** (`^0.8.0`): Provider pro integraci s Google Gemini.
- **`@tanstack/ai-openai`** (`^0.6.0`): Provider pro integraci s OpenAI GPT modely.

## 3. Klíčové otázky k implementaci (K vyjasnění)

Před zahájením samotného kódování agentického ovládání je nutné zodpovědět následující architektonické a designové otázky:

### Q1: Způsob interakce s uživatelem (UI/UX)
- Jak by mělo toto agentické ovládání vypadat v uživatelském rozhraní?
  - Půjde o klasické chatovací okno v sidebaru (např. Copilot)?
  - Půjde o textový vstup / command bar (např. Spotlight, Raycast či CMD+K menu)?
  - Uvažujeme o hlasovém ovládání (Speech-to-Text)?

### Q2: Rozsah pravomocí agenta (Dostupné nástroje / Tools)
- Jaké akce by měl agent umět provádět?
  - **Základní správa:** Vytváření, editace a mazání úkolů.
  - **Ovládání času:** Spouštění a zastavování stopek na úkolech.
  - **Pokročilé funkce:** Synchronizace s JIRA, načítání Git commitů, spouštění AI generování denních reportů.

### Q3: Kontext a propojení s UI stavem
- Měl by agent mít možnost manipulovat s aktuálním stavem na obrazovce uživatele (např. přepnout záložku, aktivovat filtr, vizuálně označit úkol)?
- Nebo bude pracovat výhradně na pozadí přímým voláním databáze a API, přičemž UI se pouze reaktivně překreslí podle změn v DB?

---
*Poslední úprava: 6. 7. 2026*
