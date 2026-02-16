-- Database Schema per CalendarioAloe
-- Incolla questo codice nel SQL Editor di Supabase e clicca su "Run"

-- 1. Abilita l'estensione per i UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabella Profili Admin
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  whatsapp_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabella Disponibilità (Regole orarie)
CREATE TABLE IF NOT EXISTS availabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  rules JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabella Eventi (Servizi/Prestazioni)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  availability_id UUID REFERENCES availabilities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  location TEXT,
  event_type TEXT CHECK (event_type IN ('single', 'single_week', 'recurring')) DEFAULT 'recurring',
  start_date DATE,
  specific_date DATE,
  allow_multi_slots BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabella Prenotazioni
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_surname TEXT NOT NULL,
  user_phone TEXT NOT NULL,
  user_email TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CONFIGURAZIONE SICUREZZA (RLS)
-- Abilitiamo la sicurezza per le tabelle
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- 7. CREAZIONE POLICY (Permessi di accesso)
-- NOTA: In una versione di produzione reale, qui useresti l'autenticazione.
-- Per ora, abilitiamo l'accesso pubblico per permettere all'app di funzionare.

-- Policies per Disponibilità
CREATE POLICY "Accesso pubblico Availabilities" ON availabilities FOR ALL USING (true) WITH CHECK (true);

-- Policies per Eventi
CREATE POLICY "Accesso pubblico Events" ON events FOR ALL USING (true) WITH CHECK (true);

-- Policies per Prenotazioni
CREATE POLICY "Accesso pubblico Bookings" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- Policies per Profili
CREATE POLICY "Accesso pubblico Profiles" ON admin_profiles FOR ALL USING (true) WITH CHECK (true);
