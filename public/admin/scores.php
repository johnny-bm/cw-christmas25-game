<?php
require __DIR__ . '/../../php/fetch_scores.php';
require __DIR__ . '/../../php/fs_helper.php';
?>
<!DOCTYPE html>
<html><head><title>Scores</title></head><body>
<table border="1">
<tr>
<th>ID</th><th>Player</th><th>Distance</th><th>Email</th><th>Created</th>
</tr>
<?php foreach ($documents as $doc):
    $f = $doc['fields'] ?? [];
?>
<tr>
    <td><?= htmlspecialchars(basename($doc['name'] ?? '')) ?></td>
    <td><?= htmlspecialchars(fs($f['player_name'] ?? null)) ?></td>
    <td><?= fs($f['distance'] ?? null) ?></td>
    <td><?= htmlspecialchars(fs($f['email'] ?? null)) ?></td>
    <td><?= fs($f['created_at'] ?? null) ?></td>
</tr>
<?php endforeach; ?>
</table>
</body></html>
