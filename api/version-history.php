<?php
// api/version-history.php
require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    session_start();
    
    $historyId = $_GET['id'] ?? null;
    if (!$historyId) {
        http_response_code(400);
        echo json_encode(['error' => 'History ID is required']);
        exit;
    }
    
    $currentUser = $_SESSION['username'] ?? null;
    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    // Verify ownership - only allow deleting own history entries
    $stmt = $pdo->prepare("SELECT updated_by FROM version_history WHERE id = ?");
    $stmt->execute([$historyId]);
    $history = $stmt->fetch();
    
    if (!$history) {
        http_response_code(404);
        echo json_encode(['error' => 'History record not found']);
        exit;
    }
    
    if ($history['updated_by'] !== $currentUser) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only delete your own version history']);
        exit;
    }
    
    // Delete the history record
    $stmt = $pdo->prepare("DELETE FROM version_history WHERE id = ?");
    $stmt->execute([$historyId]);
    
    echo json_encode(['success' => true]);
}
?>
