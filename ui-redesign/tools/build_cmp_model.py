"""Author the CMP teaching cell in Blender, then export the animation-ready GLB.
Run: blender --background --factory-startup --python tools/build_cmp_model.py
Coordinates below are Y-up display units, not equipment measurements.
The .blend retains separate named parts and bevel modifiers; GLB batches by role.
"""
import bpy
import bmesh
import math
import sys
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
from export_cmp_model import export_model

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'model-source'
OUTPUT = ROOT / 'dist' / 'models'
SOURCE.mkdir(exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def xyz(p): return (p[0], -p[2], p[1])

def mat(name, color, metal=0, rough=.4):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = rough
    return m

steel = mat('Brushed_Steel', (.40, .47, .54), .88, .30)
aluminum = mat('Machined_Aluminum', (.63, .69, .73), .80, .24)
chrome = mat('Chrome_Shaft', (.58, .65, .72), .95, .16)
paint = mat('Housing_Powdercoat', (.72, .77, .80), .18, .42)
graphite = mat('Graphite_Housing', (.038, .057, .076), .45, .42)
blue = mat('Anodized_Blue', (.018, .20, .34), .68, .30)
rubber = mat('Rubber_Seals', (.015, .023, .028), .05, .82)
peek = mat('PEEK_Retainer', (.55, .48, .32), .08, .68)
padmat = mat('Pad_Polyurethane', (.26, .24, .20), .02, .90)
silicon = mat('Silicon_Back', (.16, .20, .24), .64, .24)
device = mat('Device_Front', (.12, .20, .28), .64, .24)
film = mat('Illustrative_Film', (.025, .46, .48), .35, .26)
green = mat('Status_Lens', (.035, .48, .30), .20, .25)

groups = {}
def group(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.empty_display_type = 'PLAIN_AXES'
    obj.empty_display_size = .15
    if parent: obj.parent = parent
    obj['cmp_role'] = name
    groups[name] = obj
    return obj

static = group('CmpStatic')
rotor = group('CmpPadRotor')
surface = group('CmpPadSurface', rotor)
head = group('CmpHeadAssembly')
cover = group('CmpHeadCover', head)
retainer = group('CmpRetainer')
wafer = group('CmpWafer')
film_root = group('CmpFilm')
spindle = group('CmpSpindle')
bellows = group('CmpBellows')

def finish(obj, name, material, parent, bevel=0):
    obj.name = name
    obj.data.materials.append(material)
    obj.parent = parent
    if bevel:
        m = obj.modifiers.new('Machined edge radius', 'BEVEL')
        m.width = bevel; m.segments = 3
        m = obj.modifiers.new('Face weighted normals', 'WEIGHTED_NORMAL')
        m.keep_sharp = True; m.weight = 50
    return obj

def box(name, size, pos, material, parent=static, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(pos))
    obj = bpy.context.object
    obj.scale = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, material, parent, bevel)

def cylinder(name, radius, height, pos, material, parent=static, vertices=64, bevel=.008):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=height, location=xyz(pos))
    obj = bpy.context.object
    for p in obj.data.polygons: p.use_smooth = len(p.vertices) == 4
    return finish(obj, name, material, parent, bevel)

def profile(name, section, pos, material, parent=static, segments=96):
    # Closed radial section creates real hollow parts, shoulders, and machined grooves.
    points = []
    for i in range(segments):
        a = i * 2 * math.pi / segments
        points.extend(xyz((pos[0] + r*math.cos(a), pos[1] + y, pos[2] + r*math.sin(a))) for r,y in section)
    n = len(section)
    faces = [(i*n+j, ((i+1)%segments)*n+j, ((i+1)%segments)*n+(j+1)%n, i*n+(j+1)%n)
             for i in range(segments) for j in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(points, [], faces); mesh.update()
    bm = bmesh.new(); bm.from_mesh(mesh); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new(name, mesh); bpy.context.collection.objects.link(obj)
    for p in mesh.polygons: p.use_smooth = True
    return finish(obj, name, material, parent)

def annulus(name, inner, outer, height, pos, material, parent=static, bevel=.012):
    b = min(bevel, height/4, (outer-inner)/4)
    section = [(inner+b,0),(outer-b,0),(outer,b),(outer,height-b),(outer-b,height),
               (inner+b,height),(inner,height-b),(inner,b)]
    return profile(name, section, pos, material, parent)

def pipe(name, points, radius, material, parent=static):
    curve = bpy.data.curves.new(name, 'CURVE'); curve.dimensions = '3D'
    curve.resolution_u = 10; curve.bevel_depth = radius; curve.bevel_resolution = 3
    spline = curve.splines.new('BEZIER'); spline.bezier_points.add(len(points)-1)
    for p, loc in zip(spline.bezier_points, points):
        p.co = xyz(loc); p.handle_left_type = p.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve); bpy.context.collection.objects.link(obj)
    obj.parent = parent; curve.materials.append(material)
    return obj

