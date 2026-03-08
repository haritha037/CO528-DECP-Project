package com.decp.post.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "${services.user-service.url}")
public interface UserServiceClient {

    @GetMapping("/api/users/{firebaseUid}")
    UserDTO getUserByFirebaseUid(@PathVariable("firebaseUid") String firebaseUid);
}
