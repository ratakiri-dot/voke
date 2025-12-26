-- =====================================================
-- VOKE: Admin Withdrawal & Notification Functions
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor
-- These functions bypass RLS for admin operations

-- Function 1: Approve Withdrawal with Point Deduction
-- =====================================================
CREATE OR REPLACE FUNCTION admin_approve_withdrawal(
  transaction_id UUID,
  user_id_param UUID,
  amount_param NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance NUMERIC;
  new_balance NUMERIC;
BEGIN
  -- Get current balance
  SELECT gift_balance INTO current_balance
  FROM profiles
  WHERE id = user_id_param;
  
  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance - amount_param;
  
  IF new_balance < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Update user balance
  UPDATE profiles
  SET gift_balance = new_balance
  WHERE id = user_id_param;
  
  -- Update transaction status
  UPDATE transactions
  SET status = 'completed'
  WHERE id = transaction_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, message, type, is_read)
  VALUES (
    user_id_param,
    'Penarikan dana sebesar ' || amount_param || ' poin telah disetujui.',
    'success',
    false
  );
  
  RETURN json_build_object(
    'success', true,
    'old_balance', current_balance,
    'new_balance', new_balance
  );
END;
$$;

-- Function 2: Create Notification for Any User
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification_for_user(
  target_user_id UUID,
  notification_message TEXT,
  notification_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, message, type, is_read)
  VALUES (target_user_id, notification_message, notification_type, false)
  RETURNING id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION admin_approve_withdrawal(UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification_for_user(UUID, TEXT, TEXT) TO authenticated;
