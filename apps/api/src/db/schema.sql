-- Forcar UTF-8 no cliente (resolve problema de encoding no Windows)
SET client_encoding = 'UTF8';

/**
 * Database Schema - PostgreSQL
 * 
 * Zero-knowledge architecture:
 * - Users table: Authentication only (SRP verifier, no passwords)
 * - Vault items: Encrypted blobs only
 * - Audit log: Privacy-preserving (no PII)
 * 
 * Security features:
 * - Row-level security (future)
 * - Encrypted columns for sensitive metadata
 * - Audit trails
 * - Cascade deletes
 * 
 * @module db/schema
 */

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication (SRP-based, zero-knowledge)
    email_hash VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    salt BYTEA NOT NULL,
    srp_verifier TEXT NOT NULL,
    wrapped_mek BYTEA NOT NULL,
    
    -- Account metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Security features
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret_encrypted BYTEA,
    backup_codes_encrypted BYTEA,
    
    -- Account status
    email_verified BOOLEAN DEFAULT FALSE,
    account_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INTEGER DEFAULT 0,
    
    -- Subscription/limits (for SaaS model)
    tier VARCHAR(20) DEFAULT 'free',
    storage_used BIGINT DEFAULT 0,
    storage_limit BIGINT DEFAULT 1073741824, -- 1GB for free tier
    
    CONSTRAINT valid_tier CHECK (tier IN ('free', 'premium', 'family', 'business'))
);

CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================================================
-- VAULT ITEMS TABLE
-- ============================================================================

CREATE TABLE vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Item type
    item_type VARCHAR(20) NOT NULL,
    
    -- Encrypted payload
    encrypted_data BYTEA NOT NULL,
    encrypted_key BYTEA NOT NULL,
    nonce BYTEA NOT NULL,
    auth_tag BYTEA NOT NULL,
    
    -- Encrypted metadata (for client-side search)
    encrypted_metadata BYTEA,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete (for recovery)
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_item_type CHECK (
        item_type IN ('password', 'card', 'note', 'identity', 'file', 'totp', 'api_key', 'license')
    )
);

CREATE INDEX idx_vault_items_user ON vault_items(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vault_items_type ON vault_items(user_id, item_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_vault_items_created ON vault_items(created_at);

-- ============================================================================
-- SESSIONS TABLE
-- ============================================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session tokens
    refresh_token_hash VARCHAR(64) UNIQUE NOT NULL,
    
    -- Session metadata
    user_agent TEXT,
    ip_address INET,
    
    -- Expiry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Device tracking
    device_name VARCHAR(255),
    device_trusted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Result
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    -- Timestamp
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (
        action IN (
            'login', 'logout', 'register', 'password_change',
            'list_items', 'create_item', 'read_item', 'update_item', 'delete_item',
            'export_vault', 'import_vault',
            'mfa_enable', 'mfa_disable', 'mfa_verify',
            'session_create', 'session_revoke'
        )
    )
);

CREATE INDEX idx_audit_user ON audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_action ON audit_log(action, timestamp DESC);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp DESC);

-- ============================================================================
-- FILES TABLE (for file vault items)
-- ============================================================================

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_item_id UUID REFERENCES vault_items(id) ON DELETE CASCADE,
    
    -- File metadata (encrypted)
    storage_key VARCHAR(255) UNIQUE NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    
    -- Checksum (for integrity)
    checksum VARCHAR(64) NOT NULL,
    
    -- Timestamps
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800) -- 50MB
);

CREATE INDEX idx_files_user ON files(user_id);
CREATE INDEX idx_files_storage_key ON files(storage_key);

-- ============================================================================
-- EMERGENCY CONTACTS TABLE
-- ============================================================================

CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact info (hashed for privacy)
    contact_email_hash VARCHAR(64) NOT NULL,
    
    -- Waiting period
    waiting_period_days INTEGER DEFAULT 30,
    
    -- Recovery key (wrapped for contact)
    wrapped_recovery_key BYTEA,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requested_at TIMESTAMP WITH TIME ZONE,
    granted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'active', 'requested', 'granted', 'rejected', 'expired')
    ),
    CONSTRAINT valid_waiting_period CHECK (waiting_period_days >= 1 AND waiting_period_days <= 90)
);

CREATE INDEX idx_emergency_user ON emergency_contacts(user_id);
CREATE INDEX idx_emergency_status ON emergency_contacts(status) WHERE status = 'requested';

-- ============================================================================
-- SHARED ITEMS TABLE (future feature)
-- ============================================================================

CREATE TABLE shared_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Wrapped item key for recipient
    wrapped_key_for_recipient BYTEA NOT NULL,
    
    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT no_self_share CHECK (owner_id != shared_with_user_id)
);

CREATE INDEX idx_shared_recipient ON shared_items(shared_with_user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_shared_item ON shared_items(item_id) WHERE revoked_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_items_updated_at
    BEFORE UPDATE ON vault_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CLEANUP FUNCTIONS
-- ============================================================================

-- Delete expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Delete old audit logs (GDPR compliance - keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_log WHERE timestamp < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW-LEVEL SECURITY (Optional, for extra security)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Users can only access their own vault items
CREATE POLICY vault_items_isolation ON vault_items
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY files_isolation ON files
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Create a maintenance user (for scheduled tasks)
-- INSERT INTO users (email_hash, salt, srp_verifier, wrapped_mek, tier)
-- VALUES ('maintenance', '', '', '', 'system');
