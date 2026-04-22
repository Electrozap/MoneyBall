-- ============================================================
-- MoneyBall Seed Script
-- Paste and run in: Supabase Dashboard -> SQL Editor
-- ============================================================


-- 1. CLEAR EXISTING DATA
DELETE FROM settlements;
DELETE FROM group_bet_participants;
DELETE FROM group_bets;
DELETE FROM bets;
DELETE FROM friends;


-- 2. STAGING TABLES

DROP TABLE IF EXISTS seed_bets_staging;
CREATE TABLE seed_bets_staging (
  id              SERIAL PRIMARY KEY,
  creator_email   TEXT NOT NULL,
  opponent_email  TEXT NOT NULL,
  bet_type        TEXT NOT NULL DEFAULT 'prop',
  description     TEXT NOT NULL,
  creator_sel     TEXT,
  opponent_sel    TEXT,
  stake           NUMERIC NOT NULL,
  creator_payout  NUMERIC NOT NULL,
  odds_num        INT  DEFAULT 1,
  odds_den        INT  DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'settled',
  winner_email    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS seed_settlements_staging;
CREATE TABLE seed_settlements_staging (
  id           SERIAL PRIMARY KEY,
  payer_email  TEXT NOT NULL,
  payee_email  TEXT NOT NULL,
  amount       NUMERIC NOT NULL,
  settled_at   TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS seed_group_bets_staging;
CREATE TABLE seed_group_bets_staging (
  id                   SERIAL PRIMARY KEY,
  description          TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'open',
  participant_emails   TEXT[]    NOT NULL,
  participant_sels     TEXT[]    NOT NULL,
  participant_stakes   NUMERIC[] NOT NULL,
  odds_num             INT[]     NOT NULL,
  odds_den             INT[]     NOT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);


-- 3. SEED DATA
-- Emails:
--   manan = mehta.manan019@gmail.com
--   vivan = vivankandoi@gmail.com
--   aryan = aryanvaish1804@gmail.com
--   panda = xsplitgaming35@gmail.com
--   niket = niket.korgaonkar0305@gmail.com
--
-- stake/creator_payout convention (from betPnl in Ledger.tsx):
--   creator nets:  creator_payout - stake
--   opponent nets: stake
--   Asymmetric "A wins X, B wins Y" where A=creator: stake=Y, creator_payout=X+Y

INSERT INTO seed_bets_staging
  (creator_email, opponent_email, bet_type, description,
   creator_sel, opponent_sel,
   stake, creator_payout, odds_num, odds_den,
   status, winner_email, created_at)
VALUES

-- ============================================================
-- REGULAR SEASON - all settled
-- ============================================================

-- RS1 | Aryan +2000 | Knicks 1st seed (Manan: yes) -> Aryan won
('aryanvaish1804@gmail.com', 'mehta.manan019@gmail.com',
 'futures', 'Knicks finish 1st seed in East',
 'No - Knicks miss 1st seed', 'Yes - Knicks get 1st seed',
 2000, 4000, 1, 1, 'settled', 'aryanvaish1804@gmail.com', '2024-11-01 10:00:00+00'),

-- RS2 | Panda +500 | Brunson All-NBA 1st team (Panda: yes) -> Panda won
('xsplitgaming35@gmail.com', 'mehta.manan019@gmail.com',
 'futures', 'Brunson All-NBA 1st Team',
 'Yes - Brunson 1st Team All-NBA', 'No - Brunson misses 1st Team',
 500, 1000, 1, 1, 'settled', 'xsplitgaming35@gmail.com', '2024-11-01 10:00:00+00'),

-- RS3 | Aryan +1000 | Lakers top 5 seed (Aryan: yes) -> Aryan won
('aryanvaish1804@gmail.com', 'mehta.manan019@gmail.com',
 'futures', 'Lakers finish top 5 seed in West',
 'Yes - Lakers top 5', 'No - Lakers miss top 5',
 1000, 2000, 1, 1, 'settled', 'aryanvaish1804@gmail.com', '2024-11-01 10:00:00+00'),

-- RS4 | Aryan +500 | Lakers top 5 seed vs Vivan -> Aryan won
('aryanvaish1804@gmail.com', 'vivankandoi@gmail.com',
 'futures', 'Lakers finish top 5 seed in West',
 'Yes - Lakers top 5', 'No - Lakers miss top 5',
 500, 1000, 1, 1, 'settled', 'aryanvaish1804@gmail.com', '2024-11-01 10:00:00+00'),

-- RS5 | Manan +200 | AD O/U 50 games (Vivan: over) -> Manan won
-- creator=Vivan, opponent=Manan
('vivankandoi@gmail.com', 'mehta.manan019@gmail.com',
 'prop', 'Anthony Davis plays O/U 50 regular season games',
 'Over 50 games', 'Under 50 games',
 200, 400, 1, 1, 'settled', 'mehta.manan019@gmail.com', '2024-11-01 10:00:00+00'),

-- RS6 | Manan +100 | Pels seeding O/U 10.5 (Vivan: under) -> Manan won
-- creator=Vivan, opponent=Manan
('vivankandoi@gmail.com', 'mehta.manan019@gmail.com',
 'futures', 'Pelicans finish seeding O/U 10.5',
 'Under 10.5 (Pels 10th or better)', 'Over 10.5 (Pels 11th or worse)',
 100, 200, 1, 1, 'settled', 'mehta.manan019@gmail.com', '2024-11-01 10:00:00+00'),

-- RS7 | Panda +100 | Pels make playoffs -> Panda won (Pels missed)
-- Asymmetric: Panda wins 100, Vivan wins 200
-- creator=Panda, stake=200 (Panda risk), creator_payout=300 (nets 100)
('xsplitgaming35@gmail.com', 'vivankandoi@gmail.com',
 'futures', 'Pelicans make playoffs',
 'No - Pels miss playoffs (+100)', 'Yes - Pels make playoffs (+200)',
 200, 300, 1, 2, 'settled', 'xsplitgaming35@gmail.com', '2024-11-01 10:00:00+00'),

-- RS8 | Manan +100 | Pels make playoffs -> Manan won (Pels missed)
-- Asymmetric: Manan wins 100, Vivan wins 200
-- creator=Manan, stake=200, creator_payout=300
('mehta.manan019@gmail.com', 'vivankandoi@gmail.com',
 'futures', 'Pelicans make playoffs',
 'No - Pels miss playoffs (+100)', 'Yes - Pels make playoffs (+200)',
 200, 300, 1, 2, 'settled', 'mehta.manan019@gmail.com', '2024-11-01 10:00:00+00'),

-- RS9 | Vivan +1000 | Maxey-Cade 9-cat (Manan: Cade) -> Vivan won (Maxey won)
('mehta.manan019@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Maxey vs Cade Cunningham - 9-category comparison',
 'Cade wins 9-cat', 'Maxey wins 9-cat',
 1000, 2000, 1, 1, 'settled', 'vivankandoi@gmail.com', '2024-11-01 10:00:00+00'),

-- RS10 | Niket +1000 | Maxey-Cade 9-cat (Manan: Cade) -> Niket won (Maxey won)
('mehta.manan019@gmail.com', 'niket.korgaonkar0305@gmail.com',
 'prop', 'Maxey vs Cade Cunningham - 9-category comparison',
 'Cade wins 9-cat', 'Maxey wins 9-cat',
 1000, 2000, 1, 1, 'settled', 'niket.korgaonkar0305@gmail.com', '2024-11-01 10:00:00+00'),

-- RS11 | Manan +750 | Heat-Knicks higher seeding (Niket: Heat) -> Manan won (Knicks)
('mehta.manan019@gmail.com', 'niket.korgaonkar0305@gmail.com',
 'futures', 'Heat vs Knicks - higher seeding',
 'Knicks get higher seeding', 'Heat get higher seeding',
 750, 1500, 1, 1, 'settled', 'mehta.manan019@gmail.com', '2024-11-01 10:00:00+00'),

-- RS12 | Panda +500 | Heat-Knicks higher seeding (Niket: Heat) -> Panda won (Knicks)
('xsplitgaming35@gmail.com', 'niket.korgaonkar0305@gmail.com',
 'futures', 'Heat vs Knicks - higher seeding',
 'Knicks get higher seeding', 'Heat get higher seeding',
 500, 1000, 1, 1, 'settled', 'xsplitgaming35@gmail.com', '2024-11-01 10:00:00+00'),

-- RS13 | Vivan +250 | Heat-Knicks seeding 1:4 odds (Niket: Heat) -> Vivan won (Knicks)
-- 1:4: Niket risked 250 to win 1000; Vivan risked 1000 to win 250
-- creator=Vivan, stake=1000, creator_payout=1250 (nets 250)
('vivankandoi@gmail.com', 'niket.korgaonkar0305@gmail.com',
 'futures', 'Heat vs Knicks - higher seeding (1:4 odds)',
 'Knicks get higher seeding', 'Heat get higher seeding',
 1000, 1250, 1, 4, 'settled', 'vivankandoi@gmail.com', '2024-11-01 10:00:00+00'),


-- ============================================================
-- PLAYOFFS - SETTLED
-- ============================================================

-- PL10 | Manan +100 | Blazers-Suns (Manan: Blazers) -> Manan won
('mehta.manan019@gmail.com', 'aryanvaish1804@gmail.com',
 'prop', 'Blazers-Suns series winner (all starters injury clause)',
 'Blazers win', 'Suns win',
 100, 200, 1, 1, 'settled', 'mehta.manan019@gmail.com', '2025-04-19 10:00:00+00'),

-- PL11 | Manan +100 | Blazers-Suns vs Vivan (Manan: Blazers) -> Manan won
('mehta.manan019@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Blazers-Suns series winner (all starters injury clause)',
 'Blazers win', 'Suns win',
 100, 200, 1, 1, 'settled', 'mehta.manan019@gmail.com', '2025-04-19 10:00:00+00'),

-- PL12 | Panda +100 | Blazers-Suns (Panda: Blazers) -> Panda won
('xsplitgaming35@gmail.com', 'aryanvaish1804@gmail.com',
 'prop', 'Blazers-Suns series winner',
 'Blazers win', 'Suns win',
 100, 200, 1, 1, 'settled', 'xsplitgaming35@gmail.com', '2025-04-19 10:00:00+00'),

-- PL16 | Panda +100 | Warriors-Clippers (Panda: Warriors) -> Panda won
('xsplitgaming35@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Warriors-Clippers game winner',
 'Warriors win', 'Clippers win',
 100, 200, 1, 1, 'settled', 'xsplitgaming35@gmail.com', '2025-04-20 10:00:00+00'),

-- PL17 | Manan +100 | Magic game -> Manan won (Magic lost)
-- Asymmetric: Vivan wins 200 if Magic win, Manan wins 100 if not
-- creator=Manan, stake=200, creator_payout=300 (nets 100)
('mehta.manan019@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Magic win their playoff game',
 'Magic lose (+100)', 'Magic win (+200)',
 200, 300, 1, 2, 'settled', 'mehta.manan019@gmail.com', '2025-04-20 10:00:00+00'),

-- PL18 | Niket +100 | Magic game -> Niket won (Magic lost)
-- Asymmetric: Vivan wins 250 if Magic win, Niket wins 100 if not
-- creator=Niket, stake=250, creator_payout=350 (nets 100)
('niket.korgaonkar0305@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Magic win their playoff game',
 'Magic lose (+100)', 'Magic win (+250)',
 250, 350, 2, 5, 'settled', 'niket.korgaonkar0305@gmail.com', '2025-04-20 10:00:00+00'),

-- PL19 | Panda +300 | Clippers-Warriors -> Panda won (Warriors won)
-- Asymmetric: Manan wins 100 if Clippers, Panda wins 300 if Warriors
-- creator=Panda, stake=100, creator_payout=400 (nets 300)
('xsplitgaming35@gmail.com', 'mehta.manan019@gmail.com',
 'prop', 'Clippers-Warriors game winner',
 'Warriors win (+300)', 'Clippers win (+100)',
 100, 400, 3, 1, 'settled', 'xsplitgaming35@gmail.com', '2025-04-20 10:00:00+00'),

-- PL20 | Niket +200 | Magic-Hornets -> Niket won (Magic won)
-- Asymmetric: Niket wins 200 if Magic win, Vivan wins 100 if Hornets
-- creator=Niket, stake=100, creator_payout=300 (nets 200)
('niket.korgaonkar0305@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Magic vs Hornets game winner',
 'Magic win (+200)', 'Hornets win (+100)',
 100, 300, 2, 1, 'settled', 'niket.korgaonkar0305@gmail.com', '2025-04-20 10:00:00+00'),

-- PL21 | Aryan +150 | Warriors-Suns (Aryan: Suns) -> Aryan won
('niket.korgaonkar0305@gmail.com', 'aryanvaish1804@gmail.com',
 'prop', 'Warriors-Suns series winner',
 'Warriors win', 'Suns win',
 150, 300, 1, 1, 'settled', 'aryanvaish1804@gmail.com', '2025-04-20 10:00:00+00'),

-- PL22 | Niket +50 | Banchero O24.5 pts (Niket: over) -> Niket won
('niket.korgaonkar0305@gmail.com', 'mehta.manan019@gmail.com',
 'prop', 'Paolo Banchero O/U 24.5 points',
 'Over 24.5 pts', 'Under 24.5 pts',
 50, 100, 1, 1, 'settled', 'niket.korgaonkar0305@gmail.com', '2025-04-20 10:00:00+00'),

-- PL23 | Niket +50 | Banchero O24.5 pts vs Panda -> Niket won
('niket.korgaonkar0305@gmail.com', 'xsplitgaming35@gmail.com',
 'prop', 'Paolo Banchero O/U 24.5 points',
 'Over 24.5 pts', 'Under 24.5 pts',
 50, 100, 1, 1, 'settled', 'niket.korgaonkar0305@gmail.com', '2025-04-20 10:00:00+00'),

-- PL24 | Manan +100 | JJ 20.5 R+A Game 1 (Manan: under) -> Manan won
('mehta.manan019@gmail.com', 'xsplitgaming35@gmail.com',
 'prop', 'Jalen Johnson O/U 20.5 Reb+Ast in Game 1',
 'Under 20.5 R+A', 'Over 20.5 R+A',
 100, 200, 1, 1, 'settled', 'mehta.manan019@gmail.com', '2025-04-20 10:00:00+00'),

-- PL25 | Manan +100 | JJ 20.5 R+A Game 1 vs Aryan -> Manan won
('mehta.manan019@gmail.com', 'aryanvaish1804@gmail.com',
 'prop', 'Jalen Johnson O/U 20.5 Reb+Ast in Game 1',
 'Under 20.5 R+A', 'Over 20.5 R+A',
 100, 200, 1, 1, 'settled', 'mehta.manan019@gmail.com', '2025-04-20 10:00:00+00'),


-- ============================================================
-- PLAYOFFS - ACTIVE (status = 'accepted' so Dashboard shows them)
-- ============================================================

-- PL1 | Panda-Vivan | KD scores 40+ in any playoff game
('xsplitgaming35@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'KD scores 40+ points in any 2025 playoff game',
 'No - KD won''t score 40 (+100)', 'Yes - KD scores 40+ (+100)',
 100, 200, 1, 1, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL2 | Manan-Aryan | Lakers-Rockets Game 6
-- Asymmetric: Aryan wins 1000, Manan wins 500
-- VOID if AR/Luka return; 1:1 if return after 1 Lakers W; Aryan wins 1000 if after 2
-- creator=Manan, stake=1000, creator_payout=1500 (nets 500)
('mehta.manan019@gmail.com', 'aryanvaish1804@gmail.com',
 'prop', 'Lakers-Rockets series goes to Game 6+ | VOID if AR/Luka return; 1:1 if after 1 Lakers W; Aryan wins 1000 if after 2 Lakers W',
 'Series ends in 5 or fewer (+500)', 'Series goes to Game 6+ (+1000)',
 1000, 1500, 1, 2, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL3 | Manan-Vivan | Lakers-Rockets Game 6 (same terms, Vivan wins 1000)
('mehta.manan019@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Lakers-Rockets series goes to Game 6+ | VOID if AR/Luka return; 1:1 if after 1 Lakers W; Vivan wins 1000 if after 2 Lakers W',
 'Series ends in 5 or fewer (+500)', 'Series goes to Game 6+ (+1000)',
 1000, 1500, 1, 2, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL4 | Manan-Aryan | Brunson highest PPG in Knicks-Hawks (Manan: no)
('mehta.manan019@gmail.com', 'aryanvaish1804@gmail.com',
 'prop', 'Brunson has highest PPG in Knicks-Hawks series',
 'No - Brunson not highest PPG (+100)', 'Yes - Brunson highest PPG (+100)',
 100, 200, 1, 1, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL5 | Manan-Vivan | Brunson highest PPG Knicks-Hawks (Manan: no)
('mehta.manan019@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Brunson has highest PPG in Knicks-Hawks series',
 'No - Brunson not highest PPG (+100)', 'Yes - Brunson highest PPG (+100)',
 100, 200, 1, 1, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL6 | Manan-Panda | Brunson highest PPG Knicks-Hawks (Manan: no)
('mehta.manan019@gmail.com', 'xsplitgaming35@gmail.com',
 'prop', 'Brunson has highest PPG in Knicks-Hawks series',
 'No - Brunson not highest PPG (+100)', 'Yes - Brunson highest PPG (+100)',
 100, 200, 1, 1, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL7 | Manan-Aryan | Knicks-Hawks go 6 games (Manan: no)
('mehta.manan019@gmail.com', 'aryanvaish1804@gmail.com',
 'prop', 'Knicks-Hawks series goes to 6 games',
 'No - series ends in 5 or fewer (+300)', 'Yes - series goes 6 games (+300)',
 300, 600, 1, 1, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL8 | Panda-Vivan | Nuggets beat Spurs (Vivan wins 300, Panda wins 200; all starters clause)
-- creator=Panda, stake=300, creator_payout=500 (nets 200)
('xsplitgaming35@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Nuggets beat Spurs (all starters must be fit)',
 'Spurs win (+200)', 'Nuggets win (+300)',
 300, 500, 2, 3, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL9 | Aryan-Vivan | Nuggets beat Spurs (Vivan wins 450, Aryan wins 300; Jokic/Murray/Wemby clause)
-- creator=Aryan, stake=450, creator_payout=750 (nets 300)
('aryanvaish1804@gmail.com', 'vivankandoi@gmail.com',
 'prop', 'Nuggets beat Spurs (Jokic, Murray and Wemby must be fit)',
 'Spurs win (+300)', 'Nuggets win (+450)',
 450, 750, 2, 3, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL13 | Manan-Panda | Scottie Barnes most rebounds Hawks-Cavs (Panda wins 300, Manan wins 100)
-- creator=Manan, stake=300, creator_payout=400 (nets 100)
('mehta.manan019@gmail.com', 'xsplitgaming35@gmail.com',
 'prop', 'Scottie Barnes leads Hawks-Cavs series in total rebounds',
 'No - Barnes doesn''t lead in rebounds (+100)', 'Yes - Barnes leads in rebounds (+300)',
 300, 400, 1, 3, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL14 | Vivan-Niket | Nuggets-Wolves winner (Niket: Wolves)
('vivankandoi@gmail.com', 'niket.korgaonkar0305@gmail.com',
 'prop', 'Nuggets vs Wolves series winner',
 'Nuggets win (+200)', 'Wolves win (+200)',
 200, 400, 1, 1, 'accepted', NULL, '2025-04-19 10:00:00+00'),

-- PL15 | Panda-Niket | Nuggets-Wolves winner (Niket: Wolves)
('xsplitgaming35@gmail.com', 'niket.korgaonkar0305@gmail.com',
 'prop', 'Nuggets vs Wolves series winner',
 'Nuggets win (+100)', 'Wolves win (+100)',
 100, 200, 1, 1, 'accepted', NULL, '2025-04-19 10:00:00+00');


-- Settlement staging: Manan paid Panda 500
INSERT INTO seed_settlements_staging (payer_email, payee_email, amount, settled_at)
VALUES ('mehta.manan019@gmail.com', 'xsplitgaming35@gmail.com', 500, '2025-04-21 10:00:00+00');


-- ROY group bet: Panda wins 400 if Knueppel; Manan & Vivan win 100 each if Flagg
-- Pot = 600. Knueppel wins -> Panda gets 600 (net +400).
--             Flagg wins   -> M+V each get 300 (net +100 each).
INSERT INTO seed_group_bets_staging
  (description, status, participant_emails, participant_sels,
   participant_stakes, odds_num, odds_den)
VALUES (
  'NBA Rookie of the Year 2024-25: Knueppel (Panda) vs Flagg (Manan & Vivan)',
  'open',
  ARRAY['xsplitgaming35@gmail.com', 'mehta.manan019@gmail.com', 'vivankandoi@gmail.com'],
  ARRAY['Knueppel wins ROY (+400)', 'Flagg wins ROY (+100)', 'Flagg wins ROY (+100)'],
  ARRAY[200, 200, 200]::NUMERIC[],
  ARRAY[2, 1, 1],
  ARRAY[1, 2, 2]
);


-- 4. ACTIVATION FUNCTION

CREATE OR REPLACE FUNCTION activate_seed_data(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid        UUID;
  v_other_id   UUID;
  v_creator_id UUID;
  v_winner_id  UUID;
  v_bet        RECORD;
  v_grp        RECORD;
  v_bet_id     UUID;
  v_pid        UUID;
  v_payer_id   UUID;
  v_payee_id   UUID;
  i            INT;
  v_all_in     BOOLEAN;
BEGIN
  SELECT id INTO v_uid FROM profiles WHERE email = p_email;
  IF v_uid IS NULL THEN RETURN; END IF;

  -- 1v1 bets: this user is CREATOR
  FOR v_bet IN
    SELECT * FROM seed_bets_staging WHERE creator_email = p_email
  LOOP
    SELECT id INTO v_other_id FROM profiles WHERE email = v_bet.opponent_email;
    CONTINUE WHEN v_other_id IS NULL;

    v_winner_id := CASE
      WHEN v_bet.winner_email = v_bet.creator_email   THEN v_uid
      WHEN v_bet.winner_email = v_bet.opponent_email  THEN v_other_id
      ELSE NULL
    END;

    INSERT INTO bets (
      creator_id, opponent_id, match_id, bet_type, bet_details,
      stake, creator_payout, opponent_payout, status, winner_id, created_at
    ) VALUES (
      v_uid, v_other_id, NULL, v_bet.bet_type,
      jsonb_build_object(
        'description',        v_bet.description,
        'creator_selection',  v_bet.creator_sel,
        'opponent_selection', v_bet.opponent_sel,
        'odds_format',        'custom',
        'odds_num',           v_bet.odds_num,
        'odds_den',           v_bet.odds_den
      ),
      v_bet.stake, v_bet.creator_payout, v_bet.stake,
      v_bet.status, v_winner_id, v_bet.created_at
    );

    -- ONE friendship row per pair (requester = creator, addressee = opponent)
    INSERT INTO friends (requester_id, addressee_id, status, created_at)
    SELECT v_uid, v_other_id, 'accepted', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM friends
      WHERE (requester_id = v_uid AND addressee_id = v_other_id)
         OR (requester_id = v_other_id AND addressee_id = v_uid)
    );

    DELETE FROM seed_bets_staging WHERE id = v_bet.id;
  END LOOP;

  -- 1v1 bets: this user is OPPONENT
  FOR v_bet IN
    SELECT * FROM seed_bets_staging WHERE opponent_email = p_email
  LOOP
    SELECT id INTO v_other_id FROM profiles WHERE email = v_bet.creator_email;
    CONTINUE WHEN v_other_id IS NULL;

    v_winner_id := CASE
      WHEN v_bet.winner_email = v_bet.creator_email   THEN v_other_id
      WHEN v_bet.winner_email = v_bet.opponent_email  THEN v_uid
      ELSE NULL
    END;

    INSERT INTO bets (
      creator_id, opponent_id, match_id, bet_type, bet_details,
      stake, creator_payout, opponent_payout, status, winner_id, created_at
    ) VALUES (
      v_other_id, v_uid, NULL, v_bet.bet_type,
      jsonb_build_object(
        'description',        v_bet.description,
        'creator_selection',  v_bet.creator_sel,
        'opponent_selection', v_bet.opponent_sel,
        'odds_format',        'custom',
        'odds_num',           v_bet.odds_num,
        'odds_den',           v_bet.odds_den
      ),
      v_bet.stake, v_bet.creator_payout, v_bet.stake,
      v_bet.status, v_winner_id, v_bet.created_at
    );

    INSERT INTO friends (requester_id, addressee_id, status, created_at)
    SELECT v_other_id, v_uid, 'accepted', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM friends
      WHERE (requester_id = v_other_id AND addressee_id = v_uid)
         OR (requester_id = v_uid AND addressee_id = v_other_id)
    );

    DELETE FROM seed_bets_staging WHERE id = v_bet.id;
  END LOOP;

  -- Settlements
  FOR v_bet IN
    SELECT * FROM seed_settlements_staging
    WHERE payer_email = p_email OR payee_email = p_email
  LOOP
    SELECT id INTO v_payer_id FROM profiles WHERE email = v_bet.payer_email;
    SELECT id INTO v_payee_id FROM profiles WHERE email = v_bet.payee_email;
    CONTINUE WHEN v_payer_id IS NULL OR v_payee_id IS NULL;

    INSERT INTO settlements (user_id, opponent_id, amount, settled_at)
    VALUES (v_payer_id, v_payee_id, v_bet.amount, v_bet.settled_at);

    DELETE FROM seed_settlements_staging WHERE id = v_bet.id;
  END LOOP;

  -- Group bets (ROY): only create once ALL participants are registered
  FOR v_grp IN
    SELECT * FROM seed_group_bets_staging
    WHERE p_email = ANY(participant_emails)
  LOOP
    v_all_in := TRUE;
    FOR i IN 1..array_length(v_grp.participant_emails, 1) LOOP
      IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = v_grp.participant_emails[i]) THEN
        v_all_in := FALSE;
        EXIT;
      END IF;
    END LOOP;
    CONTINUE WHEN NOT v_all_in;

    SELECT id INTO v_creator_id FROM profiles WHERE email = v_grp.participant_emails[1];

    INSERT INTO group_bets (created_by, match_id, bet_details, status, winner_id, created_at)
    VALUES (
      v_creator_id, NULL,
      jsonb_build_object('description', v_grp.description),
      v_grp.status, NULL, v_grp.created_at
    )
    RETURNING id INTO v_bet_id;

    FOR i IN 1..array_length(v_grp.participant_emails, 1) LOOP
      SELECT id INTO v_pid FROM profiles WHERE email = v_grp.participant_emails[i];
      INSERT INTO group_bet_participants (
        group_bet_id, user_id, stake, selection,
        custom_odds_num, custom_odds_den, payout, joined_at
      ) VALUES (
        v_bet_id, v_pid,
        v_grp.participant_stakes[i],
        v_grp.participant_sels[i],
        v_grp.odds_num[i],
        v_grp.odds_den[i],
        NULL, v_grp.created_at
      );
    END LOOP;

    DELETE FROM seed_group_bets_staging WHERE id = v_grp.id;
  END LOOP;

END;
$$;


-- 5. TRIGGER - fires automatically when a new user signs up

CREATE OR REPLACE FUNCTION trg_activate_seed_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM activate_seed_data(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_on_signup ON profiles;
CREATE TRIGGER trg_seed_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_activate_seed_data();


-- 6. ACTIVATE FOR ALREADY-REGISTERED USERS (Manan + Vivan)

SELECT activate_seed_data('mehta.manan019@gmail.com');
SELECT activate_seed_data('vivankandoi@gmail.com');


-- 7. VERIFY
-- Expected after running:
--   bets_created: 11 (all Manan<->Vivan bets resolved)
--   settled: 8, active: 3 (Manan-Vivan active bets)
--   settlements: 0 (Panda not yet registered, stays staged)
--   friend_links: 1 (one row for Manan<->Vivan pair)
--   bets_still_staged: 27 (waiting for Aryan/Panda/Niket to sign up)

SELECT
  (SELECT COUNT(*) FROM bets)                            AS bets_created,
  (SELECT COUNT(*) FROM bets WHERE status = 'settled')   AS settled,
  (SELECT COUNT(*) FROM bets WHERE status = 'accepted')  AS active,
  (SELECT COUNT(*) FROM settlements)                     AS settlements,
  (SELECT COUNT(*) FROM friends)                         AS friend_links,
  (SELECT COUNT(*) FROM seed_bets_staging)               AS bets_still_staged,
  (SELECT COUNT(*) FROM seed_settlements_staging)        AS settlements_still_staged;
