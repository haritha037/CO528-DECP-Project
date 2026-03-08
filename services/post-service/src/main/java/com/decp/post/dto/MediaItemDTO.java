package com.decp.post.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MediaItemDTO {

    @NotBlank
    private String url;

    @NotBlank
    private String mediaType; // IMAGE or VIDEO

    private String fileName;
}
