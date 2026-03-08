package com.decp.post.repository;

import com.decp.post.entity.PostComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {

    // Top-level comments only (parent_id IS NULL)
    Page<PostComment> findByPostIdAndParentIsNullOrderByCreatedAtAsc(UUID postId, Pageable pageable);

    long countByPostId(UUID postId);
}
