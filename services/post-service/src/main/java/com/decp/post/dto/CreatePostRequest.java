package com.decp.post.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class CreatePostRequest {

    @Size(max = 5000, message = "Post text cannot exceed 5000 characters")
    private String textContent;

    private List<MediaItemDTO> mediaUrls = new ArrayList<>();
}
