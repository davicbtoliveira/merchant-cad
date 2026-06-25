# Generated manually for initial Merchant persistence.
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Merchant",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("cnpj", models.CharField(max_length=32, unique=True)),
                ("legal_name", models.CharField(max_length=255)),
                ("trade_name", models.CharField(blank=True, max_length=255)),
                ("contact_email", models.EmailField(max_length=254)),
                ("phone", models.CharField(blank=True, max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("pending_analysis", "Pending analysis"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("blocked", "Blocked"),
                        ],
                        default="draft",
                        editable=False,
                        max_length=32,
                    ),
                ),
            ],
            options={
                "ordering": ["id"],
            },
        ),
    ]

