package com.decp.post.service;

import com.decp.post.dto.AddCommentRequest;
import com.decp.post.dto.CommentDTO;
import com.decp.post.dto.CreatePostRequest;
import com.decp.post.dto.PostDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostService {

    PostDTO createPost(String userId, CreatePostRequest request);

    Page<PostDTO> getFeed(String currentUserId, Pageable pageable);

    Page<PostDTO> getPostsByUser(String targetUserId, String currentUserId, Pageable pageable);

    PostDTO getPost(String postId, String currentUserId);

    PostDTO updatePost(String postId, String userId, CreatePostRequest request);

    void deletePost(String postId, String userId, String userRole);

    boolean toggleReaction(String postId, String userId, String userName);

    Page<CommentDTO> getComments(String postId, Pageable pageable);

    CommentDTO addComment(String postId, String userId, String userName, AddCommentRequest request);

    CommentDTO addReply(String postId, String commentId, String userId, String userName, AddCommentRequest request);

    void deleteComment(String postId, String commentId, String userId, String userRole);
}
