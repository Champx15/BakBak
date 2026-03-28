package com.champ.ChatApp.service;

import com.champ.ChatApp.dto.PerspectiveResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PerspectiveService {
    private Environment env;

    public PerspectiveService(Environment env){
        this.env = env;
    }



    public PerspectiveResponse apiCall(String text) {
    String API_KEY = env.getProperty("API_KEY");
        RestTemplate restTemplate = new RestTemplate();
    String url = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" + API_KEY;
        Map<String, Object> comment = new HashMap<>();
        comment.put("text", text);
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("comment", comment);
        requestBody.put("languages", List.of("hi-Latn"));
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("TOXICITY", Map.of());
//        attributes.put("INSULT", Map.of());
//        attributes.put("PROFANITY", Map.of());
//        attributes.put("THREAT", Map.of());
//        attributes.put("IDENTITY_ATTACK", Map.of());
//        attributes.put("SEXUALLY_EXPLICIT", Map.of());
        requestBody.put("requestedAttributes", attributes);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<PerspectiveResponse> response = restTemplate.postForEntity(
                url,
                entity,
                PerspectiveResponse.class
        );

        return response.getBody();
    }

    public Boolean isToxic(PerspectiveResponse response){
        double threshold = 0.7;

        return  response.getAttributeScores()
                .values()
                .stream()
                .anyMatch(attr ->
                        attr.getSummaryScore().getValue() > threshold
                );
    }

}
