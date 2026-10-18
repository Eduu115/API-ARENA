package com.apiarena.contentservice.restcontroller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.apiarena.contentservice.model.services.ContentException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ContentException.class)
    public ResponseEntity<Map<String, String>> handleContent(ContentException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of(
                "code", e.getCode(),
                "message", e.getMessage()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleInvalid(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .orElse("Invalid content");
        return ResponseEntity.badRequest().body(Map.of("code", "CONTENT_INVALID", "message", message));
    }
}
