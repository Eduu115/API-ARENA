package com.apiarena.authservice.model.entities;

/**
 * Capability domains within the /admin bunker. Orthogonal to {@link User.Role}:
 * role says who you are (STUDENT/TEACHER/ADMIN); a capability says what an ADMIN
 * may touch. Owner holds all; ops admins hold MODERATION, BI admins hold BI.
 * Add a value here to introduce a new domain — no DB migration needed.
 */
public enum AdminCapability {
    MODERATION,
    BI
}
