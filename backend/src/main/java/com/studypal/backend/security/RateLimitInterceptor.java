package com.studypal.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static class Entry { long timestamp; int count; }

    private final Map<String, Entry> map = new ConcurrentHashMap<>();
    private final long windowMs = 60_000; // 1 minute
    private final int maxRequests = 120; // per window per IP

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String ip = request.getRemoteAddr();
        long now = Instant.now().toEpochMilli();
        Entry e = map.computeIfAbsent(ip, k -> { Entry n = new Entry(); n.timestamp = now; n.count = 0; return n; });
        synchronized (e) {
            if (now - e.timestamp > windowMs) { e.timestamp = now; e.count = 1; }
            else { e.count++; }
            if (e.count > maxRequests) {
                response.setStatus(429);
                response.getWriter().write("Rate limit exceeded");
                return false;
            }
        }
        return true;
    }
}
