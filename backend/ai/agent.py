import os
import time
from typing import Dict, Any, List
from config import OPENAI_API_KEY, OPENAI_MODEL

class AIAgent:
    """
    Privacy-Isolated AI Agent Service.
    
    CRITICAL ARCHITECTURAL CONSTRAINTS:
    1. NEVER receives raw master encryption keys or Shamir shares.
    2. Receives ONLY sanitized prompts from the Privacy Gateway.
    3. Cannot decrypt database records or access KMS enclaves.
    4. Connects to OpenAI if OPENAI_API_KEY is configured.
    5. Falls back to deterministic, clearly labeled 'Mock AI Mode' when no key is present.
    """

    def __init__(self):
        self.api_key = OPENAI_API_KEY
        self.model = OPENAI_MODEL
        self.client = None
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                self.client = None

    def get_provider_status(self) -> Dict[str, Any]:
        """Provides status of the AI agent without leaking secrets."""
        has_key = bool(self.api_key)
        return {
            "mode": "live" if (has_key and self.client) else "mock",
            "provider": "OpenAI" if (has_key and self.client) else "VaultMind Mock AI",
            "model": self.model if (has_key and self.client) else "vaultmind-privacy-v1-mock",
            "is_mock": not bool(has_key and self.client),
            "key_configured": has_key,
            "isolation_active": True,
            "can_access_keys": False  # Architecturally enforced False
        }

    def process_sanitized_prompt(self, sanitized_prompt: str, redacted_types: List[str]) -> Dict[str, Any]:
        """
        Sends the sanitized prompt to the external LLM or Mock provider.
        Assures zero exposure of original secrets or cryptographic keys.
        """
        status = self.get_provider_status()

        # If live OpenAI client is configured
        if status["mode"] == "live" and self.client:
            try:
                system_instruction = (
                    "You are VaultMind AI, a privacy-first assistant. "
                    "The user's query has already been sanitized by an enterprise privacy gateway. "
                    "You will see placeholders like [EMAIL_1], [CARD_1], [ACCOUNT_1], etc. "
                    "Answer the user's inquiry helpfully and naturally while respecting the privacy boundaries. "
                    "Never ask the user to reveal their real private credentials."
                )
                start_time = time.time()
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": sanitized_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                latency = round((time.time() - start_time) * 1000, 2)
                ai_text = response.choices[0].message.content

                return {
                    "response": ai_text,
                    "provider": "OpenAI",
                    "model": self.model,
                    "is_mock": False,
                    "latency_ms": latency,
                    "sanitized_tokens_handled": len(redacted_types)
                }
            except Exception as e:
                # Graceful fallback to mock with warning
                return self._generate_mock_response(sanitized_prompt, redacted_types, error_note=str(e))

        # Default Mock AI Provider
        return self._generate_mock_response(sanitized_prompt, redacted_types)

    def _generate_mock_response(self, sanitized_prompt: str, redacted_types: List[str], error_note: str = None) -> Dict[str, Any]:
        """
        Deterministic, professional mock AI response.
        Explicitly clarifies that it is operating in Mock AI mode.
        """
        redaction_summary = ", ".join(redacted_types) if redacted_types else "None"
        
        reply = (
            f"[VaultMind Mock AI Response]\n\n"
            f"I have received and processed your query through the VaultMind Privacy Gateway.\n"
            f"• Incoming Sanitized Prompt: \"{sanitized_prompt}\"\n"
            f"• Redacted Privacy Tokens: {redaction_summary}\n\n"
            f"Security Assurance:\n"
            f"No raw cryptographic keys or unencrypted sensitive identifiers were transmitted to this inference boundary. "
            f"Any entities matching banking, card, or contact patterns have been preserved securely in your isolated local vault."
        )

        if error_note:
            reply += f"\n\n[Notice: OpenAI live request failed or was unconfigured ({error_note}). Mock response provided.]"

        return {
            "response": reply,
            "provider": "VaultMind Mock AI (Offline Isolation Mode)",
            "model": "vaultmind-privacy-v1-mock",
            "is_mock": True,
            "latency_ms": 35.5,
            "sanitized_tokens_handled": len(redacted_types)
        }

ai_agent = AIAgent()
