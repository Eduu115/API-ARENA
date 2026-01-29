package com.apiarena.challengeservice.exception;

public class BadRequestException extends RuntimeException { // Todo el paquete de excepciones se maneja en el mismo paquete de la aplicación
    public BadRequestException(String message) {
        super(message);
    }
}
