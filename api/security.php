<?php
/**
 * Security Utility - Server-Side Encryption
 * AES-256-CBC encryption for sensitive data
 */

class SecurityUtil {
    private static $cipher = 'AES-256-CBC';
    private static $prefix = 'ENC:';
    
    /**
     * Get encryption key from environment or use default
     */
    private static function getKey() {
        // In production, this should come from environment variable
        $key = getenv('SOFIS_ENCRYPTION_KEY');
        if (!$key) {
            // Default key - CHANGE THIS IN PRODUCTION!
            $key = 'sofis_secret_system_key_2025_change_me_in_production';
        }
        // Derive a 32-byte key from the password
        return hash('sha256', $key, true);
    }
    
    /**
     * Encrypt a string
     */
    public static function encrypt($plaintext) {
        if (empty($plaintext) || !is_string($plaintext)) {
            return $plaintext;
        }
        
        // Already encrypted?
        if (self::isEncrypted($plaintext)) {
            return $plaintext;
        }
        
        try {
            $key = self::getKey();
            $ivLength = openssl_cipher_iv_length(self::$cipher);
            $iv = openssl_random_pseudo_bytes($ivLength);
            
            $encrypted = openssl_encrypt(
                $plaintext,
                self::$cipher,
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($encrypted === false) {
                error_log('Encryption failed: ' . openssl_error_string());
                return $plaintext; // Fallback to plaintext
            }
            
            // Combine IV and encrypted data
            $combined = $iv . $encrypted;
            
            // Return with prefix
            return self::$prefix . base64_encode($combined);
            
        } catch (Exception $e) {
            error_log('Encryption error: ' . $e->getMessage());
            return $plaintext; // Fallback
        }
    }
    
    /**
     * Decrypt a string
     */
    public static function decrypt($encryptedText) {
        if (empty($encryptedText) || !is_string($encryptedText)) {
            return $encryptedText;
        }
        
        // Not encrypted?
        if (!self::isEncrypted($encryptedText)) {
            return $encryptedText;
        }
        
        try {
            $key = self::getKey();
            
            // Remove prefix
            $base64 = substr($encryptedText, strlen(self::$prefix));
            $combined = base64_decode($base64);
            
            if ($combined === false) {
                error_log('Base64 decode failed');
                return $encryptedText;
            }
            
            $ivLength = openssl_cipher_iv_length(self::$cipher);
            $iv = substr($combined, 0, $ivLength);
            $encrypted = substr($combined, $ivLength);
            
            $decrypted = openssl_decrypt(
                $encrypted,
                self::$cipher,
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($decrypted === false) {
                error_log('Decryption failed: ' . openssl_error_string());
                return $encryptedText;
            }
            
            return $decrypted;
            
        } catch (Exception $e) {
            error_log('Decryption error: ' . $e->getMessage());
            return $encryptedText;
        }
    }
    
    /**
     * Check if a string is encrypted
     */
    public static function isEncrypted($value) {
        return is_string($value) && strpos($value, self::$prefix) === 0;
    }
    
    /**
     * Encrypt array of phones
     */
    public static function encryptPhones($phones) {
        if (!is_array($phones)) return $phones;
        return array_map([self::class, 'encrypt'], $phones);
    }
    
    /**
     * Decrypt array of phones
     */
    public static function decryptPhones($phones) {
        if (!is_array($phones)) return $phones;
        return array_map([self::class, 'decrypt'], $phones);
    }
    
    /**
     * Encrypt array of emails
     */
    public static function encryptEmails($emails) {
        if (!is_array($emails)) return $emails;
        return array_map([self::class, 'encrypt'], $emails);
    }
    
    /**
     * Decrypt array of emails
     */
    public static function decryptEmails($emails) {
        if (!is_array($emails)) return $emails;
        return array_map([self::class, 'decrypt'], $emails);
    }
}
