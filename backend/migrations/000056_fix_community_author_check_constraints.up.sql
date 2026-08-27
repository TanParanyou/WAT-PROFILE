BEGIN;

-- Allow author_user_id and author_admin_id to both be NULL when a user is deleted (ON DELETE SET NULL)
ALTER TABLE community_answers
  DROP CONSTRAINT IF EXISTS community_answers_one_author_check,
  ADD CONSTRAINT community_answers_one_author_check CHECK (
    (author_user_id IS NOT NULL)::integer + (author_admin_id IS NOT NULL)::integer <= 1
  );

-- Allow editor_user_id and editor_admin_id to both be NULL when an editor user is deleted (ON DELETE SET NULL)
ALTER TABLE community_post_revisions
  DROP CONSTRAINT IF EXISTS community_post_revisions_one_editor_check,
  ADD CONSTRAINT community_post_revisions_one_editor_check CHECK (
    (editor_user_id IS NOT NULL)::integer + (editor_admin_id IS NOT NULL)::integer <= 1
  );

COMMIT;
