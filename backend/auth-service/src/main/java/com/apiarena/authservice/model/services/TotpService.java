package com.apiarena.authservice.model.services;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Service;

/**
 * RFC 6238 TOTP for ADMIN 2FA. HMAC-SHA1, 30s step, 6 digits. No external dependency:
 * Base32 (RFC 4648) and the HOTP truncation are done here.
 *
 * ponytail: ±1 step window and no used-code replay store — fine for the single-admin bunker.
 * Add a short-lived "code already used" Redis marker if several admins share the flow.
 */
@Service
public class TotpService {

    private static final String BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int STEP_SECONDS = 30;
    private static final int DIGITS = 6;
    private static final int WINDOW = 1;
    private static final SecureRandom RANDOM = new SecureRandom();

    /** New random Base32 secret (160 bits, the RFC-recommended SHA1 key size). */
    public String generateSecret() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return base32Encode(bytes);
    }

    /** True if {@code code} matches the secret within ±1 time step (clock drift tolerance). */
    public boolean verify(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }
        String normalized = code.trim();
        if (!normalized.matches("\\d{" + DIGITS + "}")) {
            return false;
        }
        long counter = System.currentTimeMillis() / 1000L / STEP_SECONDS;
        byte[] key = base32Decode(secret);
        for (int offset = -WINDOW; offset <= WINDOW; offset++) {
            if (generateCode(key, counter + offset).equals(normalized)) {
                return true;
            }
        }
        return false;
    }

    /** otpauth:// URI so the admin can add the account (manual key or QR) in an authenticator app. */
    public String otpauthUri(String secret, String accountEmail) {
        String issuer = "API Arena";
        String label = enc(issuer + ":" + accountEmail);
        return "otpauth://totp/" + label
                + "?secret=" + secret
                + "&issuer=" + enc(issuer)
                + "&algorithm=SHA1&digits=" + DIGITS + "&period=" + STEP_SECONDS;
    }

    static String generateCode(byte[] key, long counter) {
        byte[] data = new byte[8];
        for (int i = 7; i >= 0; i--) {
            data[i] = (byte) (counter & 0xff);
            counter >>= 8;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            int otp = binary % (int) Math.pow(10, DIGITS);
            return String.format("%0" + DIGITS + "d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("TOTP generation failed", e);
        }
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8).replace("+", "%20");
    }

    static String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bits += 8;
            while (bits >= 5) {
                bits -= 5;
                sb.append(BASE32.charAt((buffer >> bits) & 0x1f));
            }
        }
        if (bits > 0) {
            sb.append(BASE32.charAt((buffer << (5 - bits)) & 0x1f));
        }
        return sb.toString();
    }

    static byte[] base32Decode(String s) {
        String clean = s.trim().replace("=", "").toUpperCase();
        int buffer = 0, bits = 0;
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        for (char c : clean.toCharArray()) {
            int val = BASE32.indexOf(c);
            if (val < 0) {
                continue;
            }
            buffer = (buffer << 5) | val;
            bits += 5;
            if (bits >= 8) {
                bits -= 8;
                out.write((buffer >> bits) & 0xff);
            }
        }
        return out.toByteArray();
    }

    /** Self-check with the RFC 6238 SHA1 test vector (seed "12345678901234567890", T=59 → 287082). */
    public static void main(String[] args) {
        byte[] key = base32Decode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
        String code = generateCode(key, 59L / STEP_SECONDS);
        assert "287082".equals(code) : "TOTP vector mismatch: " + code;
        assert java.util.Arrays.equals(key, base32Decode(base32Encode(key))) : "Base32 round-trip failed";
        System.out.println("TotpService self-check OK (" + code + ")");
    }
}
