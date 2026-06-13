import unittest
from storage import (
    parse_project_info_text,
    serialize_project_info_text,
    parse_module_text,
    serialize_module_text
)

class TestStorageFormatting(unittest.TestCase):
    def test_project_info_formatting(self):
        info_data = {
            "name": "Inventory Management",
            "description": "Stock management system\nSupports multiple warehouses",
            "tech_stack": "React + FastAPI",
            "notes": "Secure auth required\nNo external internet access"
        }
        
        serialized = serialize_project_info_text(info_data)
        parsed = parse_project_info_text(serialized)
        
        self.assertEqual(parsed["name"], info_data["name"])
        self.assertEqual(parsed["description"], info_data["description"])
        self.assertEqual(parsed["tech_stack"], info_data["tech_stack"])
        self.assertEqual(parsed["notes"], info_data["notes"])

    def test_module_formatting_empty_threats(self):
        name = "Sign In"
        notes = "Allows users to authenticate using email and password.\nJWT token is issued."
        threats = []
        
        serialized = serialize_module_text(name, notes, threats)
        parsed = parse_module_text(serialized)
        
        self.assertEqual(parsed["name"], name)
        self.assertEqual(parsed["notes"], notes)
        self.assertEqual(len(parsed["threats"]), 0)

    def test_module_formatting_with_threats(self):
        name = "Authentication"
        notes = "Notes about credentials login"
        threats = [
            {
                "threat_name": "Credential Stuffing",
                "stride_category": "Spoofing",
                "risk_level": "High",
                "attack_scenario": "Leaked database credentials used to brute-force logins",
                "mitigation": "Enforce Multi-Factor Authentication (MFA) and rate limits"
            },
            {
                "threat_name": "Session Hijacking",
                "stride_category": "Elevation of Privilege",
                "risk_level": "Medium",
                "attack_scenario": "JWT token intercepted via side-channel",
                "mitigation": "Set HttpOnly and Secure flags on auth cookies"
            }
        ]
        
        serialized = serialize_module_text(name, notes, threats)
        parsed = parse_module_text(serialized)
        
        self.assertEqual(parsed["name"], name)
        self.assertEqual(parsed["notes"], notes)
        self.assertEqual(len(parsed["threats"]), 2)
        self.assertEqual(parsed["threats"][0]["threat_name"], "Credential Stuffing")
        self.assertEqual(parsed["threats"][1]["risk_level"], "Medium")
        self.assertEqual(parsed["threats"][1]["stride_category"], "Elevation of Privilege")

if __name__ == "__main__":
    unittest.main()
