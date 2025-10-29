<?php

require __DIR__ . '/../vendor/autoload.php';
use MongoDB\Client;

header('Content-Type: application/json; charset=utf-8');

//helperss
function getRequestInfo() { return json_decode(file_get_contents('php://input'), true) ?: []; }
function sendJson($arr)   { echo json_encode($arr, JSON_UNESCAPED_UNICODE); exit; }
function returnWithError($err) { sendJson(["id"=>"0","firstName"=>"","lastName"=>"","error"=>$err]); }
function returnWithInfo($first,$last,$id) { sendJson(["id"=>$id,"firstName"=>$first,"lastName"=>$last,"error"=>""]); }

//input
$inData = getRequestInfo();
$login  = strtolower(trim($inData['login'] ?? ''));
$pass   = trim($inData['password'] ?? '');
if ($login === '' || $pass === '') returnWithError('Missing login or password');


if (class_exists(\Dotenv\Dotenv::class)) {
  \Dotenv\Dotenv::createImmutable(dirname(__DIR__))->safeLoad(); // no error if .env missing
}
$dbUser = $_ENV['MDB_USER'] ?? getenv('MDB_USER') ?? 'API';
$dbPass = $_ENV['MDB_PASS'] ?? getenv('MDB_PASS') ?? '';
if ($dbPass === '') returnWithError('Server DB password not set');


try {
  $uri = 'mongodb+srv://' . rawurlencode($dbUser) . ':' . rawurlencode($dbPass)
       . '@simplesite.s1xesvx.mongodb.net/?appName=SimpleSite';
  $client = new Client($uri);
  $db     = $client->selectDatabase('LargeProject');
  $users  = $db->selectCollection('Users');
} catch (Throwable $e) {
  returnWithError('DB connection failed: ' . $e->getMessage());
}


try {
  $userDoc = $users->findOne(
    ['login' => $login],
    ['projection' => ['firstName'=>1,'lastName'=>1,'passwordHash'=>1]]
  );
  if (!$userDoc) returnWithError('No Records Found');

  if (!isset($userDoc['passwordHash']) || !password_verify($pass, (string)$userDoc['passwordHash'])) {
    returnWithError('No Records Found');
  }

  $id = (string)$userDoc['_id'];
  returnWithInfo((string)($userDoc['firstName'] ?? ''), (string)($userDoc['lastName'] ?? ''), $id);
} catch (Throwable $e) {
  returnWithError('Query failed: ' . $e->getMessage());
}


