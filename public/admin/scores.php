<?php
require __DIR__ . '/../firestore/fetch.php';
require __DIR__ . '/../firestore/fs.php';
?>

<!DOCTYPE html>
<html>
<head>
    <title>Scores</title>
    <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 6px; }
        th { background: #eee; }
    </style>
</head>
<body>

<h2>Game Scores</h2>

<table>
<tr>
    <th>ID</th>
    <th>Player</th>
    <th>Distance</th>
    <th>Email</th>
    <th>Created</th>
</tr>

<?php foreach ($docs as $doc):
    $f = $doc['fields'] ?? [];
?>
<tr>
    <td><?= basename($doc['name']) ?></td>
    <td><?= fs($f['player_name'] ?? null) ?></td>
    <td><?= fs($f['distance'] ?? null) ?></td>
    <td><?= fs($f['email'] ?? null) ?></td>
    <td><?= fs($f['created_at'] ?? null) ?></td>
</tr>
<?php endforeach; ?>

</table>

</body>
</html>
