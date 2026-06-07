import fitz
import json

def get_page_info(path):
    doc = fitz.open(path)
    page = doc[0]
    info = {
        "rect": [float(p) for p in page.rect],
        "mediabox": [float(p) for p in page.mediabox],
        "cropbox": [float(p) for p in page.cropbox],
        "rotation": page.rotation,
        "first_span": page.get_text("dict")["blocks"][0]["lines"][0]["spans"][0]["bbox"]
    }
    print(json.dumps(info, indent=4))

if __name__ == "__main__":
    get_page_info("../frontend/public/challan_12.pdf")
