# Partner-Kalkulator + Provisionsrechner

Basiert auf dem bestehenden `kutzschbach-managed-services-konfigurator.html`.
Der Kalkulator selbst (`index.html`) ist unverändert client-seitig. Neu dazu
gekommen sind ein Partner-Login und ein Provisionsrechner, dessen EK-Preise,
Provisionssatz und Marge ausschließlich serverseitig berechnet werden
(`api/commission.js`) — der Partner sieht nur den fertigen Provisionsbetrag.

## Dateien

- `index.html` — Kalkulator + Login-Gate + Provisionsanzeige
- `pricing-data.js` — VK-Preisdaten (CATEGORIES/ONETIME/AUTO_ONBOARDING),
  einzige Quelle für Client und Server
- `api/commission.js` — Vercel Serverless Function, berechnet die Provision
- `supabase/schema.sql` — Tabellen für Partner-Accounts und EK-Preise
- `kutzschbach-managed-services-konfigurator.html` — Original, unverändert
  als Referenz/Backup erhalten

## Einmaliges Setup

### 1. Supabase-Projekt

1. Auf [supabase.com](https://supabase.com) ein (kostenloses) Projekt anlegen.
2. Im SQL Editor den Inhalt von `supabase/schema.sql` ausführen.
3. Unter **Project Settings > API** notieren:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` Key → `CONFIG.supabaseAnonKey` in `index.html`
   - `service_role` Key → `SUPABASE_SERVICE_ROLE_KEY` (geheim, nur Server!)

### 2. Partner-Zugänge anlegen

Pro Partnerfirma (oder pro Ansprechperson):

1. **Authentication > Users > Invite user** — E-Mail eingeben, Supabase
   verschickt eine Einladung zum Passwort-Setzen.
2. In der `partners`-Tabelle (Table Editor) eine Zeile mit der neuen
   User-ID, Firmenname und `commission_rate` (z.B. `0.10` für 10 %) anlegen.

### 3. EK-Preise pflegen

In `item_costs` (flache Preise) bzw. `item_costs_tiered` (gestaffelt, aktuell
nur `server`) je Position den Einkaufspreis eintragen — Beispiele stehen als
Kommentar in `supabase/schema.sql`. Ohne hinterlegten EK-Preis wird mit `0`
gerechnet (Provision entspricht dann der vollen VK-Summe für diese Position —
also unbedingt vor Go-Live vollständig befüllen).

### 4. Konfiguration in `index.html`

```js
const CONFIG = {
  ...
  supabaseUrl: "https://YOUR-PROJECT.supabase.co",
  supabaseAnonKey: "YOUR-ANON-KEY"
};
```

Der `anon`-Key ist öffentlich und darf im Client-Code stehen (das ist bei
Supabase so vorgesehen — Zugriffsrechte regelt Row Level Security).

### 5. Deployment (Vercel)

1. Projektordner mit `vercel` verknüpfen (`vercel link` oder über
   [vercel.com](https://vercel.com) importieren).
2. Unter **Project Settings > Environment Variables** setzen:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. `vercel --prod` deployen.

### Lokal testen

```bash
npm install
vercel dev
```

Öffnet den Kalkulator lokal inkl. `/api/commission` unter der von `vercel dev`
angezeigten URL.

## Provisionslogik (Zusammenfassung)

- Provision = `(VK − EK) × commission_rate`, berechnet nur auf Basis der
  monatlich wiederkehrenden Positionen (nicht auf einmalige Onboarding-Kosten).
- Zeilen-Anpassungen (`+/- %`) wirken nur auf den VK — Rabatte, die der
  Partner selbst gewährt, schmälern also auch dessen eigene Provision.
- `/api/commission` verifiziert den Supabase-Access-Token, rechnet VK **und**
  EK serverseitig aus den übermittelten Mengen neu (nicht aus
  client-seitig vorgerechneten Summen) und gibt ausschließlich den
  Provisionsbetrag zurück — nie EK-Preise, Marge oder Provisionssatz.

## Bekannte Grenzen / offene Punkte

- Partner- und EK-Preis-Pflege läuft aktuell über das Supabase-Dashboard
  (keine eigene Admin-Oberfläche).
- Die "An Inside Sales übertragen"-Funktion (`mailto:`) ist unverändert und
  protokolliert Angebote nicht in einer Datenbank.
