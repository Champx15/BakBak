package com.champ.BakBak.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@NoArgsConstructor
@Getter
@Setter
public class PerspectiveResponse {
    private Map<String, AttributeScore> attributeScores;
}
