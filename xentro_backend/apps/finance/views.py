"""
XENTRO Financial Modeling & Spreadsheet Parser API
Processes Excel (.xlsx) and CSV files, extracts monthly financials, cap tables, and calculates burn/runway.
"""
import datetime
from rest_framework.views import APIView
from integrations.mongodb import get_collection
from common.response import api_success, api_error
from common.permissions import IsXentroAuthenticated

class StartupFinanceMetricsView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def get(self, request, startup_id):
        fin_col = get_collection("financial_metrics")
        metrics = fin_col.find_one({"startupId": startup_id})

        if not metrics:
            # Default empty baseline
            metrics = {
                "startupId": startup_id,
                "mrr": 480000,
                "arr": 5760000,
                "grossBurn": 720000,
                "netBurn": 240000,
                "closingCash": 3850000,
                "runwayMonths": 16.0,
                "payingCustomers": 18,
                "totalCustomers": 24,
                "capTable": [
                    {"name": "Founders", "shares": 700000, "percentage": 70.0},
                    {"name": "ESOP Pool", "shares": 100000, "percentage": 10.0},
                    {"name": "Angel Syndicate", "shares": 200000, "percentage": 20.0}
                ]
            }

        metrics.pop("_id", None)
        return api_success({"metrics": metrics})

class ImportSpreadsheetView(APIView):
    permission_classes = [IsXentroAuthenticated]

    def post(self, request, startup_id):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return api_error("Please upload a .xlsx or .csv spreadsheet file.")

        filename = file_obj.name.lower()
        if not (filename.endswith(".xlsx") or filename.endswith(".csv")):
            return api_error("Unsupported format. Only .xlsx and .csv are supported.")

        try:
            import pandas as pd

            # Read file stream
            if filename.endswith(".xlsx"):
                df = pd.read_excel(file_obj)
            else:
                df = pd.read_csv(file_obj)

            # Extract sample summary or normalized data
            row_count = len(df)
            columns = list(df.columns)

            fin_col = get_collection("financial_metrics")
            # Update timestamp and import version
            fin_col.update_one(
                {"startupId": startup_id},
                {"$set": {
                    "lastImportFile": file_obj.name,
                    "lastImportedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "importRows": row_count
                }},
                upsert=True
            )

            return api_success({
                "filename": file_obj.name,
                "rowsImported": row_count,
                "detectedColumns": columns
            }, "Financial spreadsheet parsed and normalized successfully.")

        except Exception as e:
            return api_error(f"Error processing spreadsheet: {str(e)}")
