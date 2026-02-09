package com.dumpspace.backend.users;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserService {

    private Firestore db() {
        return FirestoreClient.getFirestore();
    }

    public Map<String, Object> upsertUser(FirebaseToken token) throws Exception {
        String uid = token.getUid();
        DocumentReference ref = db().collection("users").document(uid);
        DocumentSnapshot snap = ref.get().get();

        Map<String, Object> data = new HashMap<>();
        data.put("uid", uid);
        data.put("email", token.getEmail());
        data.put("name", token.getName());
        data.put("picture", token.getPicture());
        data.put("lastLoginAt", Instant.now().toString());

        if (!snap.exists()) {
            data.put("createdAt", Instant.now().toString());
            ref.set(data).get();
        } else {
            ref.update(data).get();
        }

        return data;
    }
}
