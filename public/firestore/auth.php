
<?php
require __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;

function firestoreToken() {
    $key = json_decode(
        file_get_contents(__DIR__ . '/../secure/firestore.json'),
        true
    );

    $now = time();

    $payload = [
        'iss'   => $key['client_email'],
        'sub'   => $key['client_email'],
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
        'scope' => 'https://www.googleapis.com/auth/datastore'
    ];

    $jwt = JWT::encode($payload, $key['private_key'], 'RS256');

    $response = file_get_contents(
        'https://oauth2.googleapis.com/token',
        false,
        stream_context_create([
            'http' => [
                'method'  => 'POST',
                'header'  => "Content-Type: application/x-www-form-urlencoded",
                'content' => http_build_query([
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion'  => $jwt
                ])
            ]
        ])
    );

    return json_decode($response, true)['access_token'];
}
