BEGIN;

DROP INDEX IF EXISTS community_rate_limit_buckets_expiry_idx;
DROP INDEX IF EXISTS community_notifications_recipient_idx;
DROP INDEX IF EXISTS community_moderation_actions_target_idx;
DROP INDEX IF EXISTS community_reports_queue_idx;
DROP INDEX IF EXISTS community_post_revisions_created_idx;
DROP INDEX IF EXISTS community_comments_thread_idx;
DROP INDEX IF EXISTS community_answers_author_idx;
DROP INDEX IF EXISTS community_answers_rank_idx;
DROP INDEX IF EXISTS community_questions_body_text_trgm_idx;
DROP INDEX IF EXISTS community_questions_title_trgm_idx;
DROP INDEX IF EXISTS community_questions_author_idx;
DROP INDEX IF EXISTS community_questions_category_locale_idx;
DROP INDEX IF EXISTS community_questions_feed_idx;
DROP INDEX IF EXISTS community_reports_open_target_uidx;
DROP INDEX IF EXISTS community_comments_author_request_uidx;
DROP INDEX IF EXISTS community_answers_author_request_uidx;
DROP INDEX IF EXISTS community_questions_author_request_uidx;

DROP TABLE IF EXISTS community_rate_limit_buckets;
DROP TABLE IF EXISTS community_notification_preferences;
DROP TABLE IF EXISTS community_notifications;
DROP TABLE IF EXISTS community_moderation_actions;
DROP TABLE IF EXISTS community_reports;
DROP TABLE IF EXISTS community_post_revisions;
DROP TABLE IF EXISTS community_answer_votes;
DROP TABLE IF EXISTS community_comments;
DROP TABLE IF EXISTS community_answers;
DROP TABLE IF EXISTS community_questions;
DROP TABLE IF EXISTS community_member_states;
DROP TABLE IF EXISTS community_categories;

COMMIT;
