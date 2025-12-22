<?php
require __DIR__ . '/firestore_auth.php';

$projectId  = 'cw-game-a42eb';
$collection = 'scores';

$token = getFirestoreToken();

$url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/$collection";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $token"
    ]
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$documents = $data['documents'] ?? [];