def bolt(name, pos, parent=static, radius=.06):
    cylinder(name+' washer', radius*1.35, .015, pos, steel, parent, vertices=24, bevel=.002)
    cylinder(name+' head', radius, .045, (pos[0],pos[1]+.025,pos[2]), chrome, parent, vertices=24, bevel=.007)
    # Dark recessed hex mouth, surrounded by a chamfered metal head.
    cylinder(name+' hex socket', radius*.48, .001, (pos[0],pos[1]+.048,pos[2]), graphite, parent, vertices=6, bevel=0)

# Cabinet, drain basin and levelling feet.
box('Rounded machine plinth', (7.5,.22,7.35), (0,-.57,-.12), graphite, bevel=.13)
box('Powder coated base shell', (6.55,.46,6.55), (0,-.30,-.10), paint, bevel=.17)
for x in [-2.8,2.8]:
    for z in [-2.8,2.8]:
        cylinder('Levelling screw', .11,.18,(x,-.73,z),steel,vertices=24)
        cylinder('Rubber levelling foot',.23,.12,(x,-.85,z),rubber,vertices=32,bevel=.025)
annulus('Drain basin wall',3.37,3.63,.23,(0,-.03,0),steel,bevel=.035)
annulus('Rolled splash rim',3.55,3.67,.09,(0,.17,0),aluminum,bevel=.025)
annulus('Black splash seal',3.35,3.40,.025,(0,.04,0),rubber,bevel=.004)
box('Front service inset',(2.2,.26,.035),(0,-.30,3.20),graphite,bevel=.025)
for x in [-.72,-.48,-.24,0,.24,.48]:
    box('Service vent',(.12,.13,.012),(x,-.3,3.222),rubber,bevel=.01)
box('Status lens',(.08,.065,.025),(.82,-.29,3.227),green,bevel=.02)
for x in [-1.0,1.0]:
    obj=cylinder('Service fastener',.035,.015,(x,-.30,3.235),chrome,vertices=24,bevel=.003)
    obj.rotation_euler.x=math.pi/2
    obj=cylinder('Service fastener socket',.017,.002,(x,-.30,3.245),graphite,vertices=6,bevel=0)
    obj.rotation_euler.x=math.pi/2
box('Left access seam',(.016,.30,4.3),(-3.276,-.30,-.05),graphite,bevel=.003)
box('Right access seam',(.016,.30,4.3),(3.276,-.30,-.05),graphite,bevel=.003)

# Rotating platen has lathed steps, a dark gasket, and socket-head fasteners.
profile('Stepped platen',[(0,.10),(3.17,.10),(3.31,.16),(3.34,.21),(3.34,.33),(3.28,.39),(0,.39)],(0,0,0),aluminum,rotor)
annulus('Platen edge gasket',3.27,3.345,.035,(0,.24,0),graphite,rotor,bevel=.007)
annulus('Top polished lip',3.19,3.32,.025,(0,.395,0),chrome,rotor,bevel=.006)
for i in range(16):
    a = i*2*math.pi/16
    bolt('Platen bolt %02d'%i,(3.255*math.cos(a),.404,3.255*math.sin(a)),rotor,.038)

# Pad has actual recessed concentric channels (no flat painted line texture).
cylinder('Pad core',3.20,.05,(0,.445,0),padmat,surface,vertices=128,bevel=.003)
for i in range(20):
    ri = .014 + i*.159
    ro = min(3.20,ri+.145)
    annulus('Pad land %02d'%i,ri,ro,.009,(0,.471,0),padmat,surface,bevel=.0015)

# Rear swing-column carrier support, compact single-table polishing module.
# F-REX300X's one-table/one-head and separate dresser architecture is the reference;
# the following individual dimensions are our illustrative reconstruction, not CAD.
box('Tower mounting block',(1.35,.20,1.0),(.8,-.38,-3.42),steel,bevel=.06)
for x in [.31,1.29]:
    for z in [-3.10,-3.72]: bolt('Tower anchor',(x,-.27,z),radius=.075)
cylinder('Swing column housing',.43,2.67,(.8,1.06,-3.48),paint,bevel=.06)
cylinder('Swing column bearing',.48,.18,(.8,2.36,-3.48),steel,bevel=.025)
annulus('Column lower seal',.42,.46,.06,(.8,.06,-3.48),rubber,bevel=.01)
box('Swing arm chassis',(.77,.31,3.65),(.8,2.50,-1.66),paint,bevel=.12)
box('Arm lower reinforcement',(.44,.08,3.46),(.8,2.31,-1.66),graphite,bevel=.025)
box('Arm access cover',(.48,.022,3.06),(.8,2.666,-1.68),steel,bevel=.01)
for z in [-3.0,-2.2,-1.4,-.6]: bolt('Arm cover screw',(.8,2.68,z),radius=.041)
cylinder('Drive motor housing',.30,.36,(.8,2.44,.18),graphite,bevel=.03)
for y in [2.30,2.37,2.44,2.51,2.58]:
    annulus('Motor cooling ridge',.30,.345,.022,(.8,y,.18),steel,bevel=.005)
