<?php
// api/force_migration.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require 'db.php';

echo "Attempting migration...<br>";

try {
    // Check if column exists first
    $check = $pdo->query("SELECT column_name FROM information_schema.columns WHERE table_name='clients' AND column_name='hosts'");
    if ($check->rowCount() > 0) {
        echo "Column 'hosts' ALREADY EXISTS.<br>";
    } else {
        echo "Column 'hosts' missing. Adding...<br>";
        $pdo->exec("ALTER TABLE clients ADD COLUMN hosts JSONB DEFAULT '[]'");
        echo "Column 'hosts' created SUCCESSFULLY.<br>";
    }
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "<br>";
}
echo "Done.";
?>
