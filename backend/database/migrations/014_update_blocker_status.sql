ALTER TABLE blocker_profiles
DROP CONSTRAINT IF EXISTS blocker_profiles_status_check;

ALTER TABLE blocker_profiles
ADD CONSTRAINT blocker_profiles_status_check
CHECK (
    status IN (
        'PENDING',
        'APPROVED',
        'REJECTED',
        'SUSPENDED'
    )
);