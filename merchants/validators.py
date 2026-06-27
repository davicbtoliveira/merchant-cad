import re

from rest_framework.exceptions import ValidationError

CNPJ_LENGTH = 14
CNPJ_CHARSET = re.compile(r"^[A-Z0-9]+$")
CNPJ_STRIP_CHARSET = re.compile(r"[.\-/\s]+")

DV1_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
DV2_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

PHONE_PATTERN = re.compile(r"^[0-9]{10,11}$")


class CNPJValidator:
    @staticmethod
    def normalize(value: str) -> str:
        if not isinstance(value, str):
            return ""
        return CNPJ_STRIP_CHARSET.sub("", value).upper()

    @staticmethod
    def validate(value: str) -> str:
        normalized = CNPJValidator.normalize(value)

        if len(normalized) != CNPJ_LENGTH:
            raise ValidationError("CNPJ inválido.")

        if not CNPJ_CHARSET.match(normalized):
            raise ValidationError("CNPJ inválido.")

        if len(set(normalized)) == 1:
            raise ValidationError("CNPJ inválido.")

        if not normalized[12].isdigit() or not normalized[13].isdigit():
            raise ValidationError("CNPJ inválido.")

        if (
            _check_digit(normalized[:12], DV1_WEIGHTS) != normalized[12]
            or _check_digit(normalized[:13], DV2_WEIGHTS) != normalized[13]
        ):
            raise ValidationError("CNPJ inválido.")

        return normalized


def _check_digit(chars: str, weights: list[int]) -> str:
    total = sum((ord(char) - 48) * weight for char, weight in zip(chars, weights))
    remainder = total % 11
    return "0" if remainder < 2 else str(11 - remainder)


class PhoneValidator:
    message = "Telefone deve ter entre 10 e 11 dígitos."

    @staticmethod
    def validate(value: str) -> str:
        if not value:
            return value or ""

        if not isinstance(value, str) or not PHONE_PATTERN.match(value):
            raise ValidationError(PhoneValidator.message)
        return value
