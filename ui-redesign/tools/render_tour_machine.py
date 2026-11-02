"""Render the onboarding illustration from our editable Blender equipment model.

blender --background --python tools/render_tour_machine.py -- --preview
blender --background --python tools/render_tour_machine.py -- --animation
The simulator model/GLB is never overwritten. Coordinates below are display units.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist' / 'media'
FRAMES = ROOT / 'model-source' / 'tour-frames'
OUT.mkdir(exist_ok=True)
FRAMES.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'model-source' / 'cmp-polishing-cell.blend'))
scene = bpy.context.scene

def xyz(p): return Vector((p[0], -p[2], p[1]))

def material(name, color, metal, rough):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = rough
    mat.diffuse_color = (*color, 1)
    return mat

material('Housing_Powdercoat', (.76, .82, .9), .12, .3)
material('Brushed_Steel', (.36, .44, .56), .72, .3)
material('Machined_Aluminum', (.67, .75, .87), .68, .25)
material('Anodized_Blue', (.016, .16, .61), .48, .27)
material('Pad_Polyurethane', (.19, .24, .32), .02, .86)
material('Silicon_Back', (.13, .22, .37), .7, .19)
liquid = material('Tour_Slurry', (.08, .61, .77), .22, .21)

# A small setup gap reveals which face approaches the pad. No compression is
# invented here: the real-time simulator keeps its existing section-only zoom.
parts = {name: bpy.data.objects[name] for name in [
    'CmpHeadAssembly', 'CmpRetainer', 'CmpWafer', 'CmpFilm', 'CmpSpindle', 'CmpBellows']}
for frame, gap in [(1,.58), (12,.58), (30,0), (70,0), (90,.58), (96,.58)]:
    head_y = .504 + gap
    for name, height in [('CmpHeadAssembly',head_y), ('CmpRetainer',.48+gap),
                         ('CmpWafer',.486+gap), ('CmpFilm',.48+gap)]:
        obj = parts[name]
        obj.location = xyz((.8,height,.18))
        obj.keyframe_insert(data_path='location', frame=frame)
    bottom = head_y + .67
    for name in ['CmpSpindle','CmpBellows']:
        obj = parts[name]
        obj.location = xyz((.8,(bottom+2.42)/2,.18))
        obj.scale.z = 2.42-bottom
        obj.keyframe_insert(data_path='location', frame=frame)
        obj.keyframe_insert(data_path='scale', frame=frame)

for name, amount in [('CmpPadRotor',1.6), ('CmpHeadAssembly',-2.3), ('CmpWafer',-2.3), ('CmpFilm',-2.3)]:
    obj=bpy.data.objects[name]
    for frame, fraction in [(1,0),(24,0),(76,1),(96,1)]:
        obj.rotation_euler.z = amount*fraction
        obj.keyframe_insert(data_path='rotation_euler',frame=frame)

# Short slurry stream appears only during contact. The blue color identifies
# the supply path; it is not a slurry composition or flow-rate measurement.
for index in range(5):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=.035)
    drop=bpy.context.object
    drop.name=f'Tour slurry droplet {index}'
    drop.scale=(1,1,1.7)
    drop.data.materials.append(liquid)
    for frame in range(1,97):
        drop.location=xyz((-1.55,.85-((frame/9+index/5)%1)*.33,.95))
        drop.hide_render = not 27 <= frame <= 74
        drop.keyframe_insert(data_path='location',frame=frame)
        drop.keyframe_insert(data_path='hide_render',frame=frame)

# Broad studio lights create readable bevels without a noisy environment map.
for obj in list(bpy.data.objects):
    if obj.type in {'LIGHT','CAMERA'}: bpy.data.objects.remove(obj,do_unlink=True)
target=xyz((-.15,.65,-.15))
bpy.ops.object.camera_add(location=xyz((8.5,8.0,11.8)))
camera=bpy.context.object
camera.name='Tour orthographic camera'
camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=11.25
scene.camera=camera
for name,pos,power,size in [('Key softbox',(-4,9,6),1900,7),
                            ('Cool fill',(6,5,0),1100,6),
                            ('Rim softbox',(-2,6,-6),1700,5)]:
    bpy.ops.object.light_add(type='AREA',location=xyz(pos))
    light=bpy.context.object
    light.name=name
    light.data.energy=power
    light.data.shape='DISK'
    light.data.size=size
    light.rotation_euler=(target-light.location).to_track_quat('-Z','Y').to_euler()

bpy.ops.mesh.primitive_plane_add(size=200,location=xyz((0,-.92,0)))
ground=bpy.context.object
ground.name='Tour seamless studio floor'
ground.data.materials.append(material('Tour_Backdrop',(.79,.85,.94),0,.78))
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.81,1,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
scene.render.engine='CYCLES'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.cycles.max_bounces=6
scene.render.resolution_x=1000
scene.render.resolution_y=780
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGB'
scene.render.film_transparent=False
scene.render.fps=24
scene.frame_start=1
scene.frame_end=96
scene.view_settings.view_transform='AgX'
scene['purpose']='Onboarding only; illustrative motion and proportions, not an MRR simulation.'
scene['source_model']='cmp-polishing-cell.blend'
scene['render_script']='tools/render_tour_machine.py'
scene.frame_set(8)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'model-source'/'cmp-tour-studio.blend'))

if '--animation' in sys.argv:
    scene.render.resolution_percentage=72
    scene.cycles.samples=12
    scene.render.filepath=str(FRAMES/'frame-')
    bpy.ops.render.render(animation=True)
else:
    scene.render.filepath=str(OUT/'cmp-tour-poster.png')
    bpy.ops.render.render(write_still=True)
print('CMP_TOUR_RENDER_COMPLETE', flush=True)
