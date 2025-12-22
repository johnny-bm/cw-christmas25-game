<?php
function fs($v) {
    if (!$v) return null;

    return $v['stringValue']
        ?? $v['integerValue']
        ?? $v['doubleValue']
        ?? $v['booleanValue']
        ?? $v['timestampValue']
        ?? null;
}
