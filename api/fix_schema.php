<?php
// api/fix_schema.php - TEMPORARY script to fix database schema
require 'db.php';

header('Content-Type: text/plain');

try {
    echo "Starting schema update...\n";
    
    $sql = "ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT FALSE";
    
    $pdo->exec($sql);
    echo "Columns added successfully (or already existed).\n";
    
    $sql2 = "UPDATE users SET is_active = TRUE, force_password_reset = FALSE WHERE is_active IS NULL";
    $pdo->exec($sql2);
    echo "Existing users updated.\n";
    
    echo "Schema update completed successfully.\n";
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
?>
