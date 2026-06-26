from rest_framework import status
from rest_framework.exceptions import APIException


class BusinessRuleViolation(APIException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_code = "business_rule_violation"

    def __init__(self, detail: dict):
        super().__init__(detail=detail)
