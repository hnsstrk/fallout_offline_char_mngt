-- Fallout Character Manager Database Schema
-- PostgreSQL 13+

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('player', 'gm', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Characters table - stores the complete FVTT JSON
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(500),
    fvtt_id VARCHAR(100),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    json_data JSONB NOT NULL,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(fvtt_id, owner_id)
);

-- Change logs table - tracks all modifications
CREATE TABLE IF NOT EXISTS change_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    field_path TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    change_type VARCHAR(20) CHECK (change_type IN ('create', 'update', 'delete', 'merge')),
    description TEXT,
    session_id UUID
);

-- Sessions table for JWT token management
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Character access permissions (for future feature: sharing characters)
CREATE TABLE IF NOT EXISTS character_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) CHECK (permission_level IN ('view', 'edit', 'admin')),
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(character_id, user_id)
);

-- Import history for tracking merges
CREATE TABLE IF NOT EXISTS import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    imported_by UUID NOT NULL REFERENCES users(id),
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    original_filename VARCHAR(500),
    changes_detected INTEGER DEFAULT 0,
    changes_applied INTEGER DEFAULT 0,
    merge_strategy VARCHAR(50),
    diff_summary JSONB
);

-- Indexes for better query performance
CREATE INDEX idx_characters_owner ON characters(owner_id);
CREATE INDEX idx_characters_fvtt_id ON characters(fvtt_id);
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_change_logs_character ON change_logs(character_id);
CREATE INDEX idx_change_logs_user ON change_logs(user_id);
CREATE INDEX idx_change_logs_timestamp ON change_logs(timestamp DESC);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_character_permissions_character ON character_permissions(character_id);
CREATE INDEX idx_character_permissions_user ON character_permissions(user_id);
CREATE INDEX idx_import_history_character ON import_history(character_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash generated with bcrypt (10 rounds)
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$rKvFYzJQjhqwFvmMZxZWU.cX5wKp2lKN0BqJ4gBQJ8QV8VfKxqEum', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE users IS 'Application users with role-based access control';
COMMENT ON TABLE characters IS 'FVTT character data stored as JSONB';
COMMENT ON TABLE change_logs IS 'Audit log for all character modifications';
COMMENT ON TABLE sessions IS 'Active JWT sessions for authentication';
COMMENT ON TABLE character_permissions IS 'Fine-grained character sharing permissions';
COMMENT ON TABLE import_history IS 'History of character imports and merges';
