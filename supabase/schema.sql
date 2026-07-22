-- Schema für den Partner-Kalkulator + Provisionsrechner.
-- In der Supabase SQL-Konsole (Dashboard > SQL Editor) ausführen.

-- Ein Partnerkonto pro Supabase-Auth-User (id = auth.users.id).
-- commission_rate als Dezimalzahl, z.B. 0.10 für 10 %.
create table if not exists public.partners (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  commission_rate numeric not null default 0,
  created_at timestamptz not null default now()
);

-- EK-Preise für alle nicht gestaffelten Positionen.
-- item_id entspricht den IDs aus pricing-data.js (z.B. 'tpe', 'wp365', 'client', 'saUser', ...).
create table if not exists public.item_costs (
  item_id text primary key,
  ek_price numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- EK-Preise für gestaffelte Positionen (aktuell nur 'server').
-- max = obere Grenze der Staffel (analog zu den VK-Stufen in pricing-data.js:
-- 4, 9, 24, NULL(=unbegrenzt)).
create table if not exists public.item_costs_tiered (
  item_id text not null,
  max integer, -- NULL = oberste Stufe (25+)
  ek_price numeric not null default 0,
  primary key (item_id, max)
);

-- Row Level Security: Partner dürfen NUR ihre eigene commission_rate lesen,
-- niemals die von anderen Partnern. EK-Preise werden ausschließlich über die
-- serverless Function mit dem Service-Role-Key gelesen (bypasst RLS) und sind
-- für Partner-Logins über die normale API gesperrt.
alter table public.partners enable row level security;
alter table public.item_costs enable row level security;
alter table public.item_costs_tiered enable row level security;

create policy "Partner sehen nur ihre eigene Zeile"
  on public.partners for select
  using (auth.uid() = id);

-- Für item_costs/item_costs_tiered bewusst KEINE Policy für normale Nutzer,
-- d.h. per Default kein Zugriff über den Anon/Authenticated-Key – nur die
-- serverless Function (Service-Role-Key) kann lesen.

-- Beispiel: einen Partner anlegen, nachdem der Auth-User im Dashboard
-- (Authentication > Users > Invite) erstellt wurde:
-- insert into public.partners (id, name, commission_rate)
-- values ('<auth-user-uuid>', 'Muster Partner GmbH', 0.10);

-- Beispiel: EK-Preise pflegen:
-- insert into public.item_costs (item_id, ek_price) values ('wp365', 35) on conflict (item_id) do update set ek_price = excluded.ek_price;
-- insert into public.item_costs_tiered (item_id, max, ek_price) values
--   ('server', 4, 30), ('server', 9, 27), ('server', 24, 24), ('server', null, 18)
--   on conflict (item_id, max) do update set ek_price = excluded.ek_price;
