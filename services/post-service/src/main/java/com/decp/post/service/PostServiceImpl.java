package com.decp.post.service;

import com.decp.post.client.UserDTO;
import com.decp.post.client.UserServiceClient;
import com.decp.post.config.RabbitMQConfig;
import com.decp.post.dto.*;
import com.decp.post.entity.Post;
import com.decp.post.entity.PostComment;
import com.decp.post.entity.PostMedia;
import com.decp.post.entity.PostReaction;
import com.decp.post.messaging.NotificationEvent;
import com.decp.post.repository.PostCommentRepository;
import com.decp.post.repository.PostReactionRepository;
import com.decp.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final PostReactionRepository reactionRepository;
    private final PostCommentRepository commentRepository;
    private final UserServiceClient userServiceClient;
    private final RabbitTemplate rabbitTemplate;

    // ── Posts ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public PostDTO createPost(String userId, CreatePostRequest request) {
        if ((request.getTextContent() == null || request.getTextContent().isBlank())
                && request.getMediaUrls().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Post must have text content or at least one media item");
        }

        Post post = new Post();
        post.setUserId(userId);
        post.setTextContent(request.getTextContent());

        for (MediaItemDTO m : request.getMediaUrls()) {
            PostMedia media = new PostMedia();
            media.setPost(post);
            media.setMediaUrl(m.getUrl());
            media.setMediaType(m.getMediaType());
            media.setFileName(m.getFileName());
            post.getMediaItems().add(media);
        }

        Post saved = postRepository.save(post);
        return mapToDTO(saved, userId);
    }

    @Override
    public Page<PostDTO> getFeed(String currentUserId, Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(post -> mapToDTO(post, currentUserId));
    }

    @Override
    public Page<PostDTO> getPostsByUser(String targetUserId, String currentUserId, Pageable pageable) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(targetUserId, pageable)
                .map(post -> mapToDTO(post, currentUserId));
    }

    @Override
    public PostDTO getPost(String postId, String currentUserId) {
        Post post = findPost(postId);
        return mapToDTO(post, currentUserId);
    }

    @Override
    @Transactional
    public PostDTO updatePost(String postId, String userId, CreatePostRequest request) {
        Post post = findPost(postId);
        if (!post.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only edit your own posts");
        }
        post.setTextContent(request.getTextContent());
        return mapToDTO(postRepository.save(post), userId);
    }

    @Override
    @Transactional
    public void deletePost(String postId, String userId, String userRole) {
        Post post = findPost(postId);
        boolean isOwner = post.getUserId().equals(userId);
        boolean isAdmin = "ADMIN".equals(userRole);
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this post");
        }
        postRepository.delete(post);
    }

    // ── Reactions ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public boolean toggleReaction(String postId, String userId, String userName) {
        Post post = findPost(postId);
        UUID pid = post.getId();

        Optional<PostReaction> existing = reactionRepository.findByPostIdAndUserId(pid, userId);
        if (existing.isPresent()) {
            reactionRepository.delete(existing.get());
            return false; // un-reacted
        }

        PostReaction reaction = new PostReaction();
        reaction.setPost(post);
        reaction.setUserId(userId);
        reactionRepository.save(reaction);

        // Notify post owner (skip if reactor == owner)
        if (!post.getUserId().equals(userId)) {
            publishEvent(NotificationEvent.builder()
                    .type("POST_REACTED")
                    .recipientId(post.getUserId())
                    .triggeredById(userId)
                    .triggeredByName(userName)
                    .postId(postId)
                    .timestamp(LocalDateTime.now())
                    .build(), RabbitMQConfig.ROUTING_KEY_POST_REACTED);
        }

        return true; // reacted
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @Override
    public Page<CommentDTO> getComments(String postId, Pageable pageable) {
        findPost(postId); // validate post exists
        UUID pid = UUID.fromString(postId);
        return commentRepository.findByPostIdAndParentIsNullOrderByCreatedAtAsc(pid, pageable)
                .map(this::mapCommentToDTO);
    }

    @Override
    @Transactional
    public CommentDTO addComment(String postId, String userId, String userName, AddCommentRequest request) {
        Post post = findPost(postId);

        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUserId(userId);
        comment.setContent(request.getContent());

        PostComment saved = commentRepository.save(comment);

        // Notify post owner (skip if commenter == owner)
        if (!post.getUserId().equals(userId)) {
            publishEvent(NotificationEvent.builder()
                    .type("POST_COMMENTED")
                    .recipientId(post.getUserId())
                    .triggeredById(userId)
                    .triggeredByName(userName)
                    .postId(postId)
                    .commentId(saved.getId().toString())
                    .timestamp(LocalDateTime.now())
                    .build(), RabbitMQConfig.ROUTING_KEY_POST_COMMENTED);
        }

        return mapCommentToDTO(saved);
    }

    @Override
    @Transactional
    public CommentDTO addReply(String postId, String commentId, String userId, String userName,
                               AddCommentRequest request) {
        Post post = findPost(postId);
        PostComment parent = findComment(commentId);

        // Enforce one level of nesting only
        if (parent.getParent() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Replies to replies are not allowed (one level of nesting only)");
        }

        PostComment reply = new PostComment();
        reply.setPost(post);
        reply.setParent(parent);
        reply.setUserId(userId);
        reply.setContent(request.getContent());

        PostComment saved = commentRepository.save(reply);

        // Notify comment author (skip if replier == comment author)
        if (!parent.getUserId().equals(userId)) {
            publishEvent(NotificationEvent.builder()
                    .type("COMMENT_REPLIED")
                    .recipientId(parent.getUserId())
                    .triggeredById(userId)
                    .triggeredByName(userName)
                    .postId(postId)
                    .commentId(saved.getId().toString())
                    .timestamp(LocalDateTime.now())
                    .build(), RabbitMQConfig.ROUTING_KEY_COMMENT_REPLIED);
        }

        // Also notify post owner if different from both replier and comment author
        String postOwner = post.getUserId();
        if (!postOwner.equals(userId) && !postOwner.equals(parent.getUserId())) {
            publishEvent(NotificationEvent.builder()
                    .type("POST_COMMENTED")
                    .recipientId(postOwner)
                    .triggeredById(userId)
                    .triggeredByName(userName)
                    .postId(postId)
                    .commentId(saved.getId().toString())
                    .timestamp(LocalDateTime.now())
                    .build(), RabbitMQConfig.ROUTING_KEY_POST_COMMENTED);
        }

        return mapCommentToDTO(saved);
    }

    @Override
    @Transactional
    public void deleteComment(String postId, String commentId, String userId, String userRole) {
        PostComment comment = findComment(commentId);
        boolean isOwner = comment.getUserId().equals(userId);
        boolean isAdmin = "ADMIN".equals(userRole);
        if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this comment");
        }
        commentRepository.delete(comment);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Post findPost(String postId) {
        try {
            return postRepository.findById(UUID.fromString(postId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found: " + postId));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid post ID: " + postId);
        }
    }

    private PostComment findComment(String commentId) {
        try {
            return commentRepository.findById(UUID.fromString(commentId))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found: " + commentId));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid comment ID: " + commentId);
        }
    }

    private AuthorDTO resolveAuthor(String firebaseUid) {
        try {
            UserDTO user = userServiceClient.getUserByFirebaseUid(firebaseUid);
            return AuthorDTO.builder()
                    .firebaseUid(user.getFirebaseUid())
                    .name(user.getName())
                    .profilePictureUrl(user.getProfilePictureUrl())
                    .role(user.getRole())
                    .roleBadge(user.getRoleBadge())
                    .initials(user.getInitials())
                    .build();
        } catch (Exception e) {
            log.warn("Could not resolve author for uid={}: {}", firebaseUid, e.getMessage());
            return AuthorDTO.builder()
                    .firebaseUid(firebaseUid)
                    .name("Unknown User")
                    .initials("?")
                    .role("STUDENT")
                    .roleBadge("blue")
                    .build();
        }
    }

    private PostDTO mapToDTO(Post post, String currentUserId) {
        UUID pid = post.getId();
        long reactionCount = reactionRepository.countByPostId(pid);
        boolean reacted = reactionRepository.existsByPostIdAndUserId(pid, currentUserId);
        long commentCount = commentRepository.countByPostId(pid);

        List<PostMediaDTO> media = post.getMediaItems().stream()
                .map(m -> PostMediaDTO.builder()
                        .id(m.getId().toString())
                        .mediaUrl(m.getMediaUrl())
                        .mediaType(m.getMediaType())
                        .fileName(m.getFileName())
                        .build())
                .collect(Collectors.toList());

        return PostDTO.builder()
                .id(pid.toString())
                .author(resolveAuthor(post.getUserId()))
                .textContent(post.getTextContent())
                .mediaItems(media)
                .reactionCount(reactionCount)
                .reactedByCurrentUser(reacted)
                .commentCount(commentCount)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    private CommentDTO mapCommentToDTO(PostComment comment) {
        List<CommentDTO> replies = comment.getReplies().stream()
                .map(r -> CommentDTO.builder()
                        .id(r.getId().toString())
                        .postId(r.getPost().getId().toString())
                        .parentId(comment.getId().toString())
                        .author(resolveAuthor(r.getUserId()))
                        .content(r.getContent())
                        .replies(List.of())
                        .createdAt(r.getCreatedAt())
                        .updatedAt(r.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return CommentDTO.builder()
                .id(comment.getId().toString())
                .postId(comment.getPost().getId().toString())
                .parentId(comment.getParent() != null ? comment.getParent().getId().toString() : null)
                .author(resolveAuthor(comment.getUserId()))
                .content(comment.getContent())
                .replies(replies)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    @Override
    public List<AuthorDTO> getReactors(String postId) {
        UUID pid;
        try { pid = UUID.fromString(postId); }
        catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid post ID"); }
        return reactionRepository.findByPostIdOrderByCreatedAtDesc(pid).stream()
                .map(r -> resolveAuthor(r.getUserId()))
                .collect(Collectors.toList());
    }

    @Override
    public java.util.Map<String, Object> getStats() {
        return java.util.Map.of(
            "totalPosts",    postRepository.count(),
            "totalReactions", reactionRepository.count(),
            "totalComments", commentRepository.count()
        );
    }

    private void publishEvent(NotificationEvent event, String routingKey) {
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.NOTIFICATION_EXCHANGE, routingKey, event);
            log.debug("Published {} event for recipient={}", event.getType(), event.getRecipientId());
        } catch (Exception e) {
            log.error("Failed to publish {} event: {}", event.getType(), e.getMessage());
            // Non-fatal — notification failure should not break the main operation
        }
    }
}
