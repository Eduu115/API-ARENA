package com.apiarena.demo.bookstore;

import java.math.BigDecimal;

public record Book(
        Long id,
        String title,
        String author,
        String isbn,
        BigDecimal price,
        Integer stock
) {
}
