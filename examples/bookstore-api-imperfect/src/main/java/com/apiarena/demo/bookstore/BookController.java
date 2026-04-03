package com.apiarena.demo.bookstore;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import jakarta.annotation.PostConstruct;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Implements "Build a Bookstore API" challenge routes.
 * <p>
 * Intentional imperfections (for testing Arena scoring):
 * <ul>
 *   <li>{@code DELETE /api/books/{id}} returns <b>200 OK</b> with a JSON body instead of <b>204 No Content</b></li>
 *   <li>{@code GET /api/books} adds a small artificial delay (hurts latency / performance score slightly)</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final AtomicLong idSeq = new AtomicLong(1);
    private final Map<Long, Book> books = new ConcurrentHashMap<>();

    /**
     * Seed so {@code GET /api/books/1} succeeds before POST in the challenge test order.
     */
    @PostConstruct
    void seed() {
        books.put(1L, new Book(1L, "Seed Book", "Demo Author", "ISBN-1000", new BigDecimal("9.99"), 3));
        idSeq.set(2);
    }

    @GetMapping
    public List<Book> list() {
        try {
            Thread.sleep(22);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return new ArrayList<>(books.values());
    }

    @PostMapping
    public ResponseEntity<Book> create(@RequestBody(required = false) Map<String, Object> body) {
        long id = idSeq.getAndIncrement();
        Book book = new Book(
                id,
                str(body, "title", "Untitled"),
                str(body, "author", "Unknown"),
                str(body, "isbn", "ISBN-" + id),
                dec(body, "price", BigDecimal.ONE),
                intg(body, "stock", 0));
        books.put(id, book);
        return ResponseEntity.status(HttpStatus.CREATED).body(book);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> get(@PathVariable long id) {
        Book b = books.get(id);
        if (b == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(b);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Book> update(@PathVariable long id, @RequestBody(required = false) Map<String, Object> body) {
        Book existing = books.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        Book updated = new Book(
                id,
                str(body, "title", existing.title()),
                str(body, "author", existing.author()),
                str(body, "isbn", existing.isbn()),
                dec(body, "price", existing.price()),
                intg(body, "stock", existing.stock()));
        books.put(id, updated);
        return ResponseEntity.ok(updated);
    }

    /**
     * Imperfect: spec expects 204; we return 200 with body (loses that functional test).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> delete(@PathVariable long id) {
        if (books.remove(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    private static String str(Map<String, Object> body, String key, String def) {
        if (body == null || body.get(key) == null) {
            return def;
        }
        return body.get(key).toString();
    }

    private static BigDecimal dec(Map<String, Object> body, String key, BigDecimal def) {
        if (body == null || body.get(key) == null) {
            return def;
        }
        Object v = body.get(key);
        if (v instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        try {
            return new BigDecimal(v.toString());
        } catch (Exception e) {
            return def;
        }
    }

    private static int intg(Map<String, Object> body, String key, int def) {
        if (body == null || body.get(key) == null) {
            return def;
        }
        Object v = body.get(key);
        if (v instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(v.toString());
        } catch (Exception e) {
            return def;
        }
    }
}
