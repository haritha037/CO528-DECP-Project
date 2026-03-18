package com.decp.post.service;

import com.decp.post.client.UserServiceClient;
import com.decp.post.repository.PostCommentRepository;
import com.decp.post.repository.PostReactionRepository;
import com.decp.post.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceImplTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private PostReactionRepository reactionRepository;

    @Mock
    private PostCommentRepository commentRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @InjectMocks
    private PostServiceImpl postService;

    @Test
    void getStats_returnsCorrectCounts() {
        when(postRepository.count()).thenReturn(10L);
        when(reactionRepository.count()).thenReturn(50L);
        when(commentRepository.count()).thenReturn(20L);

        Map<String, Object> stats = postService.getStats();

        assertEquals(10L, stats.get("totalPosts"));
        assertEquals(50L, stats.get("totalReactions"));
        assertEquals(20L, stats.get("totalComments"));
    }
}
