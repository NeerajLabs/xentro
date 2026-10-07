"""
XENTRO MongoDB Database Client
Primary permanent source of truth for the Xentro ecosystem.
Includes auto-fallback to an intelligent file-backed persistent mock store
if local MongoDB daemon is offline.
"""
import os
import json
import logging
import uuid
from threading import Lock
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=True)
except Exception:
    pass

logger = logging.getLogger(__name__)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "xentro_db")

_client = None
_db = None
_is_connected = False


def _get_nested(doc, key):
    parts = key.split(".")
    curr = doc
    for part in parts:
        if isinstance(curr, dict) and part in curr:
            curr = curr[part]
        else:
            return None
    return curr


def _set_nested(doc, key, val):
    parts = key.split(".")
    curr = doc
    for part in parts[:-1]:
        if part not in curr or not isinstance(curr[part], dict):
            curr[part] = {}
        curr = curr[part]
    curr[parts[-1]] = val


def _matches_filter(doc, filter_dict):
    if not filter_dict:
        return True
    for key, expected in filter_dict.items():
        if key == "$or":
            if not any(_matches_filter(doc, sub_f) for sub_f in expected):
                return False
        elif key == "$and":
            if not all(_matches_filter(doc, sub_f) for sub_f in expected):
                return False
        else:
            val = _get_nested(doc, key)
            if isinstance(expected, dict):
                for op, op_val in expected.items():
                    if op == "$in":
                        if val not in op_val:
                            return False
                    elif op == "$nin":
                        if val in op_val:
                            return False
                    elif op == "$ne":
                        if val == op_val:
                            return False
                    elif op == "$exists":
                        if bool(op_val) != (val is not None):
                            return False
                    elif op == "$gt":
                        if val is None or not (val > op_val):
                            return False
                    elif op == "$gte":
                        if val is None or not (val >= op_val):
                            return False
                    elif op == "$lt":
                        if val is None or not (val < op_val):
                            return False
                    elif op == "$lte":
                        if val is None or not (val <= op_val):
                            return False
            elif isinstance(val, list) and not isinstance(expected, list):
                if expected not in val:
                    return False
            else:
                if val != expected:
                    return False
    return True


class MemoryCollection:
    """Thread-safe persistent JSON file fallback collection for local offline development."""
    def __init__(self, name, db=None):
        self.name = name
        self.db = db
        self.docs = []
        self._lock = Lock()

    def find_one(self, filter_dict=None):
        with self._lock:
            if not filter_dict:
                return dict(self.docs[0]) if self.docs else None
            for doc in self.docs:
                if _matches_filter(doc, filter_dict):
                    return dict(doc)
            return None

    def find(self, filter_dict=None, sort=None, limit=0):
        with self._lock:
            results = []
            for doc in self.docs:
                if _matches_filter(doc, filter_dict):
                    results.append(dict(doc))
            if sort:
                key, direction = sort[0]
                results.sort(
                    key=lambda x: str(_get_nested(x, key) or ""),
                    reverse=(direction < 0)
                )
            if limit and limit > 0:
                results = results[:limit]
            return results

    def insert_one(self, doc):
        with self._lock:
            doc_copy = dict(doc)
            if "_id" not in doc_copy:
                doc_copy["_id"] = str(uuid.uuid4())
            self.docs.append(doc_copy)
            if self.db:
                self.db._save_to_disk()

            class InsertResult:
                def __init__(self, inserted_id):
                    self.inserted_id = inserted_id
            return InsertResult(doc_copy["_id"])

    def update_one(self, filter_dict, update_dict, upsert=False):
        with self._lock:
            target_idx = None
            for idx, doc in enumerate(self.docs):
                if _matches_filter(doc, filter_dict):
                    target_idx = idx
                    break

            if target_idx is not None:
                item = self.docs[target_idx]
                if "$set" in update_dict:
                    for k, v in update_dict["$set"].items():
                        _set_nested(item, k, v)
                if "$addToSet" in update_dict:
                    for field, val in update_dict["$addToSet"].items():
                        cur_list = _get_nested(item, field)
                        if not isinstance(cur_list, list):
                            cur_list = []
                            _set_nested(item, field, cur_list)
                        if val not in cur_list:
                            cur_list.append(val)
                if "$set" not in update_dict and "$addToSet" not in update_dict:
                    item.update(update_dict)

                if self.db:
                    self.db._save_to_disk()

                class UpdateResult:
                    modified_count = 1
                    matched_count = 1
                return UpdateResult()
            elif upsert:
                new_doc = dict(filter_dict or {})
                if "$set" in update_dict:
                    for k, v in update_dict["$set"].items():
                        _set_nested(new_doc, k, v)
                if "$addToSet" in update_dict:
                    for field, val in update_dict["$addToSet"].items():
                        new_doc[field] = [val]
                if "$set" not in update_dict and "$addToSet" not in update_dict:
                    new_doc.update(update_dict)
                self.insert_one(new_doc)

                class UpsertResult:
                    modified_count = 0
                    matched_count = 0
                    upserted_id = new_doc.get("_id")
                return UpsertResult()

            class EmptyResult:
                modified_count = 0
                matched_count = 0
            return EmptyResult()

    def update_many(self, filter_dict, update_dict):
        with self._lock:
            modified = 0
            for item in self.docs:
                if _matches_filter(item, filter_dict):
                    if "$set" in update_dict:
                        for k, v in update_dict["$set"].items():
                            _set_nested(item, k, v)
                    if "$addToSet" in update_dict:
                        for field, val in update_dict["$addToSet"].items():
                            cur_list = _get_nested(item, field)
                            if not isinstance(cur_list, list):
                                cur_list = []
                                _set_nested(item, field, cur_list)
                            if val not in cur_list:
                                cur_list.append(val)
                    if "$set" not in update_dict and "$addToSet" not in update_dict:
                        item.update(update_dict)
                    modified += 1

            if modified > 0 and self.db:
                self.db._save_to_disk()

            class UpdateManyResult:
                def __init__(self, c):
                    self.modified_count = c
                    self.matched_count = c
            return UpdateManyResult(modified)

    def delete_one(self, filter_dict):
        with self._lock:
            for idx, doc in enumerate(self.docs):
                if _matches_filter(doc, filter_dict):
                    del self.docs[idx]
                    if self.db:
                        self.db._save_to_disk()
                    class DeleteResult:
                        deleted_count = 1
                    return DeleteResult()
            class EmptyDelete:
                deleted_count = 0
            return EmptyDelete()

    def delete_many(self, filter_dict=None):
        with self._lock:
            if not filter_dict:
                count = len(self.docs)
                self.docs = []
                if self.db:
                    self.db._save_to_disk()
                class DeleteResult:
                    deleted_count = count
                return DeleteResult()

            initial_len = len(self.docs)
            self.docs = [d for d in self.docs if not _matches_filter(d, filter_dict)]
            deleted_count = initial_len - len(self.docs)
            if self.db:
                self.db._save_to_disk()
            class MultiDeleteResult:
                def __init__(self, c):
                    self.deleted_count = c
            return MultiDeleteResult(deleted_count)

    def count_documents(self, filter_dict=None):
        return len(self.find(filter_dict))


