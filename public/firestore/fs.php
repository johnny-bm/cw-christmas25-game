<?php
function fs($v) {
    if (!$v) return '';
    return $v['stringValue']
        ?? $v['integerValue']
        ?? $v['doubleValue']
        ?? $v['booleanValue']
        ?? $v['timestampValue']
        ?? '';
}
