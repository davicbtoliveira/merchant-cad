from django.test import SimpleTestCase

from merchant_cad.settings import BASE_DIR, database_config


class DatabaseConfigTests(SimpleTestCase):
    def test_uses_sqlite_by_default(self):
        config = database_config({})

        self.assertEqual(config["ENGINE"], "django.db.backends.sqlite3")
        self.assertEqual(config["NAME"], BASE_DIR / "db.sqlite3")

    def test_builds_postgres_config_from_environment(self):
        config = database_config(
            {
                "POSTGRES_DB": "merchant_cad",
                "POSTGRES_USER": "merchant_user",
                "POSTGRES_PASSWORD": "merchant_password",
                "POSTGRES_HOST": "postgres",
                "POSTGRES_PORT": "5433",
            }
        )

        self.assertEqual(
            config,
            {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": "merchant_cad",
                "USER": "merchant_user",
                "PASSWORD": "merchant_password",
                "HOST": "postgres",
                "PORT": "5433",
            },
        )

    def test_uses_postgres_defaults_when_only_db_is_set(self):
        config = database_config({"POSTGRES_DB": "merchant_cad"})

        self.assertEqual(
            config,
            {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": "merchant_cad",
                "USER": "postgres",
                "PASSWORD": "postgres",
                "HOST": "localhost",
                "PORT": "5432",
            },
        )