class MemoryDatabase:
    """Persistent local database container when MongoDB daemon is offline."""
    def __init__(self):
        self._collections = {}
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self._data_dir = os.path.join(base_dir, ".data")
        self._storage_file = os.path.join(self._data_dir, "local_db.json")
        self._load_from_disk()

    def _load_from_disk(self):
        if os.path.exists(self._storage_file):
            try:
                with open(self._storage_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for col_name, docs in data.items():
                        col = MemoryCollection(col_name, db=self)
                        col.docs = docs
                        self._collections[col_name] = col
                logger.info(f"Loaded persistent offline store from {self._storage_file}")
            except Exception as e:
                logger.warning(f"Could not load local_db.json: {e}")

    def _save_to_disk(self):
        try:
            os.makedirs(self._data_dir, exist_ok=True)
            export_data = {}
            for col_name, col in self._collections.items():
                export_data[col_name] = col.docs
            with open(self._storage_file, "w", encoding="utf-8") as f:
                json.dump(export_data, f, indent=2, default=str)
        except Exception as e:
            logger.warning(f"Could not save local_db.json: {e}")

    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = MemoryCollection(name, db=self)
        return self._collections[name]

    def get_collection(self, name):
        return self.__getitem__(name)


def get_mongodb_client():
    global _client, _db, _is_connected
    if _client is not None:
        return _client

    try:
        import certifi
        ca_file = certifi.where()
    except Exception:
        ca_file = None

    try:
        kwargs = {
            "serverSelectionTimeoutMS": 15000,
            "tlsAllowInvalidCertificates": True,
        }
        if ca_file:
            kwargs["tlsCAFile"] = ca_file
        _client = MongoClient(MONGODB_URI, **kwargs)
        _client.admin.command('ping')
        _is_connected = True
        logger.info(f"Connected to live MongoDB at {MONGODB_URI}")
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        logger.warning(f"Could not connect to live MongoDB ({e}). Activating persistent offline store.")
        _client = None
        _is_connected = False
    return _client


def get_db():
    global _db
    if _db is not None:
        return _db

    client = get_mongodb_client()
    if client and _is_connected:
        _db = client[MONGODB_DB_NAME]
    else:
        _db = MemoryDatabase()
    return _db


def get_collection(name: str):
    """Convenience helper to get a collection by name."""
    db = get_db()
    return db[name]
