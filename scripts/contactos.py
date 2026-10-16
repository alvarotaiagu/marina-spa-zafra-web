import sys,glob,os,re
from PIL import Image,ImageDraw,ImageOps
src,dst=sys.argv[1],sys.argv[2]
grupos={}
for f in sorted(glob.glob(os.path.join(src,'*.jpg'))):
    g=re.split(r'-\d',os.path.basename(f))[0]; grupos.setdefault(g,[]).append(f)
for g,fs in grupos.items():
    for p in range(0,len(fs),20):
        lote=fs[p:p+20]; W,H=300,533
        hoja=Image.new('RGB',(W*5,(H+24)*((len(lote)+4)//5)),'white'); d=ImageDraw.Draw(hoja)
        for i,f in enumerate(lote):
            im=ImageOps.exif_transpose(Image.open(f)); im.thumbnail((W,H))
            x,y=(i%5)*W,(i//5)*(H+24); hoja.paste(im,(x,y)); d.text((x+4,y+H+4),os.path.basename(f),fill='black')
        hoja.save(os.path.join(dst,f'{g}-{p//20+1}.jpg'),quality=80)
    print(g,len(fs))
