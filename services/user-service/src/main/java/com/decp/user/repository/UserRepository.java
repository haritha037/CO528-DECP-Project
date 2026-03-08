package com.decp.user.repository;

import com.decp.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByFirebaseUid(String firebaseUid);

    boolean existsByEmail(String email);

    long countByRole(String role);

    long countByProfileCompleteTrue();

    @Query("SELECT u FROM User u WHERE " +
           "(cast(:q as string) IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', cast(:q as string), '%')) " +
           "   OR LOWER(u.email) LIKE LOWER(CONCAT('%', cast(:q as string), '%'))) " +
           "AND (cast(:role as string) IS NULL OR u.role = cast(:role as string)) " +
           "AND (cast(:department as string) IS NULL OR LOWER(u.department) = LOWER(cast(:department as string)))")
    Page<User> searchUsers(
            @Param("q") String q,
            @Param("role") String role,
            @Param("department") String department,
            Pageable pageable
    );
}
