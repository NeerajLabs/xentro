"""
XENTRO Production Migration: Backfill and Synchronize accountType & userType in MongoDB
"""
from integrations.mongodb import get_collection

def run_migration():
    users_col = get_collection('users')
    entities_col = get_collection('entities')
    mentor_col = get_collection('mentor_profiles')
    inv_col = get_collection('investor_profiles')

    def determine_account_type(u):
        # If already clearly set and not empty, preserve it
        if u.get('accountType') and u['accountType'] != 'None':
            return u['accountType']
        
        uid = u.get('id')
        if uid:
            # Check existing entities
            if entities_col.find_one({'primaryOwnerId': uid, 'entityType': 'STARTUP'}) or entities_col.find_one({'id': u.get('entityId'), 'entityType': 'STARTUP'}):
                return 'Startup'
            if entities_col.find_one({'primaryOwnerId': uid, 'entityType': 'ESP'}) or entities_col.find_one({'id': u.get('entityId'), 'entityType': 'ESP'}):
                return 'ESP'
            if mentor_col.find_one({'userId': uid}):
                return 'Mentor'
            if inv_col.find_one({'userId': uid}):
                return 'Investor'
        
        # Check activeRoles
        roles = [str(r).lower().strip() for r in (u.get('activeRoles') or [])]
        for r in roles:
            if 'startup' in r or 'founder' in r:
                return 'Startup'
            if 'mentor' in r or 'advisor' in r:
                return 'Mentor'
            if 'investor' in r or 'angel' in r or 'vc' in r:
                return 'Investor'
            if 'esp' in r or 'incubator' in r or 'accelerator' in r:
                return 'ESP'
            if 'explorer' in r:
                return 'Explorer'

        # Check registrationRequest
        req = str(u.get('registrationRequest', {}).get('requestedRole', '')).lower()
        if 'startup' in req or 'founder' in req:
            return 'Startup'
        if 'mentor' in req:
            return 'Mentor'
        if 'investor' in req:
            return 'Investor'
        if 'esp' in req:
            return 'ESP'
        
        return 'Explorer'

    updated_count = 0
    total = users_col.count_documents({})
    print(f"Scanning {total} users in MongoDB...")

    for u in users_col.find():
        acct = determine_account_type(u)
        users_col.update_one(
            {'_id': u['_id']},
            {'$set': {
                'accountType': acct,
                'userType': acct,
                'primaryRole': acct
            }}
        )
        updated_count += 1
        print(f"  [OK] User {u.get('id')} ({u.get('email')}) -> accountType='{acct}', userType='{acct}'")

    print(f"\nMigration Complete: Successfully updated {updated_count} user records.")

if __name__ == '__main__':
    run_migration()
