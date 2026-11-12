"""Render the six game payloads from one editable, FOSB-inspired Blender prop.
Run blender -b --python tools/build-delivery-shipper.py from the project root.
"""
from pathlib import Path
import math

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
out = root / "dist/media/shipper"
out.mkdir(parents=True, exist_ok=True)
source = root / "model-source/wafer-shipper.blend"
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene

def material(name, color, metal=0, rough=.42, coverage=1):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    tree = m.node_tree
    surface = tree.nodes.get("Principled BSDF")
    surface.inputs["Base Color"].default_value = (*color, 1)
    surface.inputs["Roughness"].default_value = rough
    surface.inputs["Metallic"].default_value = metal
    if coverage < 1:
        mix = tree.nodes.new("ShaderNodeMixShader")
        mix.inputs[0].default_value = coverage
        tree.links.new(tree.nodes.new("ShaderNodeBsdfTransparent").outputs[0], mix.inputs[1])
        tree.links.new(surface.outputs[0], mix.inputs[2])
        tree.links.new(mix.outputs[0], tree.nodes.get("Material Output").inputs["Surface"])
    return m

def box(name, pos, dims, mat, bevel=.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b = obj.modifiers.new("Mold radii", "BEVEL")
        b.width = bevel
        b.segments = 3
        obj.modifiers.new("Face normals", "WEIGHTED_NORMAL")
    obj.data.materials.append(mat)
    return obj

def text_face(name, words, pos, size, mat, font=None):
    data = bpy.data.curves.new(name, "FONT")
    data.body = words
    data.size = size
    data.align_x = "CENTER"
    data.align_y = "CENTER"
    data.extrude = .001
    if font: data.font = font
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler.x = math.pi/2
    data.materials.append(mat)
    return data

ink = material("Deep petrol", (.023,.082,.078))
sage = material("Teal polymer", (.12,.33,.29))
ivory = material("Warm ivory", (.86,.87,.73))
amber = material("Safety amber", (.93,.41,.064))
lining = material("Rear shell", (.16,.24,.25))
clear = material("Clear blue-green PC", (.41,.77,.74), .15,.18,.105)
silicon = material("Polished silicon", (.23,.27,.42), .66,.21)
rim = material("Silicon cut edge", (.69,.72,.78), .45,.24)
font_path = Path("C:/Windows/Fonts/malgunbd.ttf")
font = bpy.data.fonts.load(str(font_path)) if font_path.exists() else None

box("Kinematic shipping base", (0,0,.16), (3.66,3.32,.32), ink,.14)
box("Base shoulder", (0,0,.34), (3.54,3.17,.19), sage,.09)
box("Rear retainer", (0,1.35,1.65),(3.20,.18,2.55),lining,.13)
for side in (-1,1):
    x=side*1.61
    box("Clear shell side",(x,0,1.66),(.09,2.97,2.63),clear,.042)
    box("Rear stiffening rib",(x,1.30,1.62),(.12,.18,2.63),sage)
    for j in range(6):
        z=.62+j*.34
        box("Internal wafer support",(side*1.47,.03,z),(.22,2.1,.067),ivory,.027)
    for y in (-.70,.70):
        box("Side grip standoff",(side*1.74,y,1.93),(.30,.19,.28),sage,.07)
    box("Side carry grip",(side*1.85,0,1.95),(.17,1.58,.27),ink,.08)

box("Shell roof",(0,0,3.00),(3.52,3.00,.16),ivory,.075)
box("Automation flange foot",(0,.07,3.15),(1.35,.78,.20),ink)
box("Automation flange",(0,.07,3.28),(1.84,1.13,.14),sage,.065)
# A closed, framed, transparent front door; latches turn into the front frame.
box("Door window",(0,-1.50,1.67),(3.19,.10,2.50),clear,.045)
for side in (-1,1):
    box("Door gasket side",(side*1.63,-1.53,1.64),(.16,.19,2.75),ink,.064)
    box("Door jamb",(side*1.55,-1.64,1.65),(.18,.13,2.52),sage,.055)
    box("Latch housing",(side*1.49,-1.75,1.70),(.36,.17,.68),ivory,.07)
    box("Rotary lock",(side*1.49,-1.85,1.73),(.24,.05,.25),amber,.045)
    box("Key slot",(side*1.49,-1.89,1.73),(.135,.024,.043),ink,.014)
box("Door header",(0,-1.55,2.91),(3.36,.20,.37),sage,.07)
box("Door sill",(0,-1.55,.44),(3.34,.20,.26),ivory,.06)
box("Shipping placard",(0,-1.669,2.91),(2.00,.031,.285),ivory,.026)
text_face("Shipping label","웨이퍼 납품" if font else "WAFER SHIPPER",(0,-1.691,2.921),.265 if font else .195,ink,font)
for i,w in enumerate([1,2,1,3,2,1,1,2,3,1,2,1]):
    box("Identification bar",(-1.22+i*.056,-1.66,.45),(.012*w,.018,.12),ink,.002)
payload=text_face("Payload tag","LOT   /   06 PCS",(.55,-1.666,.445),.13,ink)
discs=[]
for i in range(6):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1.46,depth=.064, location=(0,-.04,.674+i*.34))
    disc=bpy.context.object
    disc.name=f"Wafer {i+1:02d}"
    disc.data.materials.append(silicon)
    disc.data.materials.append(rim)
    for face in disc.data.polygons:
        if abs(face.normal.z)<.5:
            face.material_index=1
            face.use_smooth=True
    discs.append(disc)

center=Vector((0,0,1.63))
bpy.ops.object.camera_add(location=(5.2,-10.4,5.45))
camera=bpy.context.object
camera.rotation_euler=(center-camera.location).to_track_quat("-Z","Y").to_euler()
camera.data.type="ORTHO"
camera.data.ortho_scale=5.85
scene.camera=camera
scene.world=bpy.data.worlds.new("Soft daylight")
scene.world.use_nodes=True
scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.88,.91,.85,1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value=.58
for pos,power,size in [((-4,-6,7),560,5),((4,-2,5),360,3),((2,5,6),760,4)]:
    bpy.ops.object.light_add(type="AREA",location=pos)
    light=bpy.context.object
    light.data.energy=power;light.data.size=size
    light.rotation_euler=(center-light.location).to_track_quat("-Z","Y").to_euler()
scene.render.engine="CYCLES"
scene.cycles.samples=18
scene.cycles.use_denoising=True
scene.render.resolution_x=560;scene.render.resolution_y=474;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format="PNG"
scene.render.image_settings.color_mode="RGBA"
bpy.ops.wm.save_as_mainfile(filepath=str(source),compress=True)
for count in range(1,7):
    for i,disc in enumerate(discs):disc.hide_render=i>=count
    payload.body=f"LOT   /   {count:02d} PCS"
    scene.render.filepath=str(out/f"fosb-{count}.png")
    bpy.ops.render.render(write_still=True)
