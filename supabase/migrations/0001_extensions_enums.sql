-- Migration 0001: Extensions & Enums
-- Enables core extensions and defines domain-specific enum types.

-- Enable necessary Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Custom Enum Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'presence_status') THEN
        CREATE TYPE presence_status AS ENUM ('online', 'offline', 'away', 'dnd');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_request_status') THEN
        CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
    END IF;
END $$;
