package com.apiarena.contentservice.model.services;

import org.springframework.http.HttpStatus;

public class ContentException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public ContentException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
