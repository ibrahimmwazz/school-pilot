-- Trigger Function to prevent modifications to `scores` when the related class is locked
CREATE OR REPLACE FUNCTION check_class_lock_before_score_update()
RETURNS TRIGGER AS $$
DECLARE
  v_is_locked BOOLEAN;
  v_class_id TEXT;
  v_term_id TEXT;
BEGIN
  -- If we're doing an insert or update, we care about NEW.
  -- Find the class_id and academic_term_id for this score's enrollment
  SELECT class_id, academic_term_id INTO v_class_id, v_term_id
  FROM enrollments
  WHERE id = NEW.enrollment_id;

  -- Check the lock status in class_locks
  SELECT is_locked INTO v_is_locked
  FROM class_locks
  WHERE class_id = v_class_id AND academic_term_id = v_term_id;

  -- If locked, abort the transaction
  IF v_is_locked = TRUE THEN
    RAISE EXCEPTION 'Cannot modify scores. The class and academic term are currently locked.' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to INSERT
DROP TRIGGER IF EXISTS trigger_prevent_score_insert ON scores;
CREATE TRIGGER trigger_prevent_score_insert
BEFORE INSERT ON scores
FOR EACH ROW
EXECUTE FUNCTION check_class_lock_before_score_update();

-- Apply to UPDATE
DROP TRIGGER IF EXISTS trigger_prevent_score_update ON scores;
CREATE TRIGGER trigger_prevent_score_update
BEFORE UPDATE ON scores
FOR EACH ROW
EXECUTE FUNCTION check_class_lock_before_score_update();