cylinder('Motor top cover',.31,.07,(.8,2.66,.18),aluminum,bevel=.02)
pipe('Supply cable sleeve',[(1.25,-.15,-3.76),(1.28,1.9,-3.76),(1.1,2.86,-3.3),(.8,2.88,-1.9),(.8,2.77,.10)],.043,rubber)
for z in [-2.6,-1.8,-1.0]:
    box('Cable clip',(.16,.07,.07),(.8,2.81,z),steel,bevel=.015)

# Separate telescopic spindle and corrugated boot, normalised to unit height.
cylinder('Sliding spindle chrome',.115,1,(0,0,0),chrome,spindle,vertices=48,bevel=.003)
boot_section=[(.13,-.5)]
for i in range(16):
    y=-.5+i/16
    boot_section.extend([(.155,y+.008),(.205,y+.020),(.205,y+.042),(.155,y+.057)])
boot_section.extend([(.13,.5)])
profile('Corrugated spindle boot',boot_section,(0,0,0),rubber,bellows,segments=48)

# Head exterior is a hollow stepped shell, separately toggled in the web viewer.
profile('Carrier shell',[(1.08,.12),(1.28,.12),(1.31,.16),(1.31,.37),(1.26,.42),(1.19,.42),(1.19,.57),(1.13,.62),(.30,.62),(.30,.54),(1.07,.54),(1.07,.18)],(0,0,0),aluminum,cover)
annulus('Carrier shell blue band',1.285,1.315,.11,(0,.22,0),blue,cover,bevel=.008)
annulus('Shell lower seal',1.20,1.29,.035,(0,.09,0),rubber,head,bevel=.005)
annulus('Polished carrier rim',1.08,1.21,.035,(0,.62,0),chrome,head,bevel=.008)
annulus('Membrane clamp',.94,1.19,.07,(0,.012,0),steel,head,bevel=.009)
cylinder('Backing membrane',1.12,.018,(0,.012,0),rubber,head,vertices=96,bevel=.003)
profile('Hub shoulder',[(.16,.62),(.45,.62),(.48,.66),(.48,.77),(.40,.82),(.16,.82)],(0,0,0),blue,head)
annulus('Hub flange',.15,.47,.035,(0,.64,0),chrome,head,bevel=.008)
cylinder('Spindle coupling',.21,.15,(0,.88,0),steel,head,vertices=48,bevel=.018)
for i in range(10):
    a=i*2*math.pi/10
    bolt('Head bolt %02d'%i,(.96*math.cos(a),.63,.96*math.sin(a)),head,.052)
for i in range(6):
    a=i*2*math.pi/6
    bolt('Hub bolt %02d'%i,(.34*math.cos(a),.81,.34*math.sin(a)),head,.030)

# The retaining ring is genuinely open in the middle. Its lower face meets the pad.
annulus('Open retaining ring',1.165,1.31,.12,(0,0,0),peek,retainer,bevel=.012)
annulus('Retaining ring upper clamp',1.20,1.305,.025,(0,.12,0),steel,retainer,bevel=.006)
for i in range(12):
    a=i*2*math.pi/12
    bolt('Retainer screw %02d'%i,(1.25*math.cos(a),.145,1.25*math.sin(a)),retainer,.025)

# Wafer perimeter includes a real orientation notch; film shares the footprint.
def notched_disc(name,height,material,parent,front=None):
    points=[];n=160
    for y in [0,height]:
        for i in range(n):
            a=i*2*math.pi/n
            da=abs((a-math.pi/2+math.pi)%(2*math.pi)-math.pi)
            r=1.15-.075*max(0,1-da/.055)
            points.append(xyz((r*math.cos(a),y,r*math.sin(a))))
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
    me=bpy.data.meshes.new(name);me.from_pydata(points,[],faces);me.update()
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(me);bm.free()
    obj=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(obj)
    finish(obj,name,material,parent)
    if front:
        obj.data.materials.append(front)
        # Blender Z is web Y. Device pattern belongs ONLY to the bottom/front.
        for polygon in obj.data.polygons:
            if polygon.normal.z < -.9: polygon.material_index=1
    return obj
notched_disc('Silicon wafer with notch - plain backside up',.075,silicon,wafer,device)
notched_disc('Front-side polishing film - device face down',1,film,film_root,device)

