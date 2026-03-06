package com.decp.gateway.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.function.Predicate;

@Slf4j
@Component
@RequiredArgsConstructor
public class FirebaseAuthGatewayFilter implements GlobalFilter, Ordered {

    private final TokenVerificationService tokenVerificationService;

    // Endpoints that don't need authentication
    private final List<String> openApiEndpoints = List.of(
            "/actuator/health"
            // Note: /api/users/register requires ADMIN role, checked at User Service level via @PreAuthorize
    );

    private final Predicate<ServerHttpRequest> isSecured =
            request -> openApiEndpoints
                    .stream()
                    .noneMatch(uri -> request.getURI().getPath().contains(uri));

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        if (isSecured.test(request)) {
            if (this.isAuthMissing(request)) {
                return this.onError(exchange, "Authorization header is missing in request", HttpStatus.UNAUTHORIZED);
            }

            final String token = this.getAuthHeader(request);

            TokenVerificationService.DecodedToken decodedToken = tokenVerificationService.verifyToken(token);

            if (decodedToken == null) {
                return this.onError(exchange, "Authorization header is invalid", HttpStatus.UNAUTHORIZED);
            }

            // CRITICAL FIX: Apply the mutated exchange with headers
            exchange = this.populateRequestWithHeaders(exchange, decodedToken);
        }

        // For admin endpoints, we can optionally add a quick check here:
        // if (request.getURI().getPath().contains("/admin/") && !"ADMIN".equals(decodedToken.getRole())) {
        //     return this.onError(exchange, "Admin access required", HttpStatus.FORBIDDEN);
        // }

        return chain.filter(exchange);
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        log.warn("Auth Error: {}", err);
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }

    private String getAuthHeader(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getOrEmpty("Authorization").get(0);
        return authHeader.replace("Bearer ", "");
    }

    private boolean isAuthMissing(ServerHttpRequest request) {
        return !request.getHeaders().containsKey("Authorization");
    }

    private ServerWebExchange populateRequestWithHeaders(ServerWebExchange exchange, TokenVerificationService.DecodedToken decodedToken) {
        return exchange.mutate()
                .request(r -> r
                        .header("X-User-Id", decodedToken.getUid())
                        .header("X-User-Email", decodedToken.getEmail())
                        .header("X-User-Role", decodedToken.getRole())
                )
                .build();
    }

    @Override
    public int getOrder() {
        return -1; // Run before other filters
    }
}
