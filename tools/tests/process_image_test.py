"""Exercise real CLI exports: preserve RGBA, fine alpha trim, cutout and explicit hard mode."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from PIL import Image

SCRIPT = Path(__file__).resolve().parents[1] / 'process_image.py'

class PreserveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.src = self.root / 'source.png'
        self.out = self.root / 'output.png'
        im = Image.new('RGBA', (7, 5), (0, 0, 0, 0))
        im.putpixel((1, 2), (70, 100, 150, 12))
        im.putpixel((2, 2), (200, 90, 30, 128))
        im.putpixel((3, 2), (20, 40, 100, 255))
        im.save(self.src)

    def tearDown(self):
        self.temp.cleanup()

    def run_cli(self, *flags, ok=True):
        r = subprocess.run([sys.executable, '-I', str(SCRIPT), str(self.src), '-o', str(self.out), *flags], capture_output=True, text=True)
        self.assertEqual(r.returncode == 0, ok, r.stderr)
        if ok:
            with Image.open(self.out) as im:
                return im.copy()

    def test_preserve_is_lossless_without_requested_processing(self):
        result = self.run_cli('--mode', 'preserve')
        with Image.open(self.src) as original:
            self.assertEqual(result.tobytes(), original.tobytes())

    def test_trim_keeps_faint_ink_and_padding(self):
        result = self.run_cli('--mode', 'preserve', '--trim', '--pad', '2')
        self.assertEqual(result.size, (7, 5))
        self.assertEqual(result.getpixel((2, 2)), (70, 100, 150, 12))
        self.assertEqual(result.getpixel((0, 0))[3], 0)

    def test_hard_alpha_requires_explicit_choice(self):
        result = self.run_cli('--mode', 'preserve', '--alpha', 'hard')
        self.assertEqual(result.getpixel((1, 2))[3], 0)
        self.assertEqual(result.getpixel((2, 2)), (200, 90, 30, 255))

    def test_cutout_retains_existing_fractional_alpha(self):
        im = Image.new('RGBA', (7, 5), (255, 255, 255, 255))
        im.putpixel((3, 2), (200, 90, 30, 128)); im.save(self.src)
        result = self.run_cli('--mode', 'preserve', '--cutout', 'color', '--key', '#ffffff', '--despeckle', '0', '--erode', '0')
        self.assertEqual(result.getpixel((3, 2)), (200, 90, 30, 128))
        self.assertEqual(result.getpixel((0, 0))[3], 0)

    def test_preserve_rejects_knockout(self):
        self.run_cli('--mode', 'preserve', '--knockout', ok=False)

if __name__ == '__main__':
    unittest.main()
