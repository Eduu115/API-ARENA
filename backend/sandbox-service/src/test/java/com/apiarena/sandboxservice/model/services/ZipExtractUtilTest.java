package com.apiarena.sandboxservice.model.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ZipExtractUtilTest {

    private static byte[] zipOf(java.util.function.Consumer<ZipOutputStream> body) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(bos)) {
            body.accept(zos);
        }
        return bos.toByteArray();
    }

    @Test
    void extractsRegularFile(@TempDir Path dir) throws IOException {
        byte[] zip = zipOf(zos -> {
            try {
                zos.putNextEntry(new ZipEntry("hello.txt"));
                zos.write("hi".getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        ZipExtractUtil.unzip(new ByteArrayInputStream(zip), dir);
        assertEquals("hi", Files.readString(dir.resolve("hello.txt")));
    }

    @Test
    void rejectsZipSlip(@TempDir Path dir) throws IOException {
        byte[] zip = zipOf(zos -> {
            try {
                zos.putNextEntry(new ZipEntry("../escape.txt"));
                zos.write("x".getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        IOException ex = assertThrows(IOException.class,
                () -> ZipExtractUtil.unzip(new ByteArrayInputStream(zip), dir));
        assertTrue(ex.getMessage().toLowerCase().contains("invalid zip entry"));
    }

    @Test
    void rejectsTooManyEntries(@TempDir Path dir) throws IOException {
        byte[] zip = zipOf(zos -> {
            try {
                for (int i = 0; i <= 10_001; i++) {
                    zos.putNextEntry(new ZipEntry("f" + i + ".txt"));
                    zos.closeEntry();
                }
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        IOException ex = assertThrows(IOException.class,
                () -> ZipExtractUtil.unzip(new ByteArrayInputStream(zip), dir));
        assertTrue(ex.getMessage().toLowerCase().contains("too many entries"));
    }
}
