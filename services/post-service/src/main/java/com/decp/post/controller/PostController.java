package com.decp.post.controller;

import com.decp.post.dto.AddCommentRequest;
import com.decp.post.dto.CommentDTO;
import com.decp.post.dto.CreatePostRequest;
import com.decp.post.dto.PostDTO;
import com.decp.post.security.UserPrincipal;
import com.decp.post.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // ── Posts ────────────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<PostDTO> createPost(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePostRequest request) {
        PostDTO post = postService.createPost(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @GetMapping
    public ResponseEntity<Page<PostDTO>> getFeed(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(postService.getFeed(principal.getId(), pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<PostDTO>> getPostsByUser(
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getPostsByUser(userId, principal.getId(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDTO> getPost(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(postService.getPost(id, principal.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostDTO> updatePost(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreatePostRequest request) {
        return ResponseEntity.ok(postService.updatePost(id, principal.getId(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        postService.deletePost(id, principal.getId(), principal.getRole());
        return ResponseEntity.noContent().build();
    }

    // ── Reactions ────────────────────────────────────────────────────────────

    @PostMapping("/{id}/react")
    public ResponseEntity<Map<String, Object>> toggleReaction(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader("X-User-Email") String userEmail) {
        boolean reacted = postService.toggleReaction(id, principal.getId(), userEmail);
        return ResponseEntity.ok(Map.of("reacted", reacted));
    }

    // ── Comments ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}/comments")
    public ResponseEntity<Page<CommentDTO>> getComments(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(postService.getComments(id, pageable));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDTO> addComment(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader("X-User-Email") String userEmail,
            @Valid @RequestBody AddCommentRequest request) {
        CommentDTO comment = postService.addComment(id, principal.getId(), userEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PostMapping("/{id}/comments/{commentId}/replies")
    public ResponseEntity<CommentDTO> addReply(
            @PathVariable String id,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader("X-User-Email") String userEmail,
            @Valid @RequestBody AddCommentRequest request) {
        CommentDTO reply = postService.addReply(id, commentId, principal.getId(), userEmail, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(reply);
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        postService.deleteComment(id, commentId, principal.getId(), principal.getRole());
        return ResponseEntity.noContent().build();
    }

    // ── Stats placeholder (Phase 9) ──────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Object> getStats() {
        return ResponseEntity.ok(Map.of("message", "Stats endpoint — implemented in Phase 9"));
    }
}
