"""Export the SAME saved catalog objects to one self-contained runtime GLB.
Each asset is batched by material; no replacement primitives or external assets.
"""
import bpy, json, hashlib
from pathlib import Path
from mathutils import Matrix
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'model-source/workshop-catalog'
OUT=ROOT/'dist/models';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
assets=['pad-1','pad-2','care-1','care-2','endpoint-1','endpoint-2','task_lamp','storage_cabinet','note_board','environment','floor_plant','wall_clock','wall_shelf']
manifest={}

def batch(name,objects,part=0):
    parent=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(parent)
    baked=[]
    for obj in objects:
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH');obj=bpy.context.object
        obj.data.transform(obj.matrix_world);obj.matrix_world=Matrix.Identity(4)
        attr=obj.data.attributes.get('_CMP_PART') or obj.data.attributes.new('_CMP_PART','FLOAT','POINT');attr.data.foreach_set('value',[float(part)]*len(obj.data.vertices))
        baked.append(obj)
    bpy.ops.object.select_all(action='DESELECT')
    for obj in baked:obj.select_set(True)
    bpy.context.view_layer.objects.active=baked[0]
    if len(baked)>1:bpy.ops.object.join()
    mesh=bpy.context.object;mesh.name=name+'_mesh';mesh.parent=parent
    parent['source_asset']=name;return parent

for name in assets:
    path=SOURCE/f'{name}.blend'
    with bpy.data.libraries.load(str(path),link=False) as (src,dst):dst.objects=src.objects
    objects=[]
    for obj in dst.objects:
        if obj and obj.type in {'MESH','CURVE','FONT'}:
            bpy.context.collection.objects.link(obj);objects.append(obj)
    if name.startswith(('pad-','care-')):
        prefixes=('Pad backing','Microporous polishing surface','Concentric slurry channel','Radial slurry channel','Sensor window') if name.startswith('pad') else ('Conditioner backing','Working diamond disk','Diamond grit','Drive hub')
        copies=[]
        for obj in objects:
            if obj.name.startswith(prefixes):
                copy=obj.copy();copy.data=obj.data.copy();bpy.context.collection.objects.link(copy);copies.append(copy)
        batch('working_'+name.replace('-','_'),copies,5 if name.startswith('pad') else 8)
    parent=batch('shop_'+name.replace('-','_'),objects)
    parent['source_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
    manifest[name]={'node':parent.name,'source':str(path.relative_to(ROOT)).replace('\\','/'),'sha256':parent['source_sha256']}

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT/'workshop-catalog.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False,export_animations=False,export_materials='EXPORT',export_attributes=True)
(OUT/'workshop-catalog.json').write_text(json.dumps({'authoring':bpy.app.version_string,'assets':manifest},indent=2),encoding='utf-8')
print('WORKSHOP_GLB_READY', (OUT/'workshop-catalog.glb').stat().st_size,flush=True)
