package com.apiarena.authservice.util;

import java.time.LocalDate;
import java.time.Period;

import org.springframework.http.HttpStatus;

import com.apiarena.authservice.exception.ApiException;
import com.apiarena.authservice.model.entities.User;

public final class ComplianceRules {

    public static final int MIN_AGE_YEARS = 14;
    public static final String CURRENT_CONSENT_VERSION = "1.0";

    private ComplianceRules() {
    }

    public static boolean requiresProfileCompliance(User user) {
        return user.getDateOfBirth() == null || user.getPrivacyConsentAt() == null;
    }

    public static void validateDateOfBirth(LocalDate dob) {
        if (dob == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_DOB_REQUIRED", "Date of birth is required");
        }
        LocalDate today = LocalDate.now();
        if (dob.isAfter(today)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_DOB_PAST", "Date of birth must be in the past");
        }
        if (Period.between(dob, today).getYears() < MIN_AGE_YEARS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_AGE_MIN",
                    "You must be at least " + MIN_AGE_YEARS + " years old to register");
        }
    }

    public static void requireTermsAccepted(boolean acceptTerms) {
        if (!acceptTerms) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "AUTH_TERMS_REQUIRED",
                    "You must accept the Privacy Policy and Terms to register");
        }
    }
}
