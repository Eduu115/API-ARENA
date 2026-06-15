package com.apiarena.authservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class TurnstileVerificationException extends ResponseStatusException {

    public TurnstileVerificationException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
