<?php
/* ================================================
   CONFIG.PHP
   Isi file ini saat siap deploy ke hosting.
   Jangan di-upload ke public repository (git).
   ================================================ */

// ------------------------------------------------
// DATABASE (untuk RSVP, komentar, e-angpao)
// ------------------------------------------------
define('DB_HOST',     'localhost');
define('DB_NAME',     'undangan_db');
define('DB_USER',     'root');
define('DB_PASS',     '');
define('DB_CHARSET',  'utf8mb4');

// ------------------------------------------------
// DATA MEMPELAI (ubah sesuai kebutuhan)
// ------------------------------------------------
define('GROOM_NAME',    'Fulan');
define('BRIDE_NAME',    'Fulani');
define('WEDDING_DATE',  '2025-07-12');
define('WEDDING_TIME',  '10.00 WIB');
define('WEDDING_VENUE', 'Gedung Serbaguna, Jakarta Selatan');

// ------------------------------------------------
// GOOGLE SHEETS (untuk data tamu → spreadsheet)
// Isi setelah mendapatkan API key dari Google Cloud
// ------------------------------------------------
define('GOOGLE_SHEET_ID',  '');
define('GOOGLE_API_KEY',   '');

// ------------------------------------------------
// E-ANGPAO — Rekening tujuan
// ------------------------------------------------
define('BANK_NAME',    'BCA');
define('BANK_NUMBER',  '1234567890');
define('BANK_OWNER',   'Fulan / Fulani');

// ------------------------------------------------
// WHATSAPP konfirmasi hadir
// ------------------------------------------------
define('WA_NUMBER', '628xxxxxxxxxx');

// ------------------------------------------------
// Base URL (ganti saat deploy)
// ------------------------------------------------
define('BASE_URL', 'http://localhost/undangan');

// ------------------------------------------------
// Koneksi PDO — dipanggil dari halaman yang butuh DB
// ------------------------------------------------
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            // Jangan tampilkan error detail di production
            die(json_encode(['error' => 'Database connection failed']));
        }
    }
    return $pdo;
}
