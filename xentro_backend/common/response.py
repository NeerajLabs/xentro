"""
Standardized API Response Helpers
"""
from rest_framework.response import Response
from rest_framework import status

def api_success(data=None, message="Success", status_code=status.HTTP_200_OK):
    return Response({
        "success": True,
        "message": message,
        "data": data or {}
    }, status=status_code)

def api_error(message="An error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST, extra=None):
    payload = {
        "success": False,
        "message": message,
        "errors": errors or {}
    }
    if extra:
        payload["extra"] = extra
    return Response(payload, status=status_code)
