package com.comp4801.jobportal.config;

import com.comp4801.jobportal.services.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
//        http.csrf().disable()
//                .authorizeHttpRequests(auth -> auth
//                        .requestMatchers("/api/auth/**", "/api/browser/**").permitAll()
//                        .anyRequest().authenticated()
//                )
//                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
//        return http.build();
//    }
    // Source - https://stackoverflow.com/q/77611596
// Posted by Sakib X Hossain, modified by community. See post 'Timeline' for change history
// Retrieved 2026-04-09, License - CC BY-SA 4.0

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests((requests) -> requests
                        .requestMatchers("/", "/api/**").permitAll()
                        .anyRequest().permitAll()
                )
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public JwtService jwtService(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.expiration}") int jwtExpirations
    ){
        return new JwtService(jwtSecret, jwtExpirations);
    }
}
