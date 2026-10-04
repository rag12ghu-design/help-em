-- ==============================================================================
-- Help'Em — Barangay Quiling Emergency Resilience Network
-- Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Emergency Distress Tickets Table
CREATE TABLE IF NOT EXISTS emergency_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    purok_id TEXT NOT NULL,
    purok_name TEXT NOT NULL,
    target_department TEXT NOT NULL CHECK (target_department IN ('rescue_evac', 'health_medical', 'relief_supplies', 'power_utilities')),
    department_name TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'dispatched', 'resolved')),
    category TEXT NOT NULL,
    description TEXT,
    household_members INTEGER NOT NULL DEFAULT 1,
    urgent_needs TEXT[] DEFAULT '{}',
    assigned_team_id TEXT,
    assigned_team_name TEXT,
    responder_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Community Bulletins Table (Rumor Debunker)
CREATE TABLE IF NOT EXISTS community_bulletins (
    id TEXT PRIMARY KEY,
    rumor_claim TEXT NOT NULL,
    rumor_speaker TEXT NOT NULL,
    official_status TEXT NOT NULL DEFAULT 'OFFICIAL VERIFICATION',
    verified_truth TEXT NOT NULL,
    authoritative_source TEXT NOT NULL,
    pst_timestamp TEXT NOT NULL,
    purok_tag TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Community Advisories Table
CREATE TABLE IF NOT EXISTS community_advisories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'advisory' CHECK (severity IN ('urgent', 'warning', 'advisory')),
    author TEXT NOT NULL,
    department TEXT NOT NULL,
    purok_tag TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Household Safety Roster Table
CREATE TABLE IF NOT EXISTS household_safety_roster (
    id TEXT PRIMARY KEY,
    head_of_family TEXT NOT NULL,
    purok_id TEXT NOT NULL,
    purok_name TEXT NOT NULL,
    members_count INTEGER NOT NULL DEFAULT 1,
    vulnerability_type TEXT,
    contact_number TEXT,
    is_safe BOOLEAN NOT NULL DEFAULT FALSE,
    priority_level TEXT DEFAULT 'Normal',
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Emergency Response Units Table
CREATE TABLE IF NOT EXISTS response_units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    division TEXT NOT NULL,
    lead_name TEXT NOT NULL,
    contact TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'standby' CHECK (status IN ('deployed', 'standby', 'mobilizing')),
    assigned_tickets_count INTEGER NOT NULL DEFAULT 0,
    equipment TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- Public read & insert for emergency citizen reporting; authorized responder updates
-- ==============================================================================

ALTER TABLE emergency_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_safety_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_units ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tickets, bulletins, advisories, roster, and units
CREATE POLICY "Public can view tickets" ON emergency_tickets FOR SELECT USING (true);
CREATE POLICY "Public can submit tickets" ON emergency_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tickets" ON emergency_tickets FOR UPDATE USING (true);

CREATE POLICY "Public can view bulletins" ON community_bulletins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bulletins" ON community_bulletins FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view advisories" ON community_advisories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert advisories" ON community_advisories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update advisories" ON community_advisories FOR UPDATE USING (true);

CREATE POLICY "Public can view safety roster" ON household_safety_roster FOR SELECT USING (true);
CREATE POLICY "Anyone can update safety roster" ON household_safety_roster FOR UPDATE USING (true);

CREATE POLICY "Public can view response units" ON response_units FOR SELECT USING (true);
CREATE POLICY "Anyone can update response units" ON response_units FOR UPDATE USING (true);

-- ==============================================================================
-- Realtime Publication Setup
-- Enable Supabase Realtime for live cross-device synchronization
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE emergency_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE community_bulletins;
ALTER PUBLICATION supabase_realtime ADD TABLE community_advisories;
ALTER PUBLICATION supabase_realtime ADD TABLE household_safety_roster;
ALTER PUBLICATION supabase_realtime ADD TABLE response_units;

-- ==============================================================================
-- Initial Seed Data: Barangay Quiling, City of Batac
-- ==============================================================================

INSERT INTO response_units (id, name, division, lead_name, contact, status, assigned_tickets_count, equipment)
VALUES
    ('team-alpha', 'BDRRMC Rescue & Engineering Unit Alpha', 'BDRRMC Search & Rescue Division', 'Engr. Carlos Mendoza (BDRRMC Officer)', 'VHF 144.750 MHz / 0917-111-RESCUE', 'deployed', 1, ARRAY['Inflatable Boat', '4x4 Rescue Truck', 'Chainsaws', 'Life Vests']),
    ('team-beta', 'Barangay Health Medical Unit Beta', 'Barangay Health Station & Municipal Clinic', 'Nurse Alyssa Ramos, RN', 'VHF 145.200 MHz / 0917-222-MEDIC', 'deployed', 1, ARRAY['First Aid Kits', 'Oxygen Tank', 'BP Monitors', 'Pediatric Fever Packs']),
    ('team-gamma', 'Relief & Food Logistics Unit Gamma', 'MSWDO Relief Logistics Division', 'Officer Jonan Castro (MSWDO)', 'VHF 145.600 MHz / 0917-333-RELIEF', 'standby', 0, ARRAY['5-Gallon Water Refills', 'Hot Rice Porridge Pots', 'Dry Food Packs', 'Blankets']),
    ('team-delta', 'Power & Communications Unit Delta', 'Barangay Power & Radio Communications', 'Lead Tech Paolo Valdez', 'VHF 145.850 MHz / 0917-444-POWER', 'deployed', 1, ARRAY['Backup Solar Inverter', 'Generator Cables', 'VHF Base Radio', 'Multi-Phone Charging Station'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO community_bulletins (id, rumor_claim, rumor_speaker, official_status, verified_truth, authoritative_source, pst_timestamp, purok_tag)
VALUES
    ('debunk-1', '“May nagsabi gumuho daw ang dike sa Purok 1? Totoo ba? Lilipat na ba kami?”', 'Resident from Purok 1 Group Chat', 'RUMOR DEBUNKED', 'Barangay Captain and Municipal Disaster Engineers inspected the Purok 1 embankment at 19:15 PST. Dike is fully intact and water level is at a stable 2.1m safe threshold.', 'Barangay Quiling BDRRMC & City Engineering Office', '19:15 PST', 'Purok 1 • Riverside'),
    ('debunk-2', '“Wala raw kuryente buong linggo sa buong Batac at Laoag sabi ng kapitbahay.”', 'Sitio Neighborhood Messenger Thread', 'OFFICIAL VERIFICATION', 'INEC line repair team is active along National Highway. Feeder 4 estimated back by 22:00 PST. Barangay Hall generator charging hub remains open 24/7 for phone charging.', 'INEC Technical Desk & Barangay Hall Command Post', '18:45 PST', 'Purok 2 • Barangay Hall'),
    ('debunk-3', '“Walang pagkain sa evacuation center wag na kayo pumunta dun.”', 'Public Comment on Local Facebook Post', 'OFFICIAL VERIFICATION', 'Barangay relief logistics and community volunteers delivered 150 hot rice porridge bowls and clean drinking water. Covered Court has dry cots, medical kits, and hygiene packs available.', 'Barangay Social Welfare Committee & City Disaster Office', '17:30 PST', 'Purok 3 • Covered Court')
ON CONFLICT (id) DO NOTHING;

INSERT INTO community_advisories (id, title, message, severity, author, department, purok_tag, is_active, timestamp)
VALUES
    ('ann-001', 'Barangay Quiling BDRRMC Weather Advisory: Signal No. 2 Active', 'Typhoon Doppler indicates heavy gusts until 02:00 PST. Residents along Purok 1 riverbank are advised to prepare Go Bags and proceed to Covered Court if flood reaches curb level.', 'urgent', 'Barangay Quiling BDRRMC Operations Desk', 'rescue_evac', 'Barangay Quiling Wide', true, '19:10 PST'),
    ('ann-002', 'Health Advisory: Free Pediatric Check-in at Covered Court', 'Barangay Health Medical team has set up clinic tables with fever medicines, hydration packs, and wound dressings. Walk-ins open 24/7.', 'advisory', 'Barangay Quiling Disaster Operations', 'health_medical', 'Purok 3', true, '19:30 PST')
ON CONFLICT (id) DO NOTHING;

INSERT INTO household_safety_roster (id, head_of_family, purok_id, purok_name, members_count, vulnerability_type, contact_number, is_safe, priority_level, notes)
VALUES
    ('vul-001', 'Agcaoili, Ernesto', 'purok-1', 'Purok 1 • Riverside', 5, 'Senior Citizen', '0917-123-4567', false, 'Critical', 'Lola Remedios (82 yo) bedridden. House within 30m of river embankment.'),
    ('vul-002', 'Balicoco, Marites', 'purok-4', 'Purok 4 • Lowland Intersection', 4, 'Infant / Pediatric', '0918-987-6543', false, 'High', 'Two toddlers (9 mos, 2 yo). Low-lying floor prone to gutter pooling.'),
    ('vul-003', 'Calipjo, Benjamin', 'purok-5', 'Purok 5 • Farmland Outskirts', 3, 'PWD', '0920-456-7890', true, 'Medium', 'Wheelchair occupant. Verified safe at relatives elevated bungalow.'),
    ('vul-004', 'Dela Cruz, Rosita', 'purok-1', 'Purok 1 • Riverside', 6, 'Multi-Generational', '0922-333-4455', false, 'High', 'Single mother with elderly aunt and 4 school-age children.')
ON CONFLICT (id) DO NOTHING;
