import urllib.request
import json
class requests:
    @staticmethod
    def get(url):
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req) as resp:
                return Resp(resp.status, resp.read().decode())
        except urllib.error.HTTPError as e:
            return Resp(e.code, e.read().decode())
    @staticmethod
    def post(url, json=None):
        data = json_module.dumps(json).encode() if json else b''
        req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req) as resp:
                return Resp(resp.status, resp.read().decode())
        except urllib.error.HTTPError as e:
            return Resp(e.code, e.read().decode())
class Resp:
    def __init__(self, s, text):
        self.status_code = s; self.text = text
    def json(self): return json_module.loads(self.text)
import json as json_module

BASE = "http://127.0.0.1:8000"

print("--- 1. Testing Health ---")
r = requests.get(f"{BASE}/health")
assert r.status_code == 200, f"Health failed: {r.text}"
print("Health OK:", r.json())

print("\n--- 2. Testing Encryption & Decryption ---")
enc_req = {"plaintext": "Secret financial records: Account 555-888-999 with balance $75,000"}
r = requests.post(f"{BASE}/api/encrypt", json=enc_req)
assert r.status_code == 200, f"Encrypt failed: {r.text}"
enc_data = r.json()
print("Encrypted OK. Ciphertext len:", len(enc_data["ciphertext"]), "Nonce:", enc_data["nonce"])

dec_req = {
    "ciphertext": enc_data["ciphertext"],
    "nonce": enc_data["nonce"],
    "tag": enc_data["tag"]
}
r = requests.post(f"{BASE}/api/decrypt", json=dec_req)
assert r.status_code == 200, f"Decrypt failed: {r.text}"
dec_data = r.json()
assert dec_data["plaintext"] == enc_req["plaintext"], "Plaintext mismatch"
print("Decrypted OK. Integrity verified:", dec_data["integrity_verified"])

print("\n--- 3. Testing Tamper Detection ---")
tamper_req = {
    "ciphertext": enc_data["ciphertext"],
    "nonce": enc_data["nonce"],
    "tag": enc_data["tag"]
}
r = requests.post(f"{BASE}/api/security/tamper-test", json=tamper_req)
assert r.status_code == 200, f"Tamper test failed: {r.text}"
tamper_data = r.json()
assert tamper_data["tamper_detected"] is True, "Tamper should have been detected!"
assert tamper_data["tag_verification_failed"] is True, "Tag verification should fail!"
print("Tamper Detection OK. Error detected:", tamper_data["cryptographic_error"])

print("\n--- 4. Testing Key Generation & Shamir 2-of-3 ---")
r = requests.post(f"{BASE}/api/keys/generate")
assert r.status_code == 200, f"Key gen failed: {r.text}"
key_data = r.json()
shares = key_data["shares"]
assert len(shares) == 3, "Must have exactly 3 shares"
print(f"Generated Key ID: {key_data['key_id']}. 3 shares present.")

# One share failure
r = requests.post(f"{BASE}/api/keys/recover", json={"shares": [shares[0]["serialized_share"]]})
assert r.status_code == 400, f"Expected 400 for 1 share, got {r.status_code}"
print("One-share recovery successfully rejected (HTTP 400):", r.json()["detail"])

# Two share success (combo 1, 2)
r = requests.post(f"{BASE}/api/keys/recover", json={"shares": [shares[0]["serialized_share"], shares[1]["serialized_share"]]})
assert r.status_code == 200, f"Recovery 1,2 failed: {r.text}"
rec_data = r.json()
assert rec_data["matches_active_key"] is True
print("Two-share recovery (1,2) OK. Matches active key:", rec_data["matches_active_key"])

# Two share success (combo 1, 3)
r = requests.post(f"{BASE}/api/keys/recover", json={"shares": [shares[0]["serialized_share"], shares[2]["serialized_share"]]})
assert r.status_code == 200, f"Recovery 1,3 failed: {r.text}"
rec_data = r.json()
assert rec_data["matches_active_key"] is True
print("Two-share recovery (1,3) OK. Matches active key:", rec_data["matches_active_key"])

print("\n--- 5. Testing Privacy Gateway & AI Chat Pipeline ---")
chat_req = {
    "prompt": "Please review account 123456789012, email user@banksecure.com and card 4111 2222 3333 4444 for fraud.",
    "custom_terms": ["banksecure"],
    "store_encrypted": True
}
r = requests.post(f"{BASE}/api/ai/chat", json=chat_req)
assert r.status_code == 200, f"Chat failed: {r.text}"
chat_data = r.json()
sanitized = chat_data["sanitized_prompt"]
assert "123456789012" not in sanitized
assert "user@banksecure.com" not in sanitized
assert "4111 2222 3333 4444" not in sanitized
assert "banksecure" not in sanitized.lower()
print("Privacy Gateway sanitized prompt correctly:")
print("  ->", sanitized)
print("AI Provider:", chat_data["provider_info"]["provider"])
print("Key isolation verified:", chat_data["provider_info"]["key_isolation_verified"])

print("\n--- 6. Testing Security Audit Logs ---")
r = requests.get(f"{BASE}/api/security/events?limit=10")
assert r.status_code == 200
events = r.json()["events"]
print(f"Retrieved {len(events)} real backend audit events.")
for e in events[:3]:
    print(f"  [{e['created_at']}] [{e['event_type']}] {e['action']} -> {e['status']}")

print("\nALL LIVE ENDPOINTS VALIDATED SUCCESSFULLY!")

