package com.example.e2evalidapi;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/items")
public class ItemsController {

    @GetMapping
    public List<Map<String, Object>> list() {
        return List.of(
                Map.of("id", 1, "name", "item-1"),
                Map.of("id", 2, "name", "item-2"));
    }
}
