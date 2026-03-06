# Phase 2: Firebase Setup & Authentication

## Status: IN PROGRESS

## Steps

- [x] Step 2.1 — Firebase project setup (manual)
- [x] Step 2.2 — API Gateway: Firebase token validation
- [x] Step 2.3 — Downstream service security configuration
- [x] Step 2.4 — Next.js: Firebase Auth integration with interface abstraction
- [x] Step 2.5 — User registration flow (admin-only)
- [x] Step 2.6 — Verify the auth flow

## Status: COMPLETED

## Decision Changes


# Firebase connection problem
If you run into network timeouts from WSL again, you can check and fix the nameserver. Look at your current DNS:
bashcat /etc/resolv.conf
If it shows something like nameserver 172.x.x.x (WSL's auto-generated internal DNS), that can sometimes be unreliable. You can switch to Google's DNS:
```bash
sudo bash -c 'printf "[network]\ngenerateResolvConf = false\n" > /etc/wsl.conf'
```
Then verify:
```bash
cat /etc/wsl.conf
```
It should show:
```
[network]
generateResolvConf = false
```


# Docker DNS problem - build fail
The problem is that Docker has its own DNS configuration separate from your WSL `/etc/resolv.conf`. You fixed WSL's DNS, but Docker's daemon still uses the broken internal DNS.

Create or edit Docker's daemon config:

```bash
sudo mkdir -p /etc/docker
sudo bash -c 'printf "{\n  \"dns\": [\"8.8.8.8\", \"8.8.4.4\"]\n}\n" > /etc/docker/daemon.json'
```

Then restart Docker:

```bash
sudo service docker restart
```

Verify Docker can reach the internet:

```bash
docker pull alpine
```

If that pulls successfully, run your build:

```bash
docker compose up --build -d
```


## Manual Testing
If you want to see what we've built in Phase 2 working end-to-end before we move on, you can:

Run docker-compose up --build -d
Open your browser to http://localhost:3000/login
Log in with the admin@decp.com credentials you just created.
It should redirect you to the /profile/setup page (because we added that redirect logic for new logins) or the home page.


## npm run build fail due to prerendering
Next.js attempts to statically pre-render your pages (like /admin/users, /login, etc.) during the build phase (npm run build inside the Dockerfile) to make them load faster.

To pre-render these pages, Next.js executes the React code, which in turn executes 

src/lib/firebase.ts
. This file tries to initialize the Firebase app using process.env.NEXT_PUBLIC_FIREBASE_API_KEY.

However, during a Docker build (Stage 1 in your Dockerfile), the container does not have access to the environment variables defined in your 

docker-compose.yml
 env_file block. Those are only injected at runtime (when the container actually starts up).

Since process.env.NEXT_PUBLIC_FIREBASE_API_KEY is undefined during the build, Firebase crashes with auth/invalid-api-key, which causes the Next.js static generation to fail, halting the entire Docker build.

How to fix this?
In your root docker-compose.yml, you can explicitly tell the web service to use the environment file located inside the web folder for its build arguments.

```YAML
web:
    build:
      context: ./web
      args:
        - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
        - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
        - NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
        - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
        - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
        - NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
        - NEXT_PUBLIC_FIREBASE_DATABASE_URL=${NEXT_PUBLIC_FIREBASE_DATABASE_URL}
    container_name: decp-web
    ports:
      - "3000:3000"
    env_file:
      - ./web/.env.local
    depends_on:
      - api-gateway
    restart: on-failure
```

```bash
docker compose --env-file ./web/.env.local up --build
```


## Spring Cloud Gateway: Dependency & Version Conflicts
The Issue: The API Gateway crashed with java.lang.NoClassDefFoundError: io/grpc/netty/NettyChannelBuilder.

The Root Cause: The Firebase Admin SDK includes gRPC libraries that triggered Spring Cloud Gateway's gRPC auto-configuration. However, the Gateway (v3.2.x) specifically looked for grpc-netty (unshaded), while Firebase provided grpc-netty-shaded.

The Resolution:

Upgraded the stack to Spring Boot 3.4.4 and Spring Cloud 2024.0.1 to take advantage of lazier bean initialization.

Swapped the Maven dependency from grpc-netty-shaded to grpc-netty.

Explicitly disabled the Gateway's gRPC feature in application.yml via spring.cloud.gateway.grpc.enabled: false.


## Security Filter
Spring Security vs. Spring Cloud Gateway: Normally, we use Spring Security (that SecurityConfig file) to block requests. However, Spring Cloud Gateway is built on WebFlux and is designed to route requests using Filters.

The Custom Filter is the REAL Bouncer: Instead of using standard Spring Security to block requests, we created FirebaseAuthGatewayFilter
 which implements GlobalFilter. Because it's a GlobalFilter with order -1, Spring Cloud Gateway forces every single request to pass through it before it gets routed anywhere.

Why turn off Spring Security? If we told Spring Security to block requests, it would intercept them before our custom 

FirebaseAuthGatewayFilter even had a chance to run. By telling Spring Security .anyExchange().permitAll(), we are essentially telling it: "Stand down, let the requests in. Our custom 

FirebaseAuthGatewayFilter will inspect the headers, check Firebase, and reject them if they don't have a valid Auth Token."

So, while the downstream Microservices (like User, Post, Notification) should be locked down using standard Spring Security (which checks for headers), the API Gateway relies entirely on our custom GlobalFilter to grab incoming traffic from the internet, inspect the Firebase JWT, and either drop the request (401) or inject the trusted X-User-Id headers and pass it along.