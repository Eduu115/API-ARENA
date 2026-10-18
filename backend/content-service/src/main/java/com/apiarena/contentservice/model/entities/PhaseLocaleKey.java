package com.apiarena.contentservice.model.entities;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PhaseLocaleKey implements Serializable {
    private Long phaseId;
    private String locale;
}
