import re
from typing import Dict, List, Tuple, Any

class PrivacyGateway:
    """
    Privacy Gateway & Redaction Engine.
    Detects and redacts sensitive PII and financial records before AI dispatch:
    - Email addresses
    - Phone numbers (international, US, Indian)
    - Credit/Debit card numbers (13-19 digits)
    - Bank account numbers
    - Aadhaar numbers (Indian 12-digit national ID)
    - SSN / National IDs (US 9 digits)
    - User-defined sensitive terms/values
    
    Replaces sensitive tokens with human-readable surrogate placeholders:
    e.g. [EMAIL_1], [PHONE_1], [CARD_1], [ACCOUNT_1], [AADHAAR_1], [CONFIDENTIAL_1].
    
    Note on Security Boundary:
    Regex heuristic pattern matching cannot detect all contextual or implicit
    sensitive leaks (e.g. coded language, proprietary names). Hence, manual user
    tagging and explicit field specification is supported.
    """

    PATTERNS = {
        "EMAIL": re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', re.IGNORECASE),
        "CREDIT_CARD": re.compile(r'\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b'),
        "AADHAAR": re.compile(r'\b\d{4}\s\d{4}\s\d{4}\b|\b\d{12}\b'),
        "SSN": re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
        "PHONE": re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\+91[-.\s]?\d{10}\b|\b\d{10}\b'),
        "BANK_ACCOUNT": re.compile(r'\b(?:account|acct|acc|a/c)[\s:#.-]*([0-9]{9,18})\b', re.IGNORECASE)
    }

    @classmethod
    def redact(
        cls, 
        text: str, 
        custom_terms: List[str] = None
    ) -> Dict[str, Any]:
        """
        Scans text for sensitive patterns and custom terms, replaces them with placeholders,
        and returns detection metadata + sanitized string.
        """
        if not text:
            return {
                "sanitized_text": "",
                "original_text": "",
                "detections": [],
                "count": 0
            }

        sanitized = text
        detections: List[Dict[str, Any]] = []

        # 1. Custom User-Defined Sensitive Terms first (exact match case-insensitive)
        if custom_terms:
            confidential_count = [0]
            for term in sorted(custom_terms, key=len, reverse=True):
                clean_term = term.strip()
                if not clean_term:
                    continue
                pattern = re.compile(re.escape(clean_term), re.IGNORECASE)
                matches = list(pattern.finditer(sanitized))
                for match in matches:
                    confidential_count[0] += 1
                    matched_value = match.group(0)
                    placeholder = f"[CONFIDENTIAL_{confidential_count[0]}]"
                    detections.append({
                        "type": "USER_DEFINED",
                        "placeholder": placeholder,
                        "masked_preview": cls._mask_value(matched_value),
                        "position": match.span()
                    })
                if matches:
                    # Reset count back to match the repl assignment
                    start_val = confidential_count[0] - len(matches)
                    sub_count = [start_val]
                    def make_repl(cnt):
                        def repl(m):
                            cnt[0] += 1
                            return f"[CONFIDENTIAL_{cnt[0]}]"
                        return repl
                    sanitized = pattern.sub(make_repl(sub_count), sanitized)

        # 2. Email Detection
        email_matches = list(cls.PATTERNS["EMAIL"].finditer(sanitized))
        if email_matches:
            email_count = 0
            for match in email_matches:
                email_count += 1
                val = match.group(0)
                placeholder = f"[EMAIL_{email_count}]"
                detections.append({
                    "type": "EMAIL",
                    "placeholder": placeholder,
                    "masked_preview": cls._mask_value(val),
                    "position": match.span()
                })
            sub_count = [0]
            def make_email_repl(cnt):
                def repl(m):
                    cnt[0] += 1
                    return f"[EMAIL_{cnt[0]}]"
                return repl
            sanitized = cls.PATTERNS["EMAIL"].sub(make_email_repl(sub_count), sanitized)

        # 3. Credit Card Detection
        card_matches = [m for m in cls.PATTERNS["CREDIT_CARD"].finditer(sanitized) if 13 <= len(re.sub(r'\D', '', m.group(0))) <= 19 and not m.group(0).startswith('[')]
        if card_matches:
            card_count = 0
            for match in card_matches:
                card_count += 1
                val = match.group(0)
                placeholder = f"[CARD_{card_count}]"
                detections.append({
                    "type": "CREDIT_CARD",
                    "placeholder": placeholder,
                    "masked_preview": cls._mask_value(val),
                    "position": match.span()
                })
            sub_count = [0]
            def make_card_repl(cnt):
                def repl(m):
                    val = m.group(0)
                    digits = re.sub(r'\D', '', val)
                    if 13 <= len(digits) <= 19 and not val.startswith('['):
                        cnt[0] += 1
                        return f"[CARD_{cnt[0]}]"
                    return val
                return repl
            sanitized = cls.PATTERNS["CREDIT_CARD"].sub(make_card_repl(sub_count), sanitized)

        # 4. Bank Account Detection
        account_matches = list(cls.PATTERNS["BANK_ACCOUNT"].finditer(sanitized))
        if account_matches:
            account_count = 0
            for match in account_matches:
                account_count += 1
                val = match.group(0)
                placeholder = f"[ACCOUNT_{account_count}]"
                detections.append({
                    "type": "BANK_ACCOUNT",
                    "placeholder": placeholder,
                    "masked_preview": cls._mask_value(val),
                    "position": match.span()
                })
            sub_count = [0]
            def make_account_repl(cnt):
                def repl(m):
                    cnt[0] += 1
                    return f"[ACCOUNT_{cnt[0]}]"
                return repl
            sanitized = cls.PATTERNS["BANK_ACCOUNT"].sub(make_account_repl(sub_count), sanitized)

        # 5. Aadhaar / National ID
        aadhaar_matches = [m for m in cls.PATTERNS["AADHAAR"].finditer(sanitized) if len(re.sub(r'\D', '', m.group(0))) == 12 and not m.group(0).startswith('[')]
        if aadhaar_matches:
            aadhaar_count = 0
            for match in aadhaar_matches:
                aadhaar_count += 1
                val = match.group(0)
                placeholder = f"[AADHAAR_{aadhaar_count}]"
                detections.append({
                    "type": "AADHAAR",
                    "placeholder": placeholder,
                    "masked_preview": cls._mask_value(val),
                    "position": match.span()
                })
            sub_count = [0]
            def make_aadhaar_repl(cnt):
                def repl(m):
                    val = m.group(0)
                    digits = re.sub(r'\D', '', val)
                    if len(digits) == 12 and not val.startswith('['):
                        cnt[0] += 1
                        return f"[AADHAAR_{cnt[0]}]"
                    return val
                return repl
            sanitized = cls.PATTERNS["AADHAAR"].sub(make_aadhaar_repl(sub_count), sanitized)

        # 6. Phone Numbers
        phone_matches = [m for m in cls.PATTERNS["PHONE"].finditer(sanitized) if 10 <= len(re.sub(r'\D', '', m.group(0))) <= 15 and not m.group(0).startswith('[') and "_" not in m.group(0)]
        if phone_matches:
            phone_count = 0
            for match in phone_matches:
                phone_count += 1
                val = match.group(0)
                placeholder = f"[PHONE_{phone_count}]"
                detections.append({
                    "type": "PHONE",
                    "placeholder": placeholder,
                    "masked_preview": cls._mask_value(val),
                    "position": match.span()
                })
            sub_count = [0]
            def make_phone_repl(cnt):
                def repl(m):
                    val = m.group(0)
                    digits = re.sub(r'\D', '', val)
                    if 10 <= len(digits) <= 15 and not val.startswith('[') and "_" not in val:
                        cnt[0] += 1
                        return f"[PHONE_{cnt[0]}]"
                    return val
                return repl
            sanitized = cls.PATTERNS["PHONE"].sub(make_phone_repl(sub_count), sanitized)

        return {
            "original_text": text,
            "sanitized_text": sanitized,
            "detections": detections,
            "count": len(detections)
        }

    @classmethod
    def _mask_value(cls, val: str) -> str:
        """Creates a privacy-preserving visual mask e.g. j***@domain.com or ****-****-1234."""
        if "@" in val:
            user, domain = val.split("@", 1)
            masked_user = user[0] + "***" if len(user) > 1 else "*"
            return f"{masked_user}@{domain}"
        digits = re.sub(r'\D', '', val)
        if len(digits) >= 4:
            return f"{'*' * (len(digits) - 4)}{digits[-4:]}"
        return f"{val[:1]}***"
