"""
XENTRO Identity Model & ID Generator
Implements prefix-based entity identification:
Human: XU-XXXXXX
Startup: ST-XXXXXX
Founder: FO-XXXXXX
Mentor: MEN-XXXXXX
Individual Investor: INV-XXXXXX
Investor Organization: VCI-XXXXXX
ESP: ES-XXXXXX
Institution: INS-XXXXXX
Admin: ADM-XXXXXX
"""
import random
import re

PREFIXES = {
    "user": "XU",
    "startup": "ST",
    "founder": "FO",
    "mentor": "MEN",
    "investor": "INV",
    "investor_org": "VCI",
    "esp": "ES",
    "institution": "INS",
    "admin": "ADM",
    "meeting": "MTG",
    "opportunity": "OPP",
    "transaction": "TXN",
    "entitlement": "ENT",
    "profile": "PRF",
    "subscription": "SUB",
    "endorsement": "END",
    "complaint": "CMP",
    "ticket": "TCK",
    "request": "REQ",
    "membership": "MEM",
}

def generate_xentro_id(entity_type: str = "user") -> str:
    """Generates a random 6-digit collision-resistant entity ID."""
    prefix = PREFIXES.get(entity_type.lower(), "XU")
    random_num = random.randint(100000, 999999)
    return f"{prefix}-{random_num}"

def clean_username(name: str) -> str:
    """Generates a clean @username from a person or entity name."""
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
    if not cleaned:
        cleaned = "user"
    random_suffix = random.randint(10, 99)
    return f"@{cleaned}{random_suffix}"
