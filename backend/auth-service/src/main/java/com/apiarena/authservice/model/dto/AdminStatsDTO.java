package com.apiarena.authservice.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminStatsDTO {
    private long total;
    private long students;
    private long teachers;
    private long admins;
    private long banned;
    private long onlineNow;
}
