"""Loads invisible-watermark's dwtDct encoder/decoder without its heavy PyTorch-based RivaGAN part."""
import sys
import types

if "imwatermark.rivaGan" not in sys.modules:
    _stub = types.ModuleType("imwatermark.rivaGan")

    class RivaWatermark:  # stand-in: we never use the 'rivaGan' method
        def __init__(self, *args, **kwargs):
            raise RuntimeError("rivaGan is not installed; use the 'dwtDct' method")

    _stub.RivaWatermark = RivaWatermark
    sys.modules["imwatermark.rivaGan"] = _stub

from imwatermark import WatermarkDecoder, WatermarkEncoder  # noqa: E402,F401