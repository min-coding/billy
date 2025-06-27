/*
  # Update Bill Finalization Trigger Function

  1. Modifications
    - Update check_bill_finalization_status() function to insert notifications
    - Add logic to check if all participants have submitted their selections
    - Insert notification for bill host when bill is ready to finalize

  2. Security
    - Function runs with definer rights for proper access
    - Validates bill status and participant submission status
*/

-- Update the trigger function to handle notifications
CREATE OR REPLACE FUNCTION check_bill_finalization_status()
RETURNS TRIGGER AS $$
DECLARE
    bill_record RECORD;
    total_participants INTEGER;
    submitted_participants INTEGER;
    host_user_id UUID;
    bill_title TEXT;
BEGIN
    -- Get bill information
    SELECT id, title, status, created_by 
    INTO bill_record
    FROM bills 
    WHERE id = NEW.bill_id;
    
    -- Only proceed if bill is in 'select' status
    IF bill_record.status != 'select' THEN
        RETURN NEW;
    END IF;
    
    -- Count total participants for this bill
    SELECT COUNT(*) 
    INTO total_participants
    FROM bill_participants 
    WHERE bill_id = NEW.bill_id;
    
    -- Count participants who have submitted
    SELECT COUNT(*) 
    INTO submitted_participants
    FROM bill_participants 
    WHERE bill_id = NEW.bill_id AND has_submitted = true;
    
    -- If all participants have submitted, create notification for host
    IF submitted_participants = total_participants AND total_participants > 0 THEN
        -- Insert notification for the bill creator (host)
        INSERT INTO notifications (
            user_id,
            type,
            title,
            body,
            data,
            is_read
        ) VALUES (
            bill_record.created_by,
            'bill_finalized',
            'Your bill is ready to finalize!',
            'Bill "' || bill_record.title || '" is ready for final review and payment collection. All participants have made their selections.',
            jsonb_build_object(
                'bill_id', bill_record.id,
                'bill_title', bill_record.title,
                'action', 'finalize_bill'
            ),
            false
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_participant_submission ON bill_participants;

CREATE TRIGGER on_participant_submission
    AFTER UPDATE OF has_submitted ON bill_participants
    FOR EACH ROW
    WHEN (NEW.has_submitted IS TRUE AND OLD.has_submitted IS DISTINCT FROM NEW.has_submitted)
    EXECUTE FUNCTION check_bill_finalization_status();