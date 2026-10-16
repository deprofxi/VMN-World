-- TSK-51 rehearsal seed: 250 synthetic rows so the snapshot carries data, not just DDL.
-- These rows exist only inside the scratch database vmnl_tsk51_rehearsal_a, which the
-- rehearsal drops at the end. No real subject, no real address.
INSERT INTO "DataSubjectRequest" ("id", "requestRef", "userId", "email", "updatedAt")
SELECT md5(random()::text || q),
       'TSK51-A' || q,
       'tsk51-user-' || q,
       'rehearsal-' || q || '@invalid.example',
       now()
FROM generate_series(1, 250) AS q;
