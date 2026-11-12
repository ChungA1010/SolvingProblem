"""Original Blender product studies for the CMP workshop catalog (no external models).
Run: blender --background --python tools/build-shop-assets.py -- [asset-name]
The designs follow the installed workshop silhouettes. They are explanatory game art.
"""
import bpy, math, sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dist/media/workshop-catalog'
SOURCE = ROOT / 'model-source/workshop-catalog'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

def material(name, color, metal=0, rough=.43):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value=(*color,1)
    b.inputs['Metallic'].default_value=metal; b.inputs['Roughness'].default_value=rough
    return m

def cube(name, loc, size, mat, bevel=.045):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object;o.name=name
    o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=3
        o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    return o

def cyl(name,loc,r,depth,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=80,radius=r,depth=depth,location=loc)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    mod=o.modifiers.new('Machined rim','BEVEL');mod.width=min(.024,depth*.16);mod.segments=3
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    for p in o.data.polygons:p.use_smooth=True
    return o

def tube(name, points, radius, mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=3
    poly=curve.splines.new('POLY');poly.points.add(len(points)-1)
    for p,co in zip(poly.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.data.materials.append(mat);return o

def rod(name,a,b,r,mat):
    a,b=Vector(a),Vector(b);o=cyl(name,(a+b)/2,r,(b-a).length,mat)
    o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();return o

def torus(name,loc,r,thickness,mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=96,minor_segments=8,location=loc,major_radius=r,minor_radius=thickness)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

def text(name,value,loc,size,mat):
    c=bpy.data.curves.new(name,'FONT');c.body=value;c.size=size;c.extrude=.0008;c.align_x='CENTER'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(mat)
    return o

def palette():
    return dict(cream=material('Warm powder coat',(.77,.80,.67)),green=material('Sage enamel',(.20,.36,.28),.15),
        dark=material('Deep green rubber',(.035,.09,.075)),gold=material('Satin brass',(.60,.39,.16),.65,.28),
        steel=material('Brushed steel',(.48,.56,.54),.78,.30),wood=material('Oiled oak',(.47,.28,.14)),
        paper=material('Ivory paper',(.95,.87,.66)),mint=material('Display phosphor',(.37,.78,.57),.1),
        cork=material('Natural cork',(.49,.33,.19)),white=material('Ceramic',(.87,.89,.81)))

def make_pad(p,level):
    cyl('Storage cartridge',(0,0,.12),1.48,.24,p['dark'])
    cyl('Pad backing',(0,0,.27),1.43,.13,p['gold'] if level==2 else p['steel'])
    cyl('Microporous polishing surface',(0,0,.365),1.42,.07,p['green'])
    for r in [.22,.43,.64,.85,1.06,1.27]:torus('Concentric slurry channel',(0,0,.404),r,.013,p['dark'])
    for j in range(16):
        a=math.tau*j/16;tube('Radial slurry channel',[(math.cos(a)*.08,math.sin(a)*.08,.404),(math.cos(a)*1.4,math.sin(a)*1.4,.404)],.012,p['dark'])
    cube('Sensor window',(.88,-.28,.413),(.20,.34,.012),p['mint'],.02)
    if level==2:
        cyl('Replacement pad',(0,.32,.04),1.46,.08,p['gold'])
        for j in range(4):cube('Cartridge grip',(1.39*math.cos(j*math.pi/2),1.39*math.sin(j*math.pi/2),.12),(.12,.18,.12),p['steel'],.02)
    cube('Cartridge label',(0,-1.45,.16),(.7,.02,.12),p['cream'],.01)
    text('Identification','PAD / '+('II' if level==2 else 'I'),(0,-1.465,.125),.09,p['dark'])

def make_care(p,level):
    cube('Service case',(0,.15,.19),(2.75,2,.38),p['green'],.12)
    cube('Case lid',(0,.15,.41),(2.66,1.92,.08),p['cream'],.06)
    for x in [-1,1]:cube('Case catch',(x,-.87,.22),(.19,.06,.2),p['gold'],.02)
    cyl('Conditioner backing',(-.25,.1,.54),.74,.16,p['steel'])
    cyl('Working diamond disk',(-.25,.1,.64),.72,.05,p['gold'])
    for x in range(-6,7):
        for y in range(-6,7):
            xx,yy=x*.095,y*.095
            if xx*xx+yy*yy<.42:
                cube('Diamond grit',(-.25+xx,.1+yy,.677),(.035,.035,.015),p['steel'],.003)
    cyl('Drive hub',(-.25,.1,.72),.16,.12,p['steel'])
    for j in range(3):
        x=.72+j*.16;rod('Precision tool',(x,-.5,.49),(x,.49,.49),.025,p['steel']);cube('Tool handle',(x,-.57,.51),(.09,.32,.09),p['gold'],.035)
    if level==2:
        cube('Disk cradle',(0,.94,.72),(2.3,.18,.65),p['green'])
        o=cyl('Replacement high durability disk',(.2,.91,1.2),.63,.08,p['gold']);o.rotation_euler=(math.pi/2,0,0)
        o=cyl('Replacement hub',(.2,.85,1.2),.13,.09,p['steel']);o.rotation_euler=(math.pi/2,0,0)
    text('Identification','CARE / '+('II' if level==2 else 'I'),(0,-.885,.16),.13,p['cream'])

def make_endpoint(p,level):
    cube('Rubber base',(0,0,.08),(1.9,1.35,.16),p['dark'],.08)
    cube('Instrument enclosure',(0,.06,1.02),(1.8,1.08,1.85),p['cream'],.12)
    cube('Display bezel',(0,-.51,1.32),(1.53,.10,1.13),p['green'],.06)
    cube('Screen glass',(0,-.57,1.32),(1.34,.025,.91),p['dark'],.035)
    for z in [1.04,1.22,1.40]:tube('Grid line',[(-.59,-.587,z),(.59,-.587,z)],.004,p['green'])
    tube('Endpoint trace',[(-.57,-.596,1.04),(-.40,-.596,1.09),(-.24,-.596,1.08),(-.05,-.596,1.31),(.11,-.596,1.26),(.28,-.596,1.51),(.55,-.596,1.53)],.014,p['mint'])
    tube('Target threshold',[(-.58,-.60,1.50),(.58,-.60,1.50)],.006,p['gold'])
    text('Display title','ENDPOINT',(0,-.60,1.61),.09,p['cream'])
    for x in [.12,.35,.58]:
        o=cyl('Panel control',(x,-.54,.51),.066,.07,p['green']);o.rotation_euler=(math.pi/2,0,0)
    cube('Status LED',(-.54,-.55,.5),(.24,.04,.07),p['mint'],.025)
    for z in [.55,.72,.89,1.06,1.23,1.4]:cube('Cooling vent',(.904,.05,z),(.014,.52,.035),p['dark'],.01)
    tube('Sensor cable',[(-.8,.45,.45),(-1.2,.5,.28),(-1.22,.15,.10),(-1.15,-.25,.07),(-1.38,-.45,.08)],.036,p['dark'])
    cyl('Optical probe',(-1.39,-.48,.16),.13,.26,p['steel'])
    if level==2:
        cube('Signal processor',(0,.08,2.12),(1.65,.97,.35),p['green'],.06)
        text('Signal label','SIGNAL / II',(0,-.414,2.10),.11,p['cream'])
        cube('Processor LED',(.64,-.42,2.18),(.08,.03,.04),p['mint'],.01)

def make_lamp(p):
    cyl('Weighted base',(0,0,.08),.65,.16,p['dark']);cyl('Brass foot',(0,0,.2),.48,.10,p['gold'])
    a=(0,0,.27);b=(.20,.08,1.4);c=(-.64,.08,2.18)
    for dx in [-.055,.055]:rod('Parallel lower arm',(a[0]+dx,0,a[2]),(b[0]+dx,.08,b[2]),.038,p['gold'])
    rod('Upper articulated arm',b,c,.065,p['green'])
    for co in [b,c]:
        o=cyl('Hinge',co,.13,.19,p['dark']);o.rotation_euler=(math.pi/2,0,0)
        o=cyl('Hinge screw',(co[0],co[1]-.11,co[2]),.052,.03,p['gold']);o.rotation_euler=(math.pi/2,0,0)
    bpy.ops.mesh.primitive_cone_add(vertices=80,radius1=.48,radius2=.13,depth=.43,location=(-.64,.08,1.98));o=bpy.context.object;o.name='Spun metal shade';o.data.materials.append(p['green'])
    cyl('Warm diffuser',(-.64,.08,1.759),.43,.025,p['paper'])
    tube('Power cord',[(0,.16,.18),(.30,.32,.08),(.74,.36,.035),(.95,.10,.035)],.022,p['dark'])

def make_cabinet(p):
    cube('Enamel body',(0,0,1.3),(1.95,1.4,2.45),p['green'],.09)
    cube('Oak countertop',(0,0,2.59),(2.10,1.53,.16),p['wood'],.055)
    for i in range(3):
        z=.53+i*.7;cube('Drawer front',(0,-.73,z),(1.76,.11,.62),p['cream'],.045)
        for x in [-.30,.30]:cube('Handle mount',(x,-.83,z+.06),(.07,.1,.06),p['gold'],.015)
        rod('Drawer pull',(-.33,-.90,z+.06),(.33,-.90,z+.06),.032,p['gold'])
        cube('Label holder',(.57,-.80,z-.14),(.30,.018,.12),p['steel'],.01);cube('Paper label',(.57,-.812,z-.14),(.25,.008,.075),p['paper'],.005)
    for x in [-.72,.72]:
        for y in [-.5,.5]:cyl('Leveling foot',(x,y,.07),.12,.14,p['dark'])
    for i in range(3):cube('Tray box',(-.59+i*.58,.10,2.85),(.48,.84,.34),[p['cream'],p['green'],p['paper']][i],.04)

def make_board(p):
    cube('Oak frame',(0,0,1.20),(2.65,.18,2.4),p['wood'],.05)
    cube('Cork face',(0,-.104,1.20),(2.43,.04,2.18),p['cork'],.025)
    for x,z,w,h,mat in [(-.56,1.57,.95,.93,p['paper']),(.60,1.75,.86,.55,p['cream']),(.25,.61,1.48,.65,p['paper'])]:
        cube('Pinned note',(x,-.135,z),(w,.016,h),mat,.005)
        o=cyl('Pin',(x,-.17,z+h/2-.065),.035,.04,p['green']);o.rotation_euler=(math.pi/2,0,0)
    pts=[(-.56+.31*math.cos(t*math.tau/60),-.151,1.56+.31*math.sin(t*math.tau/60)) for t in range(61)];tube('Wafer sketch',pts,.008,p['green'])
    for j in range(4):tube('Memo rule',[(.26,-.152,1.89-j*.1),(.92-j*.04,-.152,1.89-j*.1)],.007,p['green'])
    tube('Experiment chart',[(-.36,-.154,.39),(-.18,-.154,.56),(.04,-.154,.52),(.22,-.154,.70),(.48,-.154,.63),(.78,-.154,.80)],.012,p['green'])

def make_environment(p):
    cube('Climate unit',(0,0,.66),(2.8,1.03,1.3),p['cream'],.12)
    cube('Top casing',(0,0,1.34),(2.85,1.08,.12),p['green'],.05)
    for z in [.30,.47,.64,.81, .98]:cube('Air louver',(-.34,-.54,z),(1.7,.09,.045),p['steel'],.015)
    cube('Status display',(.98,-.54,.75),(.48,.05,.65),p['dark'],.045)
    text('Climate label','AIR',(.98,-.58,.81),.10,p['cream'])
    cube('Ready LED',(.98,-.59,.57),(.22,.025,.055),p['mint'],.015)

def make_plant(p):
    bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=.45,radius2=.61,depth=.8,location=(0,0,.44));bpy.context.object.name='Ceramic pot';bpy.context.object.data.materials.append(p['cream'])
    torus('Pot rim',(0,0,.85),.60,.045,p['gold']);cyl('Potting soil',(0,0,.84),.55,.04,p['cork'])
    for i in range(9):
        a=i*2.4;top=Vector((math.cos(a)*(.35+(i%3)*.12),math.sin(a)*.4,1.5+(i%4)*.22))
        tube('Plant stem',[(0,0,.85),tuple(top*.65+Vector((0,0,.3))),tuple(top)],.018,p['green'])
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=top);leaf=bpy.context.object;leaf.name='Sculpted leaf';leaf.scale=(.22,.065,.49);leaf.rotation_euler=(.30*math.cos(a),.55*math.sin(a),a);leaf.data.materials.append(p['green'] if i%2 else p['mint'])
        for face in leaf.data.polygons:face.use_smooth=True

