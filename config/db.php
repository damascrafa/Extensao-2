<?php

$host = "db.yytbmvthjbyctkgtpqen.supabase.co";
$port = "5432";
$dbname = "postgres";
$user = "postgres";
$password = "WR9XRJP2L5ebRREo";

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "Conectado ao banco com sucesso!";

} catch (PDOException $e) {
    die("Erro na conexão: " . $e->getMessage());
}
