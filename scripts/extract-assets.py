from PIL import Image, ImageDraw
from pathlib import Path
from collections import deque

root = Path(__file__).resolve().parents[1] / 'public/game'
images = {name: Image.open(root / f'reference-{name}.png').convert('RGBA') for name in ['idle', 'step', 'second', 'scroll', 'hit']}

def extract(name, source, box, polygon=None, key=True):
    image = images[source].crop(box)
    if polygon:
        mask = Image.new('L', image.size)
        ImageDraw.Draw(mask).polygon(polygon, fill=255)
        image.putalpha(mask)
    if key:
        pixels = image.load()
        w, h = image.size
        queue = deque([(x, 0) for x in range(w)] + [(x, h-1) for x in range(w)] + [(0, y) for y in range(h)] + [(w-1, y) for y in range(h)])
        seen = set()
        while queue:
            x,y=queue.popleft()
            if (x,y) in seen or x<0 or y<0 or x>=w or y>=h: continue
            seen.add((x,y))
            r,g,b,a=pixels[x,y]
            if a == 0 or (abs(r-113)<22 and abs(g-110)<22 and abs(b-107)<22 and max(r,g,b)-min(r,g,b)<13):
                pixels[x,y]=(r,g,b,0)
                queue.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
    image.save(root / f'{name}.png')

extract('logo','idle',(48,29,249,67),key=False)
extract('chicken','step',(200,265,309,382))
extract('coin','second',(199,273,311,385))
extract('barrier','step',(195,191,333,263))
extract('truck','step',(1007,192,1109,373),[(12,8),(88,0),(97,17),(97,86),(100,87),(100,134),(95,140),(96,166),(85,180),(17,180),(8,168),(8,141),(1,135),(1,111),(9,109),(9,18)])
extract('icecream','step',(847,156,956,352),[(50,0),(61,4),(76,16),(97,19),(99,126),(106,127),(106,143),(99,145),(99,178),(90,193),(20,195),(12,180),(12,145),(3,143),(3,126),(10,124),(9,40),(14,20),(32,17)])
extract('taxi','scroll',(1010,82,1108,235))
extract('firetruck','second',(358,0,472,190),[(14,72),(99,72),(100,140),(110,142),(110,158),(102,161),(101,182),(88,189),(17,188),(10,180),(10,160),(3,158),(3,142),(12,139)],key=True)
fire=Image.open(root/'firetruck.png').crop((0,72,114,190))
# Extend the cropped rear with the visible ladder texture; the source frame clips the engine.
full=Image.new('RGBA',(114,194))
full.paste(fire.crop((12,0,101,40)).resize((89,86)),(12,0))
full.alpha_composite(fire,(0,76))
full.save(root/'firetruck.png')
extract('hit','hit',(343,260,501,403))
pavement=images['step'].crop((25,73,184,484))
clean=images['idle'].crop((21,112,180,192))
pavement.paste(clean,(0,0))
pavement.save(root/'pavement.png')
print('Extracted 10 reference-based game assets.')
