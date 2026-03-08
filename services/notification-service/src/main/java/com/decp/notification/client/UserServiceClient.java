package com.decp.notification.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserServiceClient {

    /**
     * Returns a page of users. We use size=500 to get all users in one call
     * (department scale < 500 users assumption).
     * Response body: { content: [{firebaseUid, ...}], ... }
     */
    @GetMapping("/api/users/all")
    Map<String, Object> getAllUsers(@RequestParam int page, @RequestParam int size);
}
