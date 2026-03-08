package com.decp.post.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PostMediaDTO {
    private String id;
    private String mediaUrl;
    private String mediaType;
    private String fileName;
}
