package com.apiarena.demo;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

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

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final AtomicLong idSeq = new AtomicLong(1);
    private final Map<Long, Item> items = new ConcurrentHashMap<>();

    @GetMapping
    public List<Item> list() {
        return new ArrayList<>(items.values());
    }

    @PostMapping
    public ResponseEntity<Item> create(@RequestBody(required = false) Map<String, String> body) {
        long id = idSeq.getAndIncrement();
        String name = body != null && body.get("name") != null ? body.get("name") : "item";
        Item item = new Item(id, name);
        items.put(id, item);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> get(@PathVariable long id) {
        Item item = items.get(id);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(item);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Item> update(@PathVariable long id, @RequestBody(required = false) Map<String, String> body) {
        Item existing = items.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        String name = body != null && body.get("name") != null ? body.get("name") : existing.name();
        Item updated = new Item(id, name);
        items.put(id, updated);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        if (items.remove(id) == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
