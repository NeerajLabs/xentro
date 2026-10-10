"""
XENTRO Production Migration: Explorer Account System & Schema Synchronization
=============================================================================
Safely and idempotently verifies and synchronizes MongoDB user documents,
generates backend profile identifiers (PRF-XXXXXX), ensures canonical
personal_profiles collection synchronization, ensures baseRole="explorer",
and creates all required unique constraints and database indexes.

Usage:
  python migrate_explorer_accounts.py --dry-run
  python migrate_explorer_accounts.py --execute
"""

import sys
import argparse
import datetime
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id

def inspect_and_migrate(dry_run: bool = True):
    users_col = get_collection("users")
    profiles_col = get_collection("personal_profiles")
    entities_col = get_collection("entities")
    memberships_col = get_collection("memberships")
    roles_col = get_collection("user_roles")
    role_req_col = get_collection("role_requests")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    total_users = users_col.count_documents({})

    print("=" * 70)
    print(f"XENTRO EXPLORER ACCOUNT MIGRATION — MODE: {'DRY RUN (NO WRITES)' if dry_run else 'LIVE EXECUTION'}")
    print(f"Found {total_users} user records in authoritative MongoDB store.")
    print("=" * 70)

    stats = {
        "scanned": 0,
        "profile_id_backfilled": 0,
        "base_role_backfilled": 0,
        "personal_profile_synced": 0,
        "education_array_normalized": 0,
        "already_compliant": 0,
        "errors": 0
    }

    for user in users_col.find():
        stats["scanned"] += 1
        user_id = user.get("id") or str(user.get("_id"))
        email = user.get("email", "").lower().strip()
        full_name = user.get("fullName") or user.get("name") or "Ecosystem Member"
        profile_id = user.get("profileId")
        base_role = user.get("baseRole")
        account_type = user.get("accountType") or "Explorer"
        personal_profile_data = user.get("personalProfile") or {}

        updates = {}
        needs_update = False

        # 1. Verify or generate immutable Profile ID
        if not profile_id:
            # Check if canonical personal_profiles already has a doc for this user
            existing_prof = profiles_col.find_one({"userId": user_id})
            if existing_prof and existing_prof.get("profileId"):
                profile_id = existing_prof["profileId"]
            else:
                profile_id = generate_xentro_id("profile")
            updates["profileId"] = profile_id
            stats["profile_id_backfilled"] += 1
            needs_update = True
            print(f"  [+] User {user_id} ({email}): Generated Profile ID -> {profile_id}")

        # 2. Verify baseRole is explorer
        if not base_role:
            updates["baseRole"] = "explorer"
            stats["base_role_backfilled"] += 1
            needs_update = True
            print(f"  [+] User {user_id} ({email}): Set baseRole -> 'explorer'")

        # 3. Ensure education array exists and is valid list
        education = personal_profile_data.get("education") or user.get("education")
        if education is None:
            education = []
            updates["personalProfile.education"] = []
            stats["education_array_normalized"] += 1
            needs_update = True
        elif isinstance(education, str):
            education = [{"institution": education, "degree": "", "fieldOfStudy": "", "startYear": "", "endYear": "", "currentlyStudying": False}]
            updates["personalProfile.education"] = education
            stats["education_array_normalized"] += 1
            needs_update = True

        # 4. Sync canonical personal_profiles collection document
        existing_profile_doc = profiles_col.find_one({"$or": [{"userId": user_id}, {"profileId": profile_id}]})
        canonical_profile = {
            "profileId": profile_id,
            "userId": user_id,
            "fullName": full_name,
            "username": user.get("username") or user.get("publicUsername") or email.split("@")[0].lower(),
            "photoUrl": user.get("photoUrl") or user.get("avatar") or personal_profile_data.get("photoUrl") or "",
            "headline": user.get("headline") or personal_profile_data.get("headline") or "",
            "location": user.get("location") or personal_profile_data.get("location") or "",
            "structuredLocation": personal_profile_data.get("structuredLocation") or {},
            "currentRole": user.get("currentRole") or personal_profile_data.get("currentRole") or "Explorer",
            "currentOrganization": user.get("currentOrganization") or user.get("organization") or personal_profile_data.get("currentOrganization") or "",
            "education": education,
            "bio": user.get("bio") or personal_profile_data.get("bio") or "",
            "skills": user.get("skills") or personal_profile_data.get("skills") or [],
            "industries": user.get("industries") or personal_profile_data.get("industries") or [],
            "ecosystemInterests": personal_profile_data.get("ecosystemInterests") or [],
            "ecosystemGoals": personal_profile_data.get("ecosystemGoals") or [],
            "socialLinks": personal_profile_data.get("socialLinks") or {
                "linkedin": user.get("linkedin") or "",
                "website": user.get("website") or "",
                "github": user.get("github") or ""
            },
            "visibility": personal_profile_data.get("visibility") or "PUBLIC",
            "updatedAt": now_iso
        }

        if not existing_profile_doc:
            canonical_profile["createdAt"] = user.get("createdAt") or now_iso
            stats["personal_profile_synced"] += 1
            print(f"  [+] User {user_id} ({email}): Created canonical personal_profiles document ({profile_id})")
            if not dry_run:
                profiles_col.insert_one(canonical_profile)
        else:
            stats["personal_profile_synced"] += 1
            if not dry_run:
                profiles_col.update_one(
                    {"_id": existing_profile_doc["_id"]},
                    {"$set": canonical_profile}
                )

        # 5. Apply user updates
        if needs_update:
            updates["updatedAt"] = now_iso
            if not dry_run:
                users_col.update_one({"_id": user["_id"]}, {"$set": updates})
        else:
            stats["already_compliant"] += 1

    # 6. Database Indexes & Constraints
    print("\nEnsuring Database Indexes & Constraints across collections...")
    index_tasks = [
        (users_col, [("id", 1)], {"unique": True, "name": "idx_users_id_unique"}),
        (users_col, [("email", 1)], {"unique": True, "sparse": True, "name": "idx_users_email_unique"}),
        (profiles_col, [("profileId", 1)], {"unique": True, "name": "idx_profiles_profileId_unique"}),
        (profiles_col, [("userId", 1)], {"unique": True, "name": "idx_profiles_userId_unique"}),
        (entities_col, [("id", 1)], {"unique": True, "name": "idx_entities_id_unique"}),
        (memberships_col, [("userId", 1), ("entityId", 1)], {"unique": True, "name": "idx_memberships_user_entity_unique"}),
        (role_req_col, [("userId", 1), ("role", 1), ("status", 1)], {"name": "idx_role_requests_user_role_status"}),
    ]

    for col, keys, opts in index_tasks:
        col_name = col.name
        index_name = opts.get("name")
        if dry_run:
            print(f"  [DRY-RUN INDEX] {col_name} -> {keys} ({opts})")
        else:
            try:
                col.create_index(keys, **opts)
                print(f"  [INDEX CREATED/VERIFIED] {col_name} -> {index_name}")
            except Exception as e:
                print(f"  [INDEX WARNING] {col_name} {index_name}: {e}")

    print("\n" + "=" * 70)
    print("MIGRATION SUMMARY")
    print("=" * 70)
    for k, v in stats.items():
        print(f"  {k.replace('_', ' ').capitalize()}: {v}")
    print("=" * 70)
    if dry_run:
        print("Dry run completed. No actual changes were written. Run with --execute to commit.")
    else:
        print("Migration execution completed successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Xentro Explorer Account Migration")
    parser.add_argument("--execute", action="store_true", help="Execute the migration (writes to database)")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Simulate without writing")
    args = parser.parse_args()

    execute_mode = args.execute
    inspect_and_migrate(dry_run=not execute_mode)
