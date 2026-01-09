/**
 * SOFIS Security Utility - AES-GCM Encryption
 * Provides client-side encryption for sensitive data before syncing to Supabase.
 */

if (!window.Security) {
    const Security = (() => {
        // This is the default key. IN PRODUCTION, THIS SHOULD BE REPLACED BY A 
        // SECURE KEY stored in Environment Variables or a secure config.
        const DEFAULT_KEY = 'sofis_secret_system_key_2025';

        // Prefix to identify encrypted strings
        const CRYPTO_PREFIX = 'ENC:';

        /**
         * Derives a CryptoKey from a password string
         */
        async function deriveKey(password) {
            const encoder = new TextEncoder();
            const pwHash = await crypto.subtle.digest('SHA-256', encoder.encode(password));
            return await crypto.subtle.importKey(
                'raw',
                pwHash,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        }

        /**
         * Encrypts plain text using AES-GCM
         */
        async function encrypt(text, masterKey = DEFAULT_KEY) {
            if (!text || typeof text !== 'string') return text;
            if (text.startsWith(CRYPTO_PREFIX)) return text; // Already encrypted

            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(text);
                const key = await deriveKey(masterKey);
                const iv = crypto.getRandomValues(new Uint8Array(12));

                const encrypted = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv: iv },
                    key,
                    data
                );

                // Combine IV and Encrypted Data for storage
                const combined = new Uint8Array(iv.length + encrypted.byteLength);
                combined.set(iv);
                combined.set(new Uint8Array(encrypted), iv.length);

                // Convert to Base64 for storage
                const base64 = btoa(String.fromCharCode(...combined));
                return CRYPTO_PREFIX + base64;
            } catch (error) {
                console.error('Encryption Error:', error);
                return text; // Return plain text as fallback (not ideal, but prevents data loss)
            }
        }

        /**
         * Decrypts AES-GCM encrypted text
         */
        async function decrypt(encryptedText, masterKey = DEFAULT_KEY) {
            if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.startsWith(CRYPTO_PREFIX)) {
                return encryptedText;
            }

            try {
                const base64 = encryptedText.substring(CRYPTO_PREFIX.length);
                const combined = new Uint8Array(atob(base64).split('').map(char => char.charCodeAt(0)));

                const iv = combined.slice(0, 12);
                const data = combined.slice(12);

                const key = await deriveKey(masterKey);
                const decrypted = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    key,
                    data
                );

                return new TextDecoder().decode(decrypted);
            } catch (error) {
                console.error('Decryption Error:', error);
                // Return encrypted string if decryption fails (likely wrong key)
                return encryptedText;
            }
        }

        return {
            encrypt,
            decrypt,
            isEncrypted: (val) => typeof val === 'string' && val.startsWith(CRYPTO_PREFIX)
        };
    })();

    // Export to window
    window.Security = Security;
}
