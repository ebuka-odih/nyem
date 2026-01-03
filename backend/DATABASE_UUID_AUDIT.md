# Database UUID Audit - User Foreign Keys

This document verifies that all `user_id` foreign keys are using UUID type.

## Users Table
- **Primary Key**: `id` → `uuid` ✅
- **Model**: `User` uses `HasUuids` trait ✅

## Foreign Key References to Users

### 1. **items** table
- **Column**: `user_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_22_190201_create_items_table.php`
- **Model**: `Item` uses `HasUuids` trait ✅

### 2. **swipes** table
- **Column**: `from_user_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_22_190206_create_swipes_table.php`
- **Model**: `Swipe` uses `HasUuids` trait ✅

### 3. **user_matches** table
- **Column**: `user1_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Column**: `user2_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_22_190213_create_user_matches_table.php`
- **Model**: `UserMatch` uses `HasUuids` trait ✅

### 4. **messages** table
- **Column**: `sender_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Column**: `receiver_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_22_190219_create_messages_table.php`
- **Model**: `Message` uses `HasUuids` trait ✅

### 5. **blocks** table
- **Column**: `blocker_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Column**: `blocked_user_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_22_190229_create_blocks_table.php`
- **Model**: `Block` uses `HasUuids` trait ✅

### 6. **reports** table
- **Column**: `reporter_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Column**: `target_user_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_22_190225_create_reports_table.php`
- **Model**: `Report` uses `HasUuids` trait ✅

### 7. **trade_offers** table
- **Column**: `from_user_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Column**: `to_user_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_24_081112_create_trade_offers_table.php`
- **Model**: `TradeOffer` uses `HasUuids` trait ✅

### 8. **user_conversations** table
- **Column**: `user1_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Column**: `user2_id`
- **Type**: `uuid` ✅
- **Foreign Key**: `constrained('users')->cascadeOnDelete()` ✅
- **Migration**: `2025_11_24_081113_create_user_conversations_table.php`
- **Model**: `UserConversation` uses `HasUuids` trait ✅

### 9. **sessions** table
- **Column**: `user_id`
- **Type**: `uuid` ✅
- **Index**: `index()` (nullable) ✅
- **Migration**: `0001_01_01_000000_create_users_table.php`
- **Note**: No foreign key constraint (Laravel sessions table standard)

### 10. **personal_access_tokens** table
- **Column**: `tokenable_id` (polymorphic)
- **Type**: `uuid` ✅ (via `uuidMorphs('tokenable')`)
- **Migration**: `2025_11_22_185947_create_personal_access_tokens_table.php`
- **Note**: Uses polymorphic relationship, but tokenable_id is UUID when tokenable_type is 'App\Models\User'

## Summary

✅ **All user foreign keys are using UUID type**

All tables that reference the `users` table use `uuid` type for their foreign key columns:
- All migrations use `$table->uuid('*_user_id')` or `$table->uuid('*_id')` for user references
- All foreign key constraints use `constrained('users')->cascadeOnDelete()`
- All models use the `HasUuids` trait
- All relationships are properly defined in models

## Verification Commands

To verify in the database:

```sql
-- Check all foreign keys referencing users table
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME LIKE '%user%id%'
AND TABLE_NAME != 'users'
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Check foreign key constraints
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME = 'users'
ORDER BY TABLE_NAME, COLUMN_NAME;
```

























