"""Export an edited .blend without modifying the saved source file.
blender --background model-source/cmp-polishing-cell.blend --python tools/export_cmp_model.py
"""
import bpy
import json
from pathlib import Path
from mathutils import Matrix

ROLES = ['CmpStatic','CmpPadRotor','CmpPadSurface','CmpHeadAssembly','CmpHeadCover',
         'CmpRetainer','CmpWafer','CmpFilm','CmpSpindle','CmpBellows']

# IDs are also used by dist/scene-parts.js. Per-vertex metadata survives batching
# by material, so picking a nozzle cannot accidentally describe the entire base.
def part_id(role, name):
    roles={'CmpHeadAssembly':1,'CmpHeadCover':1,'CmpWafer':2,'CmpFilm':3,
           'CmpRetainer':4,'CmpPadSurface':5,'CmpPadRotor':6,'CmpSpindle':9,'CmpBellows':9}
    if role in roles: return roles[role]
    if name.startswith('Conditioner'): return 8
    if name.startswith(('Nozzle','Stainless slurry','Flexible feed','Feed coupling')): return 7
    if name.startswith(('Tower','Swing','Column','Arm','Drive motor','Motor','Supply cable','Cable clip')): return 10
    return 11

def export_model(root):
    output=root/'dist'/'models';output.mkdir(parents=True,exist_ok=True)
    groups={name:bpy.data.objects.get(name) for name in ROLES}
    missing=[name for name,obj in groups.items() if obj is None or obj.type!='EMPTY']
    if missing: raise ValueError('Missing animation role empties: '+', '.join(missing))
    # Remove only the preview pose. Part geometry stays local to its named role.
    for obj in groups.values():
        obj.location=(0,0,0);obj.rotation_euler=(0,0,0);obj.scale=(1,1,1)
    bpy.context.view_layer.update()
    for role,parent in groups.items():
        parts=[o for o in list(parent.children) if o.type in {'MESH','CURVE'}]
        baked=[]
        for obj in parts:
            identifier=part_id(role,obj.name)
            bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
            bpy.ops.object.convert(target='MESH');obj=bpy.context.object
            attribute=obj.data.attributes.get('_CMP_PART') or obj.data.attributes.new('_CMP_PART','FLOAT','POINT')
            attribute.data.foreach_set('value',[float(identifier)]*len(obj.data.vertices))
            obj.data.transform(obj.matrix_local);obj.matrix_local=Matrix.Identity(4);baked.append(obj)
        if baked:
            bpy.ops.object.select_all(action='DESELECT')
            for obj in baked: obj.select_set(True)
            bpy.context.view_layer.objects.active=baked[0]
            if len(baked)>1: bpy.ops.object.join()
            bpy.context.object.name=role+'_Mesh'
    bpy.ops.object.select_all(action='DESELECT')
    def select_tree(obj):
        obj.select_set(True)
        for child in obj.children: select_tree(child)
    for obj in groups.values():
        if not obj.parent: select_tree(obj)
    bpy.ops.export_scene.gltf(filepath=str(output/'cmp-polishing-cell.glb'),export_format='GLB',use_selection=True,
        export_yup=True,export_apply=True,export_extras=True,export_cameras=False,export_lights=False,
        export_animations=False,export_materials='EXPORT',export_attributes=True)
    report={'authoring':'Blender '+bpy.app.version_string,'source':'model-source/cmp-polishing-cell.blend',
        'asset':'dist/models/cmp-polishing-cell.glb','roles':ROLES,
        'scope':'Single polishing module reconstruction referencing EBARA F-REX300X public architecture; display units, no measured equipment dimensions.',
        'reference':'https://www.ebara.co.jp/jihou/archive/year/detail/__icsFiles/afieldfile/2021/09/22/237_10.pdf',
        'surface_orientation':'Plain backside up; device/frontside and polishing film down against pad.',
        'glb_bytes':(output/'cmp-polishing-cell.glb').stat().st_size,
        'picking_attribute':'_CMP_PART','semantic_part_ids':list(range(1,12))}
    (output/'model-info.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('CMP_MODEL_READY '+json.dumps(report))

if __name__=='__main__': export_model(Path(__file__).resolve().parents[1])
