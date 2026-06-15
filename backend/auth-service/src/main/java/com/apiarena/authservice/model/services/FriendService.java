package com.apiarena.authservice.model.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.apiarena.authservice.model.dto.FriendEntryDTO;
import com.apiarena.authservice.model.dto.FriendRelationshipDTO;
import com.apiarena.authservice.model.dto.FriendSearchResultDTO;
import com.apiarena.authservice.model.dto.PendingFriendDTO;
import com.apiarena.authservice.model.dto.UserDTO;
import com.apiarena.authservice.model.entities.Friendship;
import com.apiarena.authservice.model.entities.FriendshipStatus;
import com.apiarena.authservice.model.entities.User;
import com.apiarena.authservice.repository.FriendshipRepository;
import com.apiarena.authservice.repository.UserRepository;

@Service
public class FriendService {

    @Autowired
    private FriendshipRepository friendshipRepository;

    @Autowired
    private UserRepository userRepository;

    private static long[] orderedPair(long a, long b) {
        if (a < b) {
            return new long[] { a, b };
        }
        return new long[] { b, a };
    }

    private static long peerUserId(Friendship f, Long currentUserId) {
        if (f.getUserLowId().equals(currentUserId)) {
            return f.getUserHighId();
        }
        return f.getUserLowId();
    }