def make_clock(p):
    for name,r,d,y,mat in [('Clock case',.84,.18,0,p['green']),('Brass bezel',.79,.04,-.11,p['gold']),('Dial',.73,.018,-.145,p['cream'])]:
        o=cyl(name,(0,y,.88),r,d,mat);o.rotation_euler=(math.pi/2,0,0)
    for i in range(12):
        a=math.tau*i/12;o=cube('Hour marker',(.60*math.sin(a),-.165,.88+.60*math.cos(a)),(.035,.015,.10),p['green'],.006);o.rotation_euler.y=a
    tube('Hour hand',[(0,-.19,.88),(-.23,-.19,1.13)],.027,p['dark']);tube('Minute hand',[(0,-.2,.88),(.36,-.2,1.2)],.018,p['dark'])
    o=cyl('Center cap',(0,-.23,.88),.055,.04,p['gold']);o.rotation_euler=(math.pi/2,0,0)

def make_shelf(p):
    cube('Oak shelf',(0,0,.4),(2.8,.8,.14),p['wood'])
    for x in [-1,1]:cube('Wall bracket',(x,.28,.20),(.12,.12,.40),p['green'],.02)
    for i in range(4):cube('Notebook spine',(-.94+i*.2,.1,.89),(.15,.38,.84),[p['cream'],p['green'],p['paper'],p['gold']][i],.015)
    cube('Storage box',(.61,.05,.72),(.83,.60,.48),p['cream'],.045);cube('Box lid',(.61,.05,.98),(.89,.65,.08),p['green'],.02)
    cube('Box label',(.61,-.258,.74),(.28,.02,.11),p['paper'],.008)

