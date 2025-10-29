<?php

require __DIR__ . '/../vendor/autoload.php';
use MongoDB\Client;

header('Content-Type: application/json; charset=utf-8');

// helpers
function body()    { return json_decode(file_get_contents('php://input'), true) ?: []; }
function respond($arr) { echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function fail($msg)    { respond(["error" => $msg]); }
function ok($id,$f,$l) { respond(["id"=>$id,"firstName"=>$f,"lastName"=>$l,"error"=>""]); }

// input
$in    = body();
$first = trim($in["firstName"] ?? "");
$last  = trim($in["lastName"]  ?? "");
$login = strtolower(trim($in["login"] ?? ""));   // keep normalized like Login.php
$pass  = trim($in["password"] ?? "");

if ($first === "" || $last === "" || $login === "" || $pass === "") {
  fail("Missing required field(s).");
}


if (class_exists(\Dotenv\Dotenv::class)) {
  \Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad(); // no error if .env missing
}
$dbUser = $_ENV['MDB_USER'] ?? getenv('MDB_USER') ?? 'API';
$dbPass = $_ENV['MDB_PASS'] ?? getenv('MDB_PASS') ?? '';
if ($dbPass === '') fail('Server DB password not set');


try {
  $uri = 'mongodb+srv://' . rawurlencode($dbUser) . ':' . rawurlencode($dbPass)
       . '@simplesite.s1xesvx.mongodb.net/?appName=SimpleSite';
  $client = new Client($uri);
  $db     = $client->selectDatabase('LargeProject');
  $Users  = $db->selectCollection('Users');
} catch (Throwable $e) {
  fail("DB connection failed: " . $e->getMessage());
}


try {
  
  if ($Users->findOne(['login' => $login], ['projection' => ['_id' => 1]])) {
    fail("Login already exists.");
  }

  $doc = [
    "firstName"    => $first,
    "lastName"     => $last,
    "login"        => $login,
    "passwordHash" => password_hash($pass, PASSWORD_BCRYPT), // must match Login.php
    "createdAt"    => new MongoDB\BSON\UTCDateTime()
  ];

  $res = $Users->insertOne($doc);
  ok((string)$res->getInsertedId(), $first, $last);
} catch (Throwable $e) {
  fail("Insert failed: " . $e->getMessage());
}

