import io
import csv
import datetime
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from integrations.mongodb import get_collection
from common.id_generator import generate_xentro_id
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated, IsXentroAdmin

DEFAULT_OPPORTUNITIES = [
    {
        "id": "opp-gov-sisfs-01",
        "title": "Startup India Seed Fund Scheme (SISFS 2026)",
        "category": "Grant",
        "subcategory": "Government Seed Fund",
        "publisherOrgName": "DPIIT, Ministry of Commerce & Industry",
        "shortDescription": "Financial assistance to early-stage DPIIT-recognized startups for proof of concept, prototype development, product trials, and market entry.",
        "fullDescription": "The Startup India Seed Fund Scheme provides financial assistance up to ₹20 Lakhs as non-dilutive grant for PoC validation, and up to ₹50 Lakhs via convertible debentures for commercialization.",
        "deadline": "2026-12-31",
        "amount": "₹20,00,000 - ₹50,00,000",
        "equity": "No Equity (Non-Dilutive)",
        "eligibility": "DPIIT Recognized Startups, incorporated within 2 years.",
        "location": "India",
        "applyUrl": "https://seedfund.startupindia.gov.in",
        "status": "OPEN",
        "sourceType": "government",
        "applicationsCount": 142,
        "createdAt": "2026-01-15T10:00:00Z"
    },
    {
        "id": "opp-acc-thub-02",
        "title": "T-Hub Global DeepTech Accelerator — Cohort 14",
        "category": "Accelerator",
        "subcategory": "DeepTech & Enterprise AI",
        "publisherOrgName": "T-Hub Hyderabad",
        "shortDescription": "100-day intensive acceleration program for seed-to-Series A startups in AI, Robotics, and Advanced Computing.",
        "fullDescription": "Provides ₹1Cr+ pilot credits, corporate proof-of-concepts, investor syndicate demo day, and tier-1 mentor advising.",
        "deadline": "2026-11-15",
        "amount": "$100,000 in Credits + VC Access",
        "equity": "Zero Equity upfront",
        "eligibility": "B2B SaaS, DeepTech, AI startups with working MVP.",
        "location": "Hyderabad / Hybrid",
        "applyUrl": "https://t-hub.co/accelerator",
        "status": "OPEN",
        "sourceType": "esp",
        "applicationsCount": 89,
        "createdAt": "2026-02-01T10:00:00Z"
    },
    {
        "id": "opp-grant-birac-03",
        "title": "BIRAC Biotechnology Ignition Grant (BIG)",
        "category": "Grant",
        "subcategory": "BioTech & HealthTech",
        "publisherOrgName": "Biotechnology Industry Research Assistance Council (BIRAC)",
        "shortDescription": "Up to ₹50 Lakhs grant support to biotech entrepreneurs for establishing proof-of-concept.",
        "fullDescription": "Fosters generation of ideas with commercialization potential across therapeutics, medical devices, and bio-informatics.",
        "deadline": "2026-10-31",
        "amount": "Up to ₹50,00,000",
        "equity": "100% Non-Dilutive Grant",
        "eligibility": "Indian innovators, startups, and academic researchers.",
        "location": "Pan-India",
        "applyUrl": "https://birac.nic.in",
        "status": "OPEN",
        "sourceType": "government",
        "applicationsCount": 56,
        "createdAt": "2026-02-10T10:00:00Z"
    }
]

class OpportunitiesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        opp_col = get_collection("opportunities")

        # Auto-seed if collection is completely empty
        if opp_col.count_documents({}) == 0:
            opp_col.insert_many(DEFAULT_OPPORTUNITIES)

        category = request.query_params.get("category")
        search = request.query_params.get("search", "").strip().lower()

        query = {"status": "OPEN"}
        if category and category.lower() != "all":
            query["category"] = {"$regex": f"^{category}$", "$options": "i"}

        opps = list(opp_col.find(query, sort=[("createdAt", -1)], limit=100))
        clean = []
        for o in opps:
            o.pop("_id", None)
            if search:
                title_match = search in o.get("title", "").lower()
                desc_match = search in o.get("shortDescription", "").lower() or search in o.get("fullDescription", "").lower()
                org_match = search in o.get("publisherOrgName", "").lower()
                if not (title_match or desc_match or org_match):
                    continue
            clean.append(o)

        return api_success({"opportunities": clean, "total": len(clean)})

    def post(self, request):
        data = request.data
        title = data.get("title", "").strip()
        category = data.get("category", "Grant")
        description = data.get("description", "") or data.get("fullDescription", "")
        deadline = data.get("deadline")
        amount = data.get("amount", "")
        publisher_org = data.get("publisherOrgName", "Xentro Admin")

        if not title:
            return api_error("Title is required.")

        opp_id = generate_xentro_id("opportunity")
        doc = {
            "id": opp_id,
            "creatorId": getattr(request.user, "id", "admin"),
            "title": title,
            "category": category,
            "subcategory": data.get("subcategory", "Open Opportunity"),
            "publisherOrgName": publisher_org,
            "shortDescription": data.get("shortDescription") or description[:200],
            "fullDescription": description,
            "deadline": deadline,
            "amount": amount,
            "equity": data.get("equity", "No Equity"),
            "eligibility": data.get("eligibility", "All Startups"),
            "location": data.get("location", "India"),
            "applyUrl": data.get("applyUrl", ""),
            "status": "OPEN",
            "sourceType": data.get("sourceType", "admin"),
            "applicationsCount": 0,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        opp_col = get_collection("opportunities")
        opp_col.insert_one(doc)
        doc.pop("_id", None)
        return api_success({"opportunity": doc}, "Opportunity listed successfully.", status_code=201)

class ImportOpportunitiesCsvView(APIView):
    """
    Imports and parses opportunities submitted via CSV by administrators.
    Accepts:
      - Multipart file upload ('file')
      - Raw CSV text ('csvContent' or 'csvText')
      - JSON list of opportunity records ('opportunities')
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        opp_col = get_collection("opportunities")
        imported_docs = []

        # 1. Handle JSON array directly
        if "opportunities" in request.data and isinstance(request.data["opportunities"], list):
            for row in request.data["opportunities"]:
                doc = self._parse_row_to_doc(row)
                if doc:
                    imported_docs.append(doc)

        # 2. Handle File or Raw CSV Text
        else:
            csv_content = ""
            if "file" in request.FILES:
                file_obj = request.FILES["file"]
                try:
                    csv_content = file_obj.read().decode("utf-8-sig")
                except UnicodeDecodeError:
                    file_obj.seek(0)
                    csv_content = file_obj.read().decode("latin-1")
            elif "csvContent" in request.data:
                csv_content = request.data["csvContent"]
            elif "csvText" in request.data:
                csv_content = request.data["csvText"]

            if not csv_content.strip() and not imported_docs:
                return api_error("No CSV file or data provided. Please attach a CSV file or provide csvContent.")

            if csv_content.strip():
                try:
                    reader = csv.DictReader(io.StringIO(csv_content))
                    for raw_row in reader:
                        # Clean column headers
                        row = {k.strip().lower() if k else "": v.strip() if v else "" for k, v in raw_row.items()}
                        doc = self._parse_csv_row_to_doc(row)
                        if doc:
                            imported_docs.append(doc)
                except Exception as e:
                    return api_error(f"Failed to parse CSV: {str(e)}")

        if not imported_docs:
            return api_error("No valid opportunities found in the provided CSV.")

        # Bulk insert into MongoDB
        opp_col.insert_many(imported_docs)

        # Clean _id for JSON response
        clean_docs = []
        for d in imported_docs:
            d.pop("_id", None)
            clean_docs.append(d)

        return api_success({
            "importedCount": len(clean_docs),
            "opportunities": clean_docs
        }, f"Successfully imported {len(clean_docs)} opportunities from CSV.")

    def _parse_csv_row_to_doc(self, row: dict) -> dict:
        """Maps various CSV header names flexibly to the standard Opportunity schema."""
        title = (
            row.get("title") or row.get("opportunity title") or
            row.get("name") or row.get("opportunity_title") or row.get("program name")
        )
        if not title:
            return None

        category = (
            row.get("category") or row.get("type") or
            row.get("opportunity type") or "Grant"
        )
        subcategory = row.get("subcategory") or row.get("tags") or "General"
        publisher_org = (
            row.get("organization") or row.get("publisher") or
            row.get("company") or row.get("agency") or
            row.get("institution") or row.get("sponsor") or "Ecosystem Sponsor"
        )
        desc = (
            row.get("description") or row.get("short description") or
            row.get("full description") or row.get("details") or title
        )
        deadline = row.get("deadline") or row.get("due date") or row.get("last date") or "2026-12-31"
        amount = (
            row.get("amount") or row.get("funding") or
            row.get("grant amount") or row.get("prize") or row.get("value") or "Varies"
        )
        equity = row.get("equity") or row.get("equity type") or "No Equity"
        eligibility = row.get("eligibility") or row.get("criteria") or "Startups & Innovators"
        location = row.get("location") or row.get("country") or row.get("city") or "India / Remote"
        apply_url = row.get("url") or row.get("apply url") or row.get("website") or row.get("link") or ""

        return {
            "id": generate_xentro_id("opportunity"),
            "title": title.title(),
            "category": category.title(),
            "subcategory": subcategory.title(),
            "publisherOrgName": publisher_org,
            "shortDescription": desc[:220] + "..." if len(desc) > 220 else desc,
            "fullDescription": desc,
            "deadline": deadline,
            "amount": amount,
            "equity": equity,
            "eligibility": eligibility,
            "location": location,
            "applyUrl": apply_url,
            "status": "OPEN",
            "sourceType": "imported_csv",
            "applicationsCount": 0,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

    def _parse_row_to_doc(self, row: dict) -> dict:
        title = row.get("title")
        if not title:
            return None
        return {
            "id": generate_xentro_id("opportunity"),
            "title": title,
            "category": row.get("category", "Grant"),
            "subcategory": row.get("subcategory", "Ecosystem Call"),
            "publisherOrgName": row.get("publisherOrgName") or row.get("organization", "Ecosystem Partner"),
            "shortDescription": row.get("shortDescription") or row.get("description", title)[:200],
            "fullDescription": row.get("fullDescription") or row.get("description", title),
            "deadline": row.get("deadline", "2026-12-31"),
            "amount": row.get("amount", "Financial Support"),
            "equity": row.get("equity", "No Equity"),
            "eligibility": row.get("eligibility", "Open Eligibility"),
            "location": row.get("location", "India"),
            "applyUrl": row.get("applyUrl", ""),
            "status": "OPEN",
            "sourceType": "imported_csv",
            "applicationsCount": 0,
            "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

class ApplyOpportunityView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request, opp_id):
        proposal = request.data.get("proposal", "")

        app_col = get_collection("applications")
        app_doc = {
            "id": generate_xentro_id("opportunity"),
            "opportunityId": opp_id,
            "applicantId": request.user.id,
            "applicantName": request.user.full_name,
            "proposal": proposal,
            "status": "SUBMITTED",
            "submittedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        app_col.insert_one(app_doc)

        opp_col = get_collection("opportunities")
        opp_col.update_one({"id": opp_id}, {"$inc": {"applicationsCount": 1}})

        app_doc.pop("_id", None)
        return api_success({"application": app_doc}, "Application submitted successfully.")
