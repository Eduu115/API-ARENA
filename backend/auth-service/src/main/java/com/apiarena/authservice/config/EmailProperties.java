package com.apiarena.authservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {

    /**
     * Public URL of the SPA (used in verification links), e.g. http://localhost:3000
     */
    private String frontendBaseUrl = "http://localhost:3000";

    /**
     * Resend "from" address (must be allowed in Resend for your domain).
     */
    private String from = "API Arena <onboarding@resend.dev>";

    /**
     * Resend API key (Bearer). If blank, verification links are only logged (local dev).
     */
    private String resendApiKey = "";
}