    @Transactional(readOnly = true)
    public List<FriendEntryDTO> listFriends(Long currentUserId) {
        List<Friendship> rows = friendshipRepository.findByUserInvolvedAndStatus(
                currentUserId, FriendshipStatus.ACCEPTED);
        List<FriendEntryDTO> out = new ArrayList<>();
        for (Friendship f : rows) {
            long peerId = peerUserId(f, currentUserId);
            User peer = userRepository.findById(peerId).orElse(null);
            if (peer != null) {
                out.add(FriendEntryDTO.of(f, peer));
            }
        }
        out.sort(Comparator.comparing(e -> e.getUser().getUsername().toLowerCase()));
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, List<PendingFriendDTO>> listPending(Long currentUserId) {
        List<Friendship> pending = friendshipRepository.findByUserInvolvedAndStatus(
                currentUserId, FriendshipStatus.PENDING);
        List<PendingFriendDTO> incoming = new ArrayList<>();
        List<PendingFriendDTO> outgoing = new ArrayList<>();
        for (Friendship f : pending) {
            long peerId = peerUserId(f, currentUserId);
            User peer = userRepository.findById(peerId).orElse(null);
            if (peer == null) {
                continue;
            }
            PendingFriendDTO dto = PendingFriendDTO.of(f, peer, currentUserId);
            if (dto.isIncoming()) {
                incoming.add(dto);
            } else {
                outgoing.add(dto);
            }
        }
        incoming.sort(Comparator.comparing(p -> p.getUser().getUsername().toLowerCase()));
        outgoing.sort(Comparator.comparing(p -> p.getUser().getUsername().toLowerCase()));
        return Map.of("incoming", incoming, "outgoing", outgoing);
    }

    @Transactional
    public Friendship sendRequest(Long requesterId, Long targetUserId) {
        if (targetUserId == null || targetUserId.equals(requesterId)) {
            throw new IllegalArgumentException("Invalid user");
        }
        userRepository.findById(targetUserId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        long[] pair = orderedPair(requesterId, targetUserId);
        Optional<Friendship> existing = friendshipRepository.findByUserLowIdAndUserHighId(pair[0], pair[1]);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if (f.getStatus() == FriendshipStatus.ACCEPTED) {
                throw new IllegalStateException("Already friends");
            }
            throw new IllegalStateException("A friend request is already pending");
        }
        Friendship f = Friendship.builder()
                .userLowId(pair[0])
                .userHighId(pair[1])
                .requestedByUserId(requesterId)
                .status(FriendshipStatus.PENDING)
                .build();
        return friendshipRepository.save(f);
    }

    @Transactional
    public void accept(Long currentUserId, Long friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (f.getStatus() != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Not a pending request");
        }
        if (f.getRequestedByUserId().equals(currentUserId)) {
            throw new IllegalStateException("You cannot accept your own request");
        }
        if (!f.getUserLowId().equals(currentUserId) && !f.getUserHighId().equals(currentUserId)) {
            throw new IllegalStateException("Not part of this request");
        }
        f.setStatus(FriendshipStatus.ACCEPTED);
        friendshipRepository.save(f);
    }

    @Transactional
    public void rejectOrCancel(Long currentUserId, Long friendshipId) {
        Friendship f = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (f.getStatus() != FriendshipStatus.PENDING) {
            throw new IllegalStateException("Not a pending request");
        }
        if (!f.getUserLowId().equals(currentUserId) && !f.getUserHighId().equals(currentUserId)) {
            throw new IllegalStateException("Not part of this request");
        }
        friendshipRepository.delete(f);
    }

    @Transactional
    public void unfriend(Long currentUserId, Long peerUserId) {
        if (peerUserId == null || peerUserId.equals(currentUserId)) {
            throw new IllegalArgumentException("Invalid user");
        }
        long[] pair = orderedPair(currentUserId, peerUserId);
        Friendship f = friendshipRepository.findByUserLowIdAndUserHighId(pair[0], pair[1])
                .orElseThrow(() -> new IllegalArgumentException("Friendship not found"));
        if (f.getStatus() != FriendshipStatus.ACCEPTED) {
            throw new IllegalStateException("Not friends");
        }
        friendshipRepository.delete(f);
    }

    @Transactional(readOnly = true)
    public List<FriendSearchResultDTO> searchUsers(Long currentUserId, String q) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }
        List<User> users = userRepository.searchUsersForSocial(q.trim(), currentUserId).stream()
                .limit(25)
                .collect(Collectors.toList());
        List<Friendship> all = friendshipRepository.findAllByUserInvolved(currentUserId);
        Map<Long, Friendship> byPeer = new HashMap<>();
        for (Friendship f : all) {
            long peer = peerUserId(f, currentUserId);
            byPeer.put(peer, f);
        }
        List<FriendSearchResultDTO> out = new ArrayList<>();
        for (User u : users) {
            Friendship rel = byPeer.get(u.getId());
            String relStr = "NONE";
            if (rel != null) {
                if (rel.getStatus() == FriendshipStatus.ACCEPTED) {
                    relStr = "FRIEND";
                } else if (rel.getRequestedByUserId().equals(currentUserId)) {
                    relStr = "PENDING_OUTGOING";
                } else {
                    relStr = "PENDING_INCOMING";
                }
            }
            out.add(FriendSearchResultDTO.builder()
                    .user(UserDTO.fromEntity(u))
                    .relationship(relStr)
                    .build());
        }
        return out;
    }

    @Transactional(readOnly = true)
    public FriendRelationshipDTO getRelationship(Long currentUserId, Long targetUserId) {
        if (targetUserId == null) {
            throw new IllegalArgumentException("Invalid user");
        }
        if (targetUserId.equals(currentUserId)) {
            return FriendRelationshipDTO.builder().relationship("SELF").build();
        }
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        long[] pair = orderedPair(currentUserId, targetUserId);
        Optional<Friendship> existing = friendshipRepository.findByUserLowIdAndUserHighId(pair[0], pair[1]);
        if (existing.isEmpty()) {
            return FriendRelationshipDTO.builder().relationship("NONE").build();
        }

        Friendship f = existing.get();
        if (f.getStatus() == FriendshipStatus.ACCEPTED) {
            return FriendRelationshipDTO.builder()
                    .relationship("FRIEND")
                    .friendshipId(f.getId())
                    .build();
        }
        if (f.getRequestedByUserId().equals(currentUserId)) {
            return FriendRelationshipDTO.builder()
                    .relationship("PENDING_OUTGOING")
                    .friendshipId(f.getId())
                    .build();
        }
        return FriendRelationshipDTO.builder()
                .relationship("PENDING_INCOMING")
                .friendshipId(f.getId())
                .build();
    }
}
