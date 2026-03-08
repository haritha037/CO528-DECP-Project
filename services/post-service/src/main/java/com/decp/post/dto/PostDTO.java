package com.decp.post.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostDTO {
    private String id;
    private AuthorDTO author;
    private String textContent;
    private List<PostMediaDTO> mediaItems;
    private long reactionCount;
    private boolean reactedByCurrentUser;
    private long commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
