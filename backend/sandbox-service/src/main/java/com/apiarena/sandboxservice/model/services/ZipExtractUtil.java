package com.apiarena.sandboxservice.model.services;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class ZipExtractUtil {

    /** Zip-bomb guards: cap total uncompressed bytes and entry count regardless of the (small) compressed size. */
    private static final long MAX_TOTAL_BYTES = 512L * 1024 * 1024; // 512 MB uncompressed
    private static final int MAX_ENTRIES = 10_000;

    private ZipExtractUtil() {}

    public static void unzip(InputStream zipStream, Path destDir) throws IOException {
        Files.createDirectories(destDir);
        long totalBytes = 0;
        int entries = 0;
        try (ZipInputStream zis = new ZipInputStream(zipStream)) {
            ZipEntry entry;
            byte[] buf = new byte[8192];
            while ((entry = zis.getNextEntry()) != null) {
                if (++entries > MAX_ENTRIES) {
                    throw new IOException("Zip has too many entries (limit " + MAX_ENTRIES + ")");
                }
                Path out = destDir.resolve(entry.getName()).normalize();
                if (!out.startsWith(destDir)) {
                    throw new IOException("Invalid zip entry path: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(out);
                } else {
                    Files.createDirectories(out.getParent());
                    try (OutputStream os = Files.newOutputStream(out)) {
                        int n;
                        while ((n = zis.read(buf)) != -1) {
                            totalBytes += n;
                            if (totalBytes > MAX_TOTAL_BYTES) {
                                throw new IOException("Zip uncompressed size exceeds limit (" + MAX_TOTAL_BYTES + " bytes)");
                            }
                            os.write(buf, 0, n);
                        }
                    }
                }
                zis.closeEntry();
            }
        }
    }

    public static void unzipFile(Path zipFile, Path destDir) throws IOException {
        try (InputStream in = Files.newInputStream(zipFile)) {
            unzip(in, destDir);
        }
    }
}
