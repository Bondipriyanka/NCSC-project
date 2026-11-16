import unittest

from fruit_pipeline import estimate_bunch_count


class FruitPipelineOfflineCountTests(unittest.TestCase):
    def test_single_fruit_with_texture_valleys_is_not_bunched(self):
        self.assertEqual(estimate_bunch_count(1, 1, 4000), 1)
        self.assertEqual(estimate_bunch_count(1, 0, 4000), 1)

    def test_real_bunch_has_multiple_blobs(self):
        self.assertEqual(estimate_bunch_count(4, 0, 5000), 4)
        self.assertEqual(estimate_bunch_count(1, 2, 3000), 3)


if __name__ == "__main__":
    unittest.main()
