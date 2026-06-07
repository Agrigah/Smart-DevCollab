package ma.enset.smartdevcollab.config;
import lombok.RequiredArgsConstructor; import ma.enset.smartdevcollab.security.JwtAuthFilter; import org.springframework.context.annotation.*; import org.springframework.security.authentication.*; import org.springframework.security.authentication.dao.DaoAuthenticationProvider; import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration; import org.springframework.security.config.annotation.web.builders.HttpSecurity; import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity; import org.springframework.security.config.http.SessionCreationPolicy; import org.springframework.security.core.userdetails.UserDetailsService; import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; import org.springframework.security.crypto.password.PasswordEncoder; import org.springframework.security.web.*; import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter; import org.springframework.web.cors.*; import java.util.List;
@Configuration @EnableWebSecurity @RequiredArgsConstructor
public class SecurityConfig { private final JwtAuthFilter jwtAuthFilter; private final UserDetailsService userDetailsService;
 @Bean public SecurityFilterChain securityFilterChain(HttpSecurity http)throws Exception{ return http.csrf(c->c.disable()).cors(c->c.configurationSource(corsConfigurationSource())).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
         .authorizeHttpRequests(auth -> auth
                 .requestMatchers("/api/auth/**").permitAll()
                 .requestMatchers("/api/projects/**").authenticated()
                 .requestMatchers("/api/tasks/**").authenticated()
                 .requestMatchers("/api/ai/**").authenticated()
                 .requestMatchers("/api/activity/**").authenticated()
                 .requestMatchers("/api/notifications/**").authenticated()
                 .requestMatchers("/api/users/**").authenticated()
                 .anyRequest().permitAll()
         )
         .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class).build(); }
 @Bean public AuthenticationProvider authenticationProvider(){ DaoAuthenticationProvider p=new DaoAuthenticationProvider(); p.setUserDetailsService(userDetailsService); p.setPasswordEncoder(passwordEncoder()); return p; }
 @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration c)throws Exception{ return c.getAuthenticationManager(); }
 @Bean public PasswordEncoder passwordEncoder(){ return new BCryptPasswordEncoder(); }
 @Bean public CorsConfigurationSource corsConfigurationSource(){ CorsConfiguration cfg=new CorsConfiguration(); cfg.setAllowedOrigins(List.of("http://localhost:5173","http://127.0.0.1:5173")); cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS")); cfg.setAllowedHeaders(List.of("*")); cfg.setAllowCredentials(true); UrlBasedCorsConfigurationSource src=new UrlBasedCorsConfigurationSource(); src.registerCorsConfiguration("/**",cfg); return src; }
}
