package com.apiarena.authservice.model.entities;

/**
 * Capability domains within the /admin bunker. Orthogonal to {@link User.Role}:
 * role says who you are (STUDENT/TEACHER/ADMIN); a capability says what an ADMIN
 * may touch. Owner holds all; ops admins hold MODERATION, BI admins hold BI,
 * content admins hold CONTENT.
 * <p>
 * Supreme means every value here. Adding a value demotes current supremes until
 * {@code docker/postgres/alter-admin-capability-content.sql} (or the equivalent
 * backfill) grants it to admins who already hold the previous full set.
 */
public enum AdminCapability {
    MODERATION,
    BI,
    CONTENT
}
