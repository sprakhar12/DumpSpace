package com.dumpspace.backend.security;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class SecurityConfig {

    @Bean
    public FilterRegistrationBean<FirebaseAuthGuard> firebaseAuthFilter() {
        FilterRegistrationBean<FirebaseAuthGuard> reg = new FilterRegistrationBean<>();
        reg.setFilter(new FirebaseAuthGuard());
        reg.addUrlPatterns("/api/*");
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return reg;
    }
}
