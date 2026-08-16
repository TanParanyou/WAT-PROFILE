BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE community_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(80) NOT NULL UNIQUE,
  name jsonb NOT NULL,
  description jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_categories_name_locale_check CHECK (
    jsonb_typeof(name) = 'object'
    AND name ?& ARRAY['th', 'en', 'de']
  )
);

CREATE TABLE community_member_states (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trust_status varchar(16) NOT NULL DEFAULT 'new',
  first_approved_at timestamptz,
  restricted_until timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_member_states_trust_status_check CHECK (
    trust_status IN ('new', 'trusted', 'restricted', 'banned')
  ),
  CONSTRAINT community_member_states_version_check CHECK (version > 0)
);

CREATE TABLE community_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES community_categories(id) ON DELETE RESTRICT,
  locale varchar(2) NOT NULL,
  title varchar(200) NOT NULL,
  slug varchar(240) NOT NULL,
  body jsonb NOT NULL,
  body_text text NOT NULL,
  publication_status varchar(20) NOT NULL DEFAULT 'pending_review',
  lifecycle_status varchar(16) NOT NULL DEFAULT 'open',
  accepted_answer_id uuid,
  published_answer_count integer NOT NULL DEFAULT 0,
  official_answer_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  client_request_id uuid NOT NULL,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  hidden_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_questions_locale_check CHECK (locale IN ('th', 'en', 'de')),
  CONSTRAINT community_questions_title_length_check CHECK (char_length(btrim(title)) BETWEEN 10 AND 200),
  CONSTRAINT community_questions_body_text_length_check CHECK (char_length(btrim(body_text)) BETWEEN 20 AND 20000),
  CONSTRAINT community_questions_publication_status_check CHECK (
    publication_status IN ('pending_review', 'published', 'hidden', 'deleted')
  ),
  CONSTRAINT community_questions_lifecycle_status_check CHECK (
    lifecycle_status IN ('open', 'answered', 'resolved', 'locked', 'archived')
  ),
  CONSTRAINT community_questions_counts_check CHECK (
    published_answer_count >= 0 AND official_answer_count >= 0
  ),
  CONSTRAINT community_questions_version_check CHECK (version > 0)
);

CREATE TABLE community_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  author_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body jsonb NOT NULL,
  body_text text NOT NULL,
  publication_status varchar(20) NOT NULL DEFAULT 'pending_review',
  is_official boolean NOT NULL DEFAULT false,
  official_by_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  official_at timestamptz,
  helpful_count integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  client_request_id uuid NOT NULL,
  published_at timestamptz,
  hidden_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_answers_one_author_check CHECK (
    (author_user_id IS NOT NULL)::integer + (author_admin_id IS NOT NULL)::integer = 1
  ),
  CONSTRAINT community_answers_body_text_length_check CHECK (char_length(btrim(body_text)) BETWEEN 5 AND 20000),
  CONSTRAINT community_answers_publication_status_check CHECK (
    publication_status IN ('pending_review', 'published', 'hidden', 'deleted')
  ),
  CONSTRAINT community_answers_helpful_count_check CHECK (helpful_count >= 0),
  CONSTRAINT community_answers_version_check CHECK (version > 0),
  CONSTRAINT community_answers_admin_official_check CHECK (author_admin_id IS NULL OR is_official)
);

ALTER TABLE community_answers
  ADD CONSTRAINT community_answers_id_question_uniq UNIQUE (id, question_id);

CREATE TABLE community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  answer_id uuid,
  author_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  body jsonb NOT NULL,
  body_text text NOT NULL,
  publication_status varchar(20) NOT NULL DEFAULT 'pending_review',
  version integer NOT NULL DEFAULT 1,
  client_request_id uuid NOT NULL,
  published_at timestamptz,
  hidden_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_comments_body_text_length_check CHECK (char_length(btrim(body_text)) BETWEEN 2 AND 2000),
  CONSTRAINT community_comments_publication_status_check CHECK (
    publication_status IN ('pending_review', 'published', 'hidden', 'deleted')
  ),
  CONSTRAINT community_comments_version_check CHECK (version > 0)
);

ALTER TABLE community_comments
  ADD CONSTRAINT community_comments_answer_question_fk
  FOREIGN KEY (answer_id, question_id)
  REFERENCES community_answers(id, question_id)
  ON DELETE CASCADE;

CREATE TABLE community_answer_votes (
  answer_id uuid NOT NULL REFERENCES community_answers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (answer_id, user_id)
);

CREATE TABLE community_post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES community_questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES community_answers(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  editor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  editor_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title_before varchar(200),
  title_after varchar(200),
  body_before jsonb NOT NULL,
  body_after jsonb NOT NULL,
  review_status varchar(16) NOT NULL DEFAULT 'not_required',
  reviewer_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  decision_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_revisions_one_target_check CHECK (
    (question_id IS NOT NULL)::integer + (answer_id IS NOT NULL)::integer +
    (comment_id IS NOT NULL)::integer = 1
  ),
  CONSTRAINT community_post_revisions_one_editor_check CHECK (
    (editor_user_id IS NOT NULL)::integer + (editor_admin_id IS NOT NULL)::integer = 1
  ),
  CONSTRAINT community_post_revisions_review_status_check CHECK (
    review_status IN ('not_required', 'pending', 'approved', 'rejected')
  )
);