# Separate pad conditioner, parked outside the polishing track in a rinse cup.
# Included for equipment context, not an invented conditioning process/recipe.
box('Conditioner mounting extension',(1.35,.18,2.0),(-3.55,-.05,-1.45),paint,bevel=.07)
cylinder('Conditioner pivot column',.22,1.27,(-3.16,.59,-2.05),steel,vertices=48,bevel=.02)
cylinder('Conditioner pivot cap',.28,.16,(-3.16,1.27,-2.05),paint,vertices=48,bevel=.03)
obj=box('Conditioner swing arm',(.28,.18,1.40),(-3.37,1.27,-1.40),paint,bevel=.055)
obj.rotation_euler.z=-.30
cylinder('Conditioner short spindle',.085,.43,(-3.58,1.0,-.74),chrome,vertices=32)
cylinder('Conditioner disc carrier',.38,.10,(-3.58,.76,-.74),steel,vertices=64,bevel=.012)
cylinder('Conditioner abrasive underside',.36,.025,(-3.58,.697,-.74),graphite,vertices=64,bevel=.003)
annulus('Conditioner rinse cup',.43,.51,.18,(-3.58,.37,-.74),steel,bevel=.018)
pipe('Conditioner rinse line',[(-3.87,.22,-1.80),(-3.90,.62,-1.15),(-3.70,.61,-.74)],.028,blue)

# Swivel nozzle with hex fittings, hose loops, mounting block and drain connector.
box('Nozzle bracket',(.37,.22,.42),(-3.25,.30,.9),steel,bevel=.025)
bolt('Nozzle bracket screw',(-3.25,.42,.95),radius=.042)
pipe('Stainless slurry gooseneck',[(-3.27,.38,.9),(-3.27,1.08,.9),(-2.85,1.38,.9),(-2.15,1.34,.9),(-1.55,1.10,.95)],.056,steel)
cylinder('Nozzle hex fitting',.105,.14,(-1.55,1.10,.95),steel,vertices=6,bevel=.008)
cylinder('Nozzle blue collar',.092,.09,(-1.55,1.0,.95),blue,vertices=32,bevel=.008)
annulus('Nozzle hollow tip',.030,.060,.10,(-1.55,.86,.95),chrome,bevel=.005)
pipe('Flexible feed hose',[(-3.27,.32,.9),(-3.65,.10,.4),(-3.6,-.25,-.4),(-2.85,-.35,-1.2)],.065,rubber)
cylinder('Feed coupling',.105,.17,(-3.27,.29,.9),blue,vertices=6,bevel=.006)
pipe('Drain return elbow',[(-3.25,-.08,1.8),(-3.65,-.1,1.9),(-3.72,-.46,1.9),(-3.1,-.62,1.9)],.09,graphite)

# Preserve an editable, sensibly posed Blender source with a studio camera.
def pose(obj,pos=(0,0,0),scale=(1,1,1)):
    obj.location=xyz(pos);obj.scale=(scale[0],scale[2],scale[1])
pose(head,(.8,.884,.18),(1,.70,1));pose(retainer,(.8,.86,.18));pose(wafer,(.8,.866,.18),(1,.24,1));pose(film_root,(.8,.86,.18),(1,.006,1))
pose(spindle,(.8,1.98625,.18),(1,.8675,1));pose(bellows,(.8,1.98625,.18),(1,.8675,1))
world=bpy.context.scene.world or bpy.data.worlds.new('Studio')
bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.36,.42,.50,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.7
bpy.ops.object.camera_add(location=xyz((8,6.2,10)))
camera=bpy.context.object;camera.name='Studio overview'
direction=Vector(xyz((0,1,0)))-camera.location
camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();camera.data.lens=48
bpy.context.scene.camera=camera
for name,pos,energy,size in [('Key',(-3,8,4),1800,7),('Fill',(5,5,-4),1000,5)]:
    bpy.ops.object.light_add(type='AREA',location=xyz(pos));l=bpy.context.object;l.name=name;l.data.energy=energy;l.data.shape='DISK';l.data.size=size
    l.rotation_euler=(Vector(xyz((0,1,0)))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.context.scene.render.engine='CYCLES';bpy.context.scene.cycles.samples=32
bpy.context.scene.render.resolution_x=1440;bpy.context.scene.render.resolution_y=1100
bpy.context.scene.render.resolution_percentage=100
bpy.context.scene['model_scope']='Single polishing module reconstruction referencing EBARA F-REX300X public architecture; proportions illustrative, not vendor CAD.'
bpy.context.scene['reference']='https://www.ebara.co.jp/jihou/archive/year/detail/__icsFiles/afieldfile/2021/09/22/237_10.pdf'
bpy.context.scene['build_script']='tools/build_cmp_model.py'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'cmp-polishing-cell.blend'))

# Export batches geometry only after the editable source has been saved.
export_model(ROOT)
