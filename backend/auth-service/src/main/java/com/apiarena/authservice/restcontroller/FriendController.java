package com.apiarena.authservice.restcontroller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.apiarena.authservice.model.dto.FriendEntryDTO;
import com.apiarena.authservice.model.dto.FriendRequestDTO;
import com.apiarena.authservice.model.dto.FriendSearchResultDTO;
import com.apiarena.authservice.model.dto.PendingFriendDTO;
import com.apiarena.authservice.model.entities.Friendship;
import com.apiarena.authservice.model.services.FriendService;
import com.apiarena.authservice.repository.UserRepository;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    @Autowired
    private FriendService friendService;

    @Autowired
    private UserRepository userRepository;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    @GetMapping
    public ResponseEntity<List<FriendEntryDTO>> listFriends() {
        return ResponseEntity.ok(friendService.listFriends(currentUserId()));
    }

    @GetMapping("/pending")
    public ResponseEntity<Map<String, List<PendingFriendDTO>>> pending() {
        return ResponseEntity.ok(friendService.listPending(currentUserId()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<FriendSearchResultDTO>> search(@RequestParam String q) {
        return ResponseEntity.ok(friendService.searchUsers(currentUserId(), q));
    }

    @PostMapping("/request")
    public ResponseEntity<Map<String, Object>> sendRequest(@Valid @RequestBody FriendRequestDTO body) {
        try {
            Friendship f = friendService.sendRequest(currentUserId(), body.getUserId());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "friendshipId", f.getId(),
                    "status", f.getStatus().name()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{friendshipId}/accept")
    public ResponseEntity<Void> accept(@PathVariable Long friendshipId) {
        try {
            friendService.accept(currentUserId(), friendshipId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/request/{friendshipId}")
    public ResponseEntity<Void> rejectOrCancel(@PathVariable Long friendshipId) {
        try {
            friendService.rejectOrCancel(currentUserId(), friendshipId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{peerUserId}")
    public ResponseEntity<Void> unfriend(@PathVariable Long peerUserId) {
        try {
            friendService.unfriend(currentUserId(), peerUserId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
