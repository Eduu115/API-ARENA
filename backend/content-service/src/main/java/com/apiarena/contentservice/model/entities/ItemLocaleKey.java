package com.apiarena.contentservice.model.entities;

import java.io.Serializable;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemLocaleKey implements Serializable {
    private Long itemId;
    private String locale;
}