CREATE TABLE community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  question_id uuid REFERENCES community_questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES community_answers(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES community_comments(id) ON DELETE CASCADE,
  reason varchar(32) NOT NULL,
  details text,
  state varchar(16) NOT NULL DEFAULT 'open',
  resolver_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_reports_one_target_check CHECK (
    (question_id IS NOT NULL)::integer + (answer_id IS NOT NULL)::integer +
    (comment_id IS NOT NULL)::integer = 1
  ),
  CONSTRAINT community_reports_reason_check CHECK (
    reason IN ('spam', 'harassment', 'misinformation', 'privacy', 'inappropriate', 'other')
  ),
  CONSTRAINT community_reports_details_length_check CHECK (details IS NULL OR char_length(details) <= 2000),
  CONSTRAINT community_reports_state_check CHECK (
    state IN ('open', 'reviewing', 'resolved', 'dismissed')
  )
);

CREATE TABLE community_moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action varchar(40) NOT NULL,
  target_type varchar(24) NOT NULL,
  target_id uuid NOT NULL,
  reason text NOT NULL,
  previous_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_trace_id varchar(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_moderation_actions_reason_check CHECK (char_length(btrim(reason)) BETWEEN 2 AND 2000)
);

CREATE TABLE community_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type varchar(40) NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_type varchar(24) NOT NULL,
  target_id uuid,
  dedupe_key varchar(255) NOT NULL UNIQUE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_notifications_actor_check CHECK (
    (actor_user_id IS NULL)::integer + (actor_admin_id IS NULL)::integer >= 1
  )
);

CREATE TABLE community_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE community_rate_limit_buckets (
  subject_hash char(64) NOT NULL,
  subject_type varchar(16) NOT NULL,
  surface varchar(16) NOT NULL,
  window_started_at timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (subject_hash, subject_type, surface, window_started_at),
  CONSTRAINT community_rate_limit_subject_type_check CHECK (subject_type IN ('account', 'ip')),
  CONSTRAINT community_rate_limit_surface_check CHECK (
    surface IN ('question', 'answer', 'comment', 'vote', 'report', 'search')
  ),
  CONSTRAINT community_rate_limit_count_check CHECK (count >= 0)
);

ALTER TABLE community_questions
  ADD CONSTRAINT community_questions_accepted_answer_fk
  FOREIGN KEY (accepted_answer_id, id)
  REFERENCES community_answers(id, question_id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE UNIQUE INDEX community_questions_author_request_uidx
  ON community_questions (author_user_id, client_request_id)
  WHERE author_user_id IS NOT NULL;
CREATE UNIQUE INDEX community_answers_author_request_uidx
  ON community_answers (author_user_id, client_request_id)
  WHERE author_user_id IS NOT NULL;
CREATE UNIQUE INDEX community_comments_author_request_uidx
  ON community_comments (author_user_id, client_request_id)
  WHERE author_user_id IS NOT NULL;
CREATE UNIQUE INDEX community_reports_open_target_uidx
  ON community_reports (
    reporter_user_id,
    COALESCE(question_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(answer_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(comment_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE state IN ('open', 'reviewing');

CREATE INDEX community_questions_feed_idx
  ON community_questions (publication_status, lifecycle_status, last_activity_at DESC, id DESC);
CREATE INDEX community_questions_category_locale_idx
  ON community_questions (category_id, locale, publication_status, last_activity_at DESC);
CREATE INDEX community_questions_author_idx
  ON community_questions (author_user_id, created_at DESC);
CREATE INDEX community_questions_title_trgm_idx
  ON community_questions USING gin (title gin_trgm_ops);
CREATE INDEX community_questions_body_text_trgm_idx
  ON community_questions USING gin (body_text gin_trgm_ops);
CREATE INDEX community_answers_rank_idx
  ON community_answers (question_id, publication_status, is_official DESC, helpful_count DESC, published_at ASC, id);
CREATE INDEX community_answers_author_idx
  ON community_answers (author_user_id, created_at DESC);
CREATE INDEX community_comments_thread_idx
  ON community_comments (question_id, answer_id, publication_status, created_at ASC);
CREATE INDEX community_post_revisions_created_idx
  ON community_post_revisions (created_at DESC);
CREATE INDEX community_reports_queue_idx
  ON community_reports (state, created_at ASC);
CREATE INDEX community_moderation_actions_target_idx
  ON community_moderation_actions (target_type, target_id, created_at DESC);
CREATE INDEX community_notifications_recipient_idx
  ON community_notifications (recipient_user_id, read_at, created_at DESC);
CREATE INDEX community_rate_limit_buckets_expiry_idx
  ON community_rate_limit_buckets (expires_at);

COMMIT;
