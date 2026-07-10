import sys
import unittest
from pathlib import Path


WEBAPP_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(WEBAPP_DIR))

import server  # noqa: E402


class ErrorPayloadTests(unittest.TestCase):
    def test_payload_keeps_backward_compatible_detail(self) -> None:
        payload = server._problem_payload(
            "n must be in [2, 32]",
            code="validation.range",
            params={"field": "N", "min": 2, "max": 32},
        )
        self.assertEqual(payload["detail"], "n must be in [2, 32]")
        self.assertEqual(payload["code"], "validation.range")
        self.assertEqual(payload["params"], {"field": "N", "min": 2, "max": 32})

    def test_connection_failure_has_stable_code(self) -> None:
        payload = server._problem_payload(
            "failed to connect to all addresses; connection refused",
        )
        self.assertEqual(payload["code"], "connection.failed")

    def test_cluster_start_failure_has_stable_code(self) -> None:
        payload = server._problem_payload(
            "party 2 did not start listening on :53102 within 30s",
        )
        self.assertEqual(payload["code"], "cluster.startFailed")

    def test_unknown_bad_input_uses_localizable_validation_fallback(self) -> None:
        payload = server._problem_payload("custom validation failure")
        self.assertEqual(payload["code"], "validation.invalid")


if __name__ == "__main__":
    unittest.main()
