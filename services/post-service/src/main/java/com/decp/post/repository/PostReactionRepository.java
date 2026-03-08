package com.decp.post.repository;

import com.decp.post.entity.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PostReactionRepository extends JpaRepository<PostReaction, UUID> {

    Optional<PostReaction> findByPostIdAndUserId(UUID postId, String userId);

    long countByPostId(UUID postId);

    boolean existsByPostIdAndUserId(UUID postId, String userId);
}
