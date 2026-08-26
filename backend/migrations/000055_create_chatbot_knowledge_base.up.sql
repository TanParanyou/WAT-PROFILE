CREATE TABLE IF NOT EXISTS chatbot_knowledge_bases (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    question JSONB NOT NULL,
    answer JSONB NOT NULL,
    keywords JSONB DEFAULT '[]'::jsonb,
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_chatbot_kb_deleted_at ON chatbot_knowledge_bases(deleted_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_kb_category ON chatbot_knowledge_bases(category);
CREATE INDEX IF NOT EXISTS idx_chatbot_kb_is_active ON chatbot_knowledge_bases(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_kb_priority ON chatbot_knowledge_bases(priority DESC);
