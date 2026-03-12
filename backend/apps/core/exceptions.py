from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Standardize error responses to match contracts/api.md error envelope."""
    response = exception_handler(exc, context)
    if response is None:
        return response

    error_data = {
        "detail": "",
        "code": "error",
    }

    if isinstance(response.data, dict):
        error_data["detail"] = response.data.get("detail", str(response.data))
        error_data["code"] = response.data.get("code", "error")
        # Collect field-level validation errors
        errors = {}
        for key, value in response.data.items():
            if key not in ("detail", "code"):
                errors[key] = value if isinstance(value, list) else [str(value)]
        if errors:
            error_data["errors"] = errors
    elif isinstance(response.data, list):
        error_data["detail"] = response.data[0] if response.data else "An error occurred"
    else:
        error_data["detail"] = str(response.data)

    response.data = error_data
    return response