def render(name,kind,level=1):
    bpy.ops.wm.read_factory_settings(use_empty=True);p=palette()
    if kind=='pad':make_pad(p,level)
    elif kind=='care':make_care(p,level)
    elif kind=='endpoint':make_endpoint(p,level)
    elif kind=='task_lamp':make_lamp(p)
    elif kind=='storage_cabinet':make_cabinet(p)
    elif kind=='note_board':make_board(p)
    elif kind=='floor_plant':make_plant(p)
    elif kind=='wall_clock':make_clock(p)
    elif kind=='wall_shelf':make_shelf(p)
    else:make_environment(p)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=40;scene.cycles.use_denoising=True
    scene.render.resolution_x=800;scene.render.resolution_y=680;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA';scene.render.film_transparent=True
    scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.83,.74,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.45
    scene.view_settings.view_transform='AgX'
    objects=[o for o in scene.objects if o.type in ['MESH','CURVE','FONT']];bpy.context.view_layer.update()
    bounds=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box]
    lo=Vector(tuple(min(v[i] for v in bounds) for i in range(3)));hi=Vector(tuple(max(v[i] for v in bounds) for i in range(3)));center=(hi+lo)/2
    bpy.ops.object.camera_add(location=center+Vector((4.5,-7,4.0)));cam=bpy.context.object;cam.name='Catalog camera';cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';scene.camera=cam
    rot=cam.rotation_euler.to_matrix().transposed();projected=[rot@(v-center) for v in bounds];width=max(v.x for v in projected)-min(v.x for v in projected);height=max(v.y for v in projected)-min(v.y for v in projected)
    cam.data.ortho_scale=max(width,height*800/680)*1.32
    # Transparent object study. The catalog supplies a soft ground shadow, avoiding
    # clipped shadow-catcher edges when this image is shown in narrow thumbnails.
    for name2,loc,energy,size in [('Key',(-3,-4,7),450,5),('Rim',(4,2,5),650,4),('Fill',(-4,3,2),180,3)]:
        bpy.ops.object.light_add(type='AREA',location=center+Vector(loc));l=bpy.context.object;l.name=name2;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(center-l.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(OUT/f'{name}.png');bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{name}.blend'));bpy.ops.render.render(write_still=True)
    print('CATALOG_RENDER_DONE',name,flush=True)

items=[('pad-1','pad',1),('pad-2','pad',2),('care-1','care',1),('care-2','care',2),('endpoint-1','endpoint',1),('endpoint-2','endpoint',2),('task_lamp','task_lamp',1),('storage_cabinet','storage_cabinet',1),('note_board','note_board',1),('environment','environment',1),('floor_plant','floor_plant',1),('wall_clock','wall_clock',1),('wall_shelf','wall_shelf',1)]
selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
for item in items:
    if not selected or item[0] in selected:render(*item)
