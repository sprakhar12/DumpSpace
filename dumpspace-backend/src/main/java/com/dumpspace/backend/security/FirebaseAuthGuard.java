package com.dumpspace.backend.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class FirebaseAuthGuard extends OncePerRequestFilter {

    private void unauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"unauthorized\",\"message\":\"" + message + "\"}");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            unauthorized(response, "Missing Authorization: Bearer <token>");
            return;
        }

        String idToken = authHeader.substring("Bearer ".length()).trim();

        try {
            FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            request.setAttribute("firebaseUid", decoded.getUid());
            request.setAttribute("firebaseToken", decoded);
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            unauthorized(response, "Invalid/expired Firebase token");
        }
    }
}
