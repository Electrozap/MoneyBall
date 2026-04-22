-- ============================================================
-- Fix duplicate friends + update function to prevent recurrence
-- Run in: Supabase Dashboard -> SQL Editor
-- ============================================================

-- Step 1: Remove all duplicate friend rows (keep the lower id)
DELETE FROM friends a
USING friends b
WHERE a.id > b.id
  AND (
    (a.requester_id = b.requester_id AND a.addressee_id = b.addressee_id)
    OR
    (a.requester_id = b.addressee_id AND a.addressee_id = b.requester_id)
  );

-- Step 2: Replace activate_seed_data with the fixed version
-- (creates only ONE friend row per pair, checks both directions)
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

    -- ONE row per pair: check both directions before inserting
    INSERT INTO friends (requester_id, addressee_id, status, created_at)
    SELECT v_uid, v_other_id, 'accepted', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM friends
      WHERE (requester_id = v_uid    AND addressee_id = v_other_id)
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

    -- ONE row per pair: check both directions before inserting
    INSERT INTO friends (requester_id, addressee_id, status, created_at)
    SELECT v_other_id, v_uid, 'accepted', NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM friends
      WHERE (requester_id = v_other_id AND addressee_id = v_uid)
         OR (requester_id = v_uid    AND addressee_id = v_other_id)
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

-- Step 3: Verify - every pair should appear exactly once
SELECT
  p1.full_name AS user1,
  p2.full_name AS user2,
  COUNT(*)     AS rows
FROM friends f
JOIN profiles p1 ON p1.id = f.requester_id
JOIN profiles p2 ON p2.id = f.addressee_id
GROUP BY p1.full_name, p2.full_name
ORDER BY p1.full_name;
