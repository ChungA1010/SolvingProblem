var CMPProcessLabScene=(()=>{var Wu=Object.defineProperty;var Ug=Object.getOwnPropertyDescriptor;var Og=Object.getOwnPropertyNames;var Fg=Object.prototype.hasOwnProperty;var fp=(s,t)=>{for(var e in t)Wu(s,e,{get:t[e],enumerable:!0})},Bg=(s,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Og(t))!Fg.call(s,i)&&i!==e&&Wu(s,i,{get:()=>t[i],enumerable:!(n=Ug(t,i))||n.enumerable});return s};var zg=s=>Bg(Wu({},"__esModule",{value:!0}),s);var Gb={};fp(Gb,{create:()=>kb});var Yf={};fp(Yf,{ACESFilmicToneMapping:()=>fu,AddEquation:()=>_s,AddOperation:()=>hf,AdditiveAnimationBlendMode:()=>bu,AdditiveBlending:()=>ru,AgXToneMapping:()=>mu,AlphaFormat:()=>Mu,AlwaysCompare:()=>wu,AlwaysDepth:()=>co,AlwaysStencilFunc:()=>_f,AmbientLight:()=>sl,AnimationAction:()=>pl,AnimationClip:()=>ds,AnimationLoader:()=>yh,AnimationMixer:()=>Lh,AnimationObjectGroup:()=>Ih,AnimationUtils:()=>xh,ArcCurve:()=>Io,ArrayCamera:()=>hl,ArrowHelper:()=>Qh,AttachedBindMode:()=>jc,Audio:()=>dl,AudioAnalyser:()=>Ph,AudioContext:()=>Ma,AudioListener:()=>Rh,AudioLoader:()=>wh,AxesHelper:()=>tu,BackSide:()=>$e,BasicDepthPacking:()=>mf,BasicShadowMap:()=>C0,BatchedMesh:()=>bo,BezierInterpolant:()=>el,Bone:()=>Kr,BooleanKeyframeTrack:()=>vi,Box2:()=>ml,Box3:()=>Ge,Box3Helper:()=>Kh,BoxGeometry:()=>Tn,BoxHelper:()=>Jh,BufferAttribute:()=>ve,BufferGeometry:()=>jt,BufferGeometryLoader:()=>cl,ByteType:()=>_u,Cache:()=>ri,Camera:()=>ir,CameraHelper:()=>$h,CanvasTexture:()=>ta,CapsuleGeometry:()=>Ao,CatmullRomCurve3:()=>Zs,CineonToneMapping:()=>du,CircleGeometry:()=>Ro,ClampToEdgeWrapping:()=>pn,Clock:()=>Bh,Color:()=>Lt,ColorKeyframeTrack:()=>ga,ColorManagement:()=>ie,Compatibility:()=>_m,CompressedArrayTexture:()=>ph,CompressedCubeTexture:()=>mh,CompressedTexture:()=>qs,CompressedTextureLoader:()=>vh,ConeGeometry:()=>ia,ConstantAlphaFactor:()=>of,ConstantColorFactor:()=>rf,Controls:()=>ba,CubeCamera:()=>ar,CubeDepthTexture:()=>ea,CubeReflectionMapping:()=>Si,CubeRefractionMapping:()=>xs,CubeTexture:()=>ls,CubeTextureLoader:()=>Mh,CubicBezierCurve:()=>sa,CubicBezierCurve3:()=>Lo,CubicInterpolant:()=>Qo,CullFaceBack:()=>su,CullFaceFront:()=>Vd,CullFaceFrontBack:()=>R0,CullFaceNone:()=>Gd,Curve:()=>wn,CurvePath:()=>No,CustomBlending:()=>Wd,CustomToneMapping:()=>pu,CylinderGeometry:()=>cs,Cylindrical:()=>zh,Data3DTexture:()=>ks,DataArrayTexture:()=>zs,DataTexture:()=>mn,DataTextureLoader:()=>Sh,DataUtils:()=>ih,DecrementStencilOp:()=>Z0,DecrementWrapStencilOp:()=>J0,DefaultLoadingManager:()=>Cf,DepthFormat:()=>_i,DepthStencilFormat:()=>bi,DepthTexture:()=>yi,DetachedBindMode:()=>uf,DirectionalLight:()=>ps,DirectionalLightHelper:()=>Zh,DiscreteInterpolant:()=>tl,DodecahedronGeometry:()=>Co,DoubleSide:()=>Nn,DstAlphaFactor:()=>Qd,DstColorFactor:()=>ef,DynamicCopyUsage:()=>um,DynamicDrawUsage:()=>rm,DynamicReadUsage:()=>lm,EdgesGeometry:()=>Po,EllipseCurve:()=>Ys,EqualCompare:()=>vf,EqualDepth:()=>uo,EqualStencilFunc:()=>tm,EquirectangularReflectionMapping:()=>wa,EquirectangularRefractionMapping:()=>Aa,Euler:()=>Gn,EventDispatcher:()=>En,ExternalTexture:()=>na,ExtrudeGeometry:()=>Bo,FileLoader:()=>Wn,Float16BufferAttribute:()=>ch,Float32BufferAttribute:()=>Ot,FloatType:()=>ln,Fog:()=>Hs,FogExp2:()=>xo,FramebufferTexture:()=>fh,FrontSide:()=>Xi,Frustum:()=>xi,FrustumArray:()=>jr,GLBufferAttribute:()=>Fh,GLSL1:()=>fm,GLSL3:()=>Au,GreaterCompare:()=>Mf,GreaterDepth:()=>po,GreaterEqualCompare:()=>Tu,GreaterEqualDepth:()=>fo,GreaterEqualStencilFunc:()=>sm,GreaterStencilFunc:()=>nm,GridHelper:()=>qh,Group:()=>si,HTMLTexture:()=>gh,HalfFloatType:()=>qn,HemisphereLight:()=>er,HemisphereLightHelper:()=>Xh,IcosahedronGeometry:()=>zo,ImageBitmapLoader:()=>Th,ImageLoader:()=>fs,ImageUtils:()=>_o,IncrementStencilOp:()=>Y0,IncrementWrapStencilOp:()=>$0,InstancedBufferAttribute:()=>ki,InstancedBufferGeometry:()=>ll,InstancedInterleavedBuffer:()=>Oh,InstancedMesh:()=>Xs,Int16BufferAttribute:()=>oh,Int32BufferAttribute:()=>lh,Int8BufferAttribute:()=>sh,IntType:()=>_l,InterleavedBuffer:()=>Ws,InterleavedBufferAttribute:()=>os,Interpolant:()=>Vi,InterpolateBezier:()=>Qc,InterpolateDiscrete:()=>Gr,InterpolateLinear:()=>go,InterpolateSmooth:()=>io,InterpolationSamplingMode:()=>gm,InterpolationSamplingType:()=>mm,InvertStencilOp:()=>K0,KeepStencilOp:()=>so,KeyframeTrack:()=>_n,LOD:()=>vo,LatheGeometry:()=>ko,Layers:()=>Gs,LessCompare:()=>yf,LessDepth:()=>ho,LessEqualCompare:()=>Eu,LessEqualDepth:()=>Fs,LessEqualStencilFunc:()=>em,LessStencilFunc:()=>Q0,Light:()=>hi,LightProbe:()=>al,LightShadow:()=>nr,Line:()=>oi,Line3:()=>Gh,LineBasicMaterial:()=>Ze,LineCurve:()=>ra,LineCurve3:()=>Do,LineDashedMaterial:()=>jo,LineLoop:()=>Eo,LineSegments:()=>Dn,LinearFilter:()=>Ee,LinearInterpolant:()=>ma,LinearMipMapLinearFilter:()=>N0,LinearMipMapNearestFilter:()=>D0,LinearMipmapLinearFilter:()=>Xn,LinearMipmapNearestFilter:()=>Ra,LinearSRGBColorSpace:()=>Hr,LinearToneMapping:()=>hu,LinearTransfer:()=>Wr,Loader:()=>Qe,LoaderUtils:()=>va,LoadingManager:()=>xa,LoopOnce:()=>df,LoopPingPong:()=>pf,LoopRepeat:()=>ff,MOUSE:()=>Hi,Material:()=>ze,MaterialBlending:()=>P0,MaterialLoader:()=>ol,MathUtils:()=>Cu,Matrix2:()=>kh,Matrix3:()=>$t,Matrix4:()=>Zt,MaxEquation:()=>Zd,Mesh:()=>ue,MeshBasicMaterial:()=>Vn,MeshDepthMaterial:()=>fa,MeshDistanceMaterial:()=>pa,MeshLambertMaterial:()=>js,MeshMatcapMaterial:()=>Ko,MeshNormalMaterial:()=>Jo,MeshPhongMaterial:()=>Zo,MeshPhysicalMaterial:()=>Ks,MeshStandardMaterial:()=>ci,MeshToonMaterial:()=>$o,MinEquation:()=>Yd,MirroredRepeatWrapping:()=>kr,MixOperation:()=>cf,MultiplyBlending:()=>ou,MultiplyOperation:()=>Ea,NearestFilter:()=>Pe,NearestMipMapLinearFilter:()=>L0,NearestMipMapNearestFilter:()=>I0,NearestMipmapLinearFilter:()=>hr,NearestMipmapNearestFilter:()=>gu,NeutralToneMapping:()=>Ta,NeverCompare:()=>xf,NeverDepth:()=>lo,NeverStencilFunc:()=>j0,NoBlending:()=>gs,NoColorSpace:()=>Ti,NoNormalPacking:()=>V0,NoToneMapping:()=>ui,NormalAnimationBlendMode:()=>Ql,NormalBlending:()=>cr,NormalGAPacking:()=>W0,NormalRGPacking:()=>H0,NotEqualCompare:()=>Sf,NotEqualDepth:()=>mo,NotEqualStencilFunc:()=>im,NumberKeyframeTrack:()=>Qs,Object3D:()=>oe,ObjectLoader:()=>Eh,ObjectSpaceNormalMap:()=>gf,OctahedronGeometry:()=>ha,OneFactor:()=>Jd,OneMinusConstantAlphaFactor:()=>lf,OneMinusConstantColorFactor:()=>af,OneMinusDstAlphaFactor:()=>tf,OneMinusDstColorFactor:()=>nf,OneMinusSrcAlphaFactor:()=>cu,OneMinusSrcColorFactor:()=>jd,OrthographicCamera:()=>rr,PCFShadowMap:()=>ms,PCFSoftShadowMap:()=>Hd,PMREMGenerator:()=>fr,Path:()=>hs,PerspectiveCamera:()=>De,Plane:()=>on,PlaneGeometry:()=>li,PlaneHelper:()=>jh,PointLight:()=>sr,PointLightHelper:()=>Wh,Points:()=>To,PointsMaterial:()=>Qr,PolarGridHelper:()=>Yh,PolyhedronGeometry:()=>Gi,PositionalAudio:()=>Ch,PropertyBinding:()=>ge,PropertyMixer:()=>fl,QuadraticBezierCurve:()=>aa,QuadraticBezierCurve3:()=>oa,Quaternion:()=>Ne,QuaternionKeyframeTrack:()=>tr,QuaternionLinearInterpolant:()=>nl,R11_EAC_Format:()=>Pl,RED_GREEN_RGTC2_Format:()=>Ua,RED_RGTC1_Format:()=>Jl,REVISION:()=>kd,RG11_EAC_Format:()=>Na,RGBADepthPacking:()=>z0,RGBAFormat:()=>gn,RGBAIntegerFormat:()=>Sl,RGBA_ASTC_10x10_Format:()=>Wl,RGBA_ASTC_10x5_Format:()=>Gl,RGBA_ASTC_10x6_Format:()=>Vl,RGBA_ASTC_10x8_Format:()=>Hl,RGBA_ASTC_12x10_Format:()=>Xl,RGBA_ASTC_12x12_Format:()=>ql,RGBA_ASTC_4x4_Format:()=>Dl,RGBA_ASTC_5x4_Format:()=>Nl,RGBA_ASTC_5x5_Format:()=>Ul,RGBA_ASTC_6x5_Format:()=>Ol,RGBA_ASTC_6x6_Format:()=>Fl,RGBA_ASTC_8x5_Format:()=>Bl,RGBA_ASTC_8x6_Format:()=>zl,RGBA_ASTC_8x8_Format:()=>kl,RGBA_BPTC_Format:()=>Yl,RGBA_ETC2_EAC_Format:()=>Cl,RGBA_PVRTC_2BPPV1_Format:()=>wl,RGBA_PVRTC_4BPPV1_Format:()=>Tl,RGBA_S3TC_DXT1_Format:()=>Ia,RGBA_S3TC_DXT3_Format:()=>La,RGBA_S3TC_DXT5_Format:()=>Da,RGBDepthPacking:()=>k0,RGBFormat:()=>Su,RGBIntegerFormat:()=>U0,RGB_BPTC_SIGNED_Format:()=>Zl,RGB_BPTC_UNSIGNED_Format:()=>$l,RGB_ETC1_Format:()=>Al,RGB_ETC2_Format:()=>Rl,RGB_PVRTC_2BPPV1_Format:()=>El,RGB_PVRTC_4BPPV1_Format:()=>bl,RGB_S3TC_DXT1_Format:()=>Pa,RGDepthPacking:()=>G0,RGFormat:()=>qi,RGIntegerFormat:()=>Ml,RawShaderMaterial:()=>da,Ray:()=>ai,Raycaster:()=>Sa,RectAreaLight:()=>rl,RedFormat:()=>vl,RedIntegerFormat:()=>Ca,ReinhardToneMapping:()=>uu,RenderObjectRefreshType:()=>xm,RenderTarget:()=>Yr,RenderTarget3D:()=>Dh,RepeatWrapping:()=>Bi,ReplaceStencilOp:()=>q0,ReverseSubtractEquation:()=>qd,RingGeometry:()=>Go,SIGNED_R11_EAC_Format:()=>Il,SIGNED_RED_GREEN_RGTC2_Format:()=>jl,SIGNED_RED_RGTC1_Format:()=>Kl,SIGNED_RG11_EAC_Format:()=>Ll,SRGBColorSpace:()=>je,SRGBTransfer:()=>fe,Scene:()=>zi,ShaderChunk:()=>te,ShaderLib:()=>di,ShaderMaterial:()=>Hn,ShadowMaterial:()=>Yo,Shape:()=>us,ShapeGeometry:()=>Vo,ShapePath:()=>eu,ShapeUtils:()=>kn,ShortType:()=>xu,Skeleton:()=>So,SkeletonHelper:()=>Hh,SkinnedMesh:()=>Mo,Source:()=>th,Sphere:()=>Be,SphereGeometry:()=>ua,Spherical:()=>or,SphericalHarmonics3:()=>ya,SplineCurve:()=>la,SpotLight:()=>il,SpotLightHelper:()=>Vh,Sprite:()=>yo,SpriteMaterial:()=>Jr,SrcAlphaFactor:()=>lu,SrcAlphaSaturateFactor:()=>sf,SrcColorFactor:()=>Kd,StaticCopyUsage:()=>hm,StaticDrawUsage:()=>tc,StaticReadUsage:()=>om,StereoCamera:()=>Ah,StreamCopyUsage:()=>dm,StreamDrawUsage:()=>am,StreamReadUsage:()=>cm,StringKeyframeTrack:()=>Mi,SubtractEquation:()=>Xd,SubtractiveBlending:()=>au,TOUCH:()=>Wi,TangentSpaceNormalMap:()=>Ei,TetrahedronGeometry:()=>Ho,Texture:()=>Ie,TextureLoader:()=>bh,TextureSource:()=>Ln,TextureUtils:()=>nu,Timer:()=>ul,TimestampQuery:()=>pm,TorusGeometry:()=>Wo,TorusKnotGeometry:()=>Xo,Triangle:()=>ii,TriangleFanDrawMode:()=>B0,TriangleStripDrawMode:()=>F0,TrianglesDrawMode:()=>O0,TubeGeometry:()=>Js,UVMapping:()=>gl,Uint16BufferAttribute:()=>Zr,Uint32BufferAttribute:()=>$r,Uint8BufferAttribute:()=>rh,Uint8ClampedBufferAttribute:()=>ah,Uniform:()=>Nh,UniformsGroup:()=>Uh,UniformsLib:()=>Pt,UniformsUtils:()=>Rf,UnsignedByteType:()=>xn,UnsignedInt101111Type:()=>vu,UnsignedInt248Type:()=>ys,UnsignedInt5999Type:()=>yu,UnsignedIntType:()=>Un,UnsignedShort4444Type:()=>xl,UnsignedShort5551Type:()=>yl,UnsignedShortType:()=>ur,VSMShadowMap:()=>lr,Vector2:()=>ct,Vector3:()=>L,Vector4:()=>_e,VectorKeyframeTrack:()=>_a,VideoFrameTexture:()=>dh,VideoTexture:()=>wo,WebGL3DRenderTarget:()=>nh,WebGLArrayRenderTarget:()=>eh,WebGLCoordinateSystem:()=>bn,WebGLCubeRenderTarget:()=>Fa,WebGLRenderTarget:()=>cn,WebGLRenderer:()=>ic,WebGLUtils:()=>dg,WebGPUCoordinateSystem:()=>rs,WebXRController:()=>Vs,WireframeGeometry:()=>qo,WrapAroundEnding:()=>Vr,ZeroCurvatureEnding:()=>is,ZeroFactor:()=>$d,ZeroSlopeEnding:()=>ss,ZeroStencilOp:()=>X0,createCanvasElement:()=>bf,error:()=>Ht,getConsoleFunction:()=>Mm,log:()=>qr,setConsoleFunction:()=>vm,warn:()=>Rt,warnOnce:()=>gi});var kd="187",Hi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Wi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Gd=0,su=1,Vd=2,R0=3,C0=0,ms=1,Hd=2,lr=3,Xi=0,$e=1,Nn=2,gs=0,cr=1,ru=2,au=3,ou=4,Wd=5,P0=6,_s=100,Xd=101,qd=102,Yd=103,Zd=104,$d=200,Jd=201,Kd=202,jd=203,lu=204,cu=205,Qd=206,tf=207,ef=208,nf=209,sf=210,rf=211,af=212,of=213,lf=214,lo=0,co=1,ho=2,Fs=3,uo=4,fo=5,po=6,mo=7,Ea=0,cf=1,hf=2,ui=0,hu=1,uu=2,du=3,fu=4,pu=5,mu=6,Ta=7,jc="attached",uf="detached",gl=300,Si=301,xs=302,wa=303,Aa=304,Bi=1e3,pn=1001,kr=1002,Pe=1003,gu=1004,I0=1004,hr=1005,L0=1005,Ee=1006,Ra=1007,D0=1007,Xn=1008,N0=1008,xn=1009,_u=1010,xu=1011,ur=1012,_l=1013,Un=1014,ln=1015,qn=1016,xl=1017,yl=1018,ys=1020,yu=35902,vu=35899,Mu=1021,Su=1022,gn=1023,_i=1026,bi=1027,vl=1028,Ca=1029,qi=1030,Ml=1031,U0=1032,Sl=1033,Pa=33776,Ia=33777,La=33778,Da=33779,bl=35840,El=35841,Tl=35842,wl=35843,Al=36196,Rl=37492,Cl=37496,Pl=37488,Il=37489,Na=37490,Ll=37491,Dl=37808,Nl=37809,Ul=37810,Ol=37811,Fl=37812,Bl=37813,zl=37814,kl=37815,Gl=37816,Vl=37817,Hl=37818,Wl=37819,Xl=37820,ql=37821,Yl=36492,Zl=36494,$l=36495,Jl=36283,Kl=36284,Ua=36285,jl=36286,df=2200,ff=2201,pf=2202,Gr=2300,go=2301,io=2302,Qc=2303,is=2400,ss=2401,Vr=2402,Ql=2500,bu=2501,O0=0,F0=1,B0=2,mf=3200,z0=3201,k0=3202,G0=3203,Ei=0,gf=1,Ti="",je="srgb",Hr="srgb-linear",Wr="linear",fe="srgb",V0="",H0="rg",W0="ga",X0=0,so=7680,q0=7681,Y0=7682,Z0=7683,$0=34055,J0=34056,K0=5386,j0=512,Q0=513,tm=514,em=515,nm=516,im=517,sm=518,_f=519,xf=512,yf=513,vf=514,Eu=515,Mf=516,Sf=517,Tu=518,wu=519,tc=35044,rm=35048,am=35040,om=35045,lm=35049,cm=35041,hm=35046,um=35050,dm=35042,fm="100",Au="300 es",bn=2e3,rs=2001,pm={COMPUTE:"compute",RENDER:"render"},mm={PERSPECTIVE:"perspective",LINEAR:"linear",FLAT:"flat"},gm={NORMAL:"normal",CENTROID:"centroid",SAMPLE:"sample",FIRST:"first",EITHER:"either"},_m={TEXTURE_COMPARE:"depthTextureCompare"},xm={NONE:0,SHARED:1,FULL:2};function kg(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}var Gg={Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array};function Fr(s,t){return new Gg[s](t)}function ym(s){return ArrayBuffer.isView(s)&&!(s instanceof DataView)}function Xr(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function bf(){let s=Xr("canvas");return s.style.display="block",s}var pp={},as=null;function vm(s){as=s}function Mm(){return as}function qr(...s){let t="THREE."+s.shift();as?as("log",t,...s):console.log(t,...s)}function Sm(s){let t=s[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=s[1];e&&e.isStackTrace?s[0]+=" "+e.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function Rt(...s){s=Sm(s);let t="THREE."+s.shift();if(as)as("warn",t,...s);else{let e=s[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...s)}}function Ht(...s){s=Sm(s);let t="THREE."+s.shift();if(as)as("error",t,...s);else{let e=s[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...s)}}function gi(...s){let t=s.join(" ");t in pp||(pp[t]=!0,Rt(...s))}function bm(s,t,e){return new Promise(function(n,i){function r(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:i();break;case s.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var Em={[lo]:lo,[ho]:po,[uo]:uo,[Fs]:fo,[co]:co,[po]:ho,[mo]:mo,[fo]:Fs},En=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let i=n[t];if(i!==void 0){let r=i.indexOf(e);r!==-1&&i.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let i=n.slice(0);for(let r=0,a=i.length;r<a;r++)i[r].call(this,t);t.target=null}}},nn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],mp=1234567,Os=Math.PI/180,Bs=180/Math.PI;function Yn(){let s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(nn[s&255]+nn[s>>8&255]+nn[s>>16&255]+nn[s>>24&255]+"-"+nn[t&255]+nn[t>>8&255]+"-"+nn[t>>16&15|64]+nn[t>>24&255]+"-"+nn[e&63|128]+nn[e>>8&255]+"-"+nn[e>>16&255]+nn[e>>24&255]+nn[n&255]+nn[n>>8&255]+nn[n>>16&255]+nn[n>>24&255]).toLowerCase()}function Yt(s,t,e){return Math.max(t,Math.min(e,s))}function Ef(s,t){return(s%t+t)%t}function Vg(s,t,e,n,i){return n+(s-t)*(i-n)/(e-t)}function Hg(s,t,e){return s!==t?(e-s)/(t-s):0}function ro(s,t,e){return(1-e)*s+e*t}function Wg(s,t,e,n){return ro(s,t,1-Math.exp(-e*n))}function Xg(s,t=1){return t-Math.abs(Ef(s,t*2)-t)}function qg(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*(3-2*s))}function Yg(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*s*(s*(s*6-15)+10))}function Zg(s,t){return s+Math.floor(Math.random()*(t-s+1))}function $g(s,t){return s+Math.random()*(t-s)}function Jg(s){return s*(.5-Math.random())}function Kg(s){s!==void 0&&(mp=s);let t=mp+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function jg(s){return s*Os}function Qg(s){return s*Bs}function t_(s){return s>0&&Number.isInteger(s)&&2**Math.round(Math.log2(s))===s}function e_(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function Tf(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function n_(s,t,e,n,i){let r=Math.cos,a=Math.sin,o=r(e/2),l=a(e/2),c=r((t+n)/2),h=a((t+n)/2),u=r((t-n)/2),f=a((t-n)/2),d=r((n-t)/2),p=a((n-t)/2);switch(i){case"XYX":s.set(o*h,l*u,l*f,o*c);break;case"YZY":s.set(l*f,o*h,l*u,o*c);break;case"ZXZ":s.set(l*u,l*f,o*h,o*c);break;case"XZX":s.set(o*h,l*p,l*d,o*c);break;case"YXY":s.set(l*d,o*h,l*p,o*c);break;case"ZYZ":s.set(l*p,l*d,o*h,o*c);break;default:Rt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+i)}}function Ru(s){switch(s.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function Us(s,t){if(t.constructor===Float32Array)return s;let e=Ru(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(s/e,-1)}function an(s,t){if(t.constructor===Float32Array)return s;let e=Ru(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(s*e)}var Cu={DEG2RAD:Os,RAD2DEG:Bs,generateUUID:Yn,clamp:Yt,euclideanModulo:Ef,mapLinear:Vg,inverseLerp:Hg,lerp:ro,damp:Wg,pingpong:Xg,smoothstep:qg,smootherstep:Yg,randInt:Zg,randFloat:$g,randFloatSpread:Jg,seededRandom:Kg,degToRad:jg,radToDeg:Qg,isPowerOfTwo:t_,ceilPowerOfTwo:e_,floorPowerOfTwo:Tf,setQuaternionFromProperEuler:n_,normalize:an,denormalize:Us},Lf=class Lf{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Yt(this.x,t.x,e.x),this.y=Yt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Yt(this.x,t,e),this.y=Yt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Yt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Yt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),i=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*i+t.x,this.y=r*i+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Lf.prototype.isVector2=!0;var ct=Lf,Ne=class{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,r,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3],f=r[a+0],d=r[a+1],p=r[a+2],_=r[a+3];if(u!==_||l!==f||c!==d||h!==p){let m=l*f+c*d+h*p+u*_;m<0&&(f=-f,d=-d,p=-p,_=-_,m=-m);let g=1-o;if(m<.9995){let y=Math.acos(m),M=Math.sin(y);g=Math.sin(g*y)/M,o=Math.sin(o*y)/M,l=l*g+f*o,c=c*g+d*o,h=h*g+p*o,u=u*g+_*o}else{l=l*g+f*o,c=c*g+d*o,h=h*g+p*o,u=u*g+_*o;let y=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=y,c*=y,h*=y,u*=y}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,r,a){let o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=r[a],f=r[a+1],d=r[a+2],p=r[a+3];return t[e]=o*p+h*u+l*d-c*f,t[e+1]=l*p+h*f+c*u-o*d,t[e+2]=c*p+h*d+o*f-l*u,t[e+3]=h*p-o*u-l*f-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,i=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(r/2),f=l(n/2),d=l(i/2),p=l(r/2);switch(a){case"XYZ":this._x=f*h*u+c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u-f*d*p;break;case"YXZ":this._x=f*h*u+c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u+f*d*p;break;case"ZXY":this._x=f*h*u-c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u-f*d*p;break;case"ZYX":this._x=f*h*u-c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u+f*d*p;break;case"YZX":this._x=f*h*u+c*d*p,this._y=c*d*u+f*h*p,this._z=c*h*p-f*d*u,this._w=c*h*u-f*d*p;break;case"XZY":this._x=f*h*u-c*d*p,this._y=c*d*u-f*h*p,this._z=c*h*p+f*d*u,this._w=c*h*u+f*d*p;break;default:Rt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],i=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],u=e[10],f=n+o+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(a-i)*d}else if(n>o&&n>u){let d=2*Math.sqrt(1+n-o-u);this._w=(h-l)/d,this._x=.25*d,this._y=(i+a)/d,this._z=(r+c)/d}else if(o>u){let d=2*Math.sqrt(1+o-n-u);this._w=(r-c)/d,this._x=(i+a)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-n-o);this._w=(a-i)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Yt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,i=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+i*c-r*l,this._y=i*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,i=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,i=-i,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+i*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Df=class Df{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(gp.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(gp.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*i,this.y=r[1]*e+r[4]*n+r[7]*i,this.z=r[2]*e+r[5]*n+r[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*i+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*i+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*i+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*i+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,i=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*i-o*n),h=2*(o*e-r*i),u=2*(r*n-a*e);return this.x=e+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=i+l*u+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,i=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i,this.y=r[1]*e+r[5]*n+r[9]*i,this.z=r[2]*e+r[6]*n+r[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Yt(this.x,t.x,e.x),this.y=Yt(this.y,t.y,e.y),this.z=Yt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Yt(this.x,t,e),this.y=Yt(this.y,t,e),this.z=Yt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Yt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,i=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=i*l-r*o,this.y=r*a-n*l,this.z=n*o-i*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Xu.copy(this).projectOnVector(t),this.sub(Xu)}reflect(t){return this.sub(Xu.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Yt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Df.prototype.isVector3=!0;var L=Df,Xu=new L,gp=new Ne,Nf=class Nf{constructor(t,e,n,i,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,c)}set(t,e,n,i,r,a,o,l,c){let h=this.elements;return h[0]=t,h[1]=i,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],p=n[8],_=i[0],m=i[3],g=i[6],y=i[1],M=i[4],v=i[7],w=i[2],E=i[5],x=i[8];return r[0]=a*_+o*y+l*w,r[3]=a*m+o*M+l*E,r[6]=a*g+o*v+l*x,r[1]=c*_+h*y+u*w,r[4]=c*m+h*M+u*E,r[7]=c*g+h*v+u*x,r[2]=f*_+d*y+p*w,r[5]=f*m+d*M+p*E,r[8]=f*g+d*v+p*x,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+i*r*c-i*a*l}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=h*a-o*c,f=o*l-h*r,d=c*r-a*l,p=e*u+n*f+i*d;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let _=1/p;return t[0]=u*_,t[1]=(i*c-h*n)*_,t[2]=(o*n-i*a)*_,t[3]=f*_,t[4]=(h*e-i*l)*_,t[5]=(i*r-o*e)*_,t[6]=d*_,t[7]=(n*l-c*e)*_,t[8]=(a*e-n*r)*_,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-i*c,i*l,-i*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return gi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(qu.makeScale(t,e)),this}rotate(t){return gi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(qu.makeRotation(-t)),this}translate(t,e){return gi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(qu.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Nf.prototype.isMatrix3=!0;var $t=Nf,qu=new $t,_p=new $t().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xp=new $t().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function i_(){let s={enabled:!0,workingColorSpace:Hr,spaces:{},convert:function(i,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===fe&&(i.r=Fi(i.r),i.g=Fi(i.g),i.b=Fi(i.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(i.applyMatrix3(this.spaces[r].toXYZ),i.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===fe&&(i.r=zr(i.r),i.g=zr(i.g),i.b=zr(i.b))),i},workingToColorSpace:function(i,r){return this.convert(i,this.workingColorSpace,r)},colorSpaceToWorking:function(i,r){return this.convert(i,r,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===Ti?Wr:this.spaces[i].transfer},getToneMappingMode:function(i){return this.spaces[i].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(i,r=this.workingColorSpace){return i.fromArray(this.spaces[r].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,r,a){return i.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return s.define({[Hr]:{primaries:t,whitePoint:n,transfer:Wr,toXYZ:_p,fromXYZ:xp,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:je},outputColorSpaceConfig:{drawingBufferColorSpace:je}},[je]:{primaries:t,whitePoint:n,transfer:fe,toXYZ:_p,fromXYZ:xp,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:je}}}),s}var ie=i_();function Fi(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function zr(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}var _r,_o=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{_r===void 0&&(_r=Xr("canvas")),_r.width=t.width,_r.height=t.height;let i=_r.getContext("2d");t instanceof ImageData?i.putImageData(t,0,0):i.drawImage(t,0,0,t.width,t.height),n=_r}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Xr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let i=n.getImageData(0,0,t.width,t.height),r=i.data;for(let a=0;a<r.length;a++)r[a]=Fi(r[a]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Fi(e[n]/255)*255):e[n]=Fi(e[n]);return{data:e,width:t.width,height:t.height}}else return Rt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},s_=0,Ln=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:s_++}),this.uuid=Yn(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let r;if(Array.isArray(i)){r=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?r.push(Yu(i[a].image)):r.push(Yu(i[a]))}else r=Yu(i);n.url=r}return e||(t.images[this.uuid]=n),n}};function Yu(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?_o.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(Rt("Texture: Unable to serialize Texture."),{})}var th=class extends Ln{constructor(t=null){gi('Source: "Source" has been renamed to "TextureSource". Please update your code to use "THREE.TextureSource" instead.'),super(t),this.isSource=!0}},r_=0,Zu=new L,Ie=class s extends En{constructor(t=s.DEFAULT_IMAGE,e=s.DEFAULT_MAPPING,n=pn,i=pn,r=Ee,a=Xn,o=gn,l=xn,c=s.DEFAULT_ANISOTROPY,h=Ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:r_++}),this.uuid=Yn(),this.name="",this.source=new Ln(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ct(0,0),this.repeat=new ct(1,1),this.center=new ct(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new $t,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Zu).x}get height(){return this.source.getSize(Zu).y}get depth(){return this.source.getSize(Zu).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Rt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Rt(`Texture.setValues(): property '${e}' does not exist.`);continue}i&&n&&i.isVector2&&n.isVector2||i&&n&&i.isVector3&&n.isVector3||i&&n&&i.isMatrix3&&n.isMatrix3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==gl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Bi:t.x=t.x-Math.floor(t.x);break;case pn:t.x=t.x<0?0:1;break;case kr:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Bi:t.y=t.y-Math.floor(t.y);break;case pn:t.y=t.y<0?0:1;break;case kr:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ie.DEFAULT_IMAGE=null;Ie.DEFAULT_MAPPING=gl;Ie.DEFAULT_ANISOTROPY=1;var Uf=class Uf{constructor(t=0,e=0,n=0,i=1){this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,i=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*i+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*i+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*i+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*i+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,r,l=t.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],p=l[9],_=l[2],m=l[6],g=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-_)<.01&&Math.abs(p-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+_)<.1&&Math.abs(p+m)<.1&&Math.abs(c+d+g-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let M=(c+1)/2,v=(d+1)/2,w=(g+1)/2,E=(h+f)/4,x=(u+_)/4,S=(p+m)/4;return M>v&&M>w?M<.01?(n=0,i=.707106781,r=.707106781):(n=Math.sqrt(M),i=E/n,r=x/n):v>w?v<.01?(n=.707106781,i=0,r=.707106781):(i=Math.sqrt(v),n=E/i,r=S/i):w<.01?(n=.707106781,i=.707106781,r=0):(r=Math.sqrt(w),n=x/r,i=S/r),this.set(n,i,r,e),this}let y=Math.sqrt((m-p)*(m-p)+(u-_)*(u-_)+(f-h)*(f-h));return Math.abs(y)<.001&&(y=1),this.x=(m-p)/y,this.y=(u-_)/y,this.z=(f-h)/y,this.w=Math.acos((c+d+g-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Yt(this.x,t.x,e.x),this.y=Yt(this.y,t.y,e.y),this.z=Yt(this.z,t.z,e.z),this.w=Yt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Yt(this.x,t,e),this.y=Yt(this.y,t,e),this.z=Yt(this.z,t,e),this.w=Yt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Yt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Uf.prototype.isVector4=!0;var _e=Uf,Yr=class extends En{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ee,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new _e(0,0,t,e),this.scissorTest=!1,this.viewport=new _e(0,0,t,e),this.textures=[];let i=n.count;for(let r=0;r<i;r++)this.textures[r]=new Ie({width:t,height:e,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:Ee,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,r=this.textures.length;i<r;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n,this.textures[i].isData3DTexture!==!0&&(this.textures[i].isArrayTexture=this.textures[i].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let i=Object.assign({},t.textures[e].image);this.textures[e].source=new Ln(i)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},cn=class extends Yr{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},zs=class extends Ie{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Pe,this.minFilter=Pe,this.wrapR=pn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}},eh=class extends cn{constructor(t=1,e=1,n=1,i={}){super(t,e,i),this.isWebGLArrayRenderTarget=!0,this.depth=n,this.texture=new zs(null,t,e,n),this._setTextureOptions(i),this.texture.isRenderTargetTexture=!0}},ks=class extends Ie{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Pe,this.minFilter=Pe,this.wrapR=pn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}},nh=class extends cn{constructor(t=1,e=1,n=1,i={}){super(t,e,i),this.isWebGL3DRenderTarget=!0,this.depth=n,this.texture=new ks(null,t,e,n),this._setTextureOptions(i),this.texture.isRenderTargetTexture=!0}},iu=class iu{constructor(t,e,n,i,r,a,o,l,c,h,u,f,d,p,_,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,r,a,o,l,c,h,u,f,d,p,_,m)}set(t,e,n,i,r,a,o,l,c,h,u,f,d,p,_,m){let g=this.elements;return g[0]=t,g[4]=e,g[8]=n,g[12]=i,g[1]=r,g[5]=a,g[9]=o,g[13]=l,g[2]=c,g[6]=h,g[10]=u,g[14]=f,g[3]=d,g[7]=p,g[11]=_,g[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new iu().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,i=1/xr.setFromMatrixColumn(t,0).length(),r=1/xr.setFromMatrixColumn(t,1).length(),a=1/xr.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,i=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let f=a*h,d=a*u,p=o*h,_=o*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=d+p*c,e[5]=f-_*c,e[9]=-o*l,e[2]=_-f*c,e[6]=p+d*c,e[10]=a*l}else if(t.order==="YXZ"){let f=l*h,d=l*u,p=c*h,_=c*u;e[0]=f+_*o,e[4]=p*o-d,e[8]=a*c,e[1]=a*u,e[5]=a*h,e[9]=-o,e[2]=d*o-p,e[6]=_+f*o,e[10]=a*l}else if(t.order==="ZXY"){let f=l*h,d=l*u,p=c*h,_=c*u;e[0]=f-_*o,e[4]=-a*u,e[8]=p+d*o,e[1]=d+p*o,e[5]=a*h,e[9]=_-f*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let f=a*h,d=a*u,p=o*h,_=o*u;e[0]=l*h,e[4]=p*c-d,e[8]=f*c+_,e[1]=l*u,e[5]=_*c+f,e[9]=d*c-p,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let f=a*l,d=a*c,p=o*l,_=o*c;e[0]=l*h,e[4]=_-f*u,e[8]=p*u+d,e[1]=u,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=d*u+p,e[10]=f-_*u}else if(t.order==="XZY"){let f=a*l,d=a*c,p=o*l,_=o*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=f*u+_,e[5]=a*h,e[9]=d*u-p,e[2]=p*u-d,e[6]=o*h,e[10]=_*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(a_,t,o_)}lookAt(t,e,n){let i=this.elements;return Pn.subVectors(t,e),Pn.lengthSq()===0&&(Pn.z=1),Pn.normalize(),Ki.crossVectors(n,Pn),Ki.lengthSq()===0&&(Math.abs(n.z)===1?Pn.x+=1e-4:Pn.z+=1e-4,Pn.normalize(),Ki.crossVectors(n,Pn)),Ki.normalize(),cc.crossVectors(Pn,Ki),i[0]=Ki.x,i[4]=cc.x,i[8]=Pn.x,i[1]=Ki.y,i[5]=cc.y,i[9]=Pn.y,i[2]=Ki.z,i[6]=cc.z,i[10]=Pn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,i=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],p=n[2],_=n[6],m=n[10],g=n[14],y=n[3],M=n[7],v=n[11],w=n[15],E=i[0],x=i[4],S=i[8],P=i[12],R=i[1],I=i[5],U=i[9],O=i[13],C=i[2],F=i[6],H=i[10],B=i[14],Q=i[3],k=i[7],tt=i[11],J=i[15];return r[0]=a*E+o*R+l*C+c*Q,r[4]=a*x+o*I+l*F+c*k,r[8]=a*S+o*U+l*H+c*tt,r[12]=a*P+o*O+l*B+c*J,r[1]=h*E+u*R+f*C+d*Q,r[5]=h*x+u*I+f*F+d*k,r[9]=h*S+u*U+f*H+d*tt,r[13]=h*P+u*O+f*B+d*J,r[2]=p*E+_*R+m*C+g*Q,r[6]=p*x+_*I+m*F+g*k,r[10]=p*S+_*U+m*H+g*tt,r[14]=p*P+_*O+m*B+g*J,r[3]=y*E+M*R+v*C+w*Q,r[7]=y*x+M*I+v*F+w*k,r[11]=y*S+M*U+v*H+w*tt,r[15]=y*P+M*O+v*B+w*J,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],i=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],u=t[6],f=t[10],d=t[14],p=t[3],_=t[7],m=t[11],g=t[15],y=l*d-c*f,M=o*d-c*u,v=o*f-l*u,w=a*d-c*h,E=a*f-l*h,x=a*u-o*h;return e*(_*y-m*M+g*v)-n*(p*y-m*w+g*E)+i*(p*M-_*w+g*x)-r*(p*v-_*E+m*x)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],i=t[8],r=t[1],a=t[5],o=t[9],l=t[2],c=t[6],h=t[10];return e*(a*h-o*c)-n*(r*h-o*l)+i*(r*c-a*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],i=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=t[9],f=t[10],d=t[11],p=t[12],_=t[13],m=t[14],g=t[15],y=e*o-n*a,M=e*l-i*a,v=e*c-r*a,w=n*l-i*o,E=n*c-r*o,x=i*c-r*l,S=h*_-u*p,P=h*m-f*p,R=h*g-d*p,I=u*m-f*_,U=u*g-d*_,O=f*g-d*m,C=y*O-M*U+v*I+w*R-E*P+x*S;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/C;return t[0]=(o*O-l*U+c*I)*F,t[1]=(i*U-n*O-r*I)*F,t[2]=(_*x-m*E+g*w)*F,t[3]=(f*E-u*x-d*w)*F,t[4]=(l*R-a*O-c*P)*F,t[5]=(e*O-i*R+r*P)*F,t[6]=(m*v-p*x-g*M)*F,t[7]=(h*x-f*v+d*M)*F,t[8]=(a*U-o*R+c*S)*F,t[9]=(n*R-e*U-r*S)*F,t[10]=(p*E-_*v+g*y)*F,t[11]=(u*v-h*E-d*y)*F,t[12]=(o*P-a*I-l*S)*F,t[13]=(e*I-n*P+i*S)*F,t[14]=(_*M-p*w-m*y)*F,t[15]=(h*w-u*M+f*y)*F,this}scale(t){let e=this.elements,n=t.x,i=t.y,r=t.z;return e[0]*=n,e[4]*=i,e[8]*=r,e[1]*=n,e[5]*=i,e[9]*=r,e[2]*=n,e[6]*=i,e[10]*=r,e[3]*=n,e[7]*=i,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),i=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,r,a){return this.set(1,n,r,0,t,1,a,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){let i=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,u=o+o,f=r*c,d=r*h,p=r*u,_=a*h,m=a*u,g=o*u,y=l*c,M=l*h,v=l*u,w=n.x,E=n.y,x=n.z;return i[0]=(1-(_+g))*w,i[1]=(d+v)*w,i[2]=(p-M)*w,i[3]=0,i[4]=(d-v)*E,i[5]=(1-(f+g))*E,i[6]=(m+y)*E,i[7]=0,i[8]=(p+M)*x,i[9]=(m-y)*x,i[10]=(1-(f+_))*x,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){let i=this.elements;t.x=i[12],t.y=i[13],t.z=i[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=xr.set(i[0],i[1],i[2]).length(),o=xr.set(i[4],i[5],i[6]).length(),l=xr.set(i[8],i[9],i[10]).length();r<0&&(a=-a),Qn.copy(this);let c=1/a,h=1/o,u=1/l;return Qn.elements[0]*=c,Qn.elements[1]*=c,Qn.elements[2]*=c,Qn.elements[4]*=h,Qn.elements[5]*=h,Qn.elements[6]*=h,Qn.elements[8]*=u,Qn.elements[9]*=u,Qn.elements[10]*=u,e.setFromRotationMatrix(Qn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,i,r,a,o=bn,l=!1){let c=this.elements,h=2*r/(e-t),u=2*r/(n-i),f=(e+t)/(e-t),d=(n+i)/(n-i),p,_;if(l)p=r/(a-r),_=a*r/(a-r);else if(o===bn)p=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===rs)p=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,i,r,a,o=bn,l=!1){let c=this.elements,h=2/(e-t),u=2/(n-i),f=-(e+t)/(e-t),d=-(n+i)/(n-i),p,_;if(l)p=1/(a-r),_=a/(a-r);else if(o===bn)p=-2/(a-r),_=-(a+r)/(a-r);else if(o===rs)p=-1/(a-r),_=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=u,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=p,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};iu.prototype.isMatrix4=!0;var Zt=iu,xr=new L,Qn=new Zt,a_=new L(0,0,0),o_=new L(1,1,1),Ki=new L,cc=new L,Pn=new L,yp=new Zt,vp=new Ne,Gn=class s{constructor(t=0,e=0,n=0,i=s.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let i=t.elements,r=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],f=i[6],d=i[10];switch(e){case"XYZ":this._y=Math.asin(Yt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Yt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Yt(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Yt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Yt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Yt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:Rt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return yp.makeRotationFromQuaternion(t),this.setFromRotationMatrix(yp,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return vp.setFromEuler(this),this.setFromQuaternion(vp,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Gn.DEFAULT_ORDER="XYZ";var Gs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},l_=0,Mp=new L,yr=new Ne,Pi=new Zt,hc=new L,Wa=new L,c_=new L,h_=new Ne,Sp=new L(1,0,0),bp=new L(0,1,0),Ep=new L(0,0,1),Tp={type:"added"},u_={type:"removed"},vr={type:"childadded",child:null},$u={type:"childremoved",child:null},oe=class s extends En{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:l_++}),this.uuid=Yn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=s.DEFAULT_UP.clone();let t=new L,e=new Gn,n=new Ne,i=new L(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Zt},normalMatrix:{value:new $t}}),this.matrix=new Zt,this.matrixWorld=new Zt,this.matrixAutoUpdate=s.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=s.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Gs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return yr.setFromAxisAngle(t,e),this.quaternion.multiply(yr),this}rotateOnWorldAxis(t,e){return yr.setFromAxisAngle(t,e),this.quaternion.premultiply(yr),this}rotateX(t){return this.rotateOnAxis(Sp,t)}rotateY(t){return this.rotateOnAxis(bp,t)}rotateZ(t){return this.rotateOnAxis(Ep,t)}translateOnAxis(t,e){return Mp.copy(t).applyQuaternion(this.quaternion),this.position.add(Mp.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Sp,t)}translateY(t){return this.translateOnAxis(bp,t)}translateZ(t){return this.translateOnAxis(Ep,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Pi.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?hc.copy(t):hc.set(t,e,n);let i=this.parent;this.updateWorldMatrix(!0,!1),Wa.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Pi.lookAt(Wa,hc,this.up):Pi.lookAt(hc,Wa,this.up),this.quaternion.setFromRotationMatrix(Pi),i&&(Pi.extractRotation(i.matrixWorld),yr.setFromRotationMatrix(Pi),this.quaternion.premultiply(yr.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Ht("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Tp),vr.child=t,this.dispatchEvent(vr),vr.child=null):Ht("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(u_),$u.child=t,this.dispatchEvent($u),$u.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Pi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Pi.multiply(t.parent.matrixWorld)),t.applyMatrix4(Pi),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Tp),vr.child=t,this.dispatchEvent(vr),vr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let i=this.children;for(let r=0,a=i.length;r<a;r++)i[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wa,t,c_),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wa,h_,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,i=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*i,r[13]+=n-r[1]*e-r[5]*n-r[9]*i,r[14]+=i-r[2]*e-r[6]*n-r[10]*i}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let i=this.parent;if(t===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let i={};i.uuid=this.uuid,i.type=this.type,i.name=this.name,i.castShadow=this.castShadow,i.receiveShadow=this.receiveShadow,i.visible=this.visible,i.frustumCulled=this.frustumCulled,i.renderOrder=this.renderOrder,i.static=this.static,i.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.pivot!==null&&(i.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(i.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(i.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),i.instanceInfo=this._instanceInfo.map(o=>({...o})),i.availableInstanceIds=this._availableInstanceIds.slice(),i.availableGeometryIds=this._availableGeometryIds.slice(),i.nextIndexStart=this._nextIndexStart,i.nextVertexStart=this._nextVertexStart,i.geometryCount=this._geometryCount,i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.matricesTexture=this._matricesTexture.toJSON(t),i.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(i.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));i.material=o}else i.material=r(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];i.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),u=a(t.shapes),f=a(t.skeletons),d=a(t.animations),p=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),p.length>0&&(n.nodes=p)}return n.object=i,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let i=t.children[n];this.add(i.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};oe.DEFAULT_UP=new L(0,1,0);oe.DEFAULT_MATRIX_AUTO_UPDATE=!0;oe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var si=class extends oe{constructor(){super(),this.isGroup=!0,this.type="Group"}},d_={type:"move"},Vs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new si,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new si,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new si,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let _ of t.hand.values()){let m=e.getJointPose(_,n),g=this._getHandJoint(c,_);m!==null&&(g.matrix.fromArray(m.transform.matrix),g.matrix.decompose(g.position,g.quaternion,g.scale),g.matrixWorldNeedsUpdate=!0,g.jointRadius=m.radius),g.visible=m!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,p=.005;c.inputState.pinching&&f>d+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=d-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&r!==null&&(i=r),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(d_)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new si;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},Tm={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ji={h:0,s:0,l:0},uc={h:0,s:0,l:0};function Ju(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}var Lt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=je){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ie.colorSpaceToWorking(this,e),this}setRGB(t,e,n,i=ie.workingColorSpace){return this.r=t,this.g=e,this.b=n,ie.colorSpaceToWorking(this,i),this}setHSL(t,e,n,i=ie.workingColorSpace){if(t=Ef(t,1),e=Yt(e,0,1),n=Yt(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Ju(a,r,t+1/3),this.g=Ju(a,r,t),this.b=Ju(a,r,t-1/3)}return ie.colorSpaceToWorking(this,i),this}setStyle(t,e=je){function n(r){r!==void 0&&parseFloat(r)<1&&Rt("Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,e);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Rt("Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=i[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Rt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=je){let n=Tm[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Rt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Fi(t.r),this.g=Fi(t.g),this.b=Fi(t.b),this}copyLinearToSRGB(t){return this.r=zr(t.r),this.g=zr(t.g),this.b=zr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=je){return ie.workingToColorSpace(sn.copy(this),t),Math.round(Yt(sn.r*255,0,255))*65536+Math.round(Yt(sn.g*255,0,255))*256+Math.round(Yt(sn.b*255,0,255))}getHexString(t=je){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ie.workingColorSpace){ie.workingToColorSpace(sn.copy(this),e);let n=sn.r,i=sn.g,r=sn.b,a=Math.max(n,i,r),o=Math.min(n,i,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-r)/u+(i<r?6:0);break;case i:l=(r-n)/u+2;break;case r:l=(n-i)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=ie.workingColorSpace){return ie.workingToColorSpace(sn.copy(this),e),t.r=sn.r,t.g=sn.g,t.b=sn.b,t}getStyle(t=je){ie.workingToColorSpace(sn.copy(this),t);let e=sn.r,n=sn.g,i=sn.b;return t!==je?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(ji),this.setHSL(ji.h+t,ji.s+e,ji.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(ji),t.getHSL(uc);let n=ro(ji.h,uc.h,e),i=ro(ji.s,uc.s,e),r=ro(ji.l,uc.l,e);return this.setHSL(n,i,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,i=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*i,this.g=r[1]*e+r[4]*n+r[7]*i,this.b=r[2]*e+r[5]*n+r[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},sn=new Lt;Lt.NAMES=Tm;var xo=class s{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new Lt(t),this.density=e}clone(){return new s(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}},Hs=class s{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Lt(t),this.near=e,this.far=n}clone(){return new s(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},zi=class extends oe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Gn,this.environmentIntensity=1,this.environmentRotation=new Gn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},ti=new L,Ii=new L,Ku=new L,Li=new L,Mr=new L,Sr=new L,wp=new L,ju=new L,Qu=new L,td=new L,ed=new _e,nd=new _e,id=new _e,ii=class s{constructor(t=new L,e=new L,n=new L){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),ti.subVectors(t,e),i.cross(ti);let r=i.lengthSq();return r>0?i.multiplyScalar(1/Math.sqrt(r)):i.set(0,0,0)}static getBarycoord(t,e,n,i,r){ti.subVectors(i,e),Ii.subVectors(n,e),Ku.subVectors(t,e);let a=ti.dot(ti),o=ti.dot(Ii),l=ti.dot(Ku),c=Ii.dot(Ii),h=Ii.dot(Ku),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(c*l-o*h)*f,p=(a*h-o*l)*f;return r.set(1-d-p,p,d)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,Li)===null?!1:Li.x>=0&&Li.y>=0&&Li.x+Li.y<=1}static getInterpolation(t,e,n,i,r,a,o,l){return this.getBarycoord(t,e,n,i,Li)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Li.x),l.addScaledVector(a,Li.y),l.addScaledVector(o,Li.z),l)}static getInterpolatedAttribute(t,e,n,i,r,a){return ed.setScalar(0),nd.setScalar(0),id.setScalar(0),ed.fromBufferAttribute(t,e),nd.fromBufferAttribute(t,n),id.fromBufferAttribute(t,i),a.setScalar(0),a.addScaledVector(ed,r.x),a.addScaledVector(nd,r.y),a.addScaledVector(id,r.z),a}static isFrontFacing(t,e,n,i){return ti.subVectors(n,e),Ii.subVectors(t,e),ti.cross(Ii).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return ti.subVectors(this.c,this.b),Ii.subVectors(this.a,this.b),ti.cross(Ii).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return s.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return s.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,r){return s.getInterpolation(t,this.a,this.b,this.c,e,n,i,r)}containsPoint(t){return s.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return s.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,i=this.b,r=this.c,a,o;Mr.subVectors(i,n),Sr.subVectors(r,n),ju.subVectors(t,n);let l=Mr.dot(ju),c=Sr.dot(ju);if(l<=0&&c<=0)return e.copy(n);Qu.subVectors(t,i);let h=Mr.dot(Qu),u=Sr.dot(Qu);if(h>=0&&u<=h)return e.copy(i);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0&&l-h>0)return a=l/(l-h),e.copy(n).addScaledVector(Mr,a);td.subVectors(t,r);let d=Mr.dot(td),p=Sr.dot(td);if(p>=0&&d<=p)return e.copy(r);let _=d*c-l*p;if(_<=0&&c>=0&&p<=0)return o=c/(c-p),e.copy(n).addScaledVector(Sr,o);let m=h*p-d*u;if(m<=0&&u-h>=0&&d-p>=0)return wp.subVectors(r,i),o=(u-h)/(u-h+(d-p)),e.copy(i).addScaledVector(wp,o);let g=1/(m+_+f);return a=_*g,o=f*g,e.copy(n).addScaledVector(Mr,a).addScaledVector(Sr,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Ge=class{constructor(t=new L(1/0,1/0,1/0),e=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(ei.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(ei.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=ei.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,ei):ei.fromBufferAttribute(r,a),ei.applyMatrix4(t.matrixWorld),this.expandByPoint(ei);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),dc.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),dc.copy(n.boundingBox)),dc.applyMatrix4(t.matrixWorld),this.union(dc)}let i=t.children;for(let r=0,a=i.length;r<a;r++)this.expandByObject(i[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ei),ei.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Xa),fc.subVectors(this.max,Xa),br.subVectors(t.a,Xa),Er.subVectors(t.b,Xa),Tr.subVectors(t.c,Xa),Qi.subVectors(Er,br),ts.subVectors(Tr,Er),Es.subVectors(br,Tr);let e=[0,-Qi.z,Qi.y,0,-ts.z,ts.y,0,-Es.z,Es.y,Qi.z,0,-Qi.x,ts.z,0,-ts.x,Es.z,0,-Es.x,-Qi.y,Qi.x,0,-ts.y,ts.x,0,-Es.y,Es.x,0];return!sd(e,br,Er,Tr,fc)||(e=[1,0,0,0,1,0,0,0,1],!sd(e,br,Er,Tr,fc))?!1:(pc.crossVectors(Qi,ts),e=[pc.x,pc.y,pc.z],sd(e,br,Er,Tr,fc))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ei).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ei).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Di[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Di[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Di[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Di[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Di[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Di[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Di[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Di[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Di),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Di=[new L,new L,new L,new L,new L,new L,new L,new L],ei=new L,dc=new Ge,br=new L,Er=new L,Tr=new L,Qi=new L,ts=new L,Es=new L,Xa=new L,fc=new L,pc=new L,Ts=new L;function sd(s,t,e,n,i){for(let r=0,a=s.length-3;r<=a;r+=3){Ts.fromArray(s,r);let o=i.x*Math.abs(Ts.x)+i.y*Math.abs(Ts.y)+i.z*Math.abs(Ts.z),l=t.dot(Ts),c=e.dot(Ts),h=n.dot(Ts);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Oi=f_();function f_(){let s=new ArrayBuffer(4),t=new Float32Array(s),e=new Uint32Array(s),n=new Uint32Array(512),i=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(n[l]=0,n[l|256]=32768,i[l]=24,i[l|256]=24):c<-14?(n[l]=1024>>-c-14,n[l|256]=1024>>-c-14|32768,i[l]=-c-1,i[l|256]=-c-1):c<=15?(n[l]=c+15<<10,n[l|256]=c+15<<10|32768,i[l]=13,i[l|256]=13):c<128?(n[l]=31744,n[l|256]=64512,i[l]=24,i[l|256]=24):(n[l]=31744,n[l|256]=64512,i[l]=13,i[l|256]=13)}let r=new Uint32Array(2048),a=new Uint32Array(64),o=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;(c&8388608)===0;)c<<=1,h-=8388608;c&=-8388609,h+=947912704,r[l]=c|h}for(let l=1024;l<2048;++l)r[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)a[l]=l<<23;a[31]=1199570944,a[32]=2147483648;for(let l=33;l<63;++l)a[l]=2147483648+(l-32<<23);a[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(o[l]=1024);return{floatView:t,uint32View:e,baseTable:n,shiftTable:i,mantissaTable:r,exponentTable:a,offsetTable:o}}function Sn(s){Math.abs(s)>65504&&Rt("DataUtils.toHalfFloat(): Value out of range."),s=Yt(s,-65504,65504),Oi.floatView[0]=s;let t=Oi.uint32View[0],e=t>>23&511;return Oi.baseTable[e]+((t&8388607)>>Oi.shiftTable[e])}function eo(s){let t=s>>10;return Oi.uint32View[0]=Oi.mantissaTable[Oi.offsetTable[t]+(s&1023)]+Oi.exponentTable[t],Oi.floatView[0]}var ih=class{static toHalfFloat(t){return Sn(t)}static fromHalfFloat(t){return eo(t)}},Fe=new L,mc=new ct,p_=0,ve=class extends En{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:p_++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=tc,this.updateRanges=[],this.gpuType=ln,this.version=0,this._normalizationScale=t!==void 0?Ru(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,r=this.itemSize;i<r;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)mc.fromBufferAttribute(this,e),mc.applyMatrix3(t),this.setXY(e,mc.x,mc.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyMatrix3(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyMatrix4(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyNormalMatrix(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.transformDirection(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),i=this._normalize(i)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){let e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):Us(t,this.array)}_normalize(t){let e=this._normalizationScale;return e!==void 0?Math.round(t*e):an(t,this.array)}},sh=class extends ve{constructor(t,e,n){super(new Int8Array(t),e,n)}},rh=class extends ve{constructor(t,e,n){super(new Uint8Array(t),e,n)}},ah=class extends ve{constructor(t,e,n){super(new Uint8ClampedArray(t),e,n)}},oh=class extends ve{constructor(t,e,n){super(new Int16Array(t),e,n)}},Zr=class extends ve{constructor(t,e,n){super(new Uint16Array(t),e,n)}},lh=class extends ve{constructor(t,e,n){super(new Int32Array(t),e,n)}},$r=class extends ve{constructor(t,e,n){super(new Uint32Array(t),e,n)}},ch=class extends ve{constructor(t,e,n){super(new Uint16Array(t),e,n),this.isFloat16BufferAttribute=!0}getX(t){let e=eo(this.array[t*this.itemSize]);return this.normalized&&(e=Us(e,this.array)),e}setX(t,e){return this.normalized&&(e=an(e,this.array)),this.array[t*this.itemSize]=Sn(e),this}getY(t){let e=eo(this.array[t*this.itemSize+1]);return this.normalized&&(e=Us(e,this.array)),e}setY(t,e){return this.normalized&&(e=an(e,this.array)),this.array[t*this.itemSize+1]=Sn(e),this}getZ(t){let e=eo(this.array[t*this.itemSize+2]);return this.normalized&&(e=Us(e,this.array)),e}setZ(t,e){return this.normalized&&(e=an(e,this.array)),this.array[t*this.itemSize+2]=Sn(e),this}getW(t){let e=eo(this.array[t*this.itemSize+3]);return this.normalized&&(e=Us(e,this.array)),e}setW(t,e){return this.normalized&&(e=an(e,this.array)),this.array[t*this.itemSize+3]=Sn(e),this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=an(e,this.array),n=an(n,this.array)),this.array[t+0]=Sn(e),this.array[t+1]=Sn(n),this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=an(e,this.array),n=an(n,this.array),i=an(i,this.array)),this.array[t+0]=Sn(e),this.array[t+1]=Sn(n),this.array[t+2]=Sn(i),this}setXYZW(t,e,n,i,r){return t*=this.itemSize,this.normalized&&(e=an(e,this.array),n=an(n,this.array),i=an(i,this.array),r=an(r,this.array)),this.array[t+0]=Sn(e),this.array[t+1]=Sn(n),this.array[t+2]=Sn(i),this.array[t+3]=Sn(r),this}},Ot=class extends ve{constructor(t,e,n){super(new Float32Array(t),e,n)}},m_=new Ge,qa=new L,rd=new L,Be=class{constructor(t=new L,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):m_.setFromPoints(t).getCenter(n);let i=0;for(let r=0,a=t.length;r<a;r++)i=Math.max(i,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;qa.subVectors(t,this.center);let e=qa.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(qa,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(rd.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(qa.copy(t.center).add(rd)),this.expandByPoint(qa.copy(t.center).sub(rd))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},g_=0,zn=new Zt,ad=new oe,wr=new L,In=new Ge,Ya=new Ge,Ye=new L,jt=class s extends En{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:g_++}),this.uuid=Yn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(kg(t)?$r:Zr)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new $t().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return zn.makeRotationFromQuaternion(t),this.applyMatrix4(zn),this}rotateX(t){return zn.makeRotationX(t),this.applyMatrix4(zn),this}rotateY(t){return zn.makeRotationY(t),this.applyMatrix4(zn),this}rotateZ(t){return zn.makeRotationZ(t),this.applyMatrix4(zn),this}translate(t,e,n){return zn.makeTranslation(t,e,n),this.applyMatrix4(zn),this}scale(t,e,n){return zn.makeScale(t,e,n),this.applyMatrix4(zn),this}lookAt(t){return ad.lookAt(t),ad.updateMatrix(),this.applyMatrix4(ad.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(wr).negate(),this.translate(wr.x,wr.y,wr.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let i=0,r=t.length;i<r;i++){let a=t[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Ot(n,3))}else{let n=Math.min(t.length,e.count);for(let i=0;i<n;i++){let r=t[i];e.setXYZ(i,r.x,r.y,r.z||0)}t.length>e.count&&Rt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ge);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ht("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){let r=e[n];In.setFromBufferAttribute(r),this.morphTargetsRelative?(Ye.addVectors(this.boundingBox.min,In.min),this.boundingBox.expandByPoint(Ye),Ye.addVectors(this.boundingBox.max,In.max),this.boundingBox.expandByPoint(Ye)):(this.boundingBox.expandByPoint(In.min),this.boundingBox.expandByPoint(In.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Ht('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Be);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Ht("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(t){let n=this.boundingSphere.center;if(In.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Ya.setFromBufferAttribute(o),this.morphTargetsRelative?(Ye.addVectors(In.min,Ya.min),In.expandByPoint(Ye),Ye.addVectors(In.max,Ya.max),In.expandByPoint(Ye)):(In.expandByPoint(Ya.min),In.expandByPoint(Ya.max))}In.getCenter(n);let i=0;for(let r=0,a=t.count;r<a;r++)Ye.fromBufferAttribute(t,r),i=Math.max(i,n.distanceToSquared(Ye));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ye.fromBufferAttribute(o,c),l&&(wr.fromBufferAttribute(t,c),Ye.add(wr)),i=Math.max(i,n.distanceToSquared(Ye))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&Ht('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Ht("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,i=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new ve(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[],c=new Uint8Array(n.count);for(let P=0;P<n.count;P++)o[P]=new L,l[P]=new L;let h=new L,u=new L,f=new L,d=new ct,p=new ct,_=new ct,m=new L,g=new L;function y(P,R,I){c[P]=c[R]=c[I]=1,h.fromBufferAttribute(n,P),u.fromBufferAttribute(n,R),f.fromBufferAttribute(n,I),d.fromBufferAttribute(r,P),p.fromBufferAttribute(r,R),_.fromBufferAttribute(r,I),u.sub(h),f.sub(h),p.sub(d),_.sub(d);let U=1/(p.x*_.y-_.x*p.y);isFinite(U)&&(m.copy(u).multiplyScalar(_.y).addScaledVector(f,-p.y).multiplyScalar(U),g.copy(f).multiplyScalar(p.x).addScaledVector(u,-_.x).multiplyScalar(U),o[P].add(m),o[R].add(m),o[I].add(m),l[P].add(g),l[R].add(g),l[I].add(g))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let P=0,R=M.length;P<R;++P){let I=M[P],U=I.start,O=I.count;for(let C=U,F=U+O;C<F;C+=3)y(t.getX(C+0),t.getX(C+1),t.getX(C+2))}let v=new L,w=new L,E=new L,x=new L;function S(P){E.fromBufferAttribute(i,P),x.copy(E);let R=o[P];v.copy(R),v.sub(E.multiplyScalar(E.dot(R))).normalize(),w.crossVectors(x,R);let U=w.dot(l[P])<0?-1:1;a.setXYZW(P,v.x,v.y,v.z,U)}for(let P=0,R=n.count;P<R;++P)c[P]&&S(P);this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new ve(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let i=new L,r=new L,a=new L,o=new L,l=new L,c=new L,h=new L,u=new L;if(t)for(let f=0,d=t.count;f<d;f+=3){let p=t.getX(f+0),_=t.getX(f+1),m=t.getX(f+2);i.fromBufferAttribute(e,p),r.fromBufferAttribute(e,_),a.fromBufferAttribute(e,m),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,_),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(_,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let f=0,d=e.count;f<d;f+=3)i.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),a.fromBufferAttribute(e,f+2),h.subVectors(a,r),u.subVectors(i,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ye.fromBufferAttribute(t,e),Ye.normalize(),t.setXYZ(e,Ye.x,Ye.y,Ye.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,u=o.normalized,f=new c.constructor(l.length*h),d=0,p=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?d=l[_]*o.data.stride+o.offset:d=l[_]*h;for(let g=0;g<h;g++)f[p++]=c[d++]}return new ve(f,h,u)}if(this.index===null)return Rt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new s,n=this.index.array,i=this.attributes;for(let o in i){let l=i[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=t(f,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let i={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(t.data))}h.length>0&&(i[l]=h,r=!0)}r&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let i=t.attributes;for(let c in i){let h=i[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ws=class{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=tc,this.updateRanges=[],this.version=0,this.uuid=Yn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let i=0,r=this.stride;i<r;i++)this.array[t+i]=e.array[n+i];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={});let e=Ap(this.array);t.arrayBuffers[e]===void 0&&(t.arrayBuffers[e]=this.array.slice(0).buffer);let n=new this.array.constructor(t.arrayBuffers[e]),i=new this.constructor(n,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){t.arrayBuffers===void 0&&(t.arrayBuffers={});let e=Ap(this.array);t.arrayBuffers[e]===void 0&&(t.arrayBuffers[e]=Array.from(new Uint32Array(this.array.slice(0).buffer)));let n={uuid:this.uuid,buffer:e,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}};function Ap(s){return s.buffer._uuid===void 0&&(s.buffer._uuid=Yn()),s.byteOffset===0&&s.byteLength===s.buffer.byteLength?s.buffer._uuid:s.buffer._uuid+":"+s.byteOffset+":"+s.byteLength}var fn=new L,os=class s{constructor(t,e,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=i,this._normalizationScale=t!==void 0?Ru(t.array):void 0}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)fn.fromBufferAttribute(this,e),fn.applyMatrix4(t),this.setXYZ(e,fn.x,fn.y,fn.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)fn.fromBufferAttribute(this,e),fn.applyNormalMatrix(t),this.setXYZ(e,fn.x,fn.y,fn.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)fn.fromBufferAttribute(this,e),fn.transformDirection(t),this.setXYZ(e,fn.x,fn.y,fn.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=this._denormalize(e)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=this._denormalize(e)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=this._denormalize(e)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=this._denormalize(e)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=this._normalize(e),n=this._normalize(n),i=this._normalize(i)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this}setXYZW(t,e,n,i,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=this._normalize(e),n=this._normalize(n),i=this._normalize(i),r=this._normalize(r)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this.data.array[t+3]=r,this}clone(t){if(t===void 0){qr("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let e=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[i+r])}return new ve(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new s(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){qr("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let e=[];for(let n=0;n<this.count;n++){let i=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[i+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(t){let e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):Us(t,this.data.array)}_normalize(t){let e=this._normalizationScale;return e!==void 0?Math.round(t*e):an(t,this.data.array)}},od=new L,__=new L,x_=new $t,on=class{constructor(t=new L(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let i=od.subVectors(n,e).cross(__.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let i=t.delta(od),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(i,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||x_.getNormalMatrix(t),i=this.coplanarPoint(od).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},y_=0,ze=class extends En{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:y_++}),this.uuid=Yn(),this.name="",this.type="Material",this.blending=cr,this.side=Xi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=lu,this.blendDst=cu,this.blendEquation=_s,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Lt(0,0,0),this.blendAlpha=0,this.depthFunc=Fs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=_f,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=so,this.stencilZFail=so,this.stencilZPass=so,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Rt(`Material: parameter '${e}' has value of undefined.`);continue}let i=this[e];if(i===void 0){Rt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector2&&n&&n.isVector2||i&&i.isEuler&&n&&n.isEuler||i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=i(t.textures),a=i(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Lt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new on().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ct().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ct().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let i=e.length;n=new Array(i);for(let r=0;r!==i;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},Jr=class extends ze{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Lt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Ar,Za=new L,Rr=new L,Cr=new L,Pr=new ct,$a=new ct,wm=new Zt,gc=new L,Ja=new L,_c=new L,Rp=new ct,ld=new ct,Cp=new ct,yo=class extends oe{constructor(t=new Jr){if(super(),this.isSprite=!0,this.type="Sprite",Ar===void 0){Ar=new jt;let e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Ws(e,5);Ar.setIndex([0,1,2,0,2,3]),Ar.setAttribute("position",new os(n,3,0,!1)),Ar.setAttribute("uv",new os(n,2,3,!1))}this.geometry=Ar,this.material=t,this.center=new ct(.5,.5),this.count=1}intersectsFrustum(t){return t.intersectsSprite(this)}raycast(t,e){t.camera===null&&Ht('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),Rr.setFromMatrixScale(this.matrixWorld),wm.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Cr.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Rr.multiplyScalar(-Cr.z);let n=this.material.rotation,i,r;n!==0&&(r=Math.cos(n),i=Math.sin(n));let a=this.center;xc(gc.set(-.5,-.5,0),Cr,a,Rr,i,r),xc(Ja.set(.5,-.5,0),Cr,a,Rr,i,r),xc(_c.set(.5,.5,0),Cr,a,Rr,i,r),Rp.set(0,0),ld.set(1,0),Cp.set(1,1);let o=t.ray.intersectTriangle(gc,Ja,_c,!1,Za);if(o===null&&(xc(Ja.set(-.5,.5,0),Cr,a,Rr,i,r),ld.set(0,1),o=t.ray.intersectTriangle(gc,_c,Ja,!1,Za),o===null))return;let l=t.ray.origin.distanceTo(Za);l<t.near||l>t.far||e.push({distance:l,point:Za.clone(),uv:ii.getInterpolation(Za,gc,Ja,_c,Rp,ld,Cp,new ct),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}toJSON(t){let e=super.toJSON(t);return e.object.center=this.center.toArray(),e}};function xc(s,t,e,n,i,r){Pr.subVectors(s,e).addScalar(.5).multiply(n),i!==void 0?($a.x=r*Pr.x-i*Pr.y,$a.y=i*Pr.x+r*Pr.y):$a.copy(Pr),s.copy(t),s.x+=$a.x,s.y+=$a.y,s.applyMatrix4(wm)}var yc=new L,Pp=new L,vo=class extends oe{constructor(){super(),this.isLOD=!0,this._currentLevel=0,this.type="LOD",Object.defineProperties(this,{levels:{enumerable:!0,value:[]}}),this.autoUpdate=!0}copy(t){super.copy(t,!1);let e=t.levels;for(let n=0,i=e.length;n<i;n++){let r=e[n];this.addLevel(r.object.clone(),r.distance,r.hysteresis)}return this.autoUpdate=t.autoUpdate,this}addLevel(t,e=0,n=0){e=Math.abs(e);let i=this.levels,r;for(r=0;r<i.length&&!(e<i[r].distance);r++);return i.splice(r,0,{distance:e,hysteresis:n,object:t}),this.add(t),this}removeLevel(t){let e=this.levels;for(let n=0;n<e.length;n++)if(e[n].distance===t){let i=e.splice(n,1);return this.remove(i[0].object),!0}return!1}getCurrentLevel(){return this._currentLevel}getObjectForDistance(t){let e=this.levels;if(e.length>0){let n,i;for(n=1,i=e.length;n<i;n++){let r=e[n].distance;if(e[n].object.visible&&(r-=r*e[n].hysteresis),t<r)break}return e[n-1].object}return null}raycast(t,e){if(this.levels.length>0){yc.setFromMatrixPosition(this.matrixWorld);let i=t.ray.origin.distanceTo(yc);this.getObjectForDistance(i).raycast(t,e)}}update(t){let e=this.levels;if(e.length>1){yc.setFromMatrixPosition(t.matrixWorld),Pp.setFromMatrixPosition(this.matrixWorld);let n=yc.distanceTo(Pp)/t.zoom;e[0].object.visible=!0;let i,r;for(i=1,r=e.length;i<r;i++){let a=e[i].distance;if(e[i].object.visible&&(a-=a*e[i].hysteresis),n>=a)e[i-1].object.visible=!1,e[i].object.visible=!0;else break}for(this._currentLevel=i-1;i<r;i++)e[i].object.visible=!1}}toJSON(t){let e=super.toJSON(t);e.object.autoUpdate=this.autoUpdate,e.object.levels=[];let n=this.levels;for(let i=0,r=n.length;i<r;i++){let a=n[i];e.object.levels.push({object:a.object.uuid,distance:a.distance,hysteresis:a.hysteresis})}return e}},Ni=new L,cd=new L,vc=new L,Mc=new L,ai=class{constructor(t=new L,e=new L(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ni)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Ni.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ni.copy(this.origin).addScaledVector(this.direction,e),Ni.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){cd.copy(t).add(e).multiplyScalar(.5),vc.copy(e).sub(t).normalize(),Mc.copy(this.origin).sub(cd);let r=t.distanceTo(e)*.5,a=-this.direction.dot(vc),o=Mc.dot(this.direction),l=-Mc.dot(vc),c=Mc.lengthSq(),h=Math.abs(1-a*a),u,f,d,p;if(h>0)if(u=a*l-o,f=a*o-l,p=r*h,u>=0)if(f>=-p)if(f<=p){let _=1/h;u*=_,f*=_,d=u*(u+a*f+2*o)+f*(a*u+f+2*l)+c}else f=r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f<=-p?(u=Math.max(0,-(-a*r+o)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=p?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(a*r+o)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=a>0?-r:r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(cd).addScaledVector(vc,f),d}intersectSphere(t,e){if(t.radius<0)return null;Ni.subVectors(t.center,this.origin);let n=Ni.dot(this.direction),i=Ni.dot(Ni)-n*n,r=t.radius*t.radius;if(i>r)return null;let a=Math.sqrt(r-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,i=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,i=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,a=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,a=(t.min.y-f.y)*h),n>a||r>i||((r>n||isNaN(n))&&(n=r),(a<i||isNaN(i))&&(i=a),u>=0?(o=(t.min.z-f.z)*u,l=(t.max.z-f.z)*u):(o=(t.max.z-f.z)*u,l=(t.min.z-f.z)*u),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,Ni)!==null}intersectTriangle(t,e,n,i,r){let a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,u=t.x-a.x,f=t.y-a.y,d=t.z-a.z,p=e.x-a.x,_=e.y-a.y,m=e.z-a.z,g=n.x-a.x,y=n.y-a.y,M=n.z-a.z,v=Math.abs(l),w=Math.abs(c),E=Math.abs(h),x,S,P,R,I,U,O,C,F,H,B,Q;if(v>=w&&v>=E?(P=l,U=u,F=p,Q=g,l>=0?(x=c,S=h,R=f,I=d,O=_,C=m,H=y,B=M):(x=h,S=c,R=d,I=f,O=m,C=_,H=M,B=y)):w>=E?(P=c,U=f,F=_,Q=y,c>=0?(x=h,S=l,R=d,I=u,O=m,C=p,H=M,B=g):(x=l,S=h,R=u,I=d,O=p,C=m,H=g,B=M)):(P=h,U=d,F=m,Q=M,h>=0?(x=l,S=c,R=u,I=f,O=p,C=_,H=g,B=y):(x=c,S=l,R=f,I=u,O=_,C=p,H=y,B=g)),P===0)return null;let k=x/P,tt=S/P,J=1/P,Z=R-k*U,ht=I-tt*U,X=O-k*F,q=C-tt*F,$=H-k*Q,lt=B-tt*Q,Y=$*q-lt*X,W=Z*lt-ht*$,mt=X*ht-q*Z;if(i){if(Y<0||W<0||mt<0)return null}else if((Y<0||W<0||mt<0)&&(Y>0||W>0||mt>0))return null;let pt=Y+W+mt;if(pt===0)return null;let St=J*(Y*U+W*F+mt*Q);return(pt>0?St<0:St>0)?null:this.at(St/pt,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Vn=class extends ze{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Lt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gn,this.combine=Ea,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Ip=new Zt,ws=new ai,Sc=new Be,Lp=new L,bc=new L,Ec=new L,Tc=new L,hd=new L,wc=new L,Dp=new L,Ac=new L,ue=class extends oe{constructor(t=new jt,e=new Vn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,i=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(i,t);let o=this.morphTargetInfluences;if(r&&o){wc.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(hd.fromBufferAttribute(u,t),a?wc.addScaledVector(hd,h):wc.addScaledVector(hd.sub(e),h))}e.add(wc)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.material,r=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Sc.copy(n.boundingSphere),Sc.applyMatrix4(r),ws.copy(t.ray).recast(t.near),!(Sc.containsPoint(ws.origin)===!1&&(ws.intersectSphere(Sc,Lp)===null||ws.origin.distanceToSquared(Lp)>(t.far-t.near)**2))&&(Ip.copy(r).invert(),ws.copy(t.ray).applyMatrix4(Ip),!(n.boundingBox!==null&&ws.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ws)))}_computeIntersections(t,e,n){let i,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,_=f.length;p<_;p++){let m=f[p],g=a[m.materialIndex],y=Math.max(m.start,d.start),M=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let v=y,w=M;v<w;v+=3){let E=o.getX(v),x=o.getX(v+1),S=o.getX(v+2);i=Rc(this,g,t,n,c,h,u,E,x,S),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{let p=Math.max(0,d.start),_=Math.min(o.count,d.start+d.count);for(let m=p,g=_;m<g;m+=3){let y=o.getX(m),M=o.getX(m+1),v=o.getX(m+2);i=Rc(this,a,t,n,c,h,u,y,M,v),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,_=f.length;p<_;p++){let m=f[p],g=a[m.materialIndex],y=Math.max(m.start,d.start),M=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let v=y,w=M;v<w;v+=3){let E=v,x=v+1,S=v+2;i=Rc(this,g,t,n,c,h,u,E,x,S),i&&(i.faceIndex=Math.floor(v/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{let p=Math.max(0,d.start),_=Math.min(l.count,d.start+d.count);for(let m=p,g=_;m<g;m+=3){let y=m,M=m+1,v=m+2;i=Rc(this,a,t,n,c,h,u,y,M,v),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}}};function v_(s,t,e,n,i,r,a,o){let l;if(t.side===$e?l=n.intersectTriangle(a,r,i,!0,o):l=n.intersectTriangle(i,r,a,t.side===Xi,o),l===null)return null;Ac.copy(o),Ac.applyMatrix4(s.matrixWorld);let c=e.ray.origin.distanceTo(Ac);return c<e.near||c>e.far?null:{distance:c,point:Ac.clone(),object:s}}function Rc(s,t,e,n,i,r,a,o,l,c){s.getVertexPosition(o,bc),s.getVertexPosition(l,Ec),s.getVertexPosition(c,Tc);let h=v_(s,t,e,n,bc,Ec,Tc,Dp);if(h){let u=new L;ii.getBarycoord(Dp,bc,Ec,Tc,u),i&&(h.uv=ii.getInterpolatedAttribute(i,o,l,c,u,new ct)),r&&(h.uv1=ii.getInterpolatedAttribute(r,o,l,c,u,new ct)),a&&(h.normal=ii.getInterpolatedAttribute(a,o,l,c,u,new L),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let f={a:o,b:l,c,normal:new L,materialIndex:0};ii.getNormal(bc,Ec,Tc,f.normal),h.face=f,h.barycoord=u}return h}var Ka=new _e,Np=new _e,Up=new _e,M_=new _e,Op=new Zt,Cc=new L,ud=new Be,Fp=new Zt,dd=new ai,Mo=class extends ue{constructor(t,e){super(t,e),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=jc,this.bindMatrix=new Zt,this.bindMatrixInverse=new Zt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let t=this.geometry;this.boundingBox===null&&(this.boundingBox=new Ge),this.boundingBox.makeEmpty();let e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Cc),this.boundingBox.expandByPoint(Cc)}computeBoundingSphere(){let t=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Be),this.boundingSphere.makeEmpty();let e=t.getAttribute("position");for(let n=0;n<e.count;n++)this.getVertexPosition(n,Cc),this.boundingSphere.expandByPoint(Cc)}copy(t,e){return super.copy(t,e),this.bindMode=t.bindMode,this.bindMatrix.copy(t.bindMatrix),this.bindMatrixInverse.copy(t.bindMatrixInverse),this.skeleton=t.skeleton,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}raycast(t,e){let n=this.material,i=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ud.copy(this.boundingSphere),ud.applyMatrix4(i),t.ray.intersectsSphere(ud)!==!1&&(Fp.copy(i).invert(),dd.copy(t.ray).applyMatrix4(Fp),!(this.boundingBox!==null&&dd.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(t,e,dd)))}getVertexPosition(t,e){return super.getVertexPosition(t,e),this.applyBoneTransform(t,e),e}bind(t,e){this.skeleton=t,e===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),e=this.matrixWorld),this.bindMatrix.copy(e),this.bindMatrixInverse.copy(e).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let t=new _e,e=this.geometry.attributes.skinWeight;for(let n=0,i=e.count;n<i;n++){t.fromBufferAttribute(e,n);let r=1/t.manhattanLength();r!==1/0?t.multiplyScalar(r):t.set(1,0,0,0),e.setXYZW(n,t.x,t.y,t.z,t.w)}}updateMatrixWorld(t){super.updateMatrixWorld(t),this.bindMode===jc?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===uf?this.bindMatrixInverse.copy(this.bindMatrix).invert():Rt("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(t,e){let n=this.skeleton,i=this.geometry;Np.fromBufferAttribute(i.attributes.skinIndex,t),Up.fromBufferAttribute(i.attributes.skinWeight,t),e.isVector4?(Ka.copy(e),e.set(0,0,0,0)):(Ka.set(e.x,e.y,e.z,1),e.set(0,0,0)),Ka.applyMatrix4(this.bindMatrix);for(let r=0;r<4;r++){let a=Up.getComponent(r);if(a!==0){let o=Np.getComponent(r);Op.multiplyMatrices(n.bones[o].matrixWorld,n.boneInverses[o]),e.addScaledVector(M_.copy(Ka).applyMatrix4(Op),a)}}return e.isVector4&&(e.w=Ka.w),e.applyMatrix4(this.bindMatrixInverse)}},Kr=class extends oe{constructor(){super(),this.isBone=!0,this.type="Bone"}},mn=class extends Ie{constructor(t=null,e=1,n=1,i,r,a,o,l,c=Pe,h=Pe,u,f){super(null,a,o,l,c,h,i,r,u,f),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Bp=new Zt,S_=new Zt,So=class s{constructor(t=[],e=[]){this.uuid=Yn(),this.bones=t.slice(0),this.boneInverses=e,this.boneMatrices=null,this.previousBoneMatrices=null,this.boneTexture=null,this.previousBoneTexture=null,this.init()}init(){let t=this.bones,e=this.boneInverses;if(this.boneMatrices=new Float32Array(t.length*16),e.length===0)this.calculateInverses();else if(t.length!==e.length){Rt("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,i=this.bones.length;n<i;n++)this.boneInverses.push(new Zt)}}calculateInverses(){this.boneInverses.length=0;for(let t=0,e=this.bones.length;t<e;t++){let n=new Zt;this.bones[t]&&n.copy(this.bones[t].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let t=0,e=this.bones.length;t<e;t++){let n=this.bones[t];n&&n.matrixWorld.copy(this.boneInverses[t]).invert()}for(let t=0,e=this.bones.length;t<e;t++){let n=this.bones[t];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let t=this.bones,e=this.boneInverses,n=this.boneMatrices,i=this.boneTexture;for(let r=0,a=t.length;r<a;r++){let o=t[r]?t[r].matrixWorld:S_;Bp.multiplyMatrices(o,e[r]),Bp.toArray(n,r*16)}i!==null&&(i.needsUpdate=!0)}clone(){return new s(this.bones,this.boneInverses)}computeBoneTexture(){let t=Math.sqrt(this.bones.length*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);let e=new Float32Array(t*t*4);e.set(this.boneMatrices);let n=new mn(e,t,t,gn,ln);return n.needsUpdate=!0,this.boneMatrices=e,this.boneTexture=n,this}getBoneByName(t){for(let e=0,n=this.bones.length;e<n;e++){let i=this.bones[e];if(i.name===t)return i}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null),this.previousBoneTexture!==null&&(this.previousBoneTexture.dispose(),this.previousBoneTexture=null)}fromJSON(t,e){this.uuid=t.uuid;for(let n=0,i=t.bones.length;n<i;n++){let r=t.bones[n],a=e[r];a===void 0&&(Rt("Skeleton: No bone found with UUID:",r),a=new Kr),this.bones.push(a),this.boneInverses.push(new Zt().fromArray(t.boneInverses[n]))}return this.init(),this}toJSON(){let t={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};t.uuid=this.uuid;let e=this.bones,n=this.boneInverses;for(let i=0,r=e.length;i<r;i++){let a=e[i];t.bones.push(a.uuid);let o=n[i];t.boneInverses.push(o.toArray())}return t}},ki=class extends ve{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},Ir=new Zt,zp=new Zt,Pc=[],kp=new Ge,b_=new Zt,ja=new ue,Qa=new Be,Xs=class extends ue{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new ki(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,b_)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Ge),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ir),kp.copy(t.boundingBox).applyMatrix4(Ir),this.boundingBox.union(kp)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Be),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Ir),Qa.copy(t.boundingSphere).applyMatrix4(Ir),this.boundingSphere.union(Qa)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),this.morphTexture=t.morphTexture!==null?t.morphTexture.clone():null,this.instanceColor=t.instanceColor!==null?t.instanceColor.clone():null,this.count=t.count,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(t,e){let n=this.matrixWorld,i=this.count;if(ja.geometry=this.geometry,ja.material=this.material,ja.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Qa.copy(this.boundingSphere),Qa.applyMatrix4(n),t.ray.intersectsSphere(Qa)!==!1))for(let r=0;r<i;r++){this.getMatrixAt(r,Ir),zp.multiplyMatrices(n,Ir),ja.matrixWorld=zp,ja.raycast(t,Pc);for(let a=0,o=Pc.length;a<o;a++){let l=Pc[a];l.instanceId=r,l.object=this,e.push(l)}Pc.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new ki(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new mn(new Float32Array(i*this.count),i,this.count,vl,ln));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=i*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},As=new Be,E_=new ct(.5,.5),Ic=new L,xi=class{constructor(t=new on,e=new on,n=new on,i=new on,r=new on,a=new on){this.planes=[t,e,n,i,r,a]}set(t,e,n,i,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=bn,n=!1){let i=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],u=r[5],f=r[6],d=r[7],p=r[8],_=r[9],m=r[10],g=r[11],y=r[12],M=r[13],v=r[14],w=r[15];if(i[0].setComponents(c-a,d-h,g-p,w-y).normalize(),i[1].setComponents(c+a,d+h,g+p,w+y).normalize(),i[2].setComponents(c+o,d+u,g+_,w+M).normalize(),i[3].setComponents(c-o,d-u,g-_,w-M).normalize(),n)i[4].setComponents(l,f,m,v).normalize(),i[5].setComponents(c-l,d-f,g-m,w-v).normalize();else if(i[4].setComponents(c-l,d-f,g-m,w-v).normalize(),e===bn)i[5].setComponents(c+l,d+f,g+m,w+v).normalize();else if(e===rs)i[5].setComponents(l,f,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),As.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),As.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(As)}intersectsSprite(t){As.center.set(0,0,0);let e=E_.distanceTo(t.center);return As.radius=.7071067811865476+e,As.applyMatrix4(t.matrixWorld),this.intersectsSphere(As)}intersectsSphere(t){let e=this.planes,n=t.center,i=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let i=e[n];if(Ic.x=i.normal.x>0?t.max.x:t.min.x,Ic.y=i.normal.y>0?t.max.y:t.min.y,Ic.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(Ic)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Gp=new Zt,jr=class s{constructor(){this.coordinateSystem=bn,this._frustums=[],this._count=0}setFromArrayCamera(t){let e=t.cameras,n=this._frustums;for(let i=0;i<e.length;i++){let r=e[i];Gp.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[i]===void 0&&(n[i]=new xi),n[i].setFromProjectionMatrix(Gp,r.coordinateSystem,r.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsObject(t))return!0;return!1}intersectsSprite(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSprite(t))return!0;return!1}intersectsSphere(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSphere(t))return!0;return!1}intersectsBox(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsBox(t))return!0;return!1}containsPoint(t){let e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;let e=this._frustums,n=t._frustums;for(let i=0;i<t._count;i++)e[i]===void 0&&(e[i]=new xi),e[i].copy(n[i]);return this._count=t._count,this}clone(){return new s().copy(this)}};function fd(s,t){return s-t}function T_(s,t){return s.z-t.z}function w_(s,t){return t.z-s.z}var Rd=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(t,e,n,i){let r=this.pool,a=this.list;this.index>=r.length&&r.push({start:-1,count:-1,z:-1,index:-1});let o=r[this.index];a.push(o),this.index++,o.start=t,o.count=e,o.z=n,o.index=i}reset(){this.list.length=0,this.index=0}},Mn=new Zt,A_=new Lt(1,1,1),R_=new xi,C_=new jr,Lc=new Ge,Rs=new Be,pd=new L,Vp=new L,Hp=new L,P_=new L,md=new Rd,rn=new ue,Dc=[];function I_(s,t,e=0){let n=t.itemSize;if(s.isInterleavedBufferAttribute||s.array.constructor!==t.array.constructor){let i=s.count;for(let r=0;r<i;r++)for(let a=0;a<n;a++)t.setComponent(r+e,a,s.getComponent(r,a))}else t.array.set(s.array,e*n);t.needsUpdate=!0}function pi(s,t){if(s.constructor!==t.constructor){let e=Math.min(s.length,t.length);for(let n=0;n<e;n++)t[n]=s[n]}else{let e=Math.min(s.length,t.length);t.set(new s.constructor(s.buffer,0,e))}}var bo=class extends ue{constructor(t,e,n=e*2,i){super(new jt,i),this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._instanceInfo=[],this._geometryInfo=[],this._availableInstanceIds=[],this._availableGeometryIds=[],this._nextIndexStart=0,this._nextVertexStart=0,this._geometryCount=0,this._visibilityChanged=!0,this._geometryInitialized=!1,this._maxInstanceCount=t,this._maxVertexCount=e,this._maxIndexCount=n,this._multiDrawCounts=new Int32Array(t),this._multiDrawStarts=new Int32Array(t),this._multiDrawCount=0,this._multiDrawBytesPerElement=1,this._mergedDrawCounts=new Int32Array(t),this._mergedDrawStarts=new Int32Array(t),this._mergedDrawInstanceCounts=new Int32Array(t),this._mergedDrawCount=0,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._previousMatricesTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}get maxInstanceCount(){return this._maxInstanceCount}get instanceCount(){return this._instanceInfo.length-this._availableInstanceIds.length}get unusedVertexCount(){return this._maxVertexCount-this._nextVertexStart}get unusedIndexCount(){return this._maxIndexCount-this._nextIndexStart}_initMatricesTexture(){let t=Math.sqrt(this._maxInstanceCount*4);t=Math.ceil(t/4)*4,t=Math.max(t,4);let e=new Float32Array(t*t*4),n=new mn(e,t,t,gn,ln);this._matricesTexture=n}_initIndirectTexture(){let t=Math.sqrt(this._maxInstanceCount);t=Math.ceil(t);let e=new Uint32Array(t*t),n=new mn(e,t,t,Ca,Un);this._indirectTexture=n}_initColorsTexture(){let t=Math.sqrt(this._maxInstanceCount);t=Math.ceil(t);let e=new Float32Array(t*t*4).fill(1),n=new mn(e,t,t,gn,ln);n.colorSpace=ie.workingColorSpace,this._colorsTexture=n}_initializeGeometry(t){let e=this.geometry,n=this._maxVertexCount,i=this._maxIndexCount;if(this._geometryInitialized===!1){for(let r in t.attributes){let a=t.getAttribute(r),{array:o,itemSize:l,normalized:c}=a,h=new o.constructor(n*l),u=new ve(h,l,c);e.setAttribute(r,u)}if(t.getIndex()!==null){let r=n>65535?new Uint32Array(i):new Uint16Array(i);e.setIndex(new ve(r,1))}this._geometryInitialized=!0}}_validateGeometry(t){let e=this.geometry;if(!!t.getIndex()!=!!e.getIndex())throw new Error('THREE.BatchedMesh: All geometries must consistently have "index".');for(let n in e.attributes){if(!t.hasAttribute(n))throw new Error(`THREE.BatchedMesh: Added geometry missing "${n}". All geometries must have consistent attributes.`);let i=t.getAttribute(n),r=e.getAttribute(n);if(i.itemSize!==r.itemSize||i.normalized!==r.normalized)throw new Error(`THREE.BatchedMesh: Added geometry attribute "${n}" has an inconsistent itemSize or normalized value.`)}}validateInstanceId(t){let e=this._instanceInfo;if(t<0||t>=e.length||e[t].active===!1)throw new Error(`THREE.BatchedMesh: Invalid instanceId ${t}. Instance is either out of range or has been deleted.`)}validateGeometryId(t){let e=this._geometryInfo;if(t<0||t>=e.length||e[t].active===!1)throw new Error(`THREE.BatchedMesh: Invalid geometryId ${t}. Geometry is either out of range or has been deleted.`)}setCustomSort(t){return this.customSort=t,this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ge);let t=this.boundingBox,e=this._instanceInfo;t.makeEmpty();for(let n=0,i=e.length;n<i;n++){if(e[n].active===!1)continue;let r=e[n].geometryIndex;this.getMatrixAt(n,Mn),this.getBoundingBoxAt(r,Lc).applyMatrix4(Mn),t.union(Lc)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Be);let t=this.boundingSphere,e=this._instanceInfo;t.makeEmpty();for(let n=0,i=e.length;n<i;n++){if(e[n].active===!1)continue;let r=e[n].geometryIndex;this.getMatrixAt(n,Mn),this.getBoundingSphereAt(r,Rs).applyMatrix4(Mn),t.union(Rs)}}addInstance(t){if(this._instanceInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw new Error("THREE.BatchedMesh: Maximum item count reached.");let n={visible:!0,active:!0,geometryIndex:t},i=null;this._availableInstanceIds.length>0?(this._availableInstanceIds.sort(fd),i=this._availableInstanceIds.shift(),this._instanceInfo[i]=n):(i=this._instanceInfo.length,this._instanceInfo.push(n));let r=this._matricesTexture;Mn.identity().toArray(r.image.data,i*16),r.needsUpdate=!0;let a=this._colorsTexture;return a&&(A_.toArray(a.image.data,i*4),a.needsUpdate=!0),this._visibilityChanged=!0,i}addGeometry(t,e=-1,n=-1){this._initializeGeometry(t),this._validateGeometry(t);let i={vertexStart:-1,vertexCount:-1,reservedVertexCount:-1,indexStart:-1,indexCount:-1,reservedIndexCount:-1,start:-1,count:-1,boundingBox:null,boundingSphere:null,active:!0},r=this._geometryInfo;i.vertexStart=this._nextVertexStart,i.reservedVertexCount=e===-1?t.getAttribute("position").count:e;let a=t.getIndex();if(a!==null&&(i.indexStart=this._nextIndexStart,i.reservedIndexCount=n===-1?a.count:n),i.indexStart!==-1&&i.indexStart+i.reservedIndexCount>this._maxIndexCount||i.vertexStart+i.reservedVertexCount>this._maxVertexCount)throw new Error("THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.");let l;return this._availableGeometryIds.length>0?(this._availableGeometryIds.sort(fd),l=this._availableGeometryIds.shift(),r[l]=i):(l=this._geometryCount,this._geometryCount++,r.push(i)),this.setGeometryAt(l,t),this._nextIndexStart=i.indexStart+i.reservedIndexCount,this._nextVertexStart=i.vertexStart+i.reservedVertexCount,l}setGeometryAt(t,e){if(t>=this._geometryCount)throw new Error("THREE.BatchedMesh: Maximum geometry count reached.");this._validateGeometry(e);let n=this.geometry,i=n.getIndex()!==null,r=n.getIndex(),a=e.getIndex(),o=this._geometryInfo[t];if(i&&a.count>o.reservedIndexCount||e.attributes.position.count>o.reservedVertexCount)throw new Error("THREE.BatchedMesh: Reserved space not large enough for provided geometry.");let l=o.vertexStart,c=o.reservedVertexCount;o.vertexCount=e.getAttribute("position").count;for(let h in n.attributes){let u=e.getAttribute(h),f=n.getAttribute(h);I_(u,f,l);let d=u.itemSize;for(let p=u.count,_=c;p<_;p++){let m=l+p;for(let g=0;g<d;g++)f.setComponent(m,g,0)}f.needsUpdate=!0,f.addUpdateRange(l*d,c*d)}if(i){let h=o.indexStart,u=o.reservedIndexCount;o.indexCount=e.getIndex().count;for(let f=0;f<a.count;f++)r.setX(h+f,l+a.getX(f));for(let f=a.count,d=u;f<d;f++)r.setX(h+f,l);r.needsUpdate=!0,r.addUpdateRange(h,o.reservedIndexCount)}return o.start=i?o.indexStart:o.vertexStart,o.count=i?o.indexCount:o.vertexCount,o.boundingBox=null,e.boundingBox!==null&&(o.boundingBox=e.boundingBox.clone()),o.boundingSphere=null,e.boundingSphere!==null&&(o.boundingSphere=e.boundingSphere.clone()),this._visibilityChanged=!0,t}deleteGeometry(t){let e=this._geometryInfo;if(t>=e.length||e[t].active===!1)return this;let n=this._instanceInfo;for(let i=0,r=n.length;i<r;i++)n[i].active&&n[i].geometryIndex===t&&this.deleteInstance(i);return e[t].active=!1,this._availableGeometryIds.push(t),this._visibilityChanged=!0,this}deleteInstance(t){return this.validateInstanceId(t),this._instanceInfo[t].active=!1,this._availableInstanceIds.push(t),this._visibilityChanged=!0,this}optimize(){let t=0,e=0,n=this._geometryInfo,i=n.map((a,o)=>o).sort((a,o)=>n[a].vertexStart-n[o].vertexStart),r=this.geometry;for(let a=0,o=n.length;a<o;a++){let l=i[a],c=n[l];if(c.active!==!1){if(r.index!==null){if(c.indexStart!==e){let{indexStart:h,vertexStart:u,reservedIndexCount:f}=c,d=r.index,p=d.array,_=t-u;for(let m=h;m<h+f;m++)p[m]=p[m]+_;d.array.copyWithin(e,h,h+f),d.addUpdateRange(e,f),d.needsUpdate=!0,c.indexStart=e}e+=c.reservedIndexCount}if(c.vertexStart!==t){let{vertexStart:h,reservedVertexCount:u}=c,f=r.attributes;for(let d in f){let p=f[d],{array:_,itemSize:m}=p;_.copyWithin(t*m,h*m,(h+u)*m),p.addUpdateRange(t*m,u*m),p.needsUpdate=!0}c.vertexStart=t}t+=c.reservedVertexCount,c.start=r.index?c.indexStart:c.vertexStart}}return this._nextIndexStart=e,this._nextVertexStart=t,this._visibilityChanged=!0,this}getBoundingBoxAt(t,e){if(t>=this._geometryCount)return null;let n=this.geometry,i=this._geometryInfo[t];if(i.boundingBox===null){let r=new Ge,a=n.index,o=n.attributes.position;for(let l=i.start,c=i.start+i.count;l<c;l++){let h=l;a&&(h=a.getX(h)),r.expandByPoint(pd.fromBufferAttribute(o,h))}i.boundingBox=r}return e.copy(i.boundingBox),e}getBoundingSphereAt(t,e){if(t>=this._geometryCount)return null;let n=this.geometry,i=this._geometryInfo[t];if(i.boundingSphere===null){let r=new Be;this.getBoundingBoxAt(t,Lc),Lc.getCenter(r.center);let a=n.index,o=n.attributes.position,l=0;for(let c=i.start,h=i.start+i.count;c<h;c++){let u=c;a&&(u=a.getX(u)),pd.fromBufferAttribute(o,u),l=Math.max(l,r.center.distanceToSquared(pd))}r.radius=Math.sqrt(l),i.boundingSphere=r}return e.copy(i.boundingSphere),e}setMatrixAt(t,e){this.validateInstanceId(t);let n=this._matricesTexture,i=this._matricesTexture.image.data;return e.toArray(i,t*16),n.needsUpdate=!0,this}getMatrixAt(t,e){return this.validateInstanceId(t),e.fromArray(this._matricesTexture.image.data,t*16)}setColorAt(t,e){return this.validateInstanceId(t),this._colorsTexture===null&&this._initColorsTexture(),e.toArray(this._colorsTexture.image.data,t*4),this._colorsTexture.needsUpdate=!0,this}getColorAt(t,e){return this.validateInstanceId(t),this._colorsTexture===null?e.isVector4?e.set(1,1,1,1):e.setRGB(1,1,1):e.fromArray(this._colorsTexture.image.data,t*4)}setVisibleAt(t,e){return this.validateInstanceId(t),this._instanceInfo[t].visible===e?this:(this._instanceInfo[t].visible=e,this._visibilityChanged=!0,this)}getVisibleAt(t){return this.validateInstanceId(t),this._instanceInfo[t].visible}setGeometryIdAt(t,e){return this.validateInstanceId(t),this.validateGeometryId(e),this._instanceInfo[t].geometryIndex=e,this._visibilityChanged=!0,this}getGeometryIdAt(t){return this.validateInstanceId(t),this._instanceInfo[t].geometryIndex}getGeometryRangeAt(t,e={}){this.validateGeometryId(t);let n=this._geometryInfo[t];return e.vertexStart=n.vertexStart,e.vertexCount=n.vertexCount,e.reservedVertexCount=n.reservedVertexCount,e.indexStart=n.indexStart,e.indexCount=n.indexCount,e.reservedIndexCount=n.reservedIndexCount,e.start=n.start,e.count=n.count,e}setInstanceCount(t){let e=this._availableInstanceIds,n=this._instanceInfo;for(e.sort(fd);e[e.length-1]===n.length-1;)n.pop(),e.pop();if(t<n.length)throw new Error(`THREE.BatchedMesh: Instance ids outside the range ${t} are being used. Cannot shrink instance count.`);let i=new Int32Array(t),r=new Int32Array(t);pi(this._multiDrawCounts,i),pi(this._multiDrawStarts,r),this._multiDrawCounts=i,this._multiDrawStarts=r;let a=new Int32Array(t),o=new Int32Array(t),l=new Int32Array(t);pi(this._mergedDrawCounts,a),pi(this._mergedDrawStarts,o),pi(this._mergedDrawInstanceCounts,l),this._mergedDrawCounts=a,this._mergedDrawStarts=o,this._mergedDrawInstanceCounts=l,this._maxInstanceCount=t;let c=this._indirectTexture,h=this._matricesTexture,u=this._colorsTexture;c.dispose(),this._initIndirectTexture(),pi(c.image.data,this._indirectTexture.image.data),h.dispose(),this._initMatricesTexture(),pi(h.image.data,this._matricesTexture.image.data),u&&(u.dispose(),this._initColorsTexture(),pi(u.image.data,this._colorsTexture.image.data)),this._previousMatricesTexture!==null&&(this._previousMatricesTexture.dispose(),this._previousMatricesTexture=null)}setGeometrySize(t,e){let n=[...this._geometryInfo].filter(o=>o.active);if(Math.max(...n.map(o=>o.vertexStart+o.reservedVertexCount))>t)throw new Error(`THREE.BatchedMesh: Geometry vertex values are being used outside the range ${t}. Cannot shrink further.`);if(this.geometry.index&&Math.max(...n.map(l=>l.indexStart+l.reservedIndexCount))>e)throw new Error(`THREE.BatchedMesh: Geometry index values are being used outside the range ${e}. Cannot shrink further.`);let r=this.geometry;r.dispose(),this._maxVertexCount=t,this._maxIndexCount=e,this._geometryInitialized&&(this._geometryInitialized=!1,this.geometry=new jt,this._initializeGeometry(r));let a=this.geometry;r.index&&pi(r.index.array,a.index.array);for(let o in r.attributes)pi(r.attributes[o].array,a.attributes[o].array);this._visibilityChanged=!0}raycast(t,e){let n=this._instanceInfo,i=this._geometryInfo,r=this.matrixWorld,a=this.geometry;rn.material=this.material,rn.geometry.index=a.index,rn.geometry.attributes=a.attributes,rn.geometry.boundingBox===null&&(rn.geometry.boundingBox=new Ge),rn.geometry.boundingSphere===null&&(rn.geometry.boundingSphere=new Be);for(let o=0,l=n.length;o<l;o++){if(!n[o].visible||!n[o].active)continue;let c=n[o].geometryIndex,h=i[c];rn.geometry.setDrawRange(h.start,h.count),this.getMatrixAt(o,rn.matrixWorld).premultiply(r),this.getBoundingBoxAt(c,rn.geometry.boundingBox),this.getBoundingSphereAt(c,rn.geometry.boundingSphere),rn.raycast(t,Dc);for(let u=0,f=Dc.length;u<f;u++){let d=Dc[u];d.object=this,d.batchId=o,e.push(d)}Dc.length=0}rn.material=null,rn.geometry.index=null,rn.geometry.attributes={},rn.geometry.setDrawRange(0,1/0)}copy(t){return super.copy(t),this.geometry=t.geometry.clone(),this.perObjectFrustumCulled=t.perObjectFrustumCulled,this.sortObjects=t.sortObjects,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this._geometryInfo=t._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox!==null?e.boundingBox.clone():null,boundingSphere:e.boundingSphere!==null?e.boundingSphere.clone():null})),this._instanceInfo=t._instanceInfo.map(e=>({...e})),this._availableInstanceIds=t._availableInstanceIds.slice(),this._availableGeometryIds=t._availableGeometryIds.slice(),this._nextIndexStart=t._nextIndexStart,this._nextVertexStart=t._nextVertexStart,this._geometryCount=t._geometryCount,this._maxInstanceCount=t._maxInstanceCount,this._maxVertexCount=t._maxVertexCount,this._maxIndexCount=t._maxIndexCount,this._geometryInitialized=t._geometryInitialized,this._multiDrawCounts=t._multiDrawCounts.slice(),this._multiDrawStarts=t._multiDrawStarts.slice(),this._multiDrawBytesPerElement=t._multiDrawBytesPerElement,this._mergedDrawCounts=t._mergedDrawCounts.slice(),this._mergedDrawStarts=t._mergedDrawStarts.slice(),this._mergedDrawInstanceCounts=t._mergedDrawInstanceCounts.slice(),this._indirectTexture=t._indirectTexture.clone(),this._indirectTexture.image.data=this._indirectTexture.image.data.slice(),this._matricesTexture=t._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),t._colorsTexture!==null?(this._colorsTexture=t._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice()):this._colorsTexture=null,this}dispose(){super.dispose(),this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null&&(this._colorsTexture.dispose(),this._colorsTexture=null),this._previousMatricesTexture!==null&&(this._previousMatricesTexture.dispose(),this._previousMatricesTexture=null)}_updateDrawParameters(t,e,n,i="multiDraw"){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;let r=e.getIndex(),a=r===null?1:r.array.BYTES_PER_ELEMENT,o=1;n.wireframe&&(o=2,a=e.attributes.position.count>65535?4:2);let l=this._instanceInfo,c=this._multiDrawStarts,h=this._multiDrawCounts,u=this._mergedDrawStarts,f=this._mergedDrawCounts,d=this._mergedDrawInstanceCounts,p=this._geometryInfo,_=this.perObjectFrustumCulled,m=this._indirectTexture,g=m.image.data,y=t.isArrayCamera?C_:R_;_&&(t.isArrayCamera?y.setFromArrayCamera(t):(Mn.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse).multiply(this.matrixWorld),y.setFromProjectionMatrix(Mn,t.coordinateSystem,t.reversedDepth)));let M=0,v=0;if(this.sortObjects){Mn.copy(this.matrixWorld).invert(),Vp.setFromMatrixPosition(t.matrixWorld).applyMatrix4(Mn),Hp.set(0,0,-1).transformDirection(t.matrixWorld).transformDirection(Mn);for(let x=0,S=l.length;x<S;x++)if(l[x].visible&&l[x].active){let P=l[x].geometryIndex;this.getMatrixAt(x,Mn),this.getBoundingSphereAt(P,Rs).applyMatrix4(Mn);let R=!1;if(_&&(R=!y.intersectsSphere(Rs)),!R){let I=p[P],U=P_.subVectors(Rs.center,Vp).dot(Hp);md.push(I.start,I.count,U,x)}}let w=md.list,E=this.customSort;E===null?w.sort(n.transparent?w_:T_):E.call(this,w,t);for(let x=0,S=w.length;x<S;x++){let P=w[x],R=P.start*a*o,I=P.count*o;i==="merged"?v>0&&u[v-1]===R&&f[v-1]===I?d[v-1]++:(u[v]=R,f[v]=I,d[v]=1,v++):(c[M]=R,h[M]=I),g[M]=P.index,M++}md.reset()}else for(let w=0,E=l.length;w<E;w++)if(l[w].visible&&l[w].active){let x=l[w].geometryIndex,S=!1;if(_&&(this.getMatrixAt(w,Mn),this.getBoundingSphereAt(x,Rs).applyMatrix4(Mn),S=!y.intersectsSphere(Rs)),!S){let P=p[x],R=P.start*a*o,I=P.count*o;i==="merged"?v>0&&u[v-1]===R&&f[v-1]===I?d[v-1]++:(u[v]=R,f[v]=I,d[v]=1,v++):(c[M]=R,h[M]=I),g[M]=w,M++}}m.needsUpdate=!0,this._multiDrawCount=M,this._mergedDrawCount=v,this._multiDrawBytesPerElement=a,this._visibilityChanged=!1}onBeforeRender(t,e,n,i,r){t.isWebGPURenderer===!0?(this._visibilityChanged||this.perObjectFrustumCulled||this.sortObjects)&&(this._indirectTexture.needsUpdate=!0):this._updateDrawParameters(n,i,r)}onBeforeShadow(t,e,n,i,r,a){t.isWebGPURenderer!==!0&&this._updateDrawParameters(i,r,a)}},Ze=class extends ze{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Lt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},hh=new L,uh=new L,Wp=new Zt,to=new ai,Nc=new Be,gd=new L,Xp=new L,oi=class extends oe{constructor(t=new jt,e=new Ze){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[0];for(let i=1,r=e.count;i<r;i++)hh.fromBufferAttribute(e,i-1),uh.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=hh.distanceTo(uh);t.setAttribute("lineDistance",new Ot(n,1))}else Rt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.matrixWorld,r=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Nc.copy(n.boundingSphere),Nc.applyMatrix4(i),Nc.radius+=r,t.ray.intersectsSphere(Nc)===!1)return;Wp.copy(i).invert(),to.copy(t.ray).applyMatrix4(Wp);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,f=n.attributes.position;if(h!==null){let d=Math.max(0,a.start),p=Math.min(h.count,a.start+a.count);for(let _=d,m=p-1;_<m;_+=c){let g=h.getX(_),y=h.getX(_+1),M=Uc(this,t,to,l,g,y,_);M&&e.push(M)}if(this.isLineLoop){let _=h.getX(p-1),m=h.getX(d),g=Uc(this,t,to,l,_,m,p-1);g&&e.push(g)}}else{let d=Math.max(0,a.start),p=Math.min(f.count,a.start+a.count);for(let _=d,m=p-1;_<m;_+=c){let g=Uc(this,t,to,l,_,_+1,_);g&&e.push(g)}if(this.isLineLoop){let _=Uc(this,t,to,l,p-1,d,p-1);_&&e.push(_)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Uc(s,t,e,n,i,r,a){let o=s.geometry.attributes.position;if(hh.fromBufferAttribute(o,i),uh.fromBufferAttribute(o,r),e.distanceSqToSegment(hh,uh,gd,Xp)>n)return;gd.applyMatrix4(s.matrixWorld);let c=t.ray.origin.distanceTo(gd);if(!(c<t.near||c>t.far))return{distance:c,point:Xp.clone().applyMatrix4(s.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:s}}var qp=new L,Yp=new L,Dn=class extends oi{constructor(t,e){super(t,e),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[];for(let i=0,r=e.count;i<r;i+=2)qp.fromBufferAttribute(e,i),Yp.fromBufferAttribute(e,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+qp.distanceTo(Yp);t.setAttribute("lineDistance",new Ot(n,1))}else Rt("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},Eo=class extends oi{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}},Qr=class extends ze{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Lt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Zp=new Zt,Cd=new ai,Oc=new Be,Fc=new L,To=class extends oe{constructor(t=new jt,e=new Qr){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,i=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Oc.copy(n.boundingSphere),Oc.applyMatrix4(i),Oc.radius+=r,t.ray.intersectsSphere(Oc)===!1)return;Zp.copy(i).invert(),Cd.copy(t.ray).applyMatrix4(Zp);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);for(let p=f,_=d;p<_;p++){let m=c.getX(p);Fc.fromBufferAttribute(u,m),$p(Fc,m,l,i,t,e,this)}}else{let f=Math.max(0,a.start),d=Math.min(u.count,a.start+a.count);for(let p=f,_=d;p<_;p++)Fc.fromBufferAttribute(u,p),$p(Fc,p,l,i,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=i.length;r<a;r++){let o=i[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function $p(s,t,e,n,i,r,a){let o=Cd.distanceSqToPoint(s);if(o<e){let l=new L;Cd.closestPointToPoint(s,l),l.applyMatrix4(n);let c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}var wo=class extends Ie{constructor(t,e,n,i,r=Ee,a=Ee,o,l,c){super(t,e,n,i,r,a,o,l,c),this.isVideoTexture=!0,this.generateMipmaps=!1,this._requestVideoFrameCallbackId=0;let h=this;function u(){h.needsUpdate=!0,h._requestVideoFrameCallbackId=t.requestVideoFrameCallback(u)}"requestVideoFrameCallback"in t&&(this._requestVideoFrameCallbackId=t.requestVideoFrameCallback(u))}clone(){return new this.constructor(this.image).copy(this)}update(){let t=this.image;"requestVideoFrameCallback"in t===!1&&t.readyState>=t.HAVE_CURRENT_DATA&&(this.needsUpdate=!0)}dispose(){this._requestVideoFrameCallbackId!==0&&(this.source.data.cancelVideoFrameCallback(this._requestVideoFrameCallbackId),this._requestVideoFrameCallbackId=0),super.dispose()}},dh=class extends wo{constructor(t,e,n,i,r,a,o,l){super({},t,e,n,i,r,a,o,l),this.isVideoFrameTexture=!0}update(){}clone(){return new this.constructor().copy(this)}setFrame(t){this.image=t,this.needsUpdate=!0}},fh=class extends Ie{constructor(t,e){super({width:t,height:e}),this.isFramebufferTexture=!0,this.magFilter=Pe,this.minFilter=Pe,this.generateMipmaps=!1,this.needsUpdate=!0}copy(t){return super.copy(t),this.source=new Ln(Object.assign({},t.image)),this}},qs=class extends Ie{constructor(t=[],e,n,i,r,a,o,l,c,h,u,f){super(null,a,o,l,c,h,i,r,u,f),this.isCompressedTexture=!0,this.image={width:e,height:n},this.mipmaps=t,this.flipY=!1,this.generateMipmaps=!1}},ph=class extends qs{constructor(t,e,n,i,r,a){super(t,e,n,r,a),this.isCompressedArrayTexture=!0,this.image.depth=i,this.wrapR=pn,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}},mh=class extends qs{constructor(t,e,n){super(void 0,t[0].width,t[0].height,e,n,Si),this.isCompressedCubeTexture=!0,this.isCubeTexture=!0,this.image=t}},ls=class extends Ie{constructor(t=[],e=Si,n,i,r,a,o,l,c,h){super(t,e,n,i,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},ta=class extends Ie{constructor(t,e,n,i,r,a,o,l,c){super(t,e,n,i,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},gh=class extends Ie{constructor(t,e,n,i,r,a,o,l,c){super(t,e,n,i,r,a,o,l,c),this.isHTMLTexture=!0,this.generateMipmaps=!1,this.needsUpdate=!0;let h=t?t.parentNode:null;h!==null&&"requestPaint"in h&&(h.onpaint=()=>{this.needsUpdate=!0},h.requestPaint())}dispose(){let t=this.image?this.image.parentNode:null;t!==null&&"onpaint"in t&&(t.onpaint=null),super.dispose()}},yi=class extends Ie{constructor(t,e,n=Un,i,r,a,o=Pe,l=Pe,c,h=_i,u=1){if(h!==_i&&h!==bi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let f={width:t,height:e,depth:u};super(f,i,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new Ln(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},ea=class extends yi{constructor(t,e=Un,n=Si,i,r,a=Pe,o=Pe,l,c=_i){let h={width:t,height:t,depth:1},u=[h,h,h,h,h,h];super(t,t,e,n,i,r,a,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},na=class extends Ie{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Tn=class s extends jt{constructor(t=1,e=1,n=1,i=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:r,depthSegments:a};let o=this;i=Math.floor(i),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],f=0,d=0;p("z","y","x",-1,-1,n,e,t,a,r,0),p("z","y","x",1,-1,n,e,-t,a,r,1),p("x","z","y",1,1,t,n,e,i,a,2),p("x","z","y",1,-1,t,n,-e,i,a,3),p("x","y","z",1,-1,t,e,n,i,r,4),p("x","y","z",-1,-1,t,e,-n,i,r,5),this.setIndex(l),this.setAttribute("position",new Ot(c,3)),this.setAttribute("normal",new Ot(h,3)),this.setAttribute("uv",new Ot(u,2));function p(_,m,g,y,M,v,w,E,x,S,P){let R=v/x,I=w/S,U=v/2,O=w/2,C=E/2,F=x+1,H=S+1,B=0,Q=0,k=new L;for(let tt=0;tt<H;tt++){let J=tt*I-O;for(let Z=0;Z<F;Z++){let ht=Z*R-U;k[_]=ht*y,k[m]=J*M,k[g]=C,c.push(k.x,k.y,k.z),k[_]=0,k[m]=0,k[g]=E>0?1:-1,h.push(k.x,k.y,k.z),u.push(Z/x),u.push(1-tt/S),B+=1}}for(let tt=0;tt<S;tt++)for(let J=0;J<x;J++){let Z=f+J+F*tt,ht=f+J+F*(tt+1),X=f+(J+1)+F*(tt+1),q=f+(J+1)+F*tt;l.push(Z,ht,q),l.push(ht,X,q),Q+=6}o.addGroup(d,Q,P),d+=Q,f+=B}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Ao=class s extends jt{constructor(t=1,e=1,n=4,i=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:e,capSegments:n,radialSegments:i,heightSegments:r},e=Math.max(0,e),n=Math.max(1,Math.floor(n)),i=Math.max(3,Math.floor(i)),r=Math.max(1,Math.floor(r));let a=[],o=[],l=[],c=[],h=e/2,u=Math.PI/2*t,f=e,d=2*u+f,p=n*2+r,_=i+1,m=new L,g=new L;for(let y=0;y<=p;y++){let M=0,v=0,w=0,E=0;if(y<=n){let P=y/n,R=P*Math.PI/2;v=-h-t*Math.cos(R),w=t*Math.sin(R),E=-t*Math.cos(R),M=P*u}else if(y<=n+r){let P=(y-n)/r;v=-h+P*e,w=t,E=0,M=u+P*f}else{let P=(y-n-r)/n,R=P*Math.PI/2;v=h+t*Math.sin(R),w=t*Math.cos(R),E=t*Math.sin(R),M=u+f+P*u}let x=Math.max(0,Math.min(1,M/d)),S=0;y===0?S=.5/i:y===p&&(S=-.5/i);for(let P=0;P<=i;P++){let R=P/i,I=R*Math.PI*2,U=Math.sin(I),O=Math.cos(I);g.x=-w*O,g.y=v,g.z=w*U,o.push(g.x,g.y,g.z),m.set(-w*O,E,w*U),m.normalize(),l.push(m.x,m.y,m.z),c.push(R+S,x)}if(y>0){let P=(y-1)*_;for(let R=0;R<i;R++){let I=P+R,U=P+R+1,O=y*_+R,C=y*_+R+1;a.push(I,U,O),a.push(U,C,O)}}}this.setIndex(a),this.setAttribute("position",new Ot(o,3)),this.setAttribute("normal",new Ot(l,3)),this.setAttribute("uv",new Ot(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}},Ro=class s extends jt{constructor(t=1,e=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:i},e=Math.max(3,e);let r=[],a=[],o=[],l=[],c=new L,h=new ct;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,f=3;u<=e;u++,f+=3){let d=n+u/e*i;c.x=t*Math.cos(d),c.y=t*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[f]/t+1)/2,h.y=(a[f+1]/t+1)/2,l.push(h.x,h.y)}for(let u=1;u<=e;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Ot(a,3)),this.setAttribute("normal",new Ot(o,3)),this.setAttribute("uv",new Ot(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.segments,t.thetaStart,t.thetaLength)}},cs=class s extends jt{constructor(t=1,e=1,n=1,i=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;i=Math.floor(i),r=Math.floor(r);let h=[],u=[],f=[],d=[],p=0,_=[],m=n/2,g=0;y(),a===!1&&(t>0&&M(!0),e>0&&M(!1)),this.setIndex(h),this.setAttribute("position",new Ot(u,3)),this.setAttribute("normal",new Ot(f,3)),this.setAttribute("uv",new Ot(d,2));function y(){let v=new L,w=new L,E=0,x=(e-t)/n;for(let S=0;S<=r;S++){let P=[],R=S/r,I=R*(e-t)+t;for(let U=0;U<=i;U++){let O=U/i,C=O*l+o,F=Math.sin(C),H=Math.cos(C);w.x=I*F,w.y=-R*n+m,w.z=I*H,u.push(w.x,w.y,w.z),v.set(F,x,H).normalize(),f.push(v.x,v.y,v.z),d.push(O,1-R),P.push(p++)}_.push(P)}for(let S=0;S<i;S++)for(let P=0;P<r;P++){let R=_[P][S],I=_[P+1][S],U=_[P+1][S+1],O=_[P][S+1];(t>0||P!==0)&&(h.push(R,I,O),E+=3),(e>0||P!==r-1)&&(h.push(I,U,O),E+=3)}c.addGroup(g,E,0),g+=E}function M(v){let w=p,E=new ct,x=new L,S=0,P=v===!0?t:e,R=v===!0?1:-1;for(let U=1;U<=i;U++)u.push(0,m*R,0),f.push(0,R,0),d.push(.5,.5),p++;let I=p;for(let U=0;U<=i;U++){let C=U/i*l+o,F=Math.cos(C),H=Math.sin(C);x.x=P*H,x.y=m*R,x.z=P*F,u.push(x.x,x.y,x.z),f.push(0,R,0),E.x=F*.5+.5,E.y=H*.5*R+.5,d.push(E.x,E.y),p++}for(let U=0;U<i;U++){let O=w+U,C=I+U;v===!0?h.push(C,C+1,O):h.push(C+1,C,O),S+=3}c.addGroup(g,S,v===!0?1:2),g+=S}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ia=class s extends cs{constructor(t=1,e=1,n=32,i=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,i,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new s(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Gi=class s extends jt{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};let r=[],a=[];o(i),c(n),h(),this.setAttribute("position",new Ot(r,3)),this.setAttribute("normal",new Ot(r.slice(),3)),this.setAttribute("uv",new Ot(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(y){let M=new L,v=new L,w=new L;for(let E=0;E<e.length;E+=3)d(e[E+0],M),d(e[E+1],v),d(e[E+2],w),l(M,v,w,y)}function l(y,M,v,w){let E=w+1,x=[];for(let S=0;S<=E;S++){x[S]=[];let P=y.clone().lerp(v,S/E),R=M.clone().lerp(v,S/E),I=E-S;for(let U=0;U<=I;U++)U===0&&S===E?x[S][U]=P:x[S][U]=P.clone().lerp(R,U/I)}for(let S=0;S<E;S++)for(let P=0;P<2*(E-S)-1;P++){let R=Math.floor(P/2);P%2===0?(f(x[S][R+1]),f(x[S+1][R]),f(x[S][R])):(f(x[S][R+1]),f(x[S+1][R+1]),f(x[S+1][R]))}}function c(y){let M=new L;for(let v=0;v<r.length;v+=3)M.x=r[v+0],M.y=r[v+1],M.z=r[v+2],M.normalize().multiplyScalar(y),r[v+0]=M.x,r[v+1]=M.y,r[v+2]=M.z}function h(){let y=new L;for(let M=0;M<r.length;M+=3){y.x=r[M+0],y.y=r[M+1],y.z=r[M+2];let v=m(y)/2/Math.PI+.5,w=g(y)/Math.PI+.5;a.push(v,1-w)}p(),u()}function u(){for(let y=0;y<a.length;y+=6){let M=a[y+0],v=a[y+2],w=a[y+4],E=Math.max(M,v,w),x=Math.min(M,v,w);E>.9&&x<.1&&(M<.2&&(a[y+0]+=1),v<.2&&(a[y+2]+=1),w<.2&&(a[y+4]+=1))}}function f(y){r.push(y.x,y.y,y.z)}function d(y,M){let v=y*3;M.x=t[v+0],M.y=t[v+1],M.z=t[v+2]}function p(){let y=new L,M=new L,v=new L,w=new L,E=new ct,x=new ct,S=new ct;for(let P=0,R=0;P<r.length;P+=9,R+=6){y.set(r[P+0],r[P+1],r[P+2]),M.set(r[P+3],r[P+4],r[P+5]),v.set(r[P+6],r[P+7],r[P+8]),E.set(a[R+0],a[R+1]),x.set(a[R+2],a[R+3]),S.set(a[R+4],a[R+5]),w.copy(y).add(M).add(v).divideScalar(3);let I=m(w);_(E,R+0,y,I),_(x,R+2,M,I),_(S,R+4,v,I)}}function _(y,M,v,w){w<0&&y.x===1&&(a[M]=y.x-1),v.x===0&&v.z===0&&(a[M]=w/2/Math.PI+.5)}function m(y){return Math.atan2(y.z,-y.x)}function g(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.vertices,t.indices,t.radius,t.detail)}},Co=class s extends Gi{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,i=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,a,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new s(t.radius,t.detail)}},Bc=new L,zc=new L,_d=new L,kc=new ii,Po=class extends jt{constructor(t=null,e=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:t,thresholdAngle:e},t!==null){let i=Math.pow(10,4),r=Math.cos(Os*e),a=t.getIndex(),o=t.getAttribute("position"),l=a?a.count:o.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),f=new Map,d=[];for(let p=0;p<l;p+=3){a?(c[0]=a.getX(p),c[1]=a.getX(p+1),c[2]=a.getX(p+2)):(c[0]=p,c[1]=p+1,c[2]=p+2);let{a:_,b:m,c:g}=kc;if(_.fromBufferAttribute(o,c[0]),m.fromBufferAttribute(o,c[1]),g.fromBufferAttribute(o,c[2]),kc.getNormal(_d),u[0]=`${Math.round(_.x*i)},${Math.round(_.y*i)},${Math.round(_.z*i)}`,u[1]=`${Math.round(m.x*i)},${Math.round(m.y*i)},${Math.round(m.z*i)}`,u[2]=`${Math.round(g.x*i)},${Math.round(g.y*i)},${Math.round(g.z*i)}`,!(u[0]===u[1]||u[1]===u[2]||u[2]===u[0]))for(let y=0;y<3;y++){let M=(y+1)%3,v=u[y],w=u[M],E=kc[h[y]],x=kc[h[M]],S=`${v}_${w}`,P=`${w}_${v}`,R=f.get(P);R?(_d.dot(R.normal)<=r&&(d.push(E.x,E.y,E.z),d.push(x.x,x.y,x.z)),f.set(P,null)):f.has(S)||f.set(S,{index0:c[y],index1:c[M],normal:_d.clone()})}}for(let p of f.values())if(p){let{index0:_,index1:m}=p;Bc.fromBufferAttribute(o,_),zc.fromBufferAttribute(o,m),d.push(Bc.x,Bc.y,Bc.z),d.push(zc.x,zc.y,zc.z)}this.setAttribute("position",new Ot(d,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}},wn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Rt("Curve: .getPoint() not implemented.")}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,i=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(i),e.push(r),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){let n=this.getLengths(),i=0,r=n.length,a;e?a=e:a=t*n[r-1];let o=0,l=r-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(r-1);let h=n[i],f=n[i+1]-h,d=(a-h)/f;return(i+d)/(r-1)}getTangent(t,e){let i=t-1e-4,r=t+1e-4;i<0&&(i=0),r>1&&(r=1);let a=this.getPoint(i),o=this.getPoint(r),l=e||(a.isVector2?new ct:new L);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){let n=new L,i=[],r=[],a=[],o=new L,l=new Zt;for(let d=0;d<=t;d++){let p=d/t;i[d]=this.getTangentAt(p,new L)}r[0]=new L,a[0]=new L;let c=Number.MAX_VALUE,h=Math.abs(i[0].x),u=Math.abs(i[0].y),f=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),f<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),r[0].crossVectors(i[0],o),a[0].crossVectors(i[0],r[0]);for(let d=1;d<=t;d++){if(r[d]=r[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(i[d-1],i[d]),o.length()>Number.EPSILON){o.normalize();let p=Math.acos(Yt(i[d-1].dot(i[d]),-1,1));r[d].applyMatrix4(l.makeRotationAxis(o,p))}a[d].crossVectors(i[d],r[d])}if(e===!0){let d=Math.acos(Yt(r[0].dot(r[t]),-1,1));d/=t,i[0].dot(o.crossVectors(r[0],r[t]))>0&&(d=-d);for(let p=1;p<=t;p++)r[p].applyMatrix4(l.makeRotationAxis(i[p],d*p)),a[p].crossVectors(i[p],r[p])}return{tangents:i,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this.cacheArcLengths=null,this}},Ys=class extends wn{constructor(t=0,e=0,n=1,i=1,r=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new ct){let n=e,i=Math.PI*2,r=this.aEndAngle-this.aStartAngle,a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=i;for(;r>i;)r-=i;r<Number.EPSILON&&(a?r=0:r=i),this.aClockwise===!0&&!a&&(r===i?r=-i:r=r-i);let o=this.aStartAngle+t*r,l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*h-d*u+this.aX,c=f*u+d*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},Io=class extends Ys{constructor(t,e,n,i,r,a){super(t,e,n,n,i,r,a),this.isArcCurve=!0,this.type="ArcCurve"}};function wf(){let s=0,t=0,e=0,n=0;function i(r,a,o,l){s=r,t=o,e=-3*r+3*a-2*o-l,n=2*r-2*a+o+l}return{initCatmullRom:function(r,a,o,l,c){i(a,o,c*(o-r),c*(l-a))},initNonuniformCatmullRom:function(r,a,o,l,c,h,u){let f=(a-r)/c-(o-r)/(c+h)+(o-a)/h,d=(o-a)/h-(l-a)/(h+u)+(l-o)/u;f*=h,d*=h,i(a,o,f,d)},calc:function(r){let a=r*r,o=a*r;return s+t*r+e*a+n*o}}}var Jp=new L,Kp=new L,xd=new wf,yd=new wf,vd=new wf,Zs=class extends wn{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new L){let n=e,i=this.points,r=i.length,a=(r-(this.closed?0:1))*t,o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:l===0&&o===r-1&&(o=r-2,l=1);let c,h;this.closed||o>0?c=i[(o-1)%r]:(Kp.subVectors(i[0],i[1]).add(i[0]),c=Kp);let u=i[o%r],f=i[(o+1)%r];if(this.closed||o+2<r?h=i[(o+2)%r]:(Jp.subVectors(i[r-1],i[r-2]).add(i[r-1]),h=Jp),this.curveType==="centripetal"||this.curveType==="chordal"){let d=this.curveType==="chordal"?.5:.25,p=Math.pow(c.distanceToSquared(u),d),_=Math.pow(u.distanceToSquared(f),d),m=Math.pow(f.distanceToSquared(h),d);_<1e-4&&(_=1),p<1e-4&&(p=_),m<1e-4&&(m=_),xd.initNonuniformCatmullRom(c.x,u.x,f.x,h.x,p,_,m),yd.initNonuniformCatmullRom(c.y,u.y,f.y,h.y,p,_,m),vd.initNonuniformCatmullRom(c.z,u.z,f.z,h.z,p,_,m)}else this.curveType==="catmullrom"&&(xd.initCatmullRom(c.x,u.x,f.x,h.x,this.tension),yd.initCatmullRom(c.y,u.y,f.y,h.y,this.tension),vd.initCatmullRom(c.z,u.z,f.z,h.z,this.tension));return n.set(xd.calc(l),yd.calc(l),vd.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(new L().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function jp(s,t,e,n,i){let r=(n-t)*.5,a=(i-e)*.5,o=s*s,l=s*o;return(2*e-2*n+r+a)*l+(-3*e+3*n-2*r-a)*o+r*s+e}function L_(s,t){let e=1-s;return e*e*t}function D_(s,t){return 2*(1-s)*s*t}function N_(s,t){return s*s*t}function ao(s,t,e,n){return L_(s,t)+D_(s,e)+N_(s,n)}function U_(s,t){let e=1-s;return e*e*e*t}function O_(s,t){let e=1-s;return 3*e*e*s*t}function F_(s,t){return 3*(1-s)*s*s*t}function B_(s,t){return s*s*s*t}function oo(s,t,e,n,i){return U_(s,t)+O_(s,e)+F_(s,n)+B_(s,i)}var sa=class extends wn{constructor(t=new ct,e=new ct,n=new ct,i=new ct){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new ct){let n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(oo(t,i.x,r.x,a.x,o.x),oo(t,i.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},Lo=class extends wn{constructor(t=new L,e=new L,n=new L,i=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new L){let n=e,i=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(oo(t,i.x,r.x,a.x,o.x),oo(t,i.y,r.y,a.y,o.y),oo(t,i.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},ra=class extends wn{constructor(t=new ct,e=new ct){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new ct){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new ct){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Do=class extends wn{constructor(t=new L,e=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new L){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new L){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},aa=class extends wn{constructor(t=new ct,e=new ct,n=new ct){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new ct){let n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(ao(t,i.x,r.x,a.x),ao(t,i.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},oa=class extends wn{constructor(t=new L,e=new L,n=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new L){let n=e,i=this.v0,r=this.v1,a=this.v2;return n.set(ao(t,i.x,r.x,a.x),ao(t,i.y,r.y,a.y),ao(t,i.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},la=class extends wn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new ct){let n=e,i=this.points,r=(i.length-1)*t,a=Math.floor(r),o=r-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],u=i[a>i.length-3?i.length-1:a+2];return n.set(jp(o,l.x,c.x,h.x,u.x),jp(o,l.y,c.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(i.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let i=t.points[e];this.points.push(new ct().fromArray(i))}return this}},_h=Object.freeze({__proto__:null,ArcCurve:Io,CatmullRomCurve3:Zs,CubicBezierCurve:sa,CubicBezierCurve3:Lo,EllipseCurve:Ys,LineCurve:ra,LineCurve3:Do,QuadraticBezierCurve:aa,QuadraticBezierCurve3:oa,SplineCurve:la}),No=class extends wn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1,this.cacheLengths=null}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new _h[n](e,t))}return this}getPoint(t,e){let n=t*this.getLength(),i=this.getCurveLengths(),r=0;for(;r<i.length;){if(i[r]>=n){let a=i[r]-n,o=this.curves[r],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],n;for(let i=0,r=this.curves;i<r.length;i++){let a=r[i],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){let h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this.cacheLengths=null,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){let i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let i=t.curves[e];this.curves.push(new _h[i.type]().fromJSON(i))}return this.cacheLengths=null,this}},hs=class extends No{constructor(t){super(),this.type="Path",this.currentPoint=new ct,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let n=new ra(this.currentPoint.clone(),new ct(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){let r=new aa(this.currentPoint.clone(),new ct(t,e),new ct(n,i));return this.curves.push(r),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,r,a){let o=new sa(this.currentPoint.clone(),new ct(t,e),new ct(n,i),new ct(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),n=new la(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,r,a){let o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,i,r,a),this}absarc(t,e,n,i,r,a){return this.absellipse(t,e,n,n,i,r,a),this}ellipse(t,e,n,i,r,a,o,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,i,r,a,o,l),this}absellipse(t,e,n,i,r,a,o,l){let c=new Ys(t,e,n,i,r,a,o,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}},us=class extends hs{constructor(t){super(t),this.uuid=Yn(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let n=0,i=this.holes.length;n<i;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let i=t.holes[e];this.holes.push(i.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){let i=this.holes[e];t.holes.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let i=t.holes[e];this.holes.push(new hs().fromJSON(i))}return this}};function z_(s,t,e=2){let n=t&&t.length,i=n?t[0]*e:s.length,r=Am(s,0,i,e,!0),a=[];if(!r||r.next===r.prev)return a;let o,l,c;if(n&&(r=W_(s,t,r,e)),s.length>80*e){o=s[0],l=s[1];let h=o,u=l;for(let f=e;f<i;f+=e){let d=s[f],p=s[f+1];d<o&&(o=d),p<l&&(l=p),d>h&&(h=d),p>u&&(u=p)}c=Math.max(h-o,u-l),c=c!==0?32767/c:0}return Uo(r,a,e,o,l,c,0),a}function Am(s,t,e,n,i){let r;if(i===ex(s,t,e,n)>0)for(let a=t;a<e;a+=n)r=Qp(a/n|0,s[a],s[a+1],r);else for(let a=e-n;a>=t;a-=n)r=Qp(a/n|0,s[a],s[a+1],r);return r&&ca(r,r.next)&&(Fo(r),r=r.next),r}function $s(s,t){if(!s)return s;t||(t=s);let e=s,n;do if(n=!1,!e.steiner&&(ca(e,e.next)||Ae(e.prev,e,e.next)===0)){if(Fo(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Uo(s,t,e,n,i,r,a){if(!s)return;!a&&r&&$_(s,n,i,r);let o=s;for(;s.prev!==s.next;){let l=s.prev,c=s.next;if(r?G_(s,n,i,r):k_(s)){t.push(l.i,s.i,c.i),Fo(s),s=c.next,o=c.next;continue}if(s=c,s===o){a?a===1?(s=V_($s(s),t),Uo(s,t,e,n,i,r,2)):a===2&&H_(s,t,e,n,i,r):Uo($s(s),t,e,n,i,r,1);break}}}function k_(s){let t=s.prev,e=s,n=s.next;if(Ae(t,e,n)>=0)return!1;let i=t.x,r=e.x,a=n.x,o=t.y,l=e.y,c=n.y,h=Math.min(i,r,a),u=Math.min(o,l,c),f=Math.max(i,r,a),d=Math.max(o,l,c),p=n.next;for(;p!==t;){if(p.x>=h&&p.x<=f&&p.y>=u&&p.y<=d&&no(i,o,r,l,a,c,p.x,p.y)&&Ae(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function G_(s,t,e,n){let i=s.prev,r=s,a=s.next;if(Ae(i,r,a)>=0)return!1;let o=i.x,l=r.x,c=a.x,h=i.y,u=r.y,f=a.y,d=Math.min(o,l,c),p=Math.min(h,u,f),_=Math.max(o,l,c),m=Math.max(h,u,f),g=Pd(d,p,t,e,n),y=Pd(_,m,t,e,n),M=s.prevZ,v=s.nextZ;for(;M&&M.z>=g&&v&&v.z<=y;){if(M.x>=d&&M.x<=_&&M.y>=p&&M.y<=m&&M!==i&&M!==a&&no(o,h,l,u,c,f,M.x,M.y)&&Ae(M.prev,M,M.next)>=0||(M=M.prevZ,v.x>=d&&v.x<=_&&v.y>=p&&v.y<=m&&v!==i&&v!==a&&no(o,h,l,u,c,f,v.x,v.y)&&Ae(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;M&&M.z>=g;){if(M.x>=d&&M.x<=_&&M.y>=p&&M.y<=m&&M!==i&&M!==a&&no(o,h,l,u,c,f,M.x,M.y)&&Ae(M.prev,M,M.next)>=0)return!1;M=M.prevZ}for(;v&&v.z<=y;){if(v.x>=d&&v.x<=_&&v.y>=p&&v.y<=m&&v!==i&&v!==a&&no(o,h,l,u,c,f,v.x,v.y)&&Ae(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function V_(s,t){let e=s;do{let n=e.prev,i=e.next.next;!ca(n,i)&&Cm(n,e,e.next,i)&&Oo(n,i)&&Oo(i,n)&&(t.push(n.i,e.i,i.i),Fo(e),Fo(e.next),e=s=i),e=e.next}while(e!==s);return $s(e)}function H_(s,t,e,n,i,r){let a=s;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&j_(a,o)){let l=Pm(a,o);a=$s(a,a.next),l=$s(l,l.next),Uo(a,t,e,n,i,r,0),Uo(l,t,e,n,i,r,0);return}o=o.next}a=a.next}while(a!==s)}function W_(s,t,e,n){let i=[];for(let r=0,a=t.length;r<a;r++){let o=t[r]*n,l=r<a-1?t[r+1]*n:s.length,c=Am(s,o,l,n,!1);c===c.next&&(c.steiner=!0),i.push(K_(c))}i.sort(X_);for(let r=0;r<i.length;r++)e=q_(i[r],e);return e}function X_(s,t){let e=s.x-t.x;if(e===0&&(e=s.y-t.y,e===0)){let n=(s.next.y-s.y)/(s.next.x-s.x),i=(t.next.y-t.y)/(t.next.x-t.x);e=n-i}return e}function q_(s,t){let e=Y_(s,t);if(!e)return t;let n=Pm(e,s);return $s(n,n.next),$s(e,e.next)}function Y_(s,t){let e=t,n=s.x,i=s.y,r=-1/0,a;if(ca(s,e))return e;do{if(ca(s,e.next))return e.next;if(i<=e.y&&i>=e.next.y&&e.next.y!==e.y){let u=e.x+(i-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(u<=n&&u>r&&(r=u,a=e.x<e.next.x?e:e.next,u===n))return a}e=e.next}while(e!==t);if(!a)return null;let o=a,l=a.x,c=a.y,h=1/0;e=a;do{if(n>=e.x&&e.x>=l&&n!==e.x&&Rm(i<c?n:r,i,l,c,i<c?r:n,i,e.x,e.y)){let u=Math.abs(i-e.y)/(n-e.x);Oo(e,s)&&(u<h||u===h&&(e.x>a.x||e.x===a.x&&Z_(a,e)))&&(a=e,h=u)}e=e.next}while(e!==o);return a}function Z_(s,t){return Ae(s.prev,s,t.prev)<0&&Ae(t.next,s,s.next)<0}function $_(s,t,e,n){let i=s;do i.z===0&&(i.z=Pd(i.x,i.y,t,e,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==s);i.prevZ.nextZ=null,i.prevZ=null,J_(i)}function J_(s){let t,e=1;do{let n=s,i;s=null;let r=null;for(t=0;n;){t++;let a=n,o=0;for(let c=0;c<e&&(o++,a=a.nextZ,!!a);c++);let l=e;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(i=n,n=n.nextZ,o--):(i=a,a=a.nextZ,l--),r?r.nextZ=i:s=i,i.prevZ=r,r=i;n=a}r.nextZ=null,e*=2}while(t>1);return s}function Pd(s,t,e,n,i){return s=(s-e)*i|0,t=(t-n)*i|0,s=(s|s<<8)&16711935,s=(s|s<<4)&252645135,s=(s|s<<2)&858993459,s=(s|s<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,s|t<<1}function K_(s){let t=s,e=s;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==s);return e}function Rm(s,t,e,n,i,r,a,o){return(i-a)*(t-o)>=(s-a)*(r-o)&&(s-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(i-a)*(n-o)}function no(s,t,e,n,i,r,a,o){return!(s===a&&t===o)&&Rm(s,t,e,n,i,r,a,o)}function j_(s,t){return s.next.i!==t.i&&s.prev.i!==t.i&&!Q_(s,t)&&(Oo(s,t)&&Oo(t,s)&&tx(s,t)&&(Ae(s.prev,s,t.prev)||Ae(s,t.prev,t))||ca(s,t)&&Ae(s.prev,s,s.next)>0&&Ae(t.prev,t,t.next)>0)}function Ae(s,t,e){return(t.y-s.y)*(e.x-t.x)-(t.x-s.x)*(e.y-t.y)}function ca(s,t){return s.x===t.x&&s.y===t.y}function Cm(s,t,e,n){let i=Vc(Ae(s,t,e)),r=Vc(Ae(s,t,n)),a=Vc(Ae(e,n,s)),o=Vc(Ae(e,n,t));return!!(i!==r&&a!==o||i===0&&Gc(s,e,t)||r===0&&Gc(s,n,t)||a===0&&Gc(e,s,n)||o===0&&Gc(e,t,n))}function Gc(s,t,e){return t.x<=Math.max(s.x,e.x)&&t.x>=Math.min(s.x,e.x)&&t.y<=Math.max(s.y,e.y)&&t.y>=Math.min(s.y,e.y)}function Vc(s){return s>0?1:s<0?-1:0}function Q_(s,t){let e=s;do{if(e.i!==s.i&&e.next.i!==s.i&&e.i!==t.i&&e.next.i!==t.i&&Cm(e,e.next,s,t))return!0;e=e.next}while(e!==s);return!1}function Oo(s,t){return Ae(s.prev,s,s.next)<0?Ae(s,t,s.next)>=0&&Ae(s,s.prev,t)>=0:Ae(s,t,s.prev)<0||Ae(s,s.next,t)<0}function tx(s,t){let e=s,n=!1,i=(s.x+t.x)/2,r=(s.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&i<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==s);return n}function Pm(s,t){let e=Id(s.i,s.x,s.y),n=Id(t.i,t.x,t.y),i=s.next,r=t.prev;return s.next=t,t.prev=s,e.next=i,i.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function Qp(s,t,e,n){let i=Id(s,t,e);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function Fo(s){s.next.prev=s.prev,s.prev.next=s.next,s.prevZ&&(s.prevZ.nextZ=s.nextZ),s.nextZ&&(s.nextZ.prevZ=s.prevZ)}function Id(s,t,e){return{i:s,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function ex(s,t,e,n){let i=0;for(let r=t,a=e-n;r<e;r+=n)i+=(s[a]-s[r])*(s[r+1]+s[a+1]),a=r;return i}var Ld=class{static triangulate(t,e,n=2){return z_(t,e,n)}},kn=class s{static area(t){let e=t.length,n=0;for(let i=e-1,r=0;r<e;i=r++)n+=t[i].x*t[r].y-t[r].x*t[i].y;return n*.5}static isClockWise(t){return s.area(t)<0}static triangulateShape(t,e){let n=[],i=[],r=[];t0(t),e0(n,t);let a=t.length;e.forEach(t0);for(let l=0;l<e.length;l++)i.push(a),a+=e[l].length,e0(n,e[l]);let o=Ld.triangulate(n,i);for(let l=0;l<o.length;l+=3)r.push(o.slice(l,l+3));return r}};function t0(s){let t=s.length;t>2&&s[t-1].equals(s[0])&&s.pop()}function e0(s,t){for(let e=0;e<t.length;e++)s.push(t[e].x),s.push(t[e].y)}var Bo=class s extends jt{constructor(t=new us([new ct(.5,.5),new ct(-.5,.5),new ct(-.5,-.5),new ct(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];let n=this,i=[],r=[];for(let o=0,l=t.length;o<l;o++){let c=t[o];a(c)}this.setAttribute("position",new Ot(i,3)),this.setAttribute("uv",new Ot(r,2)),this.computeVertexNormals();function a(o){let l=[],c=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,u=e.depth!==void 0?e.depth:1,f=e.bevelEnabled!==void 0?e.bevelEnabled:!0,d=e.bevelThickness!==void 0?e.bevelThickness:.2,p=e.bevelSize!==void 0?e.bevelSize:d-.1,_=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3,g=e.extrudePath,y=e.UVGenerator!==void 0?e.UVGenerator:nx,M,v=!1,w,E,x,S;if(g){M=g.getSpacedPoints(h),v=!0,f=!1;let nt=g.isCatmullRomCurve3?g.closed:!1;w=g.computeFrenetFrames(h,nt),E=new L,x=new L,S=new L}f||(m=0,d=0,p=0,_=0);let P=o.extractPoints(c),R=P.shape,I=P.holes;if(!kn.isClockWise(R)){R=R.reverse();for(let nt=0,ft=I.length;nt<ft;nt++){let _t=I[nt];kn.isClockWise(_t)&&(I[nt]=_t.reverse())}}function O(nt){let _t=10000000000000001e-36,Dt=nt[0];for(let Mt=1;Mt<=nt.length;Mt++){let qt=Mt%nt.length,Ft=nt[qt],ee=Ft.x-Dt.x,ne=Ft.y-Dt.y,ae=ee*ee+ne*ne,V=Math.max(Math.abs(Ft.x),Math.abs(Ft.y),Math.abs(Dt.x),Math.abs(Dt.y)),Te=_t*V*V;if(ae<=Te){nt.splice(qt,1),Mt--;continue}Dt=Ft}}O(R),I.forEach(O);let C=I.length,F=R;for(let nt=0;nt<C;nt++){let ft=I[nt];R=R.concat(ft)}function H(nt,ft,_t){return ft||Ht("ExtrudeGeometry: vec does not exist"),nt.clone().addScaledVector(ft,_t)}let B=R.length;function Q(nt,ft,_t){let Dt,Mt,qt,Ft=nt.x-ft.x,ee=nt.y-ft.y,ne=_t.x-nt.x,ae=_t.y-nt.y,V=Ft*Ft+ee*ee,Te=Ft*ae-ee*ne;if(Math.abs(Te)>Number.EPSILON){let Qt=Math.sqrt(V),he=Math.sqrt(ne*ne+ae*ae),Et=ft.x-ee/Qt,be=ft.y+Ft/Qt,Nt=_t.x-ae/he,Wt=_t.y+ne/he,D=((Nt-Et)*ae-(Wt-be)*ne)/(Ft*ae-ee*ne);Dt=Et+Ft*D-nt.x,Mt=be+ee*D-nt.y;let T=Dt*Dt+Mt*Mt;if(T<=2)return new ct(Dt,Mt);qt=Math.sqrt(T/2)}else{let Qt=!1;Ft>Number.EPSILON?ne>Number.EPSILON&&(Qt=!0):Ft<-Number.EPSILON?ne<-Number.EPSILON&&(Qt=!0):Math.sign(ee)===Math.sign(ae)&&(Qt=!0),Qt?(Dt=-ee,Mt=Ft,qt=Math.sqrt(V)):(Dt=Ft,Mt=ee,qt=Math.sqrt(V/2))}return new ct(Dt/qt,Mt/qt)}let k=[];for(let nt=0,ft=F.length,_t=ft-1,Dt=nt+1;nt<ft;nt++,_t++,Dt++)_t===ft&&(_t=0),Dt===ft&&(Dt=0),k[nt]=Q(F[nt],F[_t],F[Dt]);let tt=[],J,Z=k.concat();for(let nt=0,ft=C;nt<ft;nt++){let _t=I[nt];J=[];for(let Dt=0,Mt=_t.length,qt=Mt-1,Ft=Dt+1;Dt<Mt;Dt++,qt++,Ft++)qt===Mt&&(qt=0),Ft===Mt&&(Ft=0),J[Dt]=Q(_t[Dt],_t[qt],_t[Ft]);tt.push(J),Z=Z.concat(J)}let ht;if(m===0)ht=kn.triangulateShape(F,I);else{let nt=[],ft=[];for(let _t=0;_t<m;_t++){let Dt=_t/m,Mt=d*Math.cos(Dt*Math.PI/2),qt=p*Math.sin(Dt*Math.PI/2)+_;for(let Ft=0,ee=F.length;Ft<ee;Ft++){let ne=H(F[Ft],k[Ft],qt);W(ne.x,ne.y,-Mt),Dt===0&&nt.push(ne)}for(let Ft=0,ee=C;Ft<ee;Ft++){let ne=I[Ft];J=tt[Ft];let ae=[];for(let V=0,Te=ne.length;V<Te;V++){let Qt=H(ne[V],J[V],qt);W(Qt.x,Qt.y,-Mt),Dt===0&&ae.push(Qt)}Dt===0&&ft.push(ae)}}ht=kn.triangulateShape(nt,ft)}let X=ht.length,q=p+_;for(let nt=0;nt<B;nt++){let ft=f?H(R[nt],Z[nt],q):R[nt];v?(x.copy(w.normals[0]).multiplyScalar(ft.x),E.copy(w.binormals[0]).multiplyScalar(ft.y),S.copy(M[0]).add(x).add(E),W(S.x,S.y,S.z)):W(ft.x,ft.y,0)}for(let nt=1;nt<=h;nt++)for(let ft=0;ft<B;ft++){let _t=f?H(R[ft],Z[ft],q):R[ft];v?(x.copy(w.normals[nt]).multiplyScalar(_t.x),E.copy(w.binormals[nt]).multiplyScalar(_t.y),S.copy(M[nt]).add(x).add(E),W(S.x,S.y,S.z)):W(_t.x,_t.y,u/h*nt)}for(let nt=m-1;nt>=0;nt--){let ft=nt/m,_t=d*Math.cos(ft*Math.PI/2),Dt=p*Math.sin(ft*Math.PI/2)+_;for(let Mt=0,qt=F.length;Mt<qt;Mt++){let Ft=H(F[Mt],k[Mt],Dt);W(Ft.x,Ft.y,u+_t)}for(let Mt=0,qt=I.length;Mt<qt;Mt++){let Ft=I[Mt];J=tt[Mt];for(let ee=0,ne=Ft.length;ee<ne;ee++){let ae=H(Ft[ee],J[ee],Dt);v?W(ae.x,ae.y+M[h-1].y,M[h-1].x+_t):W(ae.x,ae.y,u+_t)}}}$(),lt();function $(){let nt=i.length/3;if(f){let ft=0,_t=B*ft;for(let Dt=0;Dt<X;Dt++){let Mt=ht[Dt];mt(Mt[2]+_t,Mt[1]+_t,Mt[0]+_t)}ft=h+m*2,_t=B*ft;for(let Dt=0;Dt<X;Dt++){let Mt=ht[Dt];mt(Mt[0]+_t,Mt[1]+_t,Mt[2]+_t)}}else{for(let ft=0;ft<X;ft++){let _t=ht[ft];mt(_t[2],_t[1],_t[0])}for(let ft=0;ft<X;ft++){let _t=ht[ft];mt(_t[0]+B*h,_t[1]+B*h,_t[2]+B*h)}}n.addGroup(nt,i.length/3-nt,0)}function lt(){let nt=i.length/3,ft=0;Y(F,ft),ft+=F.length;for(let _t=0,Dt=I.length;_t<Dt;_t++){let Mt=I[_t];Y(Mt,ft),ft+=Mt.length}n.addGroup(nt,i.length/3-nt,1)}function Y(nt,ft){let _t=nt.length;for(;--_t>=0;){let Dt=_t,Mt=_t-1;Mt<0&&(Mt=nt.length-1);for(let qt=0,Ft=h+m*2;qt<Ft;qt++){let ee=B*qt,ne=B*(qt+1),ae=ft+Dt+ee,V=ft+Mt+ee,Te=ft+Mt+ne,Qt=ft+Dt+ne;pt(ae,V,Te,Qt)}}}function W(nt,ft,_t){l.push(nt),l.push(ft),l.push(_t)}function mt(nt,ft,_t){St(nt),St(ft),St(_t);let Dt=i.length/3,Mt=y.generateTopUV(n,i,Dt-3,Dt-2,Dt-1);Ct(Mt[0]),Ct(Mt[1]),Ct(Mt[2])}function pt(nt,ft,_t,Dt){St(nt),St(ft),St(Dt),St(ft),St(_t),St(Dt);let Mt=i.length/3,qt=y.generateSideWallUV(n,i,Mt-6,Mt-3,Mt-2,Mt-1);Ct(qt[0]),Ct(qt[1]),Ct(qt[3]),Ct(qt[1]),Ct(qt[2]),Ct(qt[3])}function St(nt){i.push(l[nt*3+0]),i.push(l[nt*3+1]),i.push(l[nt*3+2])}function Ct(nt){r.push(nt.x),r.push(nt.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return ix(e,n,t)}static fromJSON(t,e){let n=[];for(let r=0,a=t.shapes.length;r<a;r++){let o=e[t.shapes[r]];n.push(o)}let i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new _h[i.type]().fromJSON(i)),new s(n,t.options)}},nx={generateTopUV:function(s,t,e,n,i){let r=t[e*3],a=t[e*3+1],o=t[n*3],l=t[n*3+1],c=t[i*3],h=t[i*3+1];return[new ct(r,a),new ct(o,l),new ct(c,h)]},generateSideWallUV:function(s,t,e,n,i,r){let a=t[e*3],o=t[e*3+1],l=t[e*3+2],c=t[n*3],h=t[n*3+1],u=t[n*3+2],f=t[i*3],d=t[i*3+1],p=t[i*3+2],_=t[r*3],m=t[r*3+1],g=t[r*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new ct(a,1-l),new ct(c,1-u),new ct(f,1-p),new ct(_,1-g)]:[new ct(o,1-l),new ct(h,1-u),new ct(d,1-p),new ct(m,1-g)]}};function ix(s,t,e){if(e.shapes=[],Array.isArray(s))for(let n=0,i=s.length;n<i;n++){let r=s[n];e.shapes.push(r.uuid)}else e.shapes.push(s.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}var zo=class s extends Gi{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new s(t.radius,t.detail)}},ko=class s extends jt{constructor(t=[new ct(0,-.5),new ct(.5,0),new ct(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=Yt(i,0,Math.PI*2);let r=[],a=[],o=[],l=[],c=[],h=1/e,u=new L,f=new ct,d=new L,p=new L,_=new L,m=0,g=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:m=t[y+1].x-t[y].x,g=t[y+1].y-t[y].y,d.x=g*1,d.y=-m,d.z=g*0,_.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case t.length-1:_.normalize(),l.push(_.x,_.y,_.z);break;default:m=t[y+1].x-t[y].x,g=t[y+1].y-t[y].y,d.x=g*1,d.y=-m,d.z=g*0,p.copy(d),d.x+=_.x,d.y+=_.y,d.z+=_.z,d.normalize(),l.push(d.x,d.y,d.z),_.copy(p)}for(let y=0;y<=e;y++){let M=n+y*h*i,v=Math.sin(M),w=Math.cos(M);for(let E=0;E<=t.length-1;E++){u.x=t[E].x*v,u.y=t[E].y,u.z=t[E].x*w,a.push(u.x,u.y,u.z),f.x=y/e,f.y=E/(t.length-1),o.push(f.x,f.y);let x=l[3*E+0]*v,S=l[3*E+1],P=l[3*E+0]*w;c.push(x,S,P)}}for(let y=0;y<e;y++)for(let M=0;M<t.length-1;M++){let v=M+y*t.length,w=v,E=v+t.length,x=v+t.length+1,S=v+1;r.push(w,E,S),r.push(x,S,E)}this.setIndex(r),this.setAttribute("position",new Ot(a,3)),this.setAttribute("uv",new Ot(o,2)),this.setAttribute("normal",new Ot(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.points,t.segments,t.phiStart,t.phiLength)}},ha=class s extends Gi{constructor(t=1,e=0){let n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new s(t.radius,t.detail)}},li=class s extends jt{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=t/o,f=e/l,d=[],p=[],_=[],m=[];for(let g=0;g<h;g++){let y=g*f-a;for(let M=0;M<c;M++){let v=M*u-r;p.push(v,-y,0),_.push(0,0,1),m.push(M/o),m.push(1-g/l)}}for(let g=0;g<l;g++)for(let y=0;y<o;y++){let M=y+c*g,v=y+c*(g+1),w=y+1+c*(g+1),E=y+1+c*g;d.push(M,v,E),d.push(v,w,E)}this.setIndex(d),this.setAttribute("position",new Ot(p,3)),this.setAttribute("normal",new Ot(_,3)),this.setAttribute("uv",new Ot(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.width,t.height,t.widthSegments,t.heightSegments)}},Go=class s extends jt{constructor(t=.5,e=1,n=32,i=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:r,thetaLength:a},n=Math.max(3,n),i=Math.max(1,i);let o=[],l=[],c=[],h=[],u=t,f=(e-t)/i,d=new L,p=new ct;for(let _=0;_<=i;_++){for(let m=0;m<=n;m++){let g=r+m/n*a;d.x=u*Math.cos(g),d.y=u*Math.sin(g),l.push(d.x,d.y,d.z),c.push(0,0,1),p.x=(d.x/e+1)/2,p.y=(d.y/e+1)/2,h.push(p.x,p.y)}u+=f}for(let _=0;_<i;_++){let m=_*(n+1);for(let g=0;g<n;g++){let y=g+m,M=y,v=y+n+1,w=y+n+2,E=y+1;o.push(M,v,E),o.push(v,w,E)}}this.setIndex(o),this.setAttribute("position",new Ot(l,3)),this.setAttribute("normal",new Ot(c,3)),this.setAttribute("uv",new Ot(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},Vo=class s extends jt{constructor(t=new us([new ct(0,.5),new ct(-.5,-.5),new ct(.5,-.5)]),e=12){super(),this.type="ShapeGeometry",this.parameters={shapes:t,curveSegments:e};let n=[],i=[],r=[],a=[],o=0,l=0;if(Array.isArray(t)===!1)c(t);else for(let h=0;h<t.length;h++)c(t[h]),this.addGroup(o,l,h),o+=l,l=0;this.setIndex(n),this.setAttribute("position",new Ot(i,3)),this.setAttribute("normal",new Ot(r,3)),this.setAttribute("uv",new Ot(a,2));function c(h){let u=i.length/3,f=h.extractPoints(e),d=f.shape,p=f.holes;kn.isClockWise(d)===!1&&(d=d.reverse());for(let m=0,g=p.length;m<g;m++){let y=p[m];kn.isClockWise(y)===!0&&(p[m]=y.reverse())}let _=kn.triangulateShape(d,p);for(let m=0,g=p.length;m<g;m++){let y=p[m];d=d.concat(y)}for(let m=0,g=d.length;m<g;m++){let y=d[m];i.push(y.x,y.y,0),r.push(0,0,1),a.push(y.x,y.y)}for(let m=0,g=_.length;m<g;m++){let y=_[m],M=y[0]+u,v=y[1]+u,w=y[2]+u;n.push(M,v,w),l+=3}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes;return sx(e,t)}static fromJSON(t,e){let n=[];for(let i=0,r=t.shapes.length;i<r;i++){let a=e[t.shapes[i]];n.push(a)}return new s(n,t.curveSegments)}};function sx(s,t){if(t.shapes=[],Array.isArray(s))for(let e=0,n=s.length;e<n;e++){let i=s[e];t.shapes.push(i.uuid)}else t.shapes.push(s.uuid);return t}var ua=class s extends jt{constructor(t=1,e=32,n=16,i=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],u=new L,f=new L,d=[],p=[],_=[],m=[];for(let g=0;g<=n;g++){let y=[],M=g/n,v=a+M*o,w=t*Math.cos(v),E=Math.sqrt(t*t-w*w),x=0;g===0&&a===0?x=.5/e:g===n&&l===Math.PI&&(x=-.5/e);for(let S=0;S<=e;S++){let P=S/e,R=i+P*r;u.x=-E*Math.cos(R),u.y=w,u.z=E*Math.sin(R),p.push(u.x,u.y,u.z),f.copy(u).normalize(),_.push(f.x,f.y,f.z),m.push(P+x,1-M),y.push(c++)}h.push(y)}for(let g=0;g<n;g++)for(let y=0;y<e;y++){let M=h[g][y+1],v=h[g][y],w=h[g+1][y],E=h[g+1][y+1];(g!==0||a>0)&&d.push(M,v,E),(g!==n-1||l<Math.PI)&&d.push(v,w,E)}this.setIndex(d),this.setAttribute("position",new Ot(p,3)),this.setAttribute("normal",new Ot(_,3)),this.setAttribute("uv",new Ot(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},Ho=class s extends Gi{constructor(t=1,e=0){let n=[1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],i=[2,1,0,0,3,2,1,3,0,2,3,1];super(n,i,t,e),this.type="TetrahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new s(t.radius,t.detail)}},Wo=class s extends jt{constructor(t=1,e=.4,n=12,i=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),i=Math.floor(i);let l=[],c=[],h=[],u=[],f=new L,d=new L,p=new L;for(let _=0;_<=n;_++){let m=a+_/n*o;for(let g=0;g<=i;g++){let y=g/i*r;d.x=(t+e*Math.cos(m))*Math.cos(y),d.y=(t+e*Math.cos(m))*Math.sin(y),d.z=e*Math.sin(m),c.push(d.x,d.y,d.z),f.x=t*Math.cos(y),f.y=t*Math.sin(y),p.subVectors(d,f).normalize(),h.push(p.x,p.y,p.z),u.push(g/i),u.push(_/n)}}for(let _=1;_<=n;_++)for(let m=1;m<=i;m++){let g=(i+1)*_+m-1,y=(i+1)*(_-1)+m-1,M=(i+1)*(_-1)+m,v=(i+1)*_+m;l.push(g,y,v),l.push(y,M,v)}this.setIndex(l),this.setAttribute("position",new Ot(c,3)),this.setAttribute("normal",new Ot(h,3)),this.setAttribute("uv",new Ot(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}},Xo=class s extends jt{constructor(t=1,e=.4,n=64,i=8,r=2,a=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:t,tube:e,tubularSegments:n,radialSegments:i,p:r,q:a},n=Math.floor(n),i=Math.floor(i);let o=[],l=[],c=[],h=[],u=new L,f=new L,d=new L,p=new L,_=new L,m=new L,g=new L;for(let M=0;M<=n;++M){let v=M/n*r*Math.PI*2;y(v,r,a,t,d),y(v+.01,r,a,t,p),m.subVectors(p,d),g.addVectors(p,d),_.crossVectors(m,g),g.crossVectors(_,m),_.normalize(),g.normalize();for(let w=0;w<=i;++w){let E=w/i*Math.PI*2,x=-e*Math.cos(E),S=e*Math.sin(E);u.x=d.x+(x*g.x+S*_.x),u.y=d.y+(x*g.y+S*_.y),u.z=d.z+(x*g.z+S*_.z),l.push(u.x,u.y,u.z),f.subVectors(u,d).normalize(),c.push(f.x,f.y,f.z),h.push(M/n),h.push(w/i)}}for(let M=1;M<=n;M++)for(let v=1;v<=i;v++){let w=(i+1)*(M-1)+(v-1),E=(i+1)*M+(v-1),x=(i+1)*M+v,S=(i+1)*(M-1)+v;o.push(w,E,S),o.push(E,x,S)}this.setIndex(o),this.setAttribute("position",new Ot(l,3)),this.setAttribute("normal",new Ot(c,3)),this.setAttribute("uv",new Ot(h,2));function y(M,v,w,E,x){let S=Math.cos(M),P=Math.sin(M),R=w/v*M,I=Math.cos(R);x.x=E*(2+I)*.5*S,x.y=E*(2+I)*P*.5,x.z=E*Math.sin(R)*.5}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new s(t.radius,t.tube,t.tubularSegments,t.radialSegments,t.p,t.q)}},Js=class s extends jt{constructor(t=new oa(new L(-1,-1,0),new L(-1,1,0),new L(1,1,0)),e=64,n=1,i=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:i,closed:r};let a=t.computeFrenetFrames(e,r);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;let o=new L,l=new L,c=new ct,h=new L,u=[],f=[],d=[],p=[];_(),this.setIndex(p),this.setAttribute("position",new Ot(u,3)),this.setAttribute("normal",new Ot(f,3)),this.setAttribute("uv",new Ot(d,2));function _(){for(let M=0;M<e;M++)m(M);m(r===!1?e:0),y(),g()}function m(M){h=t.getPointAt(M/e,h);let v=a.normals[M],w=a.binormals[M];for(let E=0;E<=i;E++){let x=E/i*Math.PI*2,S=Math.sin(x),P=-Math.cos(x);l.x=P*v.x+S*w.x,l.y=P*v.y+S*w.y,l.z=P*v.z+S*w.z,l.normalize(),f.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,u.push(o.x,o.y,o.z)}}function g(){for(let M=1;M<=e;M++)for(let v=1;v<=i;v++){let w=(i+1)*(M-1)+(v-1),E=(i+1)*M+(v-1),x=(i+1)*M+v,S=(i+1)*(M-1)+v;p.push(w,E,S),p.push(E,x,S)}}function y(){for(let M=0;M<=e;M++)for(let v=0;v<=i;v++)c.x=M/e,c.y=v/i,d.push(c.x,c.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new s(new _h[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}},qo=class extends jt{constructor(t=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:t},t!==null){let e=[],n=new Set,i=new L,r=new L;if(t.index!==null){let a=t.attributes.position,o=t.index,l=t.groups;l.length===0&&(l=[{start:0,count:o.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let u=l[c],f=u.start,d=u.count;for(let p=f,_=f+d;p<_;p+=3)for(let m=0;m<3;m++){let g=o.getX(p+m),y=o.getX(p+(m+1)%3);i.fromBufferAttribute(a,g),r.fromBufferAttribute(a,y),n0(i,r,n)===!0&&(e.push(i.x,i.y,i.z),e.push(r.x,r.y,r.z))}}}else{let a=t.attributes.position;for(let o=0,l=a.count/3;o<l;o++)for(let c=0;c<3;c++){let h=3*o+c,u=3*o+(c+1)%3;i.fromBufferAttribute(a,h),r.fromBufferAttribute(a,u),n0(i,r,n)===!0&&(e.push(i.x,i.y,i.z),e.push(r.x,r.y,r.z))}}this.setAttribute("position",new Ot(e,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}};function n0(s,t,e){let n=`${s.x},${s.y},${s.z}-${t.x},${t.y},${t.z}`,i=`${t.x},${t.y},${t.z}-${s.x},${s.y},${s.z}`;return e.has(n)===!0||e.has(i)===!0?!1:(e.add(n),e.add(i),!0)}var i0=Object.freeze({__proto__:null,BoxGeometry:Tn,CapsuleGeometry:Ao,CircleGeometry:Ro,ConeGeometry:ia,CylinderGeometry:cs,DodecahedronGeometry:Co,EdgesGeometry:Po,ExtrudeGeometry:Bo,IcosahedronGeometry:zo,LatheGeometry:ko,OctahedronGeometry:ha,PlaneGeometry:li,PolyhedronGeometry:Gi,RingGeometry:Go,ShapeGeometry:Vo,SphereGeometry:ua,TetrahedronGeometry:Ho,TorusGeometry:Wo,TorusKnotGeometry:Xo,TubeGeometry:Js,WireframeGeometry:qo}),Yo=class extends ze{constructor(t){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new Lt(0),this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.fog=t.fog,this}};function dr(s){let t={};for(let e in s){t[e]={};for(let n in s[e]){let i=s[e][n];if(s0(i))i.isRenderTargetTexture?(Rt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone();else if(Array.isArray(i))if(s0(i[0])){let r=[];for(let a=0,o=i.length;a<o;a++)r[a]=i[a].clone();t[e][n]=r}else t[e][n]=i.slice();else t[e][n]=i}}return t}function hn(s){let t={};for(let e=0;e<s.length;e++){let n=dr(s[e]);for(let i in n)t[i]=n[i]}return t}function s0(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function rx(s){let t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function Af(s){let t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ie.workingColorSpace}var Rf={clone:dr,merge:hn},ax=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ox=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Hn=class extends ze{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ax,this.fragmentShader=ox,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=dr(t.uniforms),this.uniformsGroups=rx(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let i in this.uniforms){let a=this.uniforms[i].value;a&&a.isTexture?e.uniforms[i]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[i]={type:"m4",value:a.toArray()}:e.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let i=t.uniforms[n];switch(this.uniforms[n]={},i.type){case"t":this.uniforms[n].value=e[i.value]||null;break;case"c":this.uniforms[n].value=new Lt().setHex(i.value);break;case"v2":this.uniforms[n].value=new ct().fromArray(i.value);break;case"v3":this.uniforms[n].value=new L().fromArray(i.value);break;case"v4":this.uniforms[n].value=new _e().fromArray(i.value);break;case"m3":this.uniforms[n].value=new $t().fromArray(i.value);break;case"m4":this.uniforms[n].value=new Zt().fromArray(i.value);break;default:this.uniforms[n].value=i.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},da=class extends Hn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},ci=class extends ze{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Lt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ei,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},Ks=class extends ci{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ct(1,1),this.clearcoatNormalMap=null,this.diffuseRoughnessMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Yt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessMinimum=100,this.iridescenceThicknessMaximum=400,this.iridescenceThicknessMap=null,this.sheenColor=new Lt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Lt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Lt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._diffuseRoughness=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get diffuseRoughness(){return this._diffuseRoughness}set diffuseRoughness(t){this._diffuseRoughness>0!=t>0&&this.version++,this._diffuseRoughness=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}get iridescenceThicknessRange(){return gi('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),[this.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum]}set iridescenceThicknessRange(t){gi('MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".'),this.iridescenceThicknessMinimum=t[0],this.iridescenceThicknessMaximum=t[1]}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.diffuseRoughness=t.diffuseRoughness,this.diffuseRoughnessMap=t.diffuseRoughnessMap,this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum,this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}},Zo=class extends ze{constructor(t){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new Lt(16777215),this.specular=new Lt(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ei,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gn,this.combine=Ea,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.specular.copy(t.specular),this.shininess=t.shininess,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},$o=class extends ze{constructor(t){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new Lt(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ei,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.gradientMap=t.gradientMap,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},Jo=class extends ze{constructor(t){super(),this.isMeshNormalMaterial=!0,this.type="MeshNormalMaterial",this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ei,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.setValues(t)}copy(t){return super.copy(t),this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.flatShading=t.flatShading,this}},js=class extends ze{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Lt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Lt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ei,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Gn,this.combine=Ea,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},fa=class extends ze{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=mf,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},pa=class extends ze{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},Ko=class extends ze{constructor(t){super(),this.isMeshMatcapMaterial=!0,this.defines={MATCAP:""},this.type="MeshMatcapMaterial",this.color=new Lt(16777215),this.matcap=null,this.map=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ei,this.normalScale=new ct(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={MATCAP:""},this.color.copy(t.color),this.matcap=t.matcap,this.map=t.map,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.alphaMap=t.alphaMap,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.flatShading=t.flatShading,this.fog=t.fog,this}},jo=class extends Ze{constructor(t){super(),this.isLineDashedMaterial=!0,this.type="LineDashedMaterial",this.scale=1,this.dashSize=3,this.gapSize=1,this.setValues(t)}copy(t){return super.copy(t),this.scale=t.scale,this.dashSize=t.dashSize,this.gapSize=t.gapSize,this}};function ni(s,t){return!s||s.constructor===t?s:typeof t.BYTES_PER_ELEMENT=="number"?new t(s):Array.prototype.slice.call(s)}function Br(s){return s!==void 0&&s.inTangents!==void 0&&s.outTangents!==void 0}function Im(s){function t(i,r){return s[i]-s[r]}let e=s.length,n=new Array(e);for(let i=0;i!==e;++i)n[i]=i;return n.sort(t),n}function Dd(s,t,e){let n=s.length,i=new s.constructor(n);for(let r=0,a=0;a!==n;++r){let o=e[r]*t;for(let l=0;l!==t;++l)i[a++]=s[o+l]}return i}function Lm(s,t,e,n){let i=1,r=s[0];for(;r!==void 0&&r[n]===void 0;)r=s[i++];if(r===void 0)return;let a=r[n];if(a!==void 0)if(Array.isArray(a))do a=r[n],a!==void 0&&(t.push(r.time),e.push(...a)),r=s[i++];while(r!==void 0);else if(a.toArray!==void 0)do a=r[n],a!==void 0&&(t.push(r.time),a.toArray(e,e.length)),r=s[i++];while(r!==void 0);else do a=r[n],a!==void 0&&(t.push(r.time),e.push(a)),r=s[i++];while(r!==void 0)}function lx(s,t,e,n,i=30){let r=s.clone();r.name=t;let a=[];for(let l=0;l<r.tracks.length;++l){let c=r.tracks[l],h=c.getValueSize(),u=[],f=[];for(let d=0;d<c.times.length;++d){let p=c.times[d]*i;if(!(p<e||p>=n)){u.push(c.times[d]);for(let _=0;_<h;++_)f.push(c.values[d*h+_])}}u.length!==0&&(c.times=ni(u,c.times.constructor),c.values=ni(f,c.values.constructor),a.push(c))}r.tracks=a;let o=1/0;for(let l=0;l<r.tracks.length;++l)o>r.tracks[l].times[0]&&(o=r.tracks[l].times[0]);for(let l=0;l<r.tracks.length;++l)r.tracks[l].shift(-1*o);return r.resetDuration(),r}function cx(s,t=0,e=s,n=30){n<=0&&(n=30);let i=e.tracks.length,r=t/n;for(let a=0;a<i;++a){let o=e.tracks[a],l=o.ValueTypeName;if(l==="bool"||l==="string")continue;let c=s.tracks.find(function(g){return g.name===o.name&&g.ValueTypeName===l});if(c===void 0)continue;let h=0,u=o.getValueSize();o.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(h=u/3);let f=0,d=c.getValueSize();c.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline&&(f=d/3);let p=o.times.length-1,_;if(r<=o.times[0]){let g=h,y=u-h;_=o.values.slice(g,y)}else if(r>=o.times[p]){let g=p*u+h,y=g+u-h;_=o.values.slice(g,y)}else{let g=o.createInterpolant();g.evaluate(r),_=g.resultBuffer.slice()}l==="quaternion"&&new Ne().fromArray(_).normalize().conjugate().toArray(_);let m=c.times.length;for(let g=0;g<m;++g){let y=g*d+f;if(l==="quaternion")Ne.multiplyQuaternionsFlat(c.values,y,_,0,c.values,y);else{let M=d-f*2;for(let v=0;v<M;++v)c.values[y+v]-=_[v]}}}return s.blendMode=bu,s}var xh=class{static convertArray(t,e){return ni(t,e)}static isTypedArray(t){return ym(t)}static hasTangents(t){return Br(t)}static getKeyframeOrder(t){return Im(t)}static sortedArray(t,e,n){return Dd(t,e,n)}static flattenJSON(t,e,n,i){Lm(t,e,n,i)}static subclip(t,e,n,i,r=30){return lx(t,e,n,i,r)}static makeClipAdditive(t,e=0,n=t,i=30){return cx(t,e,n,i)}},Vi=class{constructor(t,e,n,i){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=i!==void 0?i:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,i=e[n],r=e[n-1];t:{e:{let a;n:{i:if(!(t<i)){for(let o=n+2;;){if(i===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=i,i=e[++n],t<i)break e}a=e.length;break n}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(i=r,r=e[--n-1],t>=r)break e}a=n,n=0;break n}break t}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(i=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,i)}return this.interpolate_(n,r,t,i)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,i=this.valueSize,r=t*i;for(let a=0;a!==i;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Qo=class extends Vi{constructor(t,e,n,i){super(t,e,n,i),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:is,endingEnd:is}}intervalChanged_(t,e,n){let i=this.parameterPositions,r=t-2,a=t+1,o=i[r],l=i[a];if(o===void 0)switch(this.getSettings_().endingStart){case ss:r=t,o=2*e-n;break;case Vr:r=i.length-2,o=e+i[r]-i[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case ss:a=t,l=2*n-e;break;case Vr:a=1,l=n+i[1]-i[0];break;default:a=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,p=(n-e)/(i-e),_=p*p,m=_*p,g=-f*m+2*f*_-f*p,y=(1+f)*m+(-1.5-2*f)*_+(-.5+f)*p+1,M=(-1-d)*m+(1.5+d)*_+.5*p,v=d*m-d*_;for(let w=0;w!==o;++w)r[w]=g*a[h+w]+y*a[c+w]+M*a[l+w]+v*a[u+w];return r}},ma=class extends Vi{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(i-e),u=1-h;for(let f=0;f!==o;++f)r[f]=a[c+f]*u+a[l+f]*h;return r}},tl=class extends Vi{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t){return this.copySampleValue_(t-1)}},el=class extends Vi{interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this.inTangents,u=this.outTangents;if(!h||!u){let p=(n-e)/(i-e),_=1-p;for(let m=0;m!==o;++m)r[m]=a[c+m]*_+a[l+m]*p;return r}let f=o*2,d=t-1;for(let p=0;p!==o;++p){let _=a[c+p],m=a[l+p],g=d*f+p*2,y=u[g],M=u[g+1],v=t*f+p*2,w=h[v],E=h[v+1],x=ux(n,e,y,w,i);r[p]=Dm(x,_,M,E,m)}return r}};function Dm(s,t,e,n,i){let r=1-s;return r*r*r*t+3*r*r*s*e+3*r*s*s*n+s*s*s*i}function hx(s,t,e,n,i){let r=1-s;return 3*r*r*(e-t)+6*r*s*(n-e)+3*s*s*(i-n)}function ux(s,t,e,n,i){let r=(s-t)/(i-t);for(let a=0;a<8;a++){let o=Dm(r,t,e,n,i)-s;if(Math.abs(o)<1e-10)break;let l=hx(r,t,e,n,i);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-o/l))}return r}var _n=class{constructor(t,e,n,i){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=ni(e,this.TimeBufferType),this.values=ni(n,this.ValueBufferType),this.setInterpolation(i||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:ni(t.times,Array),values:ni(t.values,Array)};let i=t.getInterpolation();i!==t.DefaultInterpolation&&(n.interpolation=i),Br(t.settings)&&(n.settings={inTangents:ni(t.settings.inTangents,Array),outTangents:ni(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new tl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new ma(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Qo(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new el(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Gr:e=this.InterpolantFactoryMethodDiscrete;break;case go:e=this.InterpolantFactoryMethodLinear;break;case io:e=this.InterpolantFactoryMethodSmooth;break;case Qc:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Rt("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Gr;case this.InterpolantFactoryMethodLinear:return go;case this.InterpolantFactoryMethodSmooth:return io;case this.InterpolantFactoryMethodBezier:return Qc}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]+=t;Br(this.settings)&&(r0(this.settings.inTangents,t),r0(this.settings.outTangents,t))}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,i=e.length;n!==i;++n)e[n]*=t;Br(this.settings)&&(a0(this.settings.inTangents,t),a0(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,i=n.length,r=0,a=i-1;for(;r!==i&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==i){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Ht("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,i=this.values,r=n.length;r===0&&(Ht("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Ht("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Ht("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(i!==void 0&&ym(i))for(let o=0,l=i.length;o!==l;++o){let c=i[o];if(isNaN(c)){Ht("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),i=this.getInterpolation()===io,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(i)l=!0;else{let u=o*n,f=u-n,d=u+n;for(let p=0;p!==n;++p){let _=e[u+p];if(_!==e[f+p]||_!==e[d+p]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let u=o*n,f=a*n;for(let d=0;d!==n;++d)e[f+d]=e[u+d]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,i=new n(this.name,t,e);return i.createInterpolant=this.createInterpolant,Br(this.settings)&&(i.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),i}};function r0(s,t){for(let e=0,n=s.length;e!==n;e+=2)s[e]+=t}function a0(s,t){for(let e=0,n=s.length;e!==n;e+=2)s[e]*=t}_n.prototype.ValueTypeName="";_n.prototype.TimeBufferType=Float32Array;_n.prototype.ValueBufferType=Float32Array;_n.prototype.DefaultInterpolation=go;var vi=class extends _n{constructor(t,e,n){super(t,e,n)}};vi.prototype.ValueTypeName="bool";vi.prototype.ValueBufferType=Array;vi.prototype.DefaultInterpolation=Gr;vi.prototype.InterpolantFactoryMethodLinear=void 0;vi.prototype.InterpolantFactoryMethodSmooth=void 0;var ga=class extends _n{constructor(t,e,n,i){super(t,e,n,i)}};ga.prototype.ValueTypeName="color";var Qs=class extends _n{constructor(t,e,n,i){super(t,e,n,i)}};Qs.prototype.ValueTypeName="number";var nl=class extends Vi{constructor(t,e,n,i){super(t,e,n,i)}interpolate_(t,e,n,i){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(i-e),c=t*o;for(let h=c+o;c!==h;c+=4)Ne.slerpFlat(r,0,a,c-o,a,c,l);return r}},tr=class extends _n{constructor(t,e,n,i){super(t,e,n,i)}InterpolantFactoryMethodLinear(t){return new nl(this.times,this.values,this.getValueSize(),t)}};tr.prototype.ValueTypeName="quaternion";tr.prototype.InterpolantFactoryMethodSmooth=void 0;var Mi=class extends _n{constructor(t,e,n){super(t,e,n)}};Mi.prototype.ValueTypeName="string";Mi.prototype.ValueBufferType=Array;Mi.prototype.DefaultInterpolation=Gr;Mi.prototype.InterpolantFactoryMethodLinear=void 0;Mi.prototype.InterpolantFactoryMethodSmooth=void 0;var _a=class extends _n{constructor(t,e,n,i){super(t,e,n,i)}};_a.prototype.ValueTypeName="vector";var ds=class{constructor(t="",e=-1,n=[],i=Ql){this.name=t,this.tracks=n,this.duration=e,this.blendMode=i,this.uuid=Yn(),this.userData={},this.duration<0&&this.resetDuration()}static parse(t){let e=[],n=t.tracks,i=1/(t.fps||1);for(let a=0,o=n.length;a!==o;++a)e.push(fx(n[a]).scale(i));let r=new this(t.name,t.duration,e,t.blendMode);return r.uuid=t.uuid,r.userData=JSON.parse(t.userData||"{}"),r}static toJSON(t){let e=[],n=t.tracks,i={name:t.name,duration:t.duration,tracks:e,uuid:t.uuid,blendMode:t.blendMode,userData:JSON.stringify(t.userData)};for(let r=0,a=n.length;r!==a;++r)e.push(_n.toJSON(n[r]));return i}static CreateFromMorphTargetSequence(t,e,n,i){let r=e.length,a=[];for(let o=0;o<r;o++){let l=[],c=[];l.push((o+r-1)%r,o,(o+1)%r),c.push(0,1,0);let h=Im(l);l=Dd(l,1,h),c=Dd(c,1,h),!i&&l[0]===0&&(l.push(r),c.push(c[0])),a.push(new Qs(".morphTargetInfluences["+e[o].name+"]",l,c).scale(1/n))}return new this(t,-1,a)}static findByName(t,e){let n=t;if(!Array.isArray(t)){let i=t;n=i.geometry&&i.geometry.animations||i.animations}for(let i=0;i<n.length;i++)if(n[i].name===e)return n[i];return null}static CreateClipsFromMorphTargetSequences(t,e,n){let i={},r=/^([\w-]*?)([\d]+)$/;for(let o=0,l=t.length;o<l;o++){let c=t[o],h=c.name.match(r);if(h&&h.length>1){let u=h[1],f=i[u];f||(i[u]=f=[]),f.push(c)}}let a=[];for(let o in i)a.push(this.CreateFromMorphTargetSequence(o,i[o],e,n));return a}resetDuration(){let t=this.tracks,e=0;for(let n=0,i=t.length;n!==i;++n){let r=this.tracks[n];e=Math.max(e,r.times[r.times.length-1])}return this.duration=e,this}trim(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].trim(0,this.duration);return this}validate(){let t=!0;for(let e=0;e<this.tracks.length;e++)t=t&&this.tracks[e].validate();return t}optimize(){for(let t=0;t<this.tracks.length;t++)this.tracks[t].optimize();return this}clone(){let t=[];for(let n=0;n<this.tracks.length;n++)t.push(this.tracks[n].clone());let e=new this.constructor(this.name,this.duration,t,this.blendMode);return e.userData=JSON.parse(JSON.stringify(this.userData)),e}toJSON(){return this.constructor.toJSON(this)}};function dx(s){switch(s.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Qs;case"vector":case"vector2":case"vector3":case"vector4":return _a;case"color":return ga;case"quaternion":return tr;case"bool":case"boolean":return vi;case"string":return Mi}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+s)}function fx(s){if(s.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let t=dx(s.type);if(s.times===void 0){let n=[],i=[];Lm(s.keys,n,i,"value"),s.times=n,s.values=i}let e;return t.parse!==void 0?e=t.parse(s):e=new t(s.name,s.times,s.values,s.interpolation),Br(s.settings)&&(e.settings={inTangents:ni(s.settings.inTangents,Float32Array),outTangents:ni(s.settings.outTangents,Float32Array)}),e}var ri={enabled:!1,files:{},add:function(s,t){this.enabled!==!1&&(o0(s)||(this.files[s]=t))},get:function(s){if(this.enabled!==!1&&!o0(s))return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};function o0(s){try{let t=s.slice(s.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}var xa=class{constructor(t,e,n){let i=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&i.onStart!==void 0&&i.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,i.onProgress!==void 0&&i.onProgress(h,a,o),a===o&&(r=!1,i.onLoad!==void 0&&i.onLoad())},this.itemError=function(h){i.onError!==void 0&&i.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],p=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Cf=new xa,Qe=class{constructor(t){this.manager=t!==void 0?t:Cf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(i,r){n.load(t,i,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}};Qe.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ui={},Nd=class extends Error{constructor(t,e){super(t),this.response=e}},Wn=class extends Qe{constructor(t){super(t),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);let r=ri.get(`file:${t}`);if(r!==void 0){this.manager.itemStart(t),setTimeout(()=>{e&&e(r),this.manager.itemEnd(t)},0);return}if(Ui[t]!==void 0){Ui[t].push({onLoad:e,onProgress:n,onError:i});return}Ui[t]=[],Ui[t].push({onLoad:e,onProgress:n,onError:i});let a=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",priority:this.priority,cache:this.cache,signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Rt("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;let h=Ui[t],u=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=f?parseInt(f):0,p=d!==0,_=0,m=new ReadableStream({start(g){y();function y(){u.read().then(({done:M,value:v})=>{if(M)g.close();else{_+=v.byteLength;let w=new ProgressEvent("progress",{lengthComputable:p,loaded:_,total:d});for(let E=0,x=h.length;E<x;E++){let S=h[E];S.onProgress&&S.onProgress(w)}g.enqueue(v),y()}},M=>{g.error(M)})}}});return new Response(m)}else throw new Nd(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{let u=/charset="?([^;"\s]*)"?/i.exec(o),f=u&&u[1]?u[1].toLowerCase():void 0,d=new TextDecoder(f);return c.arrayBuffer().then(p=>d.decode(p))}}}).then(c=>{ri.add(`file:${t}`,c);let h=Ui[t];delete Ui[t];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onLoad&&d.onLoad(c)}}).catch(c=>{let h=Ui[t];if(h===void 0)throw this.manager.itemError(t),c;delete Ui[t];for(let u=0,f=h.length;u<f;u++){let d=h[u];d.onError&&d.onError(c)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},yh=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=this,a=new Wn(this.manager);a.setPriority(this.priority),a.setCache(this.cache),a.setPath(this.path),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(t,function(o){try{e(r.parse(JSON.parse(o)))}catch(l){i?i(l):Ht(l),r.manager.itemError(t)}},n,i)}parse(t){let e=[];for(let n=0;n<t.length;n++){let i=ds.parse(t[n]);e.push(i)}return e}},vh=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=this,a=[],o=new qs,l=new Wn(this.manager);l.setPriority(this.priority),l.setCache(this.cache),l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(r.withCredentials);let c=0;function h(u){l.load(t[u],function(f){let d=r.parse(f,!0);a[u]={width:d.width,height:d.height,format:d.format,mipmaps:d.mipmaps},c+=1,c===6&&(d.mipmapCount===1&&(o.minFilter=Ee),o.image=a,o.format=d.format,o.needsUpdate=!0,e&&e(o))},n,i)}if(Array.isArray(t))for(let u=0,f=t.length;u<f;++u)h(u);else l.load(t,function(u){let f=r.parse(u,!0);if(f.isCubemap){let d=f.mipmaps.length/f.mipmapCount;for(let p=0;p<d;p++){a[p]={mipmaps:[]};for(let _=0;_<f.mipmapCount;_++)a[p].mipmaps.push(f.mipmaps[p*f.mipmapCount+_]),a[p].format=f.format,a[p].width=f.width,a[p].height=f.height}o.image=a}else o.image.width=f.width,o.image.height=f.height,o.mipmaps=f.mipmaps;f.mipmapCount===1&&(o.minFilter=Ee),o.format=f.format,o.needsUpdate=!0,e&&e(o)},n,i);return o}},Lr=new WeakMap,fs=class extends Qe{constructor(t){super(t)}load(t,e,n,i){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);let r=this,a=ri.get(`image:${t}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(t),setTimeout(function(){e&&e(a),r.manager.itemEnd(t)},0);else{let u=Lr.get(a);u===void 0&&(u=[],Lr.set(a,u)),u.push({onLoad:e,onError:i})}return a}let o=Xr("img");function l(){h(),e&&e(this);let u=Lr.get(this)||[];for(let f=0;f<u.length;f++){let d=u[f];d.onLoad&&d.onLoad(this)}Lr.delete(this),r.manager.itemEnd(t)}function c(u){h(),i&&i(u),ri.remove(`image:${t}`);let f=Lr.get(this)||[];for(let d=0;d<f.length;d++){let p=f[d];p.onError&&p.onError(u)}Lr.delete(this),r.manager.itemError(t),r.manager.itemEnd(t)}function h(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),ri.add(`image:${t}`,o),r.manager.itemStart(t),o.fetchPriority=this.priority,o.src=t,o}},Mh=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=new ls;r.colorSpace=je;let a=new fs(this.manager);a.setPriority(this.priority),a.setCache(this.cache),a.setCrossOrigin(this.crossOrigin),a.setPath(this.path);let o=0;function l(c){a.load(t[c],function(h){r.images[c]=h,o++,o===6&&(r.needsUpdate=!0,e&&e(r))},void 0,i)}for(let c=0;c<t.length;++c)l(c);return r}},Sh=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=this,a=new mn,o=new Wn(this.manager);return o.setPriority(this.priority),o.setCache(this.cache),o.setResponseType("arraybuffer"),o.setRequestHeader(this.requestHeader),o.setPath(this.path),o.setWithCredentials(r.withCredentials),o.load(t,function(l){let c;try{c=r.parse(l)}catch(h){i!==void 0?i(h):Ht(h);return}r._applyTexData(a,c),e&&e(a,c)},n,i),a}createDataTexture(t){let e=new mn;return this._applyTexData(e,this.parse(t)),e}_applyTexData(t,e){e.image!==void 0?t.image=e.image:e.data!==void 0&&(t.image.width=e.width,t.image.height=e.height,t.image.data=e.data),t.wrapS=e.wrapS!==void 0?e.wrapS:pn,t.wrapT=e.wrapT!==void 0?e.wrapT:pn,t.magFilter=e.magFilter!==void 0?e.magFilter:Ee,t.minFilter=e.minFilter!==void 0?e.minFilter:Ee,t.anisotropy=e.anisotropy!==void 0?e.anisotropy:1,e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.mipmaps!==void 0&&(t.mipmaps=e.mipmaps,t.minFilter=Xn),e.mipmapCount===1&&(t.minFilter=Ee),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),t.needsUpdate=!0}},bh=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=new Ie,a=new fs(this.manager);return a.setPriority(this.priority),a.setCache(this.cache),a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(t,function(o){r.image=o,r.needsUpdate=!0,e!==void 0&&e(r)},n,i),r}},hi=class extends oe{static registerNode(t){this.prototype._lightNode=t}constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Lt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},er=class extends hi{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(oe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Lt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},Md=new Zt,l0=new L,c0=new L,nr=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ct(512,512),this.mapType=xn,this.map=null,this.mapPass=null,this.matrix=new Zt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new xi,this._frameExtents=new ct(1,1),this._viewportCount=1,this._viewports=[new _e(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera;l0.setFromMatrixPosition(t.matrixWorld),e.position.copy(l0),c0.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(c0),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,i){Md.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(Md,t.coordinateSystem,t.reversedDepth);let r=this._frameExtents,a=i?i.z/r.x:1,o=i?i.w/r.y:1,l=i?i.x/r.x:0,c=i?i.y/r.y:0;t.coordinateSystem===rs||t.reversedDepth?e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),e.multiply(Md)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Hc=new L,Wc=new Ne,mi=new L,ir=class extends oe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Zt,this.projectionMatrix=new Zt,this.projectionMatrixInverse=new Zt,this.coordinateSystem=bn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Hc,Wc,mi),mi.x===1&&mi.y===1&&mi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Hc,Wc,mi.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Hc,Wc,mi),mi.x===1&&mi.y===1&&mi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Hc,Wc,mi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},es=new L,h0=new ct,u0=new ct,De=class extends ir{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Bs*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Os*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Bs*2*Math.atan(Math.tan(Os*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){es.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(es.x,es.y).multiplyScalar(-t/es.z),es.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(es.x,es.y).multiplyScalar(-t/es.z)}getViewSize(t,e){return this.getViewBounds(t,h0,u0),e.subVectors(u0,h0)}setViewOffset(t,e,n,i,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Os*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,r=-.5*i,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*i/l,e-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+i,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Ud=class extends nr{constructor(){super(new De(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(t){let e=this.camera,n=Bs*2*t.angle*this.focus,i=this.mapSize.width/this.mapSize.height*this.aspect,r=t.distance||e.far;(n!==e.fov||i!==e.aspect||r!==e.far)&&(e.fov=n,e.aspect=i,e.far=r,e.updateProjectionMatrix()),super.updateMatrices(t)}copy(t){return super.copy(t),this.focus=t.focus,this.aspect=t.aspect,this}toJSON(){let t=super.toJSON();return t.focus=this.focus,t.aspect=this.aspect,t}},il=class extends hi{constructor(t,e,n=0,i=Math.PI/3,r=0,a=2){super(t,e),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(oe.DEFAULT_UP),this.updateMatrix(),this.target=new oe,this.distance=n,this.angle=i,this.penumbra=r,this.decay=a,this.map=null,this.shadow=new Ud}get power(){return this.intensity*Math.PI}set power(t){this.intensity=t/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.angle=t.angle,this.penumbra=t.penumbra,this.decay=t.decay,this.target=t.target.clone(),this.map=t.map,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.angle=this.angle,e.object.decay=this.decay,e.object.penumbra=this.penumbra,e.object.target=this.target.uuid,this.map&&this.map.isTexture&&(e.object.map=this.map.toJSON(t).uuid),e.object.shadow=this.shadow.toJSON(),e}},Od=class extends nr{constructor(){super(new De(90,1,.5,500)),this.isPointLightShadow=!0}},sr=class extends hi{constructor(t,e,n=0,i=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=i,this.shadow=new Od}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},rr=class extends ir{constructor(t=-1,e=1,n=1,i=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2,r=n-t,a=n+t,o=i+e,l=i-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Fd=class extends nr{constructor(){super(new rr(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},ps=class extends hi{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(oe.DEFAULT_UP),this.updateMatrix(),this.target=new oe,this.shadow=new Fd}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}},sl=class extends hi{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}},rl=class extends hi{constructor(t,e,n=10,i=10){super(t,e),this.isRectAreaLight=!0,this.type="RectAreaLight",this.width=n,this.height=i}get power(){return this.intensity*this.width*this.height*Math.PI}set power(t){this.intensity=t/(this.width*this.height*Math.PI)}copy(t){return super.copy(t),this.width=t.width,this.height=t.height,this}toJSON(t){let e=super.toJSON(t);return e.object.width=this.width,e.object.height=this.height,e}},ya=class{constructor(){this.isSphericalHarmonics3=!0,this.coefficients=[];for(let t=0;t<9;t++)this.coefficients.push(new L)}set(t){for(let e=0;e<9;e++)this.coefficients[e].copy(t[e]);return this}zero(){for(let t=0;t<9;t++)this.coefficients[t].set(0,0,0);return this}getAt(t,e){let n=t.x,i=t.y,r=t.z,a=this.coefficients;return e.copy(a[0]).multiplyScalar(.282095),e.addScaledVector(a[1],.488603*i),e.addScaledVector(a[2],.488603*r),e.addScaledVector(a[3],.488603*n),e.addScaledVector(a[4],1.092548*(n*i)),e.addScaledVector(a[5],1.092548*(i*r)),e.addScaledVector(a[6],.315392*(3*r*r-1)),e.addScaledVector(a[7],1.092548*(n*r)),e.addScaledVector(a[8],.546274*(n*n-i*i)),e}getIrradianceAt(t,e){let n=t.x,i=t.y,r=t.z,a=this.coefficients;return e.copy(a[0]).multiplyScalar(.886227),e.addScaledVector(a[1],2*.511664*i),e.addScaledVector(a[2],2*.511664*r),e.addScaledVector(a[3],2*.511664*n),e.addScaledVector(a[4],2*.429043*n*i),e.addScaledVector(a[5],2*.429043*i*r),e.addScaledVector(a[6],.743125*r*r-.247708),e.addScaledVector(a[7],2*.429043*n*r),e.addScaledVector(a[8],.429043*(n*n-i*i)),e}add(t){for(let e=0;e<9;e++)this.coefficients[e].add(t.coefficients[e]);return this}addScaledSH(t,e){for(let n=0;n<9;n++)this.coefficients[n].addScaledVector(t.coefficients[n],e);return this}scale(t){for(let e=0;e<9;e++)this.coefficients[e].multiplyScalar(t);return this}lerp(t,e){for(let n=0;n<9;n++)this.coefficients[n].lerp(t.coefficients[n],e);return this}equals(t){for(let e=0;e<9;e++)if(!this.coefficients[e].equals(t.coefficients[e]))return!1;return!0}copy(t){return this.set(t.coefficients)}clone(){return new this.constructor().copy(this)}fromArray(t,e=0){let n=this.coefficients;for(let i=0;i<9;i++)n[i].fromArray(t,e+i*3);return this}toArray(t=[],e=0){let n=this.coefficients;for(let i=0;i<9;i++)n[i].toArray(t,e+i*3);return t}static getBasisAt(t,e){let n=t.x,i=t.y,r=t.z;e[0]=.282095,e[1]=.488603*i,e[2]=.488603*r,e[3]=.488603*n,e[4]=1.092548*n*i,e[5]=1.092548*i*r,e[6]=.315392*(3*r*r-1),e[7]=1.092548*n*r,e[8]=.546274*(n*n-i*i)}},al=class extends hi{constructor(t=new ya,e=1){super(void 0,e),this.isLightProbe=!0,this.type="LightProbe",this.sh=t}copy(t){return super.copy(t),this.sh.copy(t.sh),this}toJSON(t){let e=super.toJSON(t);return e.object.sh=this.sh.toArray(),e}},d0={},ol=class s extends Qe{constructor(t){super(t),this.textures={}}load(t,e,n,i){let r=this,a=new Wn(r.manager);a.setPriority(r.priority),a.setCache(r.cache),a.setPath(r.path),a.setRequestHeader(r.requestHeader),a.setWithCredentials(r.withCredentials),a.load(t,function(o){try{e(r.parse(JSON.parse(o)))}catch(l){i?i(l):Ht(l),r.manager.itemError(t)}},n,i)}parse(t){let e=this.createMaterialFromType(t.type);return e.fromJSON(t,this.textures),e}setTextures(t){return this.textures=t,this}createMaterialFromType(t){return s.createMaterialFromType(t)}static createMaterialFromType(t){let n={ShadowMaterial:Yo,SpriteMaterial:Jr,RawShaderMaterial:da,ShaderMaterial:Hn,PointsMaterial:Qr,MeshPhysicalMaterial:Ks,MeshStandardMaterial:ci,MeshPhongMaterial:Zo,MeshToonMaterial:$o,MeshNormalMaterial:Jo,MeshLambertMaterial:js,MeshDepthMaterial:fa,MeshDistanceMaterial:pa,MeshBasicMaterial:Vn,MeshMatcapMaterial:Ko,LineDashedMaterial:jo,LineBasicMaterial:Ze,Material:ze,...d0}[t],i;return n===void 0?(gi(`MaterialLoader: Unknown material type "${t}". Use .registerMaterial() before starting the deserialization process.`),i=new ze):i=new n,i}static registerMaterial(t,e){d0[t]=e}},va=class{static extractUrlBase(t){let e=t.lastIndexOf("/");return e===-1?"./":t.slice(0,e+1)}static resolveURL(t,e){return typeof t!="string"||t===""?"":(/^https?:\/\//i.test(e)&&/^\//.test(t)&&(e=e.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(t)||/^data:.*,.*$/i.test(t)||/^blob:.*$/i.test(t)?t:e+t)}},ll=class extends jt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){let t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}},cl=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=this,a=new Wn(r.manager);a.setPriority(r.priority),a.setCache(r.cache),a.setPath(r.path),a.setRequestHeader(r.requestHeader),a.setWithCredentials(r.withCredentials),a.load(t,function(o){try{e(r.parse(JSON.parse(o)))}catch(l){i?i(l):Ht(l),r.manager.itemError(t)}},n,i)}parse(t){let e={},n={};function i(d,p){if(e[p]!==void 0)return e[p];let m=d.interleavedBuffers[p],g=r(d,m.buffer),y=Fr(m.type,g),M=new Ws(y,m.stride);return M.uuid=m.uuid,m.usage!==void 0&&M.setUsage(m.usage),e[p]=M,M}function r(d,p){if(n[p]!==void 0)return n[p];let m=d.arrayBuffers[p],g=new Uint32Array(m).buffer;return n[p]=g,g}let a=t.isInstancedBufferGeometry?new ll:new jt,o=t.data.index;if(o!==void 0){let d=Fr(o.type,o.array);a.setIndex(new ve(d,1))}let l=t.data.attributes;for(let d in l){let p=l[d],_;if(p.isInterleavedBufferAttribute){let m=i(t.data,p.data);_=new os(m,p.itemSize,p.offset,p.normalized)}else{let m=Fr(p.type,p.array),g=p.isInstancedBufferAttribute?ki:ve;_=new g(m,p.itemSize,p.normalized)}p.name!==void 0&&(_.name=p.name),p.usage!==void 0&&_.setUsage(p.usage),p.gpuType!==void 0&&(_.gpuType=p.gpuType),a.setAttribute(d,_)}let c=t.data.morphAttributes;if(c)for(let d in c){let p=c[d],_=[];for(let m=0,g=p.length;m<g;m++){let y=p[m],M;if(y.isInterleavedBufferAttribute){let v=i(t.data,y.data);M=new os(v,y.itemSize,y.offset,y.normalized)}else{let v=Fr(y.type,y.array);M=new ve(v,y.itemSize,y.normalized)}y.name!==void 0&&(M.name=y.name),y.usage!==void 0&&M.setUsage(y.usage),y.gpuType!==void 0&&(M.gpuType=y.gpuType),_.push(M)}a.morphAttributes[d]=_}t.data.morphTargetsRelative&&(a.morphTargetsRelative=!0);let u=t.data.groups||t.data.drawcalls||t.data.offsets;if(u!==void 0)for(let d=0,p=u.length;d!==p;++d){let _=u[d];a.addGroup(_.start,_.count,_.materialIndex)}let f=t.data.boundingSphere;return f!==void 0&&(a.boundingSphere=new Be().fromJSON(f)),t.name&&(a.name=t.name),t.userData&&(a.userData=t.userData),a}},Sd={},Eh=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=this,a=this.path===""?va.extractUrlBase(t):this.path;this.resourcePath=this.resourcePath||a;let o=new Wn(this.manager);o.setPriority(this.priority),o.setCache(this.cache),o.setPath(this.path),o.setRequestHeader(this.requestHeader),o.setWithCredentials(this.withCredentials),o.load(t,function(l){let c=null;try{c=JSON.parse(l)}catch(u){i!==void 0&&i(u),Ht("ObjectLoader: Can't parse "+t+".",u.message);return}let h=c.metadata;if(h===void 0||h.type===void 0||h.type.toLowerCase()==="geometry"){i!==void 0&&i(new Error("THREE.ObjectLoader: Can't load "+t)),Ht("ObjectLoader: Can't load "+t);return}r.parse(c,e)},n,i)}async loadAsync(t,e){let n=this,i=this.path===""?va.extractUrlBase(t):this.path;this.resourcePath=this.resourcePath||i;let r=new Wn(this.manager);r.setPriority(this.priority),r.setCache(this.cache),r.setPath(this.path),r.setRequestHeader(this.requestHeader),r.setWithCredentials(this.withCredentials);let a=await r.loadAsync(t,e),o;try{o=JSON.parse(a)}catch(c){throw new Error("THREE.ObjectLoader: Can't parse "+t+". "+c.message)}let l=o.metadata;if(l===void 0||l.type===void 0||l.type.toLowerCase()==="geometry")throw new Error("THREE.ObjectLoader: Can't load "+t);return await n.parseAsync(o)}parse(t,e){let n=this.parseAnimations(t.animations),i=this.parseShapes(t.shapes),r=this.parseGeometries(t.geometries,i),a=this.parseImages(t.images,function(){e!==void 0&&e(c)}),o=this.parseTextures(t.textures,a),l=this.parseMaterials(t.materials,o),c=this.parseObject(t.object,r,l,o,n),h=this.parseSkeletons(t.skeletons,c);if(this.bindSkeletons(c,h),this.bindLightTargets(c),e!==void 0){let u=!1;for(let f in a)if(a[f].data instanceof HTMLImageElement){u=!0;break}u===!1&&e(c)}return c}async parseAsync(t){let e=this.parseAnimations(t.animations),n=this.parseShapes(t.shapes),i=this.parseGeometries(t.geometries,n),r=await this.parseImagesAsync(t.images),a=this.parseTextures(t.textures,r),o=this.parseMaterials(t.materials,a),l=this.parseObject(t.object,i,o,a,e),c=this.parseSkeletons(t.skeletons,l);return this.bindSkeletons(l,c),this.bindLightTargets(l),l}static registerGeometry(t,e){Sd[t]=e}parseShapes(t){let e={};if(t!==void 0)for(let n=0,i=t.length;n<i;n++){let r=new us().fromJSON(t[n]);e[r.uuid]=r}return e}parseSkeletons(t,e){let n={},i={};if(e.traverse(function(r){r.isBone&&(i[r.uuid]=r)}),t!==void 0)for(let r=0,a=t.length;r<a;r++){let o=new So().fromJSON(t[r],i);n[o.uuid]=o}return n}parseGeometries(t,e){let n={};if(t!==void 0){let i=new cl;for(let r=0,a=t.length;r<a;r++){let o,l=t[r];switch(l.type){case"BufferGeometry":case"InstancedBufferGeometry":o=i.parse(l);break;default:l.type in i0?o=i0[l.type].fromJSON(l,e):l.type in Sd?o=Sd[l.type].fromJSON(l,e):Rt(`ObjectLoader: Unknown geometry type "${l.type}". Use .registerGeometry() before starting the deserialization process.`)}o.uuid=l.uuid,l.name!==void 0&&(o.name=l.name),l.userData!==void 0&&(o.userData=l.userData),n[l.uuid]=o}}return n}parseMaterials(t,e){let n={},i={};if(t!==void 0){let r=new ol;r.setTextures(e);for(let a=0,o=t.length;a<o;a++){let l=t[a];n[l.uuid]===void 0&&(n[l.uuid]=r.parse(l)),i[l.uuid]=n[l.uuid]}}return i}parseAnimations(t){let e={};if(t!==void 0)for(let n=0;n<t.length;n++){let i=t[n],r=ds.parse(i);e[r.uuid]=r}return e}parseImages(t,e){let n=this,i={},r;function a(l){return l=n.manager.resolveURL(l),n.manager.itemStart(l),r.load(l,function(){n.manager.itemEnd(l)},void 0,function(){n.manager.itemError(l),n.manager.itemEnd(l)})}function o(l){if(typeof l=="string"){let c=l,h=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(c)?c:n.resourcePath+c;return a(h)}else return l.data?{data:Fr(l.type,l.data),width:l.width,height:l.height}:null}if(t!==void 0&&t.length>0){let l=new xa(e);r=new fs(l),r.setPriority(this.priority),r.setCache(this.cache),r.setCrossOrigin(this.crossOrigin);for(let c=0,h=t.length;c<h;c++){let u=t[c],f=u.url;if(Array.isArray(f)){let d=[];for(let p=0,_=f.length;p<_;p++){let m=f[p],g=o(m);g!==null&&(g instanceof HTMLImageElement?d.push(g):d.push(new mn(g.data,g.width,g.height)))}i[u.uuid]=new Ln(d)}else{let d=o(u.url);i[u.uuid]=new Ln(d)}}}return i}async parseImagesAsync(t){let e=this,n={},i;async function r(a){if(typeof a=="string"){let o=a,l=/^(\/\/)|([a-z]+:(\/\/)?)/i.test(o)?o:e.resourcePath+o;return await i.loadAsync(l)}else return a.data?{data:Fr(a.type,a.data),width:a.width,height:a.height}:null}if(t!==void 0&&t.length>0){i=new fs(this.manager),i.setPriority(this.priority),i.setCache(this.cache),i.setCrossOrigin(this.crossOrigin);for(let a=0,o=t.length;a<o;a++){let l=t[a],c=l.url;if(Array.isArray(c)){let h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u],p=await r(d);p!==null&&(p instanceof HTMLImageElement?h.push(p):h.push(new mn(p.data,p.width,p.height)))}n[l.uuid]=new Ln(h)}else{let h=await r(l.url);n[l.uuid]=new Ln(h)}}}return n}parseTextures(t,e){function n(r,a){return typeof r=="number"?r:(Rt("ObjectLoader.parseTexture: Constant should be in numeric form.",r),a[r])}let i={};if(t!==void 0)for(let r=0,a=t.length;r<a;r++){let o=t[r];o.image===void 0&&Rt('ObjectLoader: No "image" specified for',o.uuid),e[o.image]===void 0&&Rt("ObjectLoader: Undefined image",o.image);let l=e[o.image],c=l.data,h;Array.isArray(c)?(h=new ls,c.length===6&&(h.needsUpdate=!0)):(c&&c.data?h=new mn:h=new Ie,c&&(h.needsUpdate=!0)),h.source=l,h.uuid=o.uuid,o.name!==void 0&&(h.name=o.name),o.mapping!==void 0&&(h.mapping=n(o.mapping,px)),o.channel!==void 0&&(h.channel=o.channel),o.offset!==void 0&&h.offset.fromArray(o.offset),o.repeat!==void 0&&h.repeat.fromArray(o.repeat),o.center!==void 0&&h.center.fromArray(o.center),o.rotation!==void 0&&(h.rotation=o.rotation),o.wrap!==void 0&&(h.wrapS=n(o.wrap[0],f0),h.wrapT=n(o.wrap[1],f0)),o.format!==void 0&&(h.format=o.format),o.internalFormat!==void 0&&(h.internalFormat=o.internalFormat),o.type!==void 0&&(h.type=o.type),o.colorSpace!==void 0&&(h.colorSpace=o.colorSpace),o.minFilter!==void 0&&(h.minFilter=n(o.minFilter,p0)),o.magFilter!==void 0&&(h.magFilter=n(o.magFilter,p0)),o.anisotropy!==void 0&&(h.anisotropy=o.anisotropy),o.flipY!==void 0&&(h.flipY=o.flipY),o.generateMipmaps!==void 0&&(h.generateMipmaps=o.generateMipmaps),o.mipmapsAutoUpdate!==void 0&&(h.mipmapsAutoUpdate=o.mipmapsAutoUpdate),o.premultiplyAlpha!==void 0&&(h.premultiplyAlpha=o.premultiplyAlpha),o.unpackAlignment!==void 0&&(h.unpackAlignment=o.unpackAlignment),o.compareFunction!==void 0&&(h.compareFunction=o.compareFunction),o.normalized!==void 0&&(h.normalized=o.normalized),o.userData!==void 0&&(h.userData=o.userData),i[o.uuid]=h}return i}parseObject(t,e,n,i,r){let a;function o(f){return e[f]===void 0&&Rt("ObjectLoader: Undefined geometry",f),e[f]}function l(f){if(f!==void 0){if(Array.isArray(f)){let d=[];for(let p=0,_=f.length;p<_;p++){let m=f[p];n[m]===void 0&&Rt("ObjectLoader: Undefined material",m),d.push(n[m])}return d}return n[f]===void 0&&Rt("ObjectLoader: Undefined material",f),n[f]}}function c(f){return i[f]===void 0&&Rt("ObjectLoader: Undefined texture",f),i[f]}let h,u;switch(t.type){case"Scene":a=new zi,t.background!==void 0&&(Number.isInteger(t.background)?a.background=new Lt(t.background):a.background=c(t.background)),t.environment!==void 0&&(a.environment=c(t.environment)),t.fog!==void 0&&(t.fog.type==="Fog"?a.fog=new Hs(t.fog.color,t.fog.near,t.fog.far):t.fog.type==="FogExp2"&&(a.fog=new xo(t.fog.color,t.fog.density)),t.fog.name!==""&&(a.fog.name=t.fog.name)),t.backgroundBlurriness!==void 0&&(a.backgroundBlurriness=t.backgroundBlurriness),t.backgroundIntensity!==void 0&&(a.backgroundIntensity=t.backgroundIntensity),t.backgroundRotation!==void 0&&a.backgroundRotation.fromArray(t.backgroundRotation),t.environmentIntensity!==void 0&&(a.environmentIntensity=t.environmentIntensity),t.environmentRotation!==void 0&&a.environmentRotation.fromArray(t.environmentRotation);break;case"PerspectiveCamera":a=new De(t.fov,t.aspect,t.near,t.far),t.focus!==void 0&&(a.focus=t.focus),t.zoom!==void 0&&(a.zoom=t.zoom),t.filmGauge!==void 0&&(a.filmGauge=t.filmGauge),t.filmOffset!==void 0&&(a.filmOffset=t.filmOffset),t.view!==void 0&&(a.view=Object.assign({},t.view));break;case"OrthographicCamera":a=new rr(t.left,t.right,t.top,t.bottom,t.near,t.far),t.zoom!==void 0&&(a.zoom=t.zoom),t.view!==void 0&&(a.view=Object.assign({},t.view));break;case"AmbientLight":a=new sl(t.color,t.intensity);break;case"DirectionalLight":a=new ps(t.color,t.intensity),a.target=t.target||"";break;case"PointLight":a=new sr(t.color,t.intensity,t.distance,t.decay);break;case"RectAreaLight":a=new rl(t.color,t.intensity,t.width,t.height);break;case"SpotLight":a=new il(t.color,t.intensity,t.distance,t.angle,t.penumbra,t.decay),a.target=t.target||"",t.map!==void 0&&(a.map=c(t.map));break;case"HemisphereLight":a=new er(t.color,t.groundColor,t.intensity);break;case"LightProbe":let f=new ya().fromArray(t.sh);a=new al(f,t.intensity);break;case"SkinnedMesh":h=o(t.geometry),u=l(t.material),a=new Mo(h,u),t.bindMode!==void 0&&(a.bindMode=t.bindMode),t.bindMatrix!==void 0&&a.bindMatrix.fromArray(t.bindMatrix),t.skeleton!==void 0&&(a.skeleton=t.skeleton);break;case"Mesh":h=o(t.geometry),u=l(t.material),a=new ue(h,u);break;case"InstancedMesh":h=o(t.geometry),u=l(t.material);let d=t.count,p=t.instanceMatrix,_=t.instanceColor;a=new Xs(h,u,d),a.instanceMatrix=new ki(new Float32Array(p.array),16),_!==void 0&&(a.instanceColor=new ki(new Float32Array(_.array),_.itemSize));break;case"BatchedMesh":h=o(t.geometry),u=l(t.material),a=new bo(t.maxInstanceCount,t.maxVertexCount,t.maxIndexCount,u),a.geometry=h,a.perObjectFrustumCulled=t.perObjectFrustumCulled,a.sortObjects=t.sortObjects,a._drawRanges=t.drawRanges,a._reservedRanges=t.reservedRanges,a._geometryInfo=t.geometryInfo.map(m=>{let g=null,y=null;return m.boundingBox!==void 0&&(g=new Ge().fromJSON(m.boundingBox)),m.boundingSphere!==void 0&&(y=new Be().fromJSON(m.boundingSphere)),{...m,boundingBox:g,boundingSphere:y}}),a._instanceInfo=t.instanceInfo,a._availableInstanceIds=t.availableInstanceIds,a._availableGeometryIds=t.availableGeometryIds,a._nextIndexStart=t.nextIndexStart,a._nextVertexStart=t.nextVertexStart,a._geometryCount=t.geometryCount,a._maxInstanceCount=t.maxInstanceCount,a._maxVertexCount=t.maxVertexCount,a._maxIndexCount=t.maxIndexCount,a._geometryInitialized=t.geometryInitialized,a._matricesTexture=c(t.matricesTexture.uuid),a._indirectTexture=c(t.indirectTexture.uuid),t.colorsTexture!==void 0&&(a._colorsTexture=c(t.colorsTexture.uuid)),t.boundingSphere!==void 0&&(a.boundingSphere=new Be().fromJSON(t.boundingSphere)),t.boundingBox!==void 0&&(a.boundingBox=new Ge().fromJSON(t.boundingBox));break;case"LOD":a=new vo;break;case"Line":a=new oi(o(t.geometry),l(t.material));break;case"LineLoop":a=new Eo(o(t.geometry),l(t.material));break;case"LineSegments":a=new Dn(o(t.geometry),l(t.material));break;case"PointCloud":case"Points":a=new To(o(t.geometry),l(t.material));break;case"Sprite":a=new yo(l(t.material)),t.center!==void 0&&a.center.fromArray(t.center);break;case"Group":a=new si;break;case"Bone":a=new Kr;break;default:a=new oe}if(a.uuid=t.uuid,t.name!==void 0&&(a.name=t.name),t.pivot!==void 0&&(a.pivot=new L().fromArray(t.pivot)),t.matrix!==void 0?(a.matrix.fromArray(t.matrix),t.matrixAutoUpdate!==void 0&&(a.matrixAutoUpdate=t.matrixAutoUpdate),a.matrixAutoUpdate&&(a.matrix.decompose(a.position,a.quaternion,a.scale),a.pivot!==null&&a.position.copy(a.pivot).applyMatrix4(a.matrix).sub(a.pivot))):(t.position!==void 0&&a.position.fromArray(t.position),t.rotation!==void 0&&a.rotation.fromArray(t.rotation),t.quaternion!==void 0&&a.quaternion.fromArray(t.quaternion),t.scale!==void 0&&a.scale.fromArray(t.scale)),t.up!==void 0&&a.up.fromArray(t.up),t.morphTargetDictionary!==void 0&&(a.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),t.morphTargetInfluences!==void 0&&(a.morphTargetInfluences=t.morphTargetInfluences.slice()),t.castShadow!==void 0&&(a.castShadow=t.castShadow),t.receiveShadow!==void 0&&(a.receiveShadow=t.receiveShadow),t.shadow&&(t.shadow.intensity!==void 0&&(a.shadow.intensity=t.shadow.intensity),t.shadow.bias!==void 0&&(a.shadow.bias=t.shadow.bias),t.shadow.normalBias!==void 0&&(a.shadow.normalBias=t.shadow.normalBias),t.shadow.radius!==void 0&&(a.shadow.radius=t.shadow.radius),t.shadow.blurSamples!==void 0&&(a.shadow.blurSamples=t.shadow.blurSamples),t.shadow.focus!==void 0&&(a.shadow.focus=t.shadow.focus),t.shadow.aspect!==void 0&&(a.shadow.aspect=t.shadow.aspect),t.shadow.mapSize!==void 0&&a.shadow.mapSize.fromArray(t.shadow.mapSize),t.shadow.mapType!==void 0&&(a.shadow.mapType=t.shadow.mapType),t.shadow.camera!==void 0&&(a.shadow.camera=this.parseObject(t.shadow.camera))),t.visible!==void 0&&(a.visible=t.visible),t.frustumCulled!==void 0&&(a.frustumCulled=t.frustumCulled),t.renderOrder!==void 0&&(a.renderOrder=t.renderOrder),t.static!==void 0&&(a.static=t.static),t.userData!==void 0&&(a.userData=t.userData),t.layers!==void 0&&(a.layers.mask=t.layers),t.children!==void 0){let f=t.children;for(let d=0;d<f.length;d++)a.add(this.parseObject(f[d],e,n,i,r))}if(t.animations!==void 0){let f=t.animations;for(let d=0;d<f.length;d++){let p=f[d];a.animations.push(r[p])}}if(t.type==="LOD"){t.autoUpdate!==void 0&&(a.autoUpdate=t.autoUpdate);let f=t.levels;for(let d=0;d<f.length;d++){let p=f[d],_=a.getObjectByProperty("uuid",p.object);_!==void 0&&a.addLevel(_,p.distance,p.hysteresis)}}return a}bindSkeletons(t,e){Object.keys(e).length!==0&&t.traverse(function(n){if(n.isSkinnedMesh===!0&&n.skeleton!==void 0){let i=e[n.skeleton];i===void 0?Rt("ObjectLoader: No skeleton found with UUID:",n.skeleton):n.bind(i,n.bindMatrix)}})}bindLightTargets(t){t.traverse(function(e){if(e.isDirectionalLight||e.isSpotLight){let n=e.target,i=t.getObjectByProperty("uuid",n);i!==void 0?e.target=i:e.target=new oe}})}},px={UVMapping:gl,CubeReflectionMapping:Si,CubeRefractionMapping:xs,EquirectangularReflectionMapping:wa,EquirectangularRefractionMapping:Aa},f0={RepeatWrapping:Bi,ClampToEdgeWrapping:pn,MirroredRepeatWrapping:kr},p0={NearestFilter:Pe,NearestMipmapNearestFilter:gu,NearestMipmapLinearFilter:hr,LinearFilter:Ee,LinearMipmapNearestFilter:Ra,LinearMipmapLinearFilter:Xn},bd=new WeakMap,Th=class extends Qe{constructor(t){super(t),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&Rt("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&Rt("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(t){return this.options=t,this}load(t,e,n,i){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);let r=this,a=ri.get(`image-bitmap:${t}`);if(a!==void 0){if(r.manager.itemStart(t),a.then){a.then(c=>{bd.has(a)===!0?(i&&i(bd.get(a)),r.manager.itemError(t),r.manager.itemEnd(t)):(e&&e(c),r.manager.itemEnd(t))});return}setTimeout(function(){e&&e(a),r.manager.itemEnd(t)},0);return}let o={};o.credentials=this.withCredentials||this.crossOrigin!=="anonymous"?"include":"same-origin",o.headers=this.requestHeader,o.priority=this.priority,o.cache=this.cache,o.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;let l=fetch(t,o).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign({},r.options,{colorSpaceConversion:"none"}))}).then(function(c){return ri.add(`image-bitmap:${t}`,c),e&&e(c),r.manager.itemEnd(t),c}).catch(function(c){i&&i(c),bd.set(l,c),ri.remove(`image-bitmap:${t}`),r.manager.itemError(t),r.manager.itemEnd(t)});ri.add(`image-bitmap:${t}`,l),r.manager.itemStart(t)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}},Xc,Ma=class{static getContext(){return Xc===void 0&&(Xc=new(window.AudioContext||window.webkitAudioContext)),Xc}static setContext(t){Xc=t}},wh=class extends Qe{constructor(t){super(t)}load(t,e,n,i){let r=this,a=new Wn(this.manager);a.setPriority(this.priority),a.setCache(this.cache),a.setResponseType("arraybuffer"),a.setPath(this.path),a.setRequestHeader(this.requestHeader),a.setWithCredentials(this.withCredentials),a.load(t,function(l){try{let c=l.slice(0),h=Ma.getContext(),u=t+"#decode";r.manager.itemStart(u),h.decodeAudioData(c,function(f){e(f),r.manager.itemEnd(u)}).catch(function(f){o(f),r.manager.itemEnd(u)})}catch(c){o(c)}},n,i);function o(l){i?i(l):Ht(l),r.manager.itemError(t)}}},m0=new Zt,g0=new Zt,Cs=new Zt,Ah=class{constructor(){this.type="StereoCamera",this.aspect=1,this.eyeSep=.064,this.cameraL=new De,this.cameraL.layers.enable(1),this.cameraL.matrixAutoUpdate=!1,this.cameraR=new De,this.cameraR.layers.enable(2),this.cameraR.matrixAutoUpdate=!1,this._cache={focus:null,fov:null,aspect:null,near:null,far:null,zoom:null,eyeSep:null}}update(t){let e=this._cache;if(e.focus!==t.focus||e.fov!==t.fov||e.aspect!==t.aspect*this.aspect||e.near!==t.near||e.far!==t.far||e.zoom!==t.zoom||e.eyeSep!==this.eyeSep){e.focus=t.focus,e.fov=t.fov,e.aspect=t.aspect*this.aspect,e.near=t.near,e.far=t.far,e.zoom=t.zoom,e.eyeSep=this.eyeSep,Cs.copy(t.projectionMatrix);let i=e.eyeSep/2,r=i*e.near/e.focus,a=e.near*Math.tan(Os*e.fov*.5)/e.zoom,o,l;g0.elements[12]=-i,m0.elements[12]=i,o=-a*e.aspect+r,l=a*e.aspect+r,Cs.elements[0]=2*e.near/(l-o),Cs.elements[8]=(l+o)/(l-o),this.cameraL.projectionMatrix.copy(Cs),o=-a*e.aspect-r,l=a*e.aspect-r,Cs.elements[0]=2*e.near/(l-o),Cs.elements[8]=(l+o)/(l-o),this.cameraR.projectionMatrix.copy(Cs)}this.cameraL.matrix.copy(t.matrixWorld).multiply(g0),this.cameraL.matrixWorldNeedsUpdate=!0,this.cameraR.matrix.copy(t.matrixWorld).multiply(m0),this.cameraR.matrixWorldNeedsUpdate=!0}},Dr=-90,Nr=1,ar=class extends oe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let i=new De(Dr,Nr,t,e);i.layers=this.layers,this.add(i);let r=new De(Dr,Nr,t,e);r.layers=this.layers,this.add(r);let a=new De(Dr,Nr,t,e);a.layers=this.layers,this.add(a);let o=new De(Dr,Nr,t,e);o.layers=this.layers,this.add(o);let l=new De(Dr,Nr,t,e);l.layers=this.layers,this.add(l);let c=new De(Dr,Nr,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,i,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===bn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===rs)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),p=t.xr.enabled;t.xr.enabled=!1;let _=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(n,0,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.mipmapsAutoUpdate=_,t.setRenderTarget(n,5,i),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(u,f,d),t.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},hl=class extends De{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}},ul=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(t){this._document=t,t.hidden!==void 0&&(this._pageVisibilityHandler=mx.bind(this),t.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(t){return this._timescale=t,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(t){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(t!==void 0?t:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function mx(){this._document.hidden===!1&&this.reset()}var Ps=new L,Ed=new Ne,gx=new L,Is=new L,Ls=new L,Rh=class extends oe{constructor(){super(),this.type="AudioListener",this.context=Ma.getContext(),this.gain=this.context.createGain(),this.gain.connect(this.context.destination),this.filter=null,this.timeDelta=0,this._timer=new ul}getInput(){return this.gain}removeFilter(){return this.filter!==null&&(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination),this.gain.connect(this.context.destination),this.filter=null),this}getFilter(){return this.filter}setFilter(t){return this.filter!==null?(this.gain.disconnect(this.filter),this.filter.disconnect(this.context.destination)):this.gain.disconnect(this.context.destination),this.filter=t,this.gain.connect(this.filter),this.filter.connect(this.context.destination),this}getMasterVolume(){return this.gain.gain.value}setMasterVolume(t){return this.gain.gain.setTargetAtTime(t,this.context.currentTime,.01),this}updateMatrixWorld(t){super.updateMatrixWorld(t),this._timer.update();let e=this.context.listener;if(this.timeDelta=this._timer.getDelta(),this.matrixWorld.decompose(Ps,Ed,gx),Is.set(0,0,-1).applyQuaternion(Ed),Ls.set(0,1,0).applyQuaternion(Ed),e.positionX){let n=this.context.currentTime+this.timeDelta;e.positionX.linearRampToValueAtTime(Ps.x,n),e.positionY.linearRampToValueAtTime(Ps.y,n),e.positionZ.linearRampToValueAtTime(Ps.z,n),e.forwardX.linearRampToValueAtTime(Is.x,n),e.forwardY.linearRampToValueAtTime(Is.y,n),e.forwardZ.linearRampToValueAtTime(Is.z,n),e.upX.linearRampToValueAtTime(Ls.x,n),e.upY.linearRampToValueAtTime(Ls.y,n),e.upZ.linearRampToValueAtTime(Ls.z,n)}else e.setPosition(Ps.x,Ps.y,Ps.z),e.setOrientation(Is.x,Is.y,Is.z,Ls.x,Ls.y,Ls.z)}},dl=class extends oe{constructor(t){super(),this.type="Audio",this.listener=t,this.context=t.context,this.gain=this.context.createGain(),this.gain.connect(t.getInput()),this.autoplay=!1,this.buffer=null,this.detune=0,this.loop=!1,this.loopStart=0,this.loopEnd=0,this.offset=0,this.duration=void 0,this.playbackRate=1,this.isPlaying=!1,this.hasPlaybackControl=!0,this.source=null,this.sourceType="empty",this._startedAt=0,this._progress=0,this._connected=!1,this.filters=[]}getOutput(){return this.gain}setNodeSource(t){return this.hasPlaybackControl=!1,this.sourceType="audioNode",this.source=t,this.connect(),this}setMediaElementSource(t){return this.hasPlaybackControl=!1,this.sourceType="mediaNode",this.source=this.context.createMediaElementSource(t),this.connect(),this}setMediaStreamSource(t){return this.hasPlaybackControl=!1,this.sourceType="mediaStreamNode",this.source=this.context.createMediaStreamSource(t),this.connect(),this}setBuffer(t){return this.buffer=t,this.sourceType="buffer",this.autoplay&&this.play(),this}play(t=0){if(this.isPlaying===!0){Rt("Audio: Audio is already playing.");return}if(this.hasPlaybackControl===!1){Rt("Audio: this Audio has no playback control.");return}this._startedAt=this.context.currentTime+t;let e=this.context.createBufferSource();return e.buffer=this.buffer,e.loop=this.loop,e.loopStart=this.loopStart,e.loopEnd=this.loopEnd,e.onended=this.onEnded.bind(this),e.start(this._startedAt,this._progress+this.offset,this.duration),this.isPlaying=!0,this.source=e,this.setDetune(this.detune),this.setPlaybackRate(this.playbackRate),this.connect()}pause(){if(this.hasPlaybackControl===!1){Rt("Audio: this Audio has no playback control.");return}return this.isPlaying===!0&&(this._progress+=Math.max(this.context.currentTime-this._startedAt,0)*this.playbackRate,this.loop===!0&&(this._progress=this._progress%(this.duration||this.buffer.duration)),this.source.stop(),this.source.onended=null,this.isPlaying=!1),this}stop(t=0){if(this.hasPlaybackControl===!1){Rt("Audio: this Audio has no playback control.");return}return this._progress=0,this.source!==null&&(this.source.stop(this.context.currentTime+t),this.source.onended=null),this.isPlaying=!1,this}connect(){if(this.filters.length>0){this.source.connect(this.filters[0]);for(let t=1,e=this.filters.length;t<e;t++)this.filters[t-1].connect(this.filters[t]);this.filters[this.filters.length-1].connect(this.getOutput())}else this.source.connect(this.getOutput());return this._connected=!0,this}disconnect(){if(this._connected!==!1){if(this.filters.length>0){this.source.disconnect(this.filters[0]);for(let t=1,e=this.filters.length;t<e;t++)this.filters[t-1].disconnect(this.filters[t]);this.filters[this.filters.length-1].disconnect(this.getOutput())}else this.source.disconnect(this.getOutput());return this._connected=!1,this}}getFilters(){return this.filters}setFilters(t){return t||(t=[]),this._connected===!0?(this.disconnect(),this.filters=t.slice(),this.connect()):this.filters=t.slice(),this}setDetune(t){return this.detune=t,this.isPlaying===!0&&this.source.detune!==void 0&&this.source.detune.setTargetAtTime(this.detune,this.context.currentTime,.01),this}getDetune(){return this.detune}getFilter(){return this.getFilters()[0]}setFilter(t){return this.setFilters(t?[t]:[])}setPlaybackRate(t){if(this.hasPlaybackControl===!1){Rt("Audio: this Audio has no playback control.");return}return this.playbackRate=t,this.isPlaying===!0&&this.source.playbackRate.setTargetAtTime(this.playbackRate,this.context.currentTime,.01),this}getPlaybackRate(){return this.playbackRate}onEnded(){this.isPlaying=!1,this._progress=0}getLoop(){return this.hasPlaybackControl===!1?(Rt("Audio: this Audio has no playback control."),!1):this.loop}setLoop(t){if(this.hasPlaybackControl===!1){Rt("Audio: this Audio has no playback control.");return}return this.loop=t,this.isPlaying===!0&&(this.source.loop=this.loop),this}setLoopStart(t){return this.loopStart=t,this}setLoopEnd(t){return this.loopEnd=t,this}getVolume(){return this.gain.gain.value}setVolume(t){return this.gain.gain.setTargetAtTime(t,this.context.currentTime,.01),this}copy(t,e){return super.copy(t,e),t.sourceType!=="buffer"?(Rt("Audio: Audio source type cannot be copied."),this):(this.autoplay=t.autoplay,this.buffer=t.buffer,this.detune=t.detune,this.loop=t.loop,this.loopStart=t.loopStart,this.loopEnd=t.loopEnd,this.offset=t.offset,this.duration=t.duration,this.playbackRate=t.playbackRate,this.hasPlaybackControl=t.hasPlaybackControl,this.sourceType=t.sourceType,this.filters=t.filters.slice(),this)}clone(t){return new this.constructor(this.listener).copy(this,t)}},Ds=new L,_0=new Ne,_x=new L,Ns=new L,Ch=class extends dl{constructor(t){super(t),this.panner=this.context.createPanner(),this.panner.panningModel="HRTF",this.panner.connect(this.gain)}connect(){return super.connect(),this.panner.connect(this.gain),this}disconnect(){return super.disconnect(),this.panner.disconnect(this.gain),this}getOutput(){return this.panner}getRefDistance(){return this.panner.refDistance}setRefDistance(t){return this.panner.refDistance=t,this}getRolloffFactor(){return this.panner.rolloffFactor}setRolloffFactor(t){return this.panner.rolloffFactor=t,this}getDistanceModel(){return this.panner.distanceModel}setDistanceModel(t){return this.panner.distanceModel=t,this}getMaxDistance(){return this.panner.maxDistance}setMaxDistance(t){return this.panner.maxDistance=t,this}setDirectionalCone(t,e,n){return this.panner.coneInnerAngle=t,this.panner.coneOuterAngle=e,this.panner.coneOuterGain=n,this}updateMatrixWorld(t){if(super.updateMatrixWorld(t),this.hasPlaybackControl===!0&&this.isPlaying===!1)return;this.matrixWorld.decompose(Ds,_0,_x),Ns.set(0,0,1).applyQuaternion(_0);let e=this.panner;if(e.positionX){let n=this.context.currentTime+this.listener.timeDelta;e.positionX.linearRampToValueAtTime(Ds.x,n),e.positionY.linearRampToValueAtTime(Ds.y,n),e.positionZ.linearRampToValueAtTime(Ds.z,n),e.orientationX.linearRampToValueAtTime(Ns.x,n),e.orientationY.linearRampToValueAtTime(Ns.y,n),e.orientationZ.linearRampToValueAtTime(Ns.z,n)}else e.setPosition(Ds.x,Ds.y,Ds.z),e.setOrientation(Ns.x,Ns.y,Ns.z)}},Ph=class{constructor(t,e=2048){this.analyser=t.context.createAnalyser(),this.analyser.fftSize=e,this.data=new Uint8Array(this.analyser.frequencyBinCount),t.getOutput().connect(this.analyser)}getFrequencyData(){return this.analyser.getByteFrequencyData(this.data),this.data}getAverageFrequency(){let t=0,e=this.getFrequencyData();for(let n=0;n<e.length;n++)t+=e[n];return t/e.length}},fl=class{constructor(t,e,n){this.binding=t,this.valueSize=n;let i,r,a;switch(e){case"quaternion":i=this._slerp,r=this._slerpAdditive,a=this._setAdditiveIdentityQuaternion,this.buffer=new Float64Array(n*6),this._workIndex=5;break;case"string":case"bool":i=this._select,r=this._select,a=this._setAdditiveIdentityOther,this.buffer=new Array(n*5);break;default:i=this._lerp,r=this._lerpAdditive,a=this._setAdditiveIdentityNumeric,this.buffer=new Float64Array(n*5)}this._mixBufferRegion=i,this._mixBufferRegionAdditive=r,this._setIdentity=a,this._origIndex=3,this._addIndex=4,this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,this.useCount=0,this.referenceCount=0}accumulate(t,e){let n=this.buffer,i=this.valueSize,r=t*i+i,a=this.cumulativeWeight;if(a===0){for(let o=0;o!==i;++o)n[r+o]=n[o];a=e}else{a+=e;let o=e/a;this._mixBufferRegion(n,r,0,o,i)}this.cumulativeWeight=a}accumulateAdditive(t){let e=this.buffer,n=this.valueSize,i=n*this._addIndex;this.cumulativeWeightAdditive===0&&this._setIdentity(),this._mixBufferRegionAdditive(e,i,0,t,n),this.cumulativeWeightAdditive+=t}apply(t){let e=this.valueSize,n=this.buffer,i=t*e+e,r=this.cumulativeWeight,a=this.cumulativeWeightAdditive,o=this.binding;if(this.cumulativeWeight=0,this.cumulativeWeightAdditive=0,r<1){let l=e*this._origIndex;this._mixBufferRegion(n,i,l,1-r,e)}a>0&&this._mixBufferRegionAdditive(n,i,this._addIndex*e,1,e);for(let l=e,c=e+e;l!==c;++l)if(n[l]!==n[l+e]){o.setValue(n,i);break}}saveOriginalState(){let t=this.binding,e=this.buffer,n=this.valueSize,i=n*this._origIndex;t.getValue(e,i);for(let r=n,a=i;r!==a;++r)e[r]=e[i+r%n];this._setIdentity(),this.cumulativeWeight=0,this.cumulativeWeightAdditive=0}restoreOriginalState(){let t=this.valueSize*3;this.binding.setValue(this.buffer,t)}_setAdditiveIdentityNumeric(){let t=this._addIndex*this.valueSize,e=t+this.valueSize;for(let n=t;n<e;n++)this.buffer[n]=0}_setAdditiveIdentityQuaternion(){this._setAdditiveIdentityNumeric(),this.buffer[this._addIndex*this.valueSize+3]=1}_setAdditiveIdentityOther(){let t=this._origIndex*this.valueSize,e=this._addIndex*this.valueSize;for(let n=0;n<this.valueSize;n++)this.buffer[e+n]=this.buffer[t+n]}_select(t,e,n,i,r){if(i>=.5)for(let a=0;a!==r;++a)t[e+a]=t[n+a]}_slerp(t,e,n,i){Ne.slerpFlat(t,e,t,e,t,n,i)}_slerpAdditive(t,e,n,i,r){let a=this._workIndex*r;Ne.multiplyQuaternionsFlat(t,a,t,e,t,n),Ne.slerpFlat(t,e,t,e,t,a,i)}_lerp(t,e,n,i,r){let a=1-i;for(let o=0;o!==r;++o){let l=e+o;t[l]=t[l]*a+t[n+o]*i}}_lerpAdditive(t,e,n,i,r){for(let a=0;a!==r;++a){let o=e+a;t[o]=t[o]+t[n+a]*i}}},Pf="\\[\\]\\.:\\/",xx=new RegExp("["+Pf+"]","g"),If="[^"+Pf+"]",yx="[^"+Pf.replace("\\.","")+"]",vx=/((?:WC+[\/:])*)/.source.replace("WC",If),Mx=/(WCOD+)?/.source.replace("WCOD",yx),Sx=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",If),bx=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",If),Ex=new RegExp("^"+vx+Mx+Sx+bx+"$"),Tx=["material","materials","bones","map"],Bd=class{constructor(t,e,n){let i=n||ge.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,i)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,i=this._bindings[n];i!==void 0&&i.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let i=this._targetGroup.nCachedObjects_,r=n.length;i!==r;++i)n[i].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},ge=class s{constructor(t,e,n){this.path=e,this.parsedPath=n||s.parseTrackName(e),this.node=s.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new s.Composite(t,e,n):new s(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(xx,"")}static parseTrackName(t){let e=Ex.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},i=n.nodeName&&n.nodeName.lastIndexOf(".");if(i!==void 0&&i!==-1){let r=n.nodeName.substring(i+1);Tx.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,i),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},i=n(t.children);if(i)return i}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)t[e++]=n[i]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let i=0,r=n.length;i!==r;++i)n[i]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,i=e.propertyName,r=e.propertyIndex;if(t||(t=s.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Rt("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Ht("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Ht("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Ht("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Ht("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Ht("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Ht("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Ht("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[i];if(a===void 0){let c=e.nodeName;Ht("PropertyBinding: Trying to update property for track: "+c+"."+i+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(i==="morphTargetInfluences"){if(!t.geometry){Ht("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Ht("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=i;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ge.Composite=Bd;ge.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ge.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ge.prototype.GetterByBindingType=[ge.prototype._getValue_direct,ge.prototype._getValue_array,ge.prototype._getValue_arrayElement,ge.prototype._getValue_toArray];ge.prototype.SetterByBindingTypeAndVersioning=[[ge.prototype._setValue_direct,ge.prototype._setValue_direct_setNeedsUpdate,ge.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ge.prototype._setValue_array,ge.prototype._setValue_array_setNeedsUpdate,ge.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ge.prototype._setValue_arrayElement,ge.prototype._setValue_arrayElement_setNeedsUpdate,ge.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ge.prototype._setValue_fromArray,ge.prototype._setValue_fromArray_setNeedsUpdate,ge.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Ih=class{constructor(){this.isAnimationObjectGroup=!0,this.uuid=Yn(),this._objects=Array.prototype.slice.call(arguments),this.nCachedObjects_=0;let t={};this._indicesByUUID=t;for(let n=0,i=arguments.length;n!==i;++n)t[arguments[n].uuid]=n;this._paths=[],this._parsedPaths=[],this._bindings=[],this._bindingsIndicesByPath={};let e=this;this.stats={objects:{get total(){return e._objects.length},get inUse(){return this.total-e.nCachedObjects_}},get bindingsPerObject(){return e._bindings.length}}}add(){let t=this._objects,e=this._indicesByUUID,n=this._paths,i=this._parsedPaths,r=this._bindings,a=r.length,o,l=t.length,c=this.nCachedObjects_;for(let h=0,u=arguments.length;h!==u;++h){let f=arguments[h],d=f.uuid,p=e[d];if(p===void 0){p=l++,e[d]=p,t.push(f);for(let _=0,m=a;_!==m;++_)r[_].push(new ge(f,n[_],i[_]))}else if(p<c){o=t[p];let _=--c,m=t[_];e[m.uuid]=p,t[p]=m,e[d]=_,t[_]=f;for(let g=0,y=a;g!==y;++g){let M=r[g],v=M[_],w=M[p];M[p]=v,w===void 0&&(w=new ge(f,n[g],i[g])),M[_]=w}}else t[p]!==o&&Ht("AnimationObjectGroup: Different objects with the same UUID detected. Clean the caches or recreate your infrastructure when reloading scenes.")}this.nCachedObjects_=c}remove(){let t=this._objects,e=this._indicesByUUID,n=this._bindings,i=n.length,r=this.nCachedObjects_;for(let a=0,o=arguments.length;a!==o;++a){let l=arguments[a],c=l.uuid,h=e[c];if(h!==void 0&&h>=r){let u=r++,f=t[u];e[f.uuid]=h,t[h]=f,e[c]=u,t[u]=l;for(let d=0,p=i;d!==p;++d){let _=n[d],m=_[u],g=_[h];_[h]=m,_[u]=g}}}this.nCachedObjects_=r}uncache(){let t=this._objects,e=this._indicesByUUID,n=this._bindings,i=n.length,r=this.nCachedObjects_,a=t.length;for(let o=0,l=arguments.length;o!==l;++o){let c=arguments[o],h=c.uuid,u=e[h];if(u!==void 0)if(delete e[h],u<r){let f=--r,d=t[f],p=--a,_=t[p];u!==f&&(e[d.uuid]=u),t[u]=d,f!==p&&(e[_.uuid]=f),t[f]=_,t.pop();for(let m=0,g=i;m!==g;++m){let y=n[m],M=y[f],v=y[p];y[u]=M,y[f]=v,y.pop()}}else{let f=--a,d=t[f];u!==f&&(e[d.uuid]=u),t[u]=d,t.pop();for(let p=0,_=i;p!==_;++p){let m=n[p];m[u]=m[f],m.pop()}}}this.nCachedObjects_=r}subscribe_(t,e){let n=this._bindingsIndicesByPath,i=n[t],r=this._bindings;if(i!==void 0)return r[i];let a=this._paths,o=this._parsedPaths,l=this._objects,c=l.length,h=this.nCachedObjects_,u=new Array(c);i=r.length,n[t]=i,a.push(t),o.push(e),r.push(u);for(let f=h,d=l.length;f!==d;++f){let p=l[f];u[f]=new ge(p,t,e)}return u}unsubscribe_(t){let e=this._bindingsIndicesByPath,n=e[t];if(n!==void 0){let i=this._paths,r=this._parsedPaths,a=this._bindings,o=a.length-1,l=a[o],c=i[o];e[c]=n,a[n]=l,a.pop(),r[n]=r[o],r.pop(),i[n]=i[o],i.pop()}}},pl=class{constructor(t,e,n=null,i=e.blendMode){this._mixer=t,this._clip=e,this._localRoot=n,this.blendMode=i;let r=e.tracks,a=r.length,o=new Array(a),l={endingStart:is,endingEnd:is};for(let c=0;c!==a;++c){let h=r[c].createInterpolant(null);o[c]=h,h.settings=l}this._interpolantSettings=l,this._interpolants=o,this._propertyBindings=new Array(a),this._cacheIndex=null,this._byClipCacheIndex=null,this._timeScaleInterpolant=null,this._restoreTimeScale=null,this._weightInterpolant=null,this.loop=ff,this._loopCount=-1,this._startTime=null,this.time=0,this.timeScale=1,this._effectiveTimeScale=1,this.weight=1,this._effectiveWeight=1,this.repetitions=1/0,this.paused=!1,this.enabled=!0,this.clampWhenFinished=!1,this.zeroSlopeAtStart=!0,this.zeroSlopeAtEnd=!0}play(){return this._mixer._activateAction(this),this}stop(){return this._mixer._deactivateAction(this),this.reset()}reset(){return this.paused=!1,this.enabled=!0,this.time=0,this._loopCount=-1,this._startTime=null,this.stopFading().stopWarping()}isRunning(){return this.enabled&&!this.paused&&this.timeScale!==0&&this._startTime===null&&this._mixer._isActiveAction(this)}isScheduled(){return this._mixer._isActiveAction(this)}startAt(t){return this._startTime=t,this}setLoop(t,e){return this.loop=t,this.repetitions=e,this}setEffectiveWeight(t){return this.weight=t,this._effectiveWeight=this.enabled?t:0,this.stopFading()}getEffectiveWeight(){return this._effectiveWeight}fadeIn(t){return this._scheduleFading(t,0,1)}fadeOut(t){return this._scheduleFading(t,1,0)}crossFadeFrom(t,e,n=!1){if(t.fadeOut(e),this.fadeIn(e),n===!0){let i=this._clip.duration,r=t._clip.duration,a=r/i,o=i/r;t._restoreTimeScale=t.timeScale,this._restoreTimeScale=this.timeScale,t.warp(1,a,e),this.warp(o,1,e)}return this}crossFadeTo(t,e,n=!1){return t.crossFadeFrom(this,e,n)}stopFading(){let t=this._weightInterpolant;return t!==null&&(this._weightInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this}setEffectiveTimeScale(t){return this.timeScale=t,this._effectiveTimeScale=this.paused?0:t,this.stopWarping()}getEffectiveTimeScale(){return this._effectiveTimeScale}setDuration(t){return this.timeScale=this._clip.duration/t,this.stopWarping()}syncWith(t){return this.time=t.time,this.timeScale=t.timeScale,this.stopWarping()}halt(t){return this.warp(this._effectiveTimeScale,0,t)}warp(t,e,n){let i=this._mixer,r=i.time,a=this.timeScale,o=this._timeScaleInterpolant;o===null&&(o=i._lendControlInterpolant(),this._timeScaleInterpolant=o);let l=o.parameterPositions,c=o.sampleValues;return l[0]=r,l[1]=r+n,c[0]=t/a,c[1]=e/a,this}stopWarping(){let t=this._timeScaleInterpolant;return t!==null&&(this._timeScaleInterpolant=null,this._mixer._takeBackControlInterpolant(t)),this._restoreTimeScale=null,this}getMixer(){return this._mixer}getClip(){return this._clip}getRoot(){return this._localRoot||this._mixer._root}_update(t,e,n,i){if(!this.enabled){this._updateWeight(t);return}let r=this._startTime;if(r!==null){let l=(t-r)*n;l<0||n===0?e=0:(this._startTime=null,e=n*l)}e*=this._updateTimeScale(t);let a=this._updateTime(e),o=this._updateWeight(t);if(o>0){let l=this._interpolants,c=this._propertyBindings;switch(this.blendMode){case bu:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(a),c[h].accumulateAdditive(o);break;case Ql:default:for(let h=0,u=l.length;h!==u;++h)l[h].evaluate(a),c[h].accumulate(i,o)}}}_updateWeight(t){let e=0;if(this.enabled){e=this.weight;let n=this._weightInterpolant;if(n!==null){let i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(this.stopFading(),i===0&&(this.enabled=!1))}}return this._effectiveWeight=e,e}_updateTimeScale(t){let e=0;if(!this.paused){e=this.timeScale;let n=this._timeScaleInterpolant;if(n!==null){let i=n.evaluate(t)[0];e*=i,t>n.parameterPositions[1]&&(e===0?this.paused=!0:(this._restoreTimeScale!==null&&(e=this._restoreTimeScale),this.timeScale=e),this.stopWarping())}}return this._effectiveTimeScale=e,e}_updateTime(t){let e=this._clip.duration,n=this.loop,i=this.time+t,r=this._loopCount,a=n===pf;if(t===0)return r===-1?i:a&&(r&1)===1?e-i:i;if(n===df){r===-1&&(this._loopCount=0,this._setEndings(!0,!0,!1));t:{if(i>=e)i=e;else if(i<0)i=0;else{this.time=i;break t}this.clampWhenFinished?this.paused=!0:this.enabled=!1,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t<0?-1:1})}}else{if(r===-1&&(t>=0?(r=0,this._setEndings(!0,this.repetitions===0,a)):this._setEndings(this.repetitions===0,!0,a)),i>=e||i<0){let o=Math.floor(i/e);i-=e*o,r+=Math.abs(o);let l=this.repetitions-r;if(l<=0)this.clampWhenFinished?this.paused=!0:this.enabled=!1,i=t>0?e:0,this.time=i,this._mixer.dispatchEvent({type:"finished",action:this,direction:t>0?1:-1});else{if(l===1){let c=t<0;this._setEndings(c,!c,a)}else this._setEndings(!1,!1,a);this._loopCount=r,this.time=i,this._mixer.dispatchEvent({type:"loop",action:this,loopDelta:o})}}else this._loopCount=r,this.time=i;if(a&&(r&1)===1)return e-i}return i}_setEndings(t,e,n){let i=this._interpolantSettings;n?(i.endingStart=ss,i.endingEnd=ss):(t?i.endingStart=this.zeroSlopeAtStart?ss:is:i.endingStart=Vr,e?i.endingEnd=this.zeroSlopeAtEnd?ss:is:i.endingEnd=Vr)}_scheduleFading(t,e,n){let i=this._mixer,r=i.time,a=this._weightInterpolant;a===null&&(a=i._lendControlInterpolant(),this._weightInterpolant=a);let o=a.parameterPositions,l=a.sampleValues;return o[0]=r,l[0]=e,o[1]=r+t,l[1]=n,this}},wx=new Float32Array(1),Lh=class extends En{constructor(t){super(),this._root=t,this._initMemoryManager(),this._accuIndex=0,this.time=0,this.timeScale=1,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}_bindAction(t,e){let n=t._localRoot||this._root,i=t._clip.tracks,r=i.length,a=t._propertyBindings,o=t._interpolants,l=n.uuid,c=this._bindingsByRootAndName,h=c[l];h===void 0&&(h={},c[l]=h);for(let u=0;u!==r;++u){let f=i[u],d=f.name,p=h[d];if(p!==void 0)++p.referenceCount,a[u]=p;else{if(p=a[u],p!==void 0){p._cacheIndex===null&&(++p.referenceCount,this._addInactiveBinding(p,l,d));continue}let _=e&&e._propertyBindings[u].binding.parsedPath;p=new fl(ge.create(n,d,_),f.ValueTypeName,f.getValueSize()),++p.referenceCount,this._addInactiveBinding(p,l,d),a[u]=p}o[u].resultBuffer=p.buffer}}_activateAction(t){if(!this._isActiveAction(t)){if(t._cacheIndex===null){let n=(t._localRoot||this._root).uuid,i=t._clip.uuid,r=this._actionsByClip[i];this._bindAction(t,r&&r.knownActions[0]),this._addInactiveAction(t,i,n)}let e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){let r=e[n];r.useCount++===0&&(this._lendBinding(r),r.saveOriginalState())}this._lendAction(t)}}_deactivateAction(t){if(this._isActiveAction(t)){let e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){let r=e[n];--r.useCount===0&&(r.restoreOriginalState(),this._takeBackBinding(r))}this._takeBackAction(t)}}_initMemoryManager(){this._actions=[],this._nActiveActions=0,this._actionsByClip={},this._bindings=[],this._nActiveBindings=0,this._bindingsByRootAndName={},this._controlInterpolants=[],this._nActiveControlInterpolants=0;let t=this;this.stats={actions:{get total(){return t._actions.length},get inUse(){return t._nActiveActions}},bindings:{get total(){return t._bindings.length},get inUse(){return t._nActiveBindings}},controlInterpolants:{get total(){return t._controlInterpolants.length},get inUse(){return t._nActiveControlInterpolants}}}}_isActiveAction(t){let e=t._cacheIndex;return e!==null&&e<this._nActiveActions}_addInactiveAction(t,e,n){let i=this._actions,r=this._actionsByClip,a=r[e];if(a===void 0)a={knownActions:[t],actionByRoot:{}},t._byClipCacheIndex=0,r[e]=a;else{let o=a.knownActions;t._byClipCacheIndex=o.length,o.push(t)}t._cacheIndex=i.length,i.push(t),a.actionByRoot[n]=t}_removeInactiveAction(t){let e=this._actions,n=e[e.length-1],i=t._cacheIndex;n._cacheIndex=i,e[i]=n,e.pop(),t._cacheIndex=null;let r=t._clip.uuid,a=this._actionsByClip,o=a[r],l=o.knownActions,c=l[l.length-1],h=t._byClipCacheIndex;c._byClipCacheIndex=h,l[h]=c,l.pop(),t._byClipCacheIndex=null;let u=o.actionByRoot,f=(t._localRoot||this._root).uuid;delete u[f],l.length===0&&delete a[r],this._removeInactiveBindingsForAction(t)}_removeInactiveBindingsForAction(t){let e=t._propertyBindings;for(let n=0,i=e.length;n!==i;++n){let r=e[n];--r.referenceCount===0&&this._removeInactiveBinding(r)}}_lendAction(t){let e=this._actions,n=t._cacheIndex,i=this._nActiveActions++,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_takeBackAction(t){let e=this._actions,n=t._cacheIndex,i=--this._nActiveActions,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_addInactiveBinding(t,e,n){let i=this._bindingsByRootAndName,r=this._bindings,a=i[e];a===void 0&&(a={},i[e]=a),a[n]=t,t._cacheIndex=r.length,r.push(t)}_removeInactiveBinding(t){let e=this._bindings,n=t.binding,i=n.rootNode.uuid,r=n.path,a=this._bindingsByRootAndName,o=a[i],l=e[e.length-1],c=t._cacheIndex;l._cacheIndex=c,e[c]=l,e.pop(),delete o[r],Object.keys(o).length===0&&delete a[i]}_lendBinding(t){let e=this._bindings,n=t._cacheIndex,i=this._nActiveBindings++,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_takeBackBinding(t){let e=this._bindings,n=t._cacheIndex,i=--this._nActiveBindings,r=e[i];t._cacheIndex=i,e[i]=t,r._cacheIndex=n,e[n]=r}_lendControlInterpolant(){let t=this._controlInterpolants,e=this._nActiveControlInterpolants++,n=t[e];return n===void 0&&(n=new ma(new Float32Array(2),new Float32Array(2),1,wx),n.__cacheIndex=e,t[e]=n),n}_takeBackControlInterpolant(t){let e=this._controlInterpolants,n=t.__cacheIndex,i=--this._nActiveControlInterpolants,r=e[i];t.__cacheIndex=i,e[i]=t,r.__cacheIndex=n,e[n]=r}clipAction(t,e,n){let i=e||this._root,r=i.uuid,a=typeof t=="string"?ds.findByName(i,t):t,o=a!==null?a.uuid:t,l=this._actionsByClip[o],c=null;if(n===void 0&&(a!==null?n=a.blendMode:n=Ql),l!==void 0){let u=l.actionByRoot[r];if(u!==void 0&&u.blendMode===n)return u;c=l.knownActions[0],a===null&&(a=c._clip)}if(a===null)return null;let h=new pl(this,a,e,n);return this._bindAction(h,c),this._addInactiveAction(h,o,r),h}existingAction(t,e){let n=e||this._root,i=n.uuid,r=typeof t=="string"?ds.findByName(n,t):t,a=r?r.uuid:t,o=this._actionsByClip[a];return o!==void 0&&o.actionByRoot[i]||null}stopAllAction(){let t=this._actions,e=this._nActiveActions;for(let n=e-1;n>=0;--n)t[n].stop();return this}update(t){t*=this.timeScale;let e=this._actions,n=this._nActiveActions,i=this.time+=t,r=Math.sign(t),a=this._accuIndex^=1;for(let c=0;c!==n;++c)e[c]._update(i,t,r,a);let o=this._bindings,l=this._nActiveBindings;for(let c=0;c!==l;++c)o[c].apply(a);return this}setTime(t){this.time=0;for(let e=0;e<this._actions.length;e++)this._actions[e].time=0;return this.update(t)}getRoot(){return this._root}uncacheClip(t){let e=this._actions,n=t.uuid,i=this._actionsByClip,r=i[n];if(r!==void 0){let a=r.knownActions;for(let o=0,l=a.length;o!==l;++o){let c=a[o];this._deactivateAction(c);let h=c._cacheIndex,u=e[e.length-1];c._cacheIndex=null,c._byClipCacheIndex=null,u._cacheIndex=h,e[h]=u,e.pop(),this._removeInactiveBindingsForAction(c)}delete i[n]}}uncacheRoot(t){let e=t.uuid,n=this._actionsByClip;for(let a in n){let o=n[a].actionByRoot,l=o[e];l!==void 0&&(this._deactivateAction(l),this._removeInactiveAction(l))}let i=this._bindingsByRootAndName,r=i[e];if(r!==void 0)for(let a in r){let o=r[a];o.restoreOriginalState(),this._removeInactiveBinding(o)}}uncacheAction(t,e){let n=this.existingAction(t,e);n!==null&&(this._deactivateAction(n),this._removeInactiveAction(n))}},Dh=class extends Yr{constructor(t=1,e=1,n=1,i={}){super(t,e,i),this.isRenderTarget3D=!0,this.depth=n;for(let r=0;r<this.textures.length;r++){let a=new ks(null,t,e,n);a.isRenderTargetTexture=!0,a.renderTarget=this,this.textures[r]=a}this._setTextureOptions(i)}},Nh=class s{constructor(t){this.value=t}clone(){return new s(this.value.clone===void 0?this.value:this.value.clone())}},Ax=0,Uh=class extends En{constructor(){super(),this.isUniformsGroup=!0,Object.defineProperty(this,"id",{value:Ax++}),this.name="",this.usage=tc,this.uniforms=[]}add(t){return this.uniforms.push(t),this}remove(t){let e=this.uniforms.indexOf(t);return e!==-1&&this.uniforms.splice(e,1),this}setName(t){return this.name=t,this}setUsage(t){return this.usage=t,this}dispose(){this.dispatchEvent({type:"dispose"})}copy(t){this.name=t.name,this.usage=t.usage;let e=t.uniforms;this.uniforms.length=0;for(let n=0,i=e.length;n<i;n++){let r=e[n];Array.isArray(r)?this.uniforms.push(r.map(a=>a.clone())):this.uniforms.push(r.clone())}return this}clone(){return new this.constructor().copy(this)}},Oh=class extends Ws{constructor(t,e,n=1){super(t,e),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=n}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}clone(t){let e=super.clone(t);return e.meshPerAttribute=this.meshPerAttribute,e}toJSON(t){let e=super.toJSON(t);return e.isInstancedInterleavedBuffer=!0,e.meshPerAttribute=this.meshPerAttribute,e}},Fh=class{constructor(t,e,n,i,r,a=!1){this.isGLBufferAttribute=!0,this.name="",this.buffer=t,this.type=e,this.itemSize=n,this.elementSize=i,this.count=r,this.normalized=a,this.version=0}set needsUpdate(t){t===!0&&this.version++}setBuffer(t){return this.buffer=t,this}setType(t,e){return this.type=t,this.elementSize=e,this}setItemSize(t){return this.itemSize=t,this}setCount(t){return this.count=t,this}},x0=new Zt,Sa=class{constructor(t,e,n=0,i=1/0){this.ray=new ai(t,e),this.near=n,this.far=i,this.camera=null,this.layers=new Gs,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Ht("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return x0.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(x0),this}intersectObject(t,e=!0,n=[]){return zd(t,this,n,e),n.sort(y0),n}intersectObjects(t,e=!0,n=[]){for(let i=0,r=t.length;i<r;i++)zd(t[i],this,n,e);return n.sort(y0),n}};function y0(s,t){return s.distance-t.distance}function zd(s,t,e,n){let i=!0;if(s.layers.test(t.layers)&&s.raycast(t,e)===!1&&(i=!1),i===!0&&n===!0){let r=s.children;for(let a=0,o=r.length;a<o;a++)zd(r[a],t,e,!0)}}var Bh=class{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1,Rt("Clock: This module has been deprecated. Please use THREE.Timer instead.")}start(){this.startTime=performance.now(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let e=performance.now();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}},or=class{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Yt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(Yt(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}},zh=class{constructor(t=1,e=0,n=0){this.radius=t,this.theta=e,this.y=n}set(t,e,n){return this.radius=t,this.theta=e,this.y=n,this}copy(t){return this.radius=t.radius,this.theta=t.theta,this.y=t.y,this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+n*n),this.theta=Math.atan2(t,n),this.y=e,this}clone(){return new this.constructor().copy(this)}},Of=class Of{constructor(t,e,n,i){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,i)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,i){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=i,this}};Of.prototype.isMatrix2=!0;var kh=Of,v0=new ct,ml=class{constructor(t=new ct(1/0,1/0),e=new ct(-1/0,-1/0)){this.isBox2=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=v0.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(t){return this.isEmpty()?t.set(0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,v0).distanceTo(t)}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},M0=new L,qc=new L,Ur=new L,Or=new L,Td=new L,Rx=new L,Cx=new L,Gh=class{constructor(t=new L,e=new L){this.start=t,this.end=e}set(t,e){return this.start.copy(t),this.end.copy(e),this}copy(t){return this.start.copy(t.start),this.end.copy(t.end),this}getCenter(t){return t.addVectors(this.start,this.end).multiplyScalar(.5)}delta(t){return t.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(t,e){return this.delta(e).multiplyScalar(t).add(this.start)}closestPointToPointParameter(t,e){M0.subVectors(t,this.start),qc.subVectors(this.end,this.start);let n=qc.dot(qc);if(n===0)return 0;let r=qc.dot(M0)/n;return e&&(r=Yt(r,0,1)),r}closestPointToPoint(t,e,n){let i=this.closestPointToPointParameter(t,e);return this.delta(n).multiplyScalar(i).add(this.start)}distanceSqToLine3(t,e=Rx,n=Cx){let i=10000000000000001e-32,r,a,o=this.start,l=t.start,c=this.end,h=t.end;Ur.subVectors(c,o),Or.subVectors(h,l),Td.subVectors(o,l);let u=Ur.dot(Ur),f=Or.dot(Or),d=Or.dot(Td);if(u<=i&&f<=i)return e.copy(o),n.copy(l),e.distanceToSquared(n);if(u<=i)r=0,a=d/f,a=Yt(a,0,1);else{let p=Ur.dot(Td);if(f<=i)a=0,r=Yt(-p/u,0,1);else{let _=Ur.dot(Or),m=u*f-_*_;m!==0?r=Yt((_*d-p*f)/m,0,1):r=0,a=(_*r+d)/f,a<0?(a=0,r=Yt(-p/u,0,1)):a>1&&(a=1,r=Yt((_-p)/u,0,1))}}return e.copy(o).addScaledVector(Ur,r),n.copy(l).addScaledVector(Or,a),e.distanceToSquared(n)}applyMatrix4(t){return this.start.applyMatrix4(t),this.end.applyMatrix4(t),this}equals(t){return t.start.equals(this.start)&&t.end.equals(this.end)}clone(){return new this.constructor().copy(this)}},S0=new L,Vh=class extends oe{constructor(t,e){super(),this.light=t,this.matrixAutoUpdate=!1,this.color=e,this.type="SpotLightHelper";let n=new jt,i=[0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,-1,0,1,0,0,0,0,1,1,0,0,0,0,-1,1];for(let a=0,o=1,l=32;a<l;a++,o++){let c=a/l*Math.PI*2,h=o/l*Math.PI*2;i.push(Math.cos(c),Math.sin(c),1,Math.cos(h),Math.sin(h),1)}n.setAttribute("position",new Ot(i,3));let r=new Ze({fog:!1,toneMapped:!1});this.cone=new Dn(n,r),this.add(this.cone),this.update()}dispose(){super.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}update(){this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),this.parent?(this.parent.updateWorldMatrix(!0),this.matrix.copy(this.parent.matrixWorld).invert().multiply(this.light.matrixWorld)):this.matrix.copy(this.light.matrixWorld),this.matrixWorldNeedsUpdate=!0;let t=this.light.distance?this.light.distance:1e3,e=t*Math.tan(this.light.angle);this.cone.scale.set(e,e,t),S0.setFromMatrixPosition(this.light.target.matrixWorld),this.cone.lookAt(S0),this.color!==void 0?this.cone.material.color.set(this.color):this.cone.material.color.copy(this.light.color)}},ns=new L,Yc=new Zt,wd=new Zt,Hh=class extends Dn{constructor(t){let e=Nm(t),n=new jt,i=[],r=[];for(let c=0;c<e.length;c++){let h=e[c];h.parent&&h.parent.isBone&&(i.push(0,0,0),i.push(0,0,0),r.push(0,0,0),r.push(0,0,0))}n.setAttribute("position",new Ot(i,3)),n.setAttribute("color",new Ot(r,3));let a=new Ze({vertexColors:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,transparent:!0});super(n,a),this.isSkeletonHelper=!0,this.type="SkeletonHelper",this.root=t,this.bones=e,this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1;let o=new Lt(255),l=new Lt(65280);this.setColors(o,l)}updateMatrixWorld(t){let e=this.bones,n=this.geometry,i=n.getAttribute("position");wd.copy(this.root.matrixWorld).invert();for(let r=0,a=0;r<e.length;r++){let o=e[r];o.parent&&o.parent.isBone&&(Yc.multiplyMatrices(wd,o.matrixWorld),ns.setFromMatrixPosition(Yc),i.setXYZ(a,ns.x,ns.y,ns.z),Yc.multiplyMatrices(wd,o.parent.matrixWorld),ns.setFromMatrixPosition(Yc),i.setXYZ(a+1,ns.x,ns.y,ns.z),a+=2)}n.getAttribute("position").needsUpdate=!0,super.updateMatrixWorld(t)}setColors(t,e){let i=this.geometry.getAttribute("color");for(let r=0;r<i.count;r+=2)i.setXYZ(r,t.r,t.g,t.b),i.setXYZ(r+1,e.r,e.g,e.b);return i.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function Nm(s){let t=[];s.isBone===!0&&t.push(s);for(let e=0;e<s.children.length;e++)t.push(...Nm(s.children[e]));return t}var Wh=class extends ue{constructor(t,e,n){let i=new ua(e,4,2),r=new Vn({wireframe:!0,fog:!1,toneMapped:!1});super(i,r),this.light=t,this.color=n,this.type="PointLightHelper",this.matrix=this.light.matrixWorld,this.matrixAutoUpdate=!1,this.update()}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.color!==void 0?this.material.color.set(this.color):this.material.color.copy(this.light.color)}},Px=new L,b0=new Lt,E0=new Lt,Xh=class extends oe{constructor(t,e,n){super(),this.light=t,this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.color=n,this.type="HemisphereLightHelper";let i=new ha(e);i.rotateY(Math.PI*.5),this.material=new Vn({wireframe:!0,fog:!1,toneMapped:!1}),this.color===void 0&&(this.material.vertexColors=!0);let r=i.getAttribute("position"),a=new Float32Array(r.count*3);i.setAttribute("color",new ve(a,3)),this.add(new ue(i,this.material)),this.update()}dispose(){super.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}update(){let t=this.children[0];if(this.color!==void 0)this.material.color.set(this.color);else{let e=t.geometry.getAttribute("color");b0.copy(this.light.color),E0.copy(this.light.groundColor);for(let n=0,i=e.count;n<i;n++){let r=n<i/2?b0:E0;e.setXYZ(n,r.r,r.g,r.b)}e.needsUpdate=!0}this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),t.lookAt(Px.setFromMatrixPosition(this.light.matrixWorld).negate())}},qh=class extends Dn{constructor(t=10,e=10,n=4473924,i=8947848){n=new Lt(n),i=new Lt(i);let r=e/2,a=t/e,o=t/2,l=[],c=[];for(let f=0,d=0,p=-o;f<=e;f++,p+=a){l.push(-o,0,p,o,0,p),l.push(p,0,-o,p,0,o);let _=f===r?n:i;_.toArray(c,d),d+=3,_.toArray(c,d),d+=3,_.toArray(c,d),d+=3,_.toArray(c,d),d+=3}let h=new jt;h.setAttribute("position",new Ot(l,3)),h.setAttribute("color",new Ot(c,3));let u=new Ze({vertexColors:!0,toneMapped:!1});super(h,u),this.type="GridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},Yh=class extends Dn{constructor(t=10,e=16,n=8,i=64,r=4473924,a=8947848){r=new Lt(r),a=new Lt(a);let o=[],l=[];if(e>1)for(let u=0;u<e;u++){let f=u/e*(Math.PI*2),d=Math.sin(f)*t,p=Math.cos(f)*t;o.push(0,0,0),o.push(d,0,p);let _=u&1?r:a;l.push(_.r,_.g,_.b),l.push(_.r,_.g,_.b)}for(let u=0;u<n;u++){let f=u&1?r:a,d=t-t/n*u;for(let p=0;p<i;p++){let _=p/i*(Math.PI*2),m=Math.sin(_)*d,g=Math.cos(_)*d;o.push(m,0,g),l.push(f.r,f.g,f.b),_=(p+1)/i*(Math.PI*2),m=Math.sin(_)*d,g=Math.cos(_)*d,o.push(m,0,g),l.push(f.r,f.g,f.b)}}let c=new jt;c.setAttribute("position",new Ot(o,3)),c.setAttribute("color",new Ot(l,3));let h=new Ze({vertexColors:!0,toneMapped:!1});super(c,h),this.type="PolarGridHelper"}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},T0=new L,Zc=new L,w0=new L,Zh=class extends oe{constructor(t,e,n){super(),this.light=t,this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.color=n,this.type="DirectionalLightHelper",e===void 0&&(e=1);let i=new jt;i.setAttribute("position",new Ot([-e,e,0,e,e,0,e,-e,0,-e,-e,0,-e,e,0],3));let r=new Ze({fog:!1,toneMapped:!1});this.lightPlane=new oi(i,r),this.add(this.lightPlane),i=new jt,i.setAttribute("position",new Ot([0,0,0,0,0,1],3)),this.targetLine=new oi(i,r),this.add(this.targetLine),this.update()}dispose(){super.dispose(),this.lightPlane.geometry.dispose(),this.lightPlane.material.dispose(),this.targetLine.geometry.dispose(),this.targetLine.material.dispose()}update(){this.matrixWorldNeedsUpdate=!0,this.light.updateWorldMatrix(!0,!1),this.light.target.updateWorldMatrix(!0,!1),T0.setFromMatrixPosition(this.light.matrixWorld),Zc.setFromMatrixPosition(this.light.target.matrixWorld),w0.subVectors(Zc,T0),this.lightPlane.lookAt(Zc),this.color!==void 0?(this.lightPlane.material.color.set(this.color),this.targetLine.material.color.set(this.color)):(this.lightPlane.material.color.copy(this.light.color),this.targetLine.material.color.copy(this.light.color)),this.targetLine.lookAt(Zc),this.targetLine.scale.z=w0.length()}},$c=new L,Ce=new ir,$h=class extends Dn{constructor(t){let e=new jt,n=new Ze({color:16777215,vertexColors:!0,toneMapped:!1}),i=[],r=[],a={};o("n1","n2"),o("n2","n4"),o("n4","n3"),o("n3","n1"),o("f1","f2"),o("f2","f4"),o("f4","f3"),o("f3","f1"),o("n1","f1"),o("n2","f2"),o("n3","f3"),o("n4","f4"),o("p","n1"),o("p","n2"),o("p","n3"),o("p","n4"),o("u1","u2"),o("u2","u3"),o("u3","u1"),o("c","t"),o("p","c"),o("cn1","cn2"),o("cn3","cn4"),o("cf1","cf2"),o("cf3","cf4");function o(p,_){l(p),l(_)}function l(p){i.push(0,0,0),r.push(0,0,0),a[p]===void 0&&(a[p]=[]),a[p].push(i.length/3-1)}e.setAttribute("position",new Ot(i,3)),e.setAttribute("color",new Ot(r,3)),super(e,n),this.type="CameraHelper",this.camera=t,this.camera.updateProjectionMatrix&&this.camera.updateProjectionMatrix(),this.matrix=t.matrixWorld,this.matrixAutoUpdate=!1,this.pointMap=a,this.update();let c=new Lt(16755200),h=new Lt(16711680),u=new Lt(43775),f=new Lt(16777215),d=new Lt(3355443);this.setColors(c,h,u,f,d)}setColors(t,e,n,i,r){let o=this.geometry.getAttribute("color");return o.setXYZ(0,t.r,t.g,t.b),o.setXYZ(1,t.r,t.g,t.b),o.setXYZ(2,t.r,t.g,t.b),o.setXYZ(3,t.r,t.g,t.b),o.setXYZ(4,t.r,t.g,t.b),o.setXYZ(5,t.r,t.g,t.b),o.setXYZ(6,t.r,t.g,t.b),o.setXYZ(7,t.r,t.g,t.b),o.setXYZ(8,t.r,t.g,t.b),o.setXYZ(9,t.r,t.g,t.b),o.setXYZ(10,t.r,t.g,t.b),o.setXYZ(11,t.r,t.g,t.b),o.setXYZ(12,t.r,t.g,t.b),o.setXYZ(13,t.r,t.g,t.b),o.setXYZ(14,t.r,t.g,t.b),o.setXYZ(15,t.r,t.g,t.b),o.setXYZ(16,t.r,t.g,t.b),o.setXYZ(17,t.r,t.g,t.b),o.setXYZ(18,t.r,t.g,t.b),o.setXYZ(19,t.r,t.g,t.b),o.setXYZ(20,t.r,t.g,t.b),o.setXYZ(21,t.r,t.g,t.b),o.setXYZ(22,t.r,t.g,t.b),o.setXYZ(23,t.r,t.g,t.b),o.setXYZ(24,e.r,e.g,e.b),o.setXYZ(25,e.r,e.g,e.b),o.setXYZ(26,e.r,e.g,e.b),o.setXYZ(27,e.r,e.g,e.b),o.setXYZ(28,e.r,e.g,e.b),o.setXYZ(29,e.r,e.g,e.b),o.setXYZ(30,e.r,e.g,e.b),o.setXYZ(31,e.r,e.g,e.b),o.setXYZ(32,n.r,n.g,n.b),o.setXYZ(33,n.r,n.g,n.b),o.setXYZ(34,n.r,n.g,n.b),o.setXYZ(35,n.r,n.g,n.b),o.setXYZ(36,n.r,n.g,n.b),o.setXYZ(37,n.r,n.g,n.b),o.setXYZ(38,i.r,i.g,i.b),o.setXYZ(39,i.r,i.g,i.b),o.setXYZ(40,r.r,r.g,r.b),o.setXYZ(41,r.r,r.g,r.b),o.setXYZ(42,r.r,r.g,r.b),o.setXYZ(43,r.r,r.g,r.b),o.setXYZ(44,r.r,r.g,r.b),o.setXYZ(45,r.r,r.g,r.b),o.setXYZ(46,r.r,r.g,r.b),o.setXYZ(47,r.r,r.g,r.b),o.setXYZ(48,r.r,r.g,r.b),o.setXYZ(49,r.r,r.g,r.b),o.needsUpdate=!0,this}update(){let t=this.geometry,e=this.pointMap,n=1,i=1,r,a;if(Ce.projectionMatrixInverse.copy(this.camera.projectionMatrixInverse),this.camera.reversedDepth===!0)r=1,a=0;else if(this.camera.coordinateSystem===bn)r=-1,a=1;else if(this.camera.coordinateSystem===rs)r=0,a=1;else throw new Error("THREE.CameraHelper.update(): Invalid coordinate system: "+this.camera.coordinateSystem);Le("c",e,t,Ce,0,0,r),Le("t",e,t,Ce,0,0,a),Le("n1",e,t,Ce,-n,-i,r),Le("n2",e,t,Ce,n,-i,r),Le("n3",e,t,Ce,-n,i,r),Le("n4",e,t,Ce,n,i,r),Le("f1",e,t,Ce,-n,-i,a),Le("f2",e,t,Ce,n,-i,a),Le("f3",e,t,Ce,-n,i,a),Le("f4",e,t,Ce,n,i,a),Le("u1",e,t,Ce,n*.7,i*1.1,r),Le("u2",e,t,Ce,-n*.7,i*1.1,r),Le("u3",e,t,Ce,0,i*2,r),Le("cf1",e,t,Ce,-n,0,a),Le("cf2",e,t,Ce,n,0,a),Le("cf3",e,t,Ce,0,-i,a),Le("cf4",e,t,Ce,0,i,a),Le("cn1",e,t,Ce,-n,0,r),Le("cn2",e,t,Ce,n,0,r),Le("cn3",e,t,Ce,0,-i,r),Le("cn4",e,t,Ce,0,i,r),t.getAttribute("position").needsUpdate=!0}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}};function Le(s,t,e,n,i,r,a){$c.set(i,r,a).unproject(n);let o=t[s];if(o!==void 0){let l=e.getAttribute("position");for(let c=0,h=o.length;c<h;c++)l.setXYZ(o[c],$c.x,$c.y,$c.z)}}var Jc=new Ge,Jh=class extends Dn{constructor(t,e=16776960){let n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),i=new Float32Array(24),r=new jt;r.setIndex(new ve(n,1)),r.setAttribute("position",new ve(i,3)),super(r,new Ze({color:e,toneMapped:!1})),this.object=t,this.type="BoxHelper",this.matrixAutoUpdate=!1,this.update()}update(){if(this.object!==void 0&&Jc.setFromObject(this.object),Jc.isEmpty())return;let t=Jc.min,e=Jc.max,n=this.geometry.attributes.position,i=n.array;i[0]=e.x,i[1]=e.y,i[2]=e.z,i[3]=t.x,i[4]=e.y,i[5]=e.z,i[6]=t.x,i[7]=t.y,i[8]=e.z,i[9]=e.x,i[10]=t.y,i[11]=e.z,i[12]=e.x,i[13]=e.y,i[14]=t.z,i[15]=t.x,i[16]=e.y,i[17]=t.z,i[18]=t.x,i[19]=t.y,i[20]=t.z,i[21]=e.x,i[22]=t.y,i[23]=t.z,n.needsUpdate=!0,this.geometry.computeBoundingSphere()}setFromObject(t){return this.object=t,this.update(),this}copy(t,e){return super.copy(t,e),this.object=t.object,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},Kh=class extends Dn{constructor(t,e=16776960){let n=new Uint16Array([0,1,1,2,2,3,3,0,4,5,5,6,6,7,7,4,0,4,1,5,2,6,3,7]),i=[1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1],r=new jt;r.setIndex(new ve(n,1)),r.setAttribute("position",new Ot(i,3)),super(r,new Ze({color:e,toneMapped:!1})),this.box=t,this.type="Box3Helper",this.geometry.computeBoundingSphere()}updateMatrixWorld(t){let e=this.box;e.isEmpty()||(e.getCenter(this.position),e.getSize(this.scale),this.scale.multiplyScalar(.5),super.updateMatrixWorld(t))}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},jh=class extends oi{constructor(t,e=1,n=16776960){let i=n,r=[1,-1,0,-1,1,0,-1,-1,0,1,1,0,-1,1,0,-1,-1,0,1,-1,0,1,1,0],a=new jt;a.setAttribute("position",new Ot(r,3)),a.computeBoundingSphere(),super(a,new Ze({color:i,toneMapped:!1})),this.type="PlaneHelper",this.plane=t,this.size=e;let o=[1,1,0,-1,1,0,-1,-1,0,1,1,0,-1,-1,0,1,-1,0],l=new jt;l.setAttribute("position",new Ot(o,3)),l.computeBoundingSphere(),this.add(new ue(l,new Vn({color:i,opacity:.2,transparent:!0,depthWrite:!1,toneMapped:!1})))}updateMatrixWorld(t){this.position.set(0,0,0),this.scale.set(.5*this.size,.5*this.size,1),this.lookAt(this.plane.normal),this.translateZ(-this.plane.constant),super.updateMatrixWorld(t)}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose(),this.children[0].geometry.dispose(),this.children[0].material.dispose()}},A0=new L,Kc,Ad,Qh=class extends oe{constructor(t=new L(0,0,1),e=new L(0,0,0),n=1,i=16776960,r=n*.2,a=r*.2){super(),this.type="ArrowHelper",Kc===void 0&&(Kc=new jt,Kc.setAttribute("position",new Ot([0,0,0,0,1,0],3)),Ad=new ia(.5,1,5,1),Ad.translate(0,-.5,0)),this.position.copy(e),this.line=new oi(Kc,new Ze({color:i,toneMapped:!1})),this.line.matrixAutoUpdate=!1,this.add(this.line),this.cone=new ue(Ad,new Vn({color:i,toneMapped:!1})),this.cone.matrixAutoUpdate=!1,this.add(this.cone),this.setDirection(t),this.setLength(n,r,a)}setDirection(t){if(t.y>.99999)this.quaternion.set(0,0,0,1);else if(t.y<-.99999)this.quaternion.set(1,0,0,0);else{A0.set(t.z,0,-t.x).normalize();let e=Math.acos(t.y);this.quaternion.setFromAxisAngle(A0,e)}}setLength(t,e=t*.2,n=e*.2){this.line.scale.set(1,Math.max(1e-4,t-e),1),this.line.updateMatrix(),this.cone.scale.set(n,e,n),this.cone.position.y=t,this.cone.updateMatrix()}setColor(t){this.line.material.color.set(t),this.cone.material.color.set(t)}copy(t){return super.copy(t,!1),this.line.copy(t.line),this.cone.copy(t.cone),this}dispose(){super.dispose(),this.line.geometry.dispose(),this.line.material.dispose(),this.cone.geometry.dispose(),this.cone.material.dispose()}},tu=class extends Dn{constructor(t=1){let e=[0,0,0,t,0,0,0,0,0,0,t,0,0,0,0,0,0,t],n=[1,0,0,1,.6,0,0,1,0,.6,1,0,0,0,1,0,.6,1],i=new jt;i.setAttribute("position",new Ot(e,3)),i.setAttribute("color",new Ot(n,3));let r=new Ze({vertexColors:!0,toneMapped:!1});super(i,r),this.type="AxesHelper"}setColors(t,e,n){let i=new Lt,r=this.geometry.attributes.color.array;return i.set(t),i.toArray(r,0),i.toArray(r,3),i.set(e),i.toArray(r,6),i.toArray(r,9),i.set(n),i.toArray(r,12),i.toArray(r,15),this.geometry.attributes.color.needsUpdate=!0,this}dispose(){super.dispose(),this.geometry.dispose(),this.material.dispose()}},eu=class{constructor(){this.type="ShapePath",this.color=new Lt,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(t,e){return this.currentPath=new hs,this.subPaths.push(this.currentPath),this.currentPath.moveTo(t,e),this}lineTo(t,e){return this.currentPath.lineTo(t,e),this}quadraticCurveTo(t,e,n,i){return this.currentPath.quadraticCurveTo(t,e,n,i),this}bezierCurveTo(t,e,n,i,r,a){return this.currentPath.bezierCurveTo(t,e,n,i,r,a),this}splineThru(t){return this.currentPath.splineThru(t),this}toShapes(){function t(l,c){let h=!1,u=c.length;for(let f=0,d=u-1;f<u;d=f++){let p=c[f],_=c[d];p.y>l.y!=_.y>l.y&&l.x<(_.x-p.x)*(l.y-p.y)/(_.y-p.y)+p.x&&(h=!h)}return h}function e(l,c){let h=c.getCenter(new ct);if(t(h,l))return h;let u=h.y,f=[],d=l.length;for(let p=0;p<d;p++){let _=l[p],m=l[(p+1)%d];if(_.y>u!=m.y>u){let g=_.x+(u-_.y)*(m.x-_.x)/(m.y-_.y);f.push(g)}}return f.length>1&&(f.sort((p,_)=>p-_),h.x=(f[0]+f[1])/2),h}let n=this.userData.style&&this.userData.style.fillRule||"nonzero";n!=="nonzero"&&n!=="evenodd"&&(Rt('Fill-rule "'+n+'" is not supported, falling back to "nonzero".'),n="nonzero");let i=n==="nonzero"?(l=>l!==0):(l=>(l&1)!==0),r=[];for(let l of this.subPaths){let c=l.getPoints();if(c.length<3)continue;let h=kn.area(c);if(h===0)continue;let u=new ml;for(let f=0;f<c.length;f++)u.expandByPoint(c[f]);r.push({subPath:l,points:c,boundingBox:u,interiorPoint:e(c,u),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}r.sort((l,c)=>c.absArea-l.absArea);for(let l=0;l<r.length;l++){let c=r[l],h=0;for(let u=l-1;u>=0;u--){let f=r[u];if(f.boundingBox.containsBox(c.boundingBox)&&t(c.interiorPoint,f.points)){c.container=f.exclude?f.container:f,h=f.winding,c.winding+=h;break}}i(c.winding)===i(h)&&(c.exclude=!0)}for(let l of r)l.exclude||(l.role=l.container===null||l.container.role==="hole"?"outer":"hole");let a=[],o=new Map;for(let l of r){if(l.exclude||l.role!=="outer")continue;let c=new us;c.curves=l.subPath.curves,a.push(c),o.set(l,c)}for(let l of r){if(l.exclude||l.role!=="hole")continue;let c=o.get(l.container);if(!c)continue;let h=new hs;h.curves=l.subPath.curves,c.holes.push(h)}return a}},ba=class extends En{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function Ix(s,t){let e=s.image&&s.image.width?s.image.width/s.image.height:1;return e>t?(s.repeat.x=1,s.repeat.y=e/t,s.offset.x=0,s.offset.y=(1-s.repeat.y)/2):(s.repeat.x=t/e,s.repeat.y=1,s.offset.x=(1-s.repeat.x)/2,s.offset.y=0),s}function Lx(s,t){let e=s.image&&s.image.width?s.image.width/s.image.height:1;return e>t?(s.repeat.x=t/e,s.repeat.y=1,s.offset.x=(1-s.repeat.x)/2,s.offset.y=0):(s.repeat.x=1,s.repeat.y=e/t,s.offset.x=0,s.offset.y=(1-s.repeat.y)/2),s}function Dx(s){return s.repeat.x=1,s.repeat.y=1,s.offset.x=0,s.offset.y=0,s}function Pu(s,t,e,n){let i=Nx(n);switch(e){case Mu:return s*t;case vl:return s*t/i.components*i.byteLength;case Ca:return s*t/i.components*i.byteLength;case qi:return s*t*2/i.components*i.byteLength;case Ml:return s*t*2/i.components*i.byteLength;case Su:return s*t*3/i.components*i.byteLength;case gn:return s*t*4/i.components*i.byteLength;case Sl:return s*t*4/i.components*i.byteLength;case Pa:case Ia:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case La:case Da:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case El:case wl:return Math.max(s,16)*Math.max(t,8)/4;case bl:case Tl:return Math.max(s,8)*Math.max(t,8)/2;case Al:case Rl:case Pl:case Il:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case Cl:case Na:case Ll:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Dl:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case Nl:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case Ul:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case Ol:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case Fl:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case Bl:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case zl:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case kl:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case Gl:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case Vl:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case Hl:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case Wl:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case Xl:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case ql:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case Yl:case Zl:case $l:return Math.ceil(s/4)*Math.ceil(t/4)*16;case Jl:case Kl:return Math.ceil(s/4)*Math.ceil(t/4)*8;case Ua:case jl:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Nx(s){switch(s){case xn:case _u:return{byteLength:1,components:1};case ur:case xu:case qn:return{byteLength:2,components:1};case xl:case yl:return{byteLength:2,components:4};case Un:case _l:case ln:return{byteLength:4,components:1};case yu:case vu:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}var nu=class{static contain(t,e){return Ix(t,e)}static cover(t,e){return Lx(t,e)}static fill(t){return Dx(t)}static getByteLength(t,e,n,i){return Pu(t,e,n,i)}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"187"}}));typeof window<"u"&&(window.__THREE__?Rt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="187");function ng(){let s=null,t=!1,e=null,n=null;function i(r,a){n=s.requestAnimationFrame(i),e(r,a)}return{start:function(){t!==!0&&e!==null&&s!==null&&(n=s.requestAnimationFrame(i),t=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){s=r}}}function Ux(s){let t=new WeakMap;function e(o,l){let c=o.array,h=o.usage,u=c.byteLength,f=s.createBuffer();s.bindBuffer(l,f),s.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=s.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=s.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=s.HALF_FLOAT:d=s.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=s.SHORT;else if(c instanceof Uint32Array)d=s.UNSIGNED_INT;else if(c instanceof Int32Array)d=s.INT;else if(c instanceof Int8Array)d=s.BYTE;else if(c instanceof Uint8Array)d=s.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){let h=l.array,u=l.updateRanges;if(s.bindBuffer(c,o),u.length===0)s.bufferSubData(c,0,h);else{u.sort((d,p)=>d.start-p.start);let f=0;for(let d=1;d<u.length;d++){let p=u[f],_=u[d];_.start<=p.start+p.count+1?p.count=Math.max(p.count,_.start+_.count-p.start):(++f,u[f]=_)}u.length=f+1;for(let d=0,p=u.length;d<p;d++){let _=u[d];s.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(s.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:r,update:a}}var Ox=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Fx=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Bx=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,zx=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,kx=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Gx=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Vx=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Hx=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Wx=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Xx=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,qx=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Yx=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Zx=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,$x=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Jx=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Kx=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,jx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Qx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ty=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ey=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ny=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,iy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,sy=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,ry=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ay=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,oy=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ly=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,cy=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,hy=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,uy="gl_FragColor = linearToOutputTexel( gl_FragColor );",dy=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,fy=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,py=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,my=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,gy=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,_y=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,xy=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,yy=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,vy=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,My=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Sy=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,by=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Ey=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ty=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,wy=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Ay=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Ry=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Cy=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Py=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Iy=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ly=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Dy=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ny=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Uy=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Oy=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Fy=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,By=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,zy=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ky=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Gy=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Vy=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Hy=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Wy=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Xy=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,qy=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Yy=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Zy=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$y=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Jy=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ky=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,jy=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Qy=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,tv=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,ev=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,nv=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,iv=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,sv=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,rv=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,av=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ov=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,lv=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,cv=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,hv=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,uv=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,dv=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,fv=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,pv=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,mv=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,gv=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,_v=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,xv=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,yv=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,vv=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Mv=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Sv=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,bv=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Ev=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Tv=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,wv=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Av=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Rv=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Cv=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Pv=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Iv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Lv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Dv=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Nv=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Uv=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ov=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Fv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Bv=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kv=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Gv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Vv=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Hv=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Wv=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Xv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,qv=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Zv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$v=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Jv=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kv=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jv=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Qv=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,tM=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,eM=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,nM=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,iM=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,sM=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,rM=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,aM=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,oM=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,lM=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,cM=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,hM=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,uM=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,dM=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,fM=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,pM=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,te={alphahash_fragment:Ox,alphahash_pars_fragment:Fx,alphamap_fragment:Bx,alphamap_pars_fragment:zx,alphatest_fragment:kx,alphatest_pars_fragment:Gx,aomap_fragment:Vx,aomap_pars_fragment:Hx,batching_pars_vertex:Wx,batching_vertex:Xx,begin_vertex:qx,beginnormal_vertex:Yx,bsdfs:Zx,iridescence_fragment:$x,bumpmap_pars_fragment:Jx,clipping_planes_fragment:Kx,clipping_planes_pars_fragment:jx,clipping_planes_pars_vertex:Qx,clipping_planes_vertex:ty,color_fragment:ey,color_pars_fragment:ny,color_pars_vertex:iy,color_vertex:sy,common:ry,defaultnormal_vertex:ay,displacementmap_pars_vertex:oy,displacementmap_vertex:ly,emissivemap_fragment:cy,emissivemap_pars_fragment:hy,colorspace_fragment:uy,colorspace_pars_fragment:dy,envmap_fragment:fy,envmap_common_pars_fragment:py,envmap_pars_fragment:my,envmap_pars_vertex:gy,envmap_physical_pars_fragment:Ay,envmap_vertex:_y,fog_vertex:xy,fog_pars_vertex:yy,fog_fragment:vy,fog_pars_fragment:My,gradientmap_pars_fragment:Sy,lightmap_pars_fragment:by,lights_lambert_fragment:Ey,lights_lambert_pars_fragment:Ty,lights_pars_begin:wy,lights_toon_fragment:Ry,lights_toon_pars_fragment:Cy,lights_phong_fragment:Py,lights_phong_pars_fragment:Iy,lights_physical_fragment:Ly,lights_physical_pars_fragment:Dy,lights_fragment_begin:Ny,lights_fragment_maps:Uy,lights_fragment_end:Oy,lightprobes_pars_fragment:Fy,logdepthbuf_fragment:By,logdepthbuf_pars_fragment:zy,logdepthbuf_pars_vertex:ky,logdepthbuf_vertex:Gy,map_fragment:Vy,map_pars_fragment:Hy,map_particle_fragment:Wy,map_particle_pars_fragment:Xy,metalnessmap_fragment:qy,metalnessmap_pars_fragment:Yy,morphinstance_vertex:Zy,morphcolor_vertex:$y,morphnormal_vertex:Jy,morphtarget_pars_vertex:Ky,morphtarget_vertex:jy,normal_fragment_begin:Qy,normal_fragment_maps:tv,normal_pars_fragment:ev,normal_pars_vertex:nv,normal_vertex:iv,normalmap_pars_fragment:sv,clearcoat_normal_fragment_begin:rv,clearcoat_normal_fragment_maps:av,clearcoat_pars_fragment:ov,iridescence_pars_fragment:lv,opaque_fragment:cv,packing:hv,premultiplied_alpha_fragment:uv,project_vertex:dv,dithering_fragment:fv,dithering_pars_fragment:pv,roughnessmap_fragment:mv,roughnessmap_pars_fragment:gv,shadowmap_pars_fragment:_v,shadowmap_pars_vertex:xv,shadowmap_vertex:yv,shadowmask_pars_fragment:vv,skinbase_vertex:Mv,skinning_pars_vertex:Sv,skinning_vertex:bv,skinnormal_vertex:Ev,specularmap_fragment:Tv,specularmap_pars_fragment:wv,tonemapping_fragment:Av,tonemapping_pars_fragment:Rv,transmission_fragment:Cv,transmission_pars_fragment:Pv,uv_pars_fragment:Iv,uv_pars_vertex:Lv,uv_vertex:Dv,worldpos_vertex:Nv,background_vert:Uv,background_frag:Ov,backgroundCube_vert:Fv,backgroundCube_frag:Bv,cube_vert:zv,cube_frag:kv,depth_vert:Gv,depth_frag:Vv,distance_vert:Hv,distance_frag:Wv,equirect_vert:Xv,equirect_frag:qv,linedashed_vert:Yv,linedashed_frag:Zv,meshbasic_vert:$v,meshbasic_frag:Jv,meshlambert_vert:Kv,meshlambert_frag:jv,meshmatcap_vert:Qv,meshmatcap_frag:tM,meshnormal_vert:eM,meshnormal_frag:nM,meshphong_vert:iM,meshphong_frag:sM,meshphysical_vert:rM,meshphysical_frag:aM,meshtoon_vert:oM,meshtoon_frag:lM,points_vert:cM,points_frag:hM,shadow_vert:uM,shadow_frag:dM,sprite_vert:fM,sprite_frag:pM},Pt={common:{diffuse:{value:new Lt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new $t},alphaMap:{value:null},alphaMapTransform:{value:new $t},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new $t}},envmap:{envMap:{value:null},envMapRotation:{value:new $t},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new $t}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new $t}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new $t},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new $t},normalScale:{value:new ct(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new $t},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new $t}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new $t}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new $t}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Lt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Lt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new $t},alphaTest:{value:0},uvTransform:{value:new $t}},sprite:{diffuse:{value:new Lt(16777215)},opacity:{value:1},center:{value:new ct(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new $t},alphaMap:{value:null},alphaMapTransform:{value:new $t},alphaTest:{value:0}}},di={basic:{uniforms:hn([Pt.common,Pt.specularmap,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:hn([Pt.common,Pt.specularmap,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.fog,Pt.lights,{emissive:{value:new Lt(0)},envMapIntensity:{value:1}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:hn([Pt.common,Pt.specularmap,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.fog,Pt.lights,{emissive:{value:new Lt(0)},specular:{value:new Lt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:hn([Pt.common,Pt.envmap,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.roughnessmap,Pt.metalnessmap,Pt.fog,Pt.lights,{emissive:{value:new Lt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:hn([Pt.common,Pt.aomap,Pt.lightmap,Pt.emissivemap,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.gradientmap,Pt.fog,Pt.lights,{emissive:{value:new Lt(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:hn([Pt.common,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,Pt.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:hn([Pt.points,Pt.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:hn([Pt.common,Pt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:hn([Pt.common,Pt.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:hn([Pt.common,Pt.bumpmap,Pt.normalmap,Pt.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:hn([Pt.sprite,Pt.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new $t},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new $t}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distance:{uniforms:hn([Pt.common,Pt.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distance_vert,fragmentShader:te.distance_frag},shadow:{uniforms:hn([Pt.lights,Pt.fog,{color:{value:new Lt(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};di.physical={uniforms:hn([di.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new $t},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new $t},clearcoatNormalScale:{value:new ct(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new $t},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new $t},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new $t},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new $t},sheen:{value:0},sheenColor:{value:new Lt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new $t},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new $t},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new $t},transmissionSamplerSize:{value:new ct},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new $t},attenuationDistance:{value:0},attenuationColor:{value:new Lt(0)},specularColor:{value:new Lt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new $t},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new $t},anisotropyVector:{value:new ct},anisotropyMap:{value:null},anisotropyMapTransform:{value:new $t}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};var Iu={r:0,b:0,g:0},mM=new Zt,ig=new $t;ig.set(-1,0,0,0,1,0,0,0,1);function gM(s,t,e,n,i,r){let a=new Lt(0),o=i===!0?0:1,l,c,h=null,u=0,f=null;function d(y){let M=y.isScene===!0?y.background:null;if(M&&M.isTexture){let v=y.backgroundBlurriness>0;M=t.get(M,v)}return M}function p(y){let M=!1,v=d(y);v===null?m(a,o):v&&v.isColor&&(m(v,1),M=!0);let w=s.xr.getEnvironmentBlendMode();w==="additive"?e.buffers.color.setClear(0,0,0,1,r):w==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(s.autoClear||M)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function _(y,M){let v=d(M);v&&v.isCubeTexture?(c===void 0&&(c=new ue(new Tn(1,1,1),new Hn({name:"BackgroundCubeMaterial",uniforms:dr(di.backgroundCube.uniforms),vertexShader:di.backgroundCube.vertexShader,fragmentShader:di.backgroundCube.fragmentShader,side:$e,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(w,E,x){this.matrixWorld.copyPosition(x.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=M.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(mM.makeRotationFromEuler(M.backgroundRotation)).transpose(),v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(ig),c.material.toneMapped=ie.getTransfer(v.colorSpace)!==fe,(h!==v||u!==v.version||f!==s.toneMapping)&&(c.material.needsUpdate=!0,h=v,u=v.version,f=s.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new ue(new li(2,2),new Hn({name:"BackgroundMaterial",uniforms:dr(di.background.uniforms),vertexShader:di.background.vertexShader,fragmentShader:di.background.fragmentShader,side:Xi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=M.backgroundIntensity,l.material.toneMapped=ie.getTransfer(v.colorSpace)!==fe,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||u!==v.version||f!==s.toneMapping)&&(l.material.needsUpdate=!0,h=v,u=v.version,f=s.toneMapping),l.layers.enableAll(),y.unshift(l,l.geometry,l.material,0,0,null))}function m(y,M){y.getRGB(Iu,Af(s)),e.buffers.color.setClear(Iu.r,Iu.g,Iu.b,M,r)}function g(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(y,M=1){a.set(y),o=M,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(y){o=y,m(a,o)},render:p,addToRenderList:_,dispose:g}}function _M(s,t){let e=s.getParameter(s.MAX_VERTEX_ATTRIBS),n={},i=f(null),r=i,a=!1;function o(I,U,O,C,F){let H=!1,B=u(I,C,O,U);r!==B&&(r=B,c(r.object)),H=d(I,C,O,F),H&&p(I,C,O,F),F!==null&&t.update(F,s.ELEMENT_ARRAY_BUFFER),(H||a)&&(a=!1,v(I,U,O,C),F!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(F).buffer))}function l(){return s.createVertexArray()}function c(I){return s.bindVertexArray(I)}function h(I){return s.deleteVertexArray(I)}function u(I,U,O,C){let F=C.wireframe===!0,H=n[U.id];H===void 0&&(H={},n[U.id]=H);let B=I.isInstancedMesh===!0?I.id:0,Q=H[B];Q===void 0&&(Q={},H[B]=Q);let k=Q[O.id];k===void 0&&(k={},Q[O.id]=k);let tt=k[F];return tt===void 0&&(tt=f(l()),k[F]=tt),tt}function f(I){let U=[],O=[],C=[];for(let F=0;F<e;F++)U[F]=0,O[F]=0,C[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:O,attributeDivisors:C,object:I,attributes:{},index:null}}function d(I,U,O,C){let F=r.attributes,H=U.attributes,B=0,Q=O.getAttributes();for(let k in Q)if(Q[k].location>=0){let J=F[k],Z=H[k];if(Z===void 0&&(k==="instanceMatrix"&&I.instanceMatrix&&(Z=I.instanceMatrix),k==="instanceColor"&&I.instanceColor&&(Z=I.instanceColor)),J===void 0||J.attribute!==Z||Z&&J.data!==Z.data)return!0;B++}return r.attributesNum!==B||r.index!==C}function p(I,U,O,C){let F={},H=U.attributes,B=0,Q=O.getAttributes();for(let k in Q)if(Q[k].location>=0){let J=H[k];J===void 0&&(k==="instanceMatrix"&&I.instanceMatrix&&(J=I.instanceMatrix),k==="instanceColor"&&I.instanceColor&&(J=I.instanceColor));let Z={};Z.attribute=J,J&&J.data&&(Z.data=J.data),F[k]=Z,B++}r.attributes=F,r.attributesNum=B,r.index=C}function _(){let I=r.newAttributes;for(let U=0,O=I.length;U<O;U++)I[U]=0}function m(I){g(I,0)}function g(I,U){let O=r.newAttributes,C=r.enabledAttributes,F=r.attributeDivisors;O[I]=1,C[I]===0&&(s.enableVertexAttribArray(I),C[I]=1),F[I]!==U&&(s.vertexAttribDivisor(I,U),F[I]=U)}function y(){let I=r.newAttributes,U=r.enabledAttributes;for(let O=0,C=U.length;O<C;O++)U[O]!==I[O]&&(s.disableVertexAttribArray(O),U[O]=0)}function M(I,U,O,C,F,H,B){B===!0?s.vertexAttribIPointer(I,U,O,F,H):s.vertexAttribPointer(I,U,O,C,F,H)}function v(I,U,O,C){_();let F=C.attributes,H=O.getAttributes(),B=U.defaultAttributeValues;for(let Q in H){let k=H[Q];if(k.location>=0){let tt=F[Q];if(tt===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(tt=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(tt=I.instanceColor)),tt!==void 0){let J=tt.normalized,Z=tt.itemSize,ht=t.get(tt);if(ht===void 0)continue;let X=ht.buffer,q=ht.type,$=ht.bytesPerElement,lt=q===s.INT||q===s.UNSIGNED_INT||tt.gpuType===_l;if(tt.isInterleavedBufferAttribute){let Y=tt.data,W=Y.isInterleavedBuffer===!0?Y.stride:Y.itemSize,mt=tt.offset;if(Y.isInstancedInterleavedBuffer||Y.isInstancedBufferAttribute){for(let pt=0;pt<k.locationSize;pt++)g(k.location+pt,Y.meshPerAttribute);I.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=Y.meshPerAttribute*Y.count)}else for(let pt=0;pt<k.locationSize;pt++)m(k.location+pt);s.bindBuffer(s.ARRAY_BUFFER,X);for(let pt=0;pt<k.locationSize;pt++)M(k.location+pt,Z/k.locationSize,q,J,W*$,(mt+Z/k.locationSize*pt)*$,lt)}else{if(tt.isInstancedBufferAttribute){for(let Y=0;Y<k.locationSize;Y++)g(k.location+Y,tt.meshPerAttribute);I.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let Y=0;Y<k.locationSize;Y++)m(k.location+Y);s.bindBuffer(s.ARRAY_BUFFER,X);for(let Y=0;Y<k.locationSize;Y++)M(k.location+Y,Z/k.locationSize,q,J,Z*$,Z/k.locationSize*Y*$,lt)}}else if(B!==void 0){let J=B[Q];if(J!==void 0)switch(J.length){case 2:s.vertexAttrib2fv(k.location,J);break;case 3:s.vertexAttrib3fv(k.location,J);break;case 4:s.vertexAttrib4fv(k.location,J);break;default:s.vertexAttrib1fv(k.location,J)}}}}y()}function w(){P();for(let I in n){let U=n[I];for(let O in U){let C=U[O];for(let F in C){let H=C[F];for(let B in H)h(H[B].object),delete H[B];delete C[F]}}delete n[I]}}function E(I){if(n[I.id]===void 0)return;let U=n[I.id];for(let O in U){let C=U[O];for(let F in C){let H=C[F];for(let B in H)h(H[B].object),delete H[B];delete C[F]}}delete n[I.id]}function x(I){for(let U in n){let O=n[U];for(let C in O){let F=O[C];if(F[I.id]===void 0)continue;let H=F[I.id];for(let B in H)h(H[B].object),delete H[B];delete F[I.id]}}}function S(I){for(let U in n){let O=n[U],C=I.isInstancedMesh===!0?I.id:0,F=O[C];if(F!==void 0){for(let H in F){let B=F[H];for(let Q in B)h(B[Q].object),delete B[Q];delete F[H]}delete O[C],Object.keys(O).length===0&&delete n[U]}}}function P(){R(),a=!0,r!==i&&(r=i,c(r.object))}function R(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:P,resetDefaultState:R,dispose:w,releaseStatesOfGeometry:E,releaseStatesOfObject:S,releaseStatesOfProgram:x,initAttributes:_,enableAttribute:m,disableUnusedAttributes:y}}function xM(s,t,e){let n;function i(l){n=l}function r(l,c){s.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,h){h!==0&&(s.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let f=0;for(let d=0;d<h;d++)f+=c[d];e.update(f,n,1)}this.setMode=i,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function yM(s,t,e,n){let i;function r(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){let x=t.get("EXT_texture_filter_anisotropic");i=s.getParameter(x.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(x){return!(x!==gn&&n.convert(x)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(x){let S=x===qn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(x!==xn&&x!==ln&&!S&&n.convert(x)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE))}function l(x){if(x==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";x="mediump"}return x==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(Rt("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),f=e.logarithmicDepthBuffer===!0&&u===!1;e.reversedDepthBuffer===!0&&u===!1&&Rt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),e.logarithmicDepthBuffer===!0&&u===!0&&Rt("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");let d=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),p=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=s.getParameter(s.MAX_TEXTURE_SIZE),m=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),g=s.getParameter(s.MAX_VERTEX_ATTRIBS),y=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),M=s.getParameter(s.MAX_VARYING_VECTORS),v=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),w=s.getParameter(s.MAX_SAMPLES),E=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:d,maxVertexTextures:p,maxTextureSize:_,maxCubemapSize:m,maxAttributes:g,maxVertexUniforms:y,maxVaryings:M,maxFragmentUniforms:v,maxSamples:w,samples:E}}function vM(s){let t=this,e=null,n=0,i=!1,r=!1,a=new on,o=new $t,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||i;return i=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,d){let p=u.clippingPlanes,_=u.clipIntersection,m=u.clipShadows,g=s.get(u);if(!i||p===null||p.length===0||r&&!m)r?h(null):c();else{let y=r?0:n,M=y*4,v=g.clippingState||null;l.value=v,v=h(p,f,M,d);for(let w=0;w!==M;++w)v[w]=e[w];g.clippingState=v,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,d,p){let _=u!==null?u.length:0,m=null;if(_!==0){if(m=l.value,p!==!0||m===null){let g=d+_*4,y=f.matrixWorldInverse;o.getNormalMatrix(y),(m===null||m.length<g)&&(m=new Float32Array(g));for(let M=0,v=d;M!==_;++M,v+=4)a.copy(u[M]).applyMatrix4(y,o),a.normal.toArray(m,v),m[v+3]=a.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=_,t.numIntersection=0,m}}var Fa=class extends cn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new ls(i),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Tn(5,5,5),r=new Hn({name:"CubemapFromEquirect",uniforms:dr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:$e,blending:gs});r.uniforms.tEquirect.value=e;let a=new ue(i,r),o=e.minFilter;return e.minFilter===Xn&&(e.minFilter=Ee),new ar(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,i=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,i);t.setRenderTarget(r)}},Um=256,MM=3,SM=20,sg=256,rg=16,bM=3,EM=new L,TM=new Lt,fr=class s{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new ar(1,10,null),this._boxMesh=new ue(new Tn(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,n=.1,i=100,r={}){let{size:a=256,position:o=EM}=r,l=this._renderer;this._setSize(a);let c=this._allocateTarget(),h=this._getSourceTarget(!0);e>0&&(h.texture.mipmapsAutoUpdate=!1);let u=l.autoClear,f=l.autoClearColor,d=l.autoClearDepth,p=l.autoClearStencil,_=t.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,_===null&&(t.background=l.getClearColor(TM));let m=new ar(n,i,h);return m.position.copy(o),m.update(l,t),l.autoClear=u,l.autoClearColor=f,l.autoClearDepth=d,l.autoClearStencil=p,t.background=_,e>0&&(h.texture.mipmapsAutoUpdate=!0,this._blur(c,e)),this._applyPMREM(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bm(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Fm(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(Um,Tf(t))}_fromTexture(t,e){t.mapping===Si||t.mapping===xs?this._setSize(t.image.length===0?Um:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);let n=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(n),n}_allocateTarget(){let t=this._cubeSize,e=Om(t,!1,!1),n=Math.log2(t)-MM;for(let i=0;i<=n;i++)e.texture.mipmaps.push({width:t>>i,height:t>>i});return e.texture.name="PMREM",e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){let e=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==e||t&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Om(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,n){let i=this._boxMesh,r=this._cubeCamera;i.material=n,r.renderTarget=t,r.activeMipmapLevel=e;let a=t.width>>e;t.viewport.set(0,0,a,a),r.update(this._renderer,i),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===Si||t.mapping===xs?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bm()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Fm()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=wM(),this._integrationMaterial=AM());let e=this._cubeSize,n=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(e/rg);for(let a=0;a<=n;a++){let o=s.lodToRoughness(a,n);if(a>n-bM)r.roughness.value=o,this._renderCube(t,a,this._integrationMaterial);else{let l=o>0?Math.log2(e)+.5*Math.log2(6/(sg*Math.pow(o,4)))+.5:0;i.roughness.value=o,i.lodBias.value=l,this._renderCube(t,a,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=RM());let n=this._blurMaterial,i=n.uniforms,r=this._sourceTarget;i.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,i.envMap.value=r.texture,this._renderCube(t,0,n),i.envMap.value=t.texture,this._renderCube(r,0,n)}};function Om(s,t,e){return new Fa(s,{minFilter:Xn,generateMipmaps:t,type:qn,colorSpace:Hr,depthBuffer:e})}function sc(s,t,e){return new Hn({name:s,uniforms:t,vertexShader:te.cube_vert,fragmentShader:e,side:$e,blending:gs,depthTest:!1,depthWrite:!1})}function wM(){return sc("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${sg}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function AM(){return sc("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:rg}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function RM(){return sc("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${SM}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Fm(){return sc("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Bm(){return sc("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function CM(s){let t=new WeakMap,e=new WeakMap,n=null;function i(f,d=!1){return f==null?null:d?a(f):r(f)}function r(f){if(f&&f.isTexture){let d=f.mapping;if(d===wa||d===Aa)if(t.has(f)){let p=t.get(f).texture;return o(p,f.mapping)}else{let p=f.image;if(p&&p.height>0){let _=new Fa(p.height);return _.fromEquirectangularTexture(s,f),t.set(f,_),f.addEventListener("dispose",c),o(_.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture&&f.isPMREMTexture!==!0){let d=f.mapping,p=d===wa||d===Aa,_=d===Si||d===xs;if(p||_){let m=e.get(f),g=m!==void 0?m.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==g)return n===null&&(n=new fr(s)),m=p?n.fromEquirectangular(f,m):n.fromCubemap(f,m),m.texture.pmremVersion=f.pmremVersion,e.set(f,m),m.texture;if(m!==void 0)return m.texture;{let y=f.image;return p&&y&&y.height>0||_&&y&&l(y)?(n===null&&(n=new fr(s)),m=p?n.fromEquirectangular(f):n.fromCubemap(f),m.texture.pmremVersion=f.pmremVersion,e.set(f,m),f.addEventListener("dispose",h),m.texture):null}}}return f}function o(f,d){return d===wa?f.mapping=Si:d===Aa&&(f.mapping=xs),f}function l(f){let d=0,p=6;for(let _=0;_<p;_++)f[_]!==void 0&&d++;return d===p}function c(f){let d=f.target;d.removeEventListener("dispose",c);let p=t.get(d);p!==void 0&&(t.delete(d),p.dispose())}function h(f){let d=f.target;d.removeEventListener("dispose",h);let p=e.get(d);p!==void 0&&(e.delete(d),p.dispose())}function u(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:i,dispose:u}}function PM(s){let t={};function e(n){if(t[n]!==void 0)return t[n];let i=s.getExtension(n);return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let i=e(n);return i===null&&gi("WebGLRenderer: "+n+" extension not supported."),i}}}function IM(s,t,e,n){let i={},r=new WeakMap,a=new FinalizationRegistry(p=>delete i[p]);function o(p){l(p.target)}function l(p){p.index!==null&&t.remove(p.index);for(let m in p.attributes)t.remove(p.attributes[m]);p.removeEventListener("dispose",o),delete i[p.id],a.unregister(p);let _=r.get(p);_&&(t.remove(_),r.delete(p)),n.releaseStatesOfGeometry(p),p.isInstancedBufferGeometry===!0&&delete p._maxInstanceCount,e.memory.geometries--}function c(p,_){return i[_.id]!==void 0||(_.addEventListener("dispose",o),i[_.id]=new WeakRef(_),a.register(_,_.id,_),e.memory.geometries++),_}function h(p){let _=p.attributes;for(let m in _)t.update(_[m],s.ARRAY_BUFFER)}function u(p){let _=p.index,m=p.attributes.position,g=0;if(m===void 0)return;let y=_!==null?_.array.length:m.array.length/3-1,M=m.count>=65535?$r:Zr,v=new M(Math.ceil(y/3)*6,1),w=v.array;if(_!==null){let x=_.array;g=_.version;for(let S=0,P=0;S<y;S+=3){let R=x[S+0],I=x[S+1],U=x[S+2];w[P++]=R,w[P++]=I,w[P++]=I,w[P++]=U,w[P++]=U,w[P++]=R}}else{g=m.version;for(let x=0,S=0;x<y;x+=3){let P=x+0,R=x+1,I=x+2;w[S++]=P,w[S++]=R,w[S++]=R,w[S++]=I,w[S++]=I,w[S++]=P}}v.version=g;let E=r.get(p);E&&t.remove(E),r.set(p,v)}function f(p){let _=r.get(p);if(_){let m=p.index;m!==null&&_.version<m.version&&u(p)}else u(p);return r.get(p)}function d(){for(let p in i){let _=i[p].deref();_!==void 0&&l(_)}}return{get:c,update:h,getWireframeAttribute:f,dispose:d}}function LM(s,t,e){let n;function i(u){n=u}let r,a;function o(u){r=u.type,a=u.bytesPerElement}function l(u,f){s.drawElements(n,f,r,u*a),e.update(f,n,1)}function c(u,f,d){d!==0&&(s.drawElementsInstanced(n,f,r,u*a,d),e.update(f,n,d))}function h(u,f,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,u,0,d);let _=0;for(let m=0;m<d;m++)_+=f[m];e.update(_,n,1)}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function DM(s){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case s.TRIANGLES:e.triangles+=o*(r/3);break;case s.LINES:e.lines+=o*(r/2);break;case s.LINE_STRIP:e.lines+=o*(r-1);break;case s.LINE_LOOP:e.lines+=o*r;break;case s.POINTS:e.points+=o*r;break;default:Ht("WebGLInfo: Unknown draw mode:",a);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function NM(s,t,e){let n=new WeakMap,i=new _e;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0,f=n.get(o);if(f===void 0||f.count!==u){let P=function(){x.dispose(),n.delete(o),o.removeEventListener("dispose",P)};f!==void 0&&f.texture.dispose();let d=o.morphAttributes.position!==void 0,p=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],g=o.morphAttributes.normal||[],y=o.morphAttributes.color||[],M=0;d===!0&&(M=1),p===!0&&(M=2),_===!0&&(M=3);let v=o.attributes.position.count*M,w=1;v>t.maxTextureSize&&(w=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);let E=new Float32Array(v*w*4*u),x=new zs(E,v,w,u);x.type=ln,x.needsUpdate=!0;let S=M*4;for(let R=0;R<u;R++){let I=m[R],U=g[R],O=y[R],C=v*w*4*R;for(let F=0;F<I.count;F++){let H=F*S;d===!0&&(i.fromBufferAttribute(I,F),E[C+H+0]=i.x,E[C+H+1]=i.y,E[C+H+2]=i.z,E[C+H+3]=0),p===!0&&(i.fromBufferAttribute(U,F),E[C+H+4]=i.x,E[C+H+5]=i.y,E[C+H+6]=i.z,E[C+H+7]=0),_===!0&&(i.fromBufferAttribute(O,F),E[C+H+8]=i.x,E[C+H+9]=i.y,E[C+H+10]=i.z,E[C+H+11]=O.itemSize===4?i.w:1)}}f={count:u,texture:x,size:new ct(v,w)},n.set(o,f),o.addEventListener("dispose",P)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(s,"morphTexture",a.morphTexture,e);else{let d=0;for(let _=0;_<c.length;_++)d+=c[_];let p=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(s,"morphTargetBaseInfluence",p),l.getUniforms().setValue(s,"morphTargetInfluences",c)}l.getUniforms().setValue(s,"morphTargetsTexture",f.texture,e),l.getUniforms().setValue(s,"morphTargetsTextureSize",f.size)}return{update:r}}function UM(s,t,e,n,i){let r=new WeakMap;function a(c){let h=i.render.frame,u=c.geometry,f=t.get(c,u);if(r.get(f)!==h&&(t.update(f),r.set(f,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(e.update(c.instanceMatrix,s.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,s.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let d=c.skeleton;r.get(d)!==h&&(d.update(),r.set(d,h))}return f}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}var OM={[hu]:"LINEAR_TONE_MAPPING",[uu]:"REINHARD_TONE_MAPPING",[du]:"CINEON_TONE_MAPPING",[fu]:"ACES_FILMIC_TONE_MAPPING",[mu]:"AGX_TONE_MAPPING",[Ta]:"NEUTRAL_TONE_MAPPING",[pu]:"CUSTOM_TONE_MAPPING"};function FM(s,t,e,n,i,r){let a=new cn(t,e,{type:s,depthBuffer:i,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=null,h=new jt;h.setAttribute("position",new Ot([-1,3,0,-1,-1,0,3,-1,0],3)),h.setAttribute("uv",new Ot([0,2,0,0,2,0],2));let u=new da({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new ue(h,u),d=new rr(-1,1,1,-1,0,1),p=null,_=null,m=!1,g,y=null,M=[],v=!1;this.setSize=function(w,E){a.setSize(w,E),o!==null&&o.setSize(w,E),l!==null&&l.setSize(w,E);for(let x=0;x<M.length;x++){let S=M[x];S.setSize&&S.setSize(w,E)}},this.setEffects=function(w){M=w,v=M.length>0&&M[0].isRenderPass===!0;let E=a.width,x=a.height;M.length>0&&o===null&&(o=new cn(E,x,{type:qn,depthBuffer:!1,stencilBuffer:!1}),l=new cn(E,x,{type:qn,depthBuffer:!1,stencilBuffer:!1}));let S=i===!0&&M.some(P=>P.needsDepthTexture===!0);S!==(a.depthTexture!==null)&&(S===!0&&c===null&&(c=new yi(E,x),r===!0&&(c.format=bi,c.type=ys)),a.dispose(),a.depthTexture=S?c:null,a.resolveDepthBuffer=S,a.storeMultisampledDepthBuffer=S);for(let P=0;P<M.length;P++){let R=M[P];R.setSize&&R.setSize(E,x),S&&R.needsDepthTexture===!0&&R.setDepthTexture&&R.setDepthTexture(c)}},this.begin=function(w,E){if(m||w.toneMapping===ui&&M.length===0)return!1;if(y=E,E!==null){let x=E.width,S=E.height;(a.width!==x||a.height!==S)&&this.setSize(x,S)}return v===!1&&w.setRenderTarget(a),g=w.toneMapping,w.toneMapping=ui,!0},this.hasRenderPass=function(){return v},this.end=function(w,E){w.toneMapping=g,m=!0;let x=a,S=o;for(let P=0;P<M.length;P++){let R=M[P];R.enabled!==!1&&(R.render(w,S,x,E),R.needsSwap!==!1&&(x=S,S=S===o?l:o))}if(p!==w.outputColorSpace||_!==w.toneMapping){p=w.outputColorSpace,_=w.toneMapping,u.defines={},ie.getTransfer(p)===fe&&(u.defines.SRGB_TRANSFER="");let P=OM[_];P&&(u.defines[P]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=x.texture,w.setRenderTarget(y),w.render(f,d),y=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),h.dispose(),u.dispose()}}var ag=new Ie,og=new yi(1,1),lg=new ea(1),cg=new zs,hg=new ks,ug=new ls,zm=[],km=[],Gm=new Float32Array(16),Vm=new Float32Array(9),Hm=new Float32Array(4);function Ba(s,t,e){let n=s[0];if(n<=0||n>0)return s;let i=t*e,r=zm[i];if(r===void 0&&(r=new Float32Array(i),zm[i]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,s[a].toArray(r,o)}return r}function Ve(s,t){if(s.length!==t.length)return!1;for(let e=0,n=s.length;e<n;e++)if(s[e]!==t[e])return!1;return!0}function He(s,t){for(let e=0,n=t.length;e<n;e++)s[e]=t[e]}function Du(s,t){let e=km[t];e===void 0&&(e=new Int32Array(t),km[t]=e);for(let n=0;n!==t;++n)e[n]=s.allocateTextureUnit();return e}function BM(s,t){let e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function zM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ve(e,t))return;s.uniform2fv(this.addr,t),He(e,t)}}function kM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ve(e,t))return;s.uniform3fv(this.addr,t),He(e,t)}}function GM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ve(e,t))return;s.uniform4fv(this.addr,t),He(e,t)}}function VM(s,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ve(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),He(e,t)}else{if(Ve(e,n))return;Hm.set(n),s.uniformMatrix2fv(this.addr,!1,Hm),He(e,n)}}function HM(s,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ve(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),He(e,t)}else{if(Ve(e,n))return;Vm.set(n),s.uniformMatrix3fv(this.addr,!1,Vm),He(e,n)}}function WM(s,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ve(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),He(e,t)}else{if(Ve(e,n))return;Gm.set(n),s.uniformMatrix4fv(this.addr,!1,Gm),He(e,n)}}function XM(s,t){let e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function qM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ve(e,t))return;s.uniform2iv(this.addr,t),He(e,t)}}function YM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ve(e,t))return;s.uniform3iv(this.addr,t),He(e,t)}}function ZM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ve(e,t))return;s.uniform4iv(this.addr,t),He(e,t)}}function $M(s,t){let e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function JM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ve(e,t))return;s.uniform2uiv(this.addr,t),He(e,t)}}function KM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ve(e,t))return;s.uniform3uiv(this.addr,t),He(e,t)}}function jM(s,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ve(e,t))return;s.uniform4uiv(this.addr,t),He(e,t)}}function Nu(s){return s.version===0&&(s.compareFunction=wu,s.needsUpdate=!0),s}function QM(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_2D_SHADOW?r=Nu(og):r=ag,e.setTexture2D(t||r,i)}function tS(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||hg,i)}function eS(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i);let r;this.type===s.SAMPLER_CUBE_SHADOW?r=Nu(lg):r=ug,e.setTextureCube(t||r,i)}function nS(s,t,e){let n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(s.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||cg,i)}function iS(s){switch(s){case 5126:return BM;case 35664:return zM;case 35665:return kM;case 35666:return GM;case 35674:return VM;case 35675:return HM;case 35676:return WM;case 5124:case 35670:return XM;case 35667:case 35671:return qM;case 35668:case 35672:return YM;case 35669:case 35673:return ZM;case 5125:return $M;case 36294:return JM;case 36295:return KM;case 36296:return jM;case 35678:case 36198:case 36298:case 36306:case 35682:return QM;case 35679:case 36299:case 36307:return tS;case 35680:case 36300:case 36308:case 36293:return eS;case 36289:case 36303:case 36311:case 36292:return nS}}function sS(s,t){s.uniform1fv(this.addr,t)}function rS(s,t){let e=Ba(t,this.size,2);s.uniform2fv(this.addr,e)}function aS(s,t){let e=Ba(t,this.size,3);s.uniform3fv(this.addr,e)}function oS(s,t){let e=Ba(t,this.size,4);s.uniform4fv(this.addr,e)}function lS(s,t){let e=Ba(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function cS(s,t){let e=Ba(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function hS(s,t){let e=Ba(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function uS(s,t){s.uniform1iv(this.addr,t)}function dS(s,t){s.uniform2iv(this.addr,t)}function fS(s,t){s.uniform3iv(this.addr,t)}function pS(s,t){s.uniform4iv(this.addr,t)}function mS(s,t){s.uniform1uiv(this.addr,t)}function gS(s,t){s.uniform2uiv(this.addr,t)}function _S(s,t){s.uniform3uiv(this.addr,t)}function xS(s,t){s.uniform4uiv(this.addr,t)}function yS(s,t,e){let n=this.cache,i=t.length,r=Du(e,i);Ve(n,r)||(s.uniform1iv(this.addr,r),He(n,r));let a;this.type===s.SAMPLER_2D_SHADOW?a=Nu(og):a=ag;for(let o=0;o!==i;++o)e.setTexture2D(t[o]||a,r[o])}function vS(s,t,e){let n=this.cache,i=t.length,r=Du(e,i);Ve(n,r)||(s.uniform1iv(this.addr,r),He(n,r));for(let a=0;a!==i;++a)e.setTexture3D(t[a]||hg,r[a])}function MS(s,t,e){let n=this.cache,i=t.length,r=Du(e,i);Ve(n,r)||(s.uniform1iv(this.addr,r),He(n,r));let a;this.type===s.SAMPLER_CUBE_SHADOW?a=Nu(lg):a=ug;for(let o=0;o!==i;++o)e.setTextureCube(t[o]||a,r[o])}function SS(s,t,e){let n=this.cache,i=t.length,r=Du(e,i);Ve(n,r)||(s.uniform1iv(this.addr,r),He(n,r));for(let a=0;a!==i;++a)e.setTexture2DArray(t[a]||cg,r[a])}function bS(s){switch(s){case 5126:return sS;case 35664:return rS;case 35665:return aS;case 35666:return oS;case 35674:return lS;case 35675:return cS;case 35676:return hS;case 5124:case 35670:return uS;case 35667:case 35671:return dS;case 35668:case 35672:return fS;case 35669:case 35673:return pS;case 5125:return mS;case 36294:return gS;case 36295:return _S;case 36296:return xS;case 35678:case 36198:case 36298:case 36306:case 35682:return yS;case 35679:case 36299:case 36307:return vS;case 35680:case 36300:case 36308:case 36293:return MS;case 36289:case 36303:case 36311:case 36292:return SS}}var zf=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=iS(e.type)}},kf=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=bS(e.type)}},Gf=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let i=this.seq;for(let r=0,a=i.length;r!==a;++r){let o=i[r];o.setValue(t,e[o.id],n)}}},Ff=/(\w+)(\])?(\[|\.)?/g;function Wm(s,t){s.seq.push(t),s.map[t.id]=t}function ES(s,t,e){let n=s.name,i=n.length;for(Ff.lastIndex=0;;){let r=Ff.exec(n),a=Ff.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){Wm(e,c===void 0?new zf(o,s,t):new kf(o,s,t));break}else{let u=e.map[o];u===void 0&&(u=new Gf(o),Wm(e,u)),e=u}}}var Oa=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);ES(o,l,this)}let i=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?i.push(a):r.push(a);i.length>0&&(this.seq=i.concat(r))}setValue(t,e,n,i){let r=this.map[e];r!==void 0&&r.setValue(t,n,i)}setOptional(t,e,n){let i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,i)}}static seqWithValue(t,e){let n=[];for(let i=0,r=t.length;i!==r;++i){let a=t[i];a.id in e&&n.push(a)}return n}};function Xm(s,t,e){let n=s.createShader(t);return s.shaderSource(n,e),s.compileShader(n),n}var TS=37297,wS=0;function AS(s,t){let e=s.split(`
`),n=[],i=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=i;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var qm=new $t;function RS(s){ie._getMatrix(qm,ie.workingColorSpace,s);let t=`mat3( ${qm.elements.map(e=>e.toFixed(4))} )`;switch(ie.getTransfer(s)){case Wr:return[t,"LinearTransferOETF"];case fe:return[t,"sRGBTransferOETF"];default:return Rt("WebGLProgram: Unsupported color space: ",s),[t,"LinearTransferOETF"]}}function Ym(s,t,e){let n=s.getShaderParameter(t,s.COMPILE_STATUS),r=(s.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+AS(s.getShaderSource(t),o)}else return r}function CS(s,t){let e=RS(t);return[`vec4 ${s}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}var PS={[hu]:"Linear",[uu]:"Reinhard",[du]:"Cineon",[fu]:"ACESFilmic",[mu]:"AgX",[Ta]:"Neutral",[pu]:"Custom"};function IS(s,t){let e=PS[t];return e===void 0?(Rt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Lu=new L;function LS(){ie.getLuminanceCoefficients(Lu);let s=Lu.x.toFixed(4),t=Lu.y.toFixed(4),e=Lu.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function DS(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(nc).join(`
`)}function NS(s){let t=[];for(let e in s){let n=s[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function US(s,t){let e={},n=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){let r=s.getActiveAttrib(t,i),a=r.name,o=1;r.type===s.FLOAT_MAT2&&(o=2),r.type===s.FLOAT_MAT3&&(o=3),r.type===s.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:s.getAttribLocation(t,a),locationSize:o}}return e}function nc(s){return s!==""}function Zm(s,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function $m(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var OS=/^[ \t]*#include +<([\w\d./]+)>/gm;function Vf(s){return s.replace(OS,FS)}function FS(s,t){let e=te[t];if(e===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return Vf(e)}var BS=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Jm(s){return s.replace(BS,zS)}function zS(s,t,e,n){let i="";for(let r=parseInt(t);r<parseInt(e);r++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return i}function Km(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var kS={[ms]:"SHADOWMAP_TYPE_PCF",[lr]:"SHADOWMAP_TYPE_VSM"};function GS(s){return kS[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var VS={[xs]:"ENVMAP_MODE_REFRACTION"};function HS(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":VS[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}var WS={[Ea]:"ENVMAP_BLENDING_MULTIPLY",[cf]:"ENVMAP_BLENDING_MIX",[hf]:"ENVMAP_BLENDING_ADD"};function XS(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":WS[s.combine]||"ENVMAP_BLENDING_NONE"}function qS(s,t,e,n){let i=s.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=GS(e),c=e.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",h=HS(e),u=XS(e),f=DS(e),d=NS(r),p=i.createProgram(),_,m,g=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(_=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(nc).join(`
`),_.length>0&&(_+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d].filter(nc).join(`
`),m.length>0&&(m+=`
`)):(_=[Km(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+e.diffuseRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(nc).join(`
`),m=[Km(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,d,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",e.envMapPMREM?"#define ENVMAP_MAX_LOD "+e.envMapMaxLod+".0":"",e.envMapPMREM?"#define ENVMAP_SIZE "+e.envMapSize+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ui?"#define TONE_MAPPING":"",e.toneMapping!==ui?te.tonemapping_pars_fragment:"",e.toneMapping!==ui?IS("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,CS("linearToOutputTexel",e.outputColorSpace),LS(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(nc).join(`
`)),a=Vf(a),a=Zm(a,e),a=$m(a,e),o=Vf(o),o=Zm(o,e),o=$m(o,e),a=Jm(a),o=Jm(o),e.isRawShaderMaterial!==!0&&(g=`#version 300 es
`,_=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+_,m=["#define varying in",e.glslVersion===Au?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Au?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let y=g+_+a,M=g+m+o,v=Xm(i,i.VERTEX_SHADER,y),w=Xm(i,i.FRAGMENT_SHADER,M);i.attachShader(p,v),i.attachShader(p,w),e.index0AttributeName!==void 0?i.bindAttribLocation(p,0,e.index0AttributeName):e.hasPositionAttribute===!0&&i.bindAttribLocation(p,0,"position"),i.linkProgram(p);function E(R){if(s.debug.checkShaderErrors){let I=i.getProgramInfoLog(p)||"",U=i.getShaderInfoLog(v)||"",O=i.getShaderInfoLog(w)||"",C=I.trim(),F=U.trim(),H=O.trim(),B=!0,Q=!0;if(i.getProgramParameter(p,i.LINK_STATUS)===!1)if(B=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(i,p,v,w);else{let k=Ym(i,v,"vertex"),tt=Ym(i,w,"fragment");Ht("WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(p,i.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+C+`
`+k+`
`+tt)}else C!==""?Rt("WebGLProgram: Program Info Log:",C):(F===""||H==="")&&(Q=!1);Q&&(R.diagnostics={runnable:B,programLog:C,vertexShader:{log:F,prefix:_},fragmentShader:{log:H,prefix:m}})}i.deleteShader(v),i.deleteShader(w),x=new Oa(i,p),S=US(i,p)}let x;this.getUniforms=function(){return x===void 0&&E(this),x};let S;this.getAttributes=function(){return S===void 0&&E(this),S};let P=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=i.getProgramParameter(p,TS)),P},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(p),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=wS++,this.cacheKey=t,this.usedTimes=1,this.program=p,this.vertexShader=v,this.fragmentShader=w,this}var YS=0,Hf=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let i=this._getShaderCacheForMaterial(t);return i.has(e)===!1&&(i.add(e),e.usedTimes++),i.has(n)===!1&&(i.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Wf(t),e.set(t,n)),n}},Wf=class{constructor(t){this.id=YS++,this.code=t,this.usedTimes=0}};function ZS(s){return s===qi||s===Na||s===Ua}function $S(s,t,e,n,i,r){let a=new Gs,o=new Hf,l=new Set,c=[],h=new Map,u=n.logarithmicDepthBuffer,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function d(x){return l.add(x),x===0?"uv":`uv${x}`}function p(x,S,P,R,I,U){let O=R.fog,C=I.geometry,F=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?R.environment:null,H=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,B=t.get(x.envMap||F,H),Q=f[x.type],k=n.precision;x.precision!==null&&(k=n.getMaxPrecision(x.precision),k!==x.precision&&Rt("WebGLProgram.getParameters:",x.precision,"not supported, using",k,"instead."));let tt=C.morphAttributes.position||C.morphAttributes.normal||C.morphAttributes.color,J=tt!==void 0?tt.length:0,Z=0;C.morphAttributes.position!==void 0&&(Z=1),C.morphAttributes.normal!==void 0&&(Z=2),C.morphAttributes.color!==void 0&&(Z=3);let ht,X,q,$;if(Q){let It=di[Q];ht=It.vertexShader,X=It.fragmentShader}else{ht=x.vertexShader,X=x.fragmentShader;let It=o.getVertexShaderStage(x),xe=o.getFragmentShaderStage(x);o.update(x,It,xe),q=It.id,$=xe.id}let lt=s.getRenderTarget(),Y=s.state.buffers.depth.getReversed(),W=I.isInstancedMesh===!0,mt=I.isBatchedMesh===!0,pt=!!x.map,St=!!x.matcap,Ct=!!B,nt=Ct&&B.isPMREMTexture===!0,ft=!!x.aoMap,_t=!!x.lightMap,Dt=!!x.bumpMap&&x.wireframe===!1,Mt=!!x.normalMap,qt=!!x.displacementMap,Ft=!!x.emissiveMap,ee=!!x.metalnessMap,ne=!!x.roughnessMap,ae=x.anisotropy>0,V=x.clearcoat>0,Te=x.diffuseRoughness>0,Qt=x.dispersion>0,he=x.retroreflectivity>0,Et=x.iridescence>0,be=x.sheen>0,Nt=x.transmission>0,Wt=ae&&!!x.anisotropyMap,D=V&&!!x.clearcoatMap,T=V&&!!x.clearcoatNormalMap,K=V&&!!x.clearcoatRoughnessMap,xt=Te&&!!x.diffuseRoughnessMap,ut=Et&&!!x.iridescenceMap,vt=Et&&!!x.iridescenceThicknessMap,Tt=be&&!!x.sheenColorMap,at=be&&!!x.sheenRoughnessMap,ot=!!x.specularMap,bt=!!x.specularColorMap,b=!!x.specularIntensityMap,N=Nt&&!!x.transmissionMap,z=Nt&&!!x.thicknessMap,it=!!x.gradientMap,rt=!!x.alphaMap,dt=x.alphaTest>0,yt=!!x.alphaHash,Xt=!!x.extensions,gt=ui;x.toneMapped&&(lt===null||lt.isXRRenderTarget===!0)&&(gt=s.toneMapping);let Gt=nt?B.isCompressedCubeTexture?B.image[0].mipmaps:B.mipmaps:null,Jt={shaderID:Q,shaderType:x.type,shaderName:x.name,vertexShader:ht,fragmentShader:X,defines:x.defines,customVertexShaderID:q,customFragmentShaderID:$,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:k,batching:mt,batchingColor:mt&&I._colorsTexture!==null,instancing:W,instancingColor:W&&I.instanceColor!==null,instancingMorph:W&&I.morphTexture!==null,outputColorSpace:lt===null?s.outputColorSpace:lt.isXRRenderTarget===!0?lt.texture.colorSpace:ie.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:pt,matcap:St,envMap:Ct,envMapMode:Ct&&B.mapping,envMapPMREM:nt,envMapMaxLod:nt?Gt.length-1:null,envMapSize:nt?Gt[0].width:null,aoMap:ft,lightMap:_t,bumpMap:Dt,normalMap:Mt,displacementMap:qt,emissiveMap:Ft,normalMapObjectSpace:Mt&&x.normalMapType===gf,normalMapTangentSpace:Mt&&x.normalMapType===Ei,packedNormalMap:Mt&&x.normalMapType===Ei&&ZS(x.normalMap.format),metalnessMap:ee,roughnessMap:ne,anisotropy:ae,anisotropyMap:Wt,clearcoat:V,clearcoatMap:D,clearcoatNormalMap:T,clearcoatRoughnessMap:K,diffuseRoughness:Te,diffuseRoughnessMap:xt,dispersion:Qt,retroreflection:he,iridescence:Et,iridescenceMap:ut,iridescenceThicknessMap:vt,sheen:be,sheenColorMap:Tt,sheenRoughnessMap:at,specularMap:ot,specularColorMap:bt,specularIntensityMap:b,transmission:Nt,transmissionMap:N,thicknessMap:z,gradientMap:it,opaque:x.transparent===!1&&x.blending===cr&&x.alphaToCoverage===!1,alphaMap:rt,alphaTest:dt,alphaHash:yt,combine:x.combine,mapUv:pt&&d(x.map.channel),aoMapUv:ft&&d(x.aoMap.channel),lightMapUv:_t&&d(x.lightMap.channel),bumpMapUv:Dt&&d(x.bumpMap.channel),normalMapUv:Mt&&d(x.normalMap.channel),displacementMapUv:qt&&d(x.displacementMap.channel),emissiveMapUv:Ft&&d(x.emissiveMap.channel),metalnessMapUv:ee&&d(x.metalnessMap.channel),roughnessMapUv:ne&&d(x.roughnessMap.channel),anisotropyMapUv:Wt&&d(x.anisotropyMap.channel),clearcoatMapUv:D&&d(x.clearcoatMap.channel),clearcoatNormalMapUv:T&&d(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:K&&d(x.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:xt&&d(x.diffuseRoughnessMap.channel),iridescenceMapUv:ut&&d(x.iridescenceMap.channel),iridescenceThicknessMapUv:vt&&d(x.iridescenceThicknessMap.channel),sheenColorMapUv:Tt&&d(x.sheenColorMap.channel),sheenRoughnessMapUv:at&&d(x.sheenRoughnessMap.channel),specularMapUv:ot&&d(x.specularMap.channel),specularColorMapUv:bt&&d(x.specularColorMap.channel),specularIntensityMapUv:b&&d(x.specularIntensityMap.channel),transmissionMapUv:N&&d(x.transmissionMap.channel),thicknessMapUv:z&&d(x.thicknessMap.channel),alphaMapUv:rt&&d(x.alphaMap.channel),vertexTangents:!!C.attributes.tangent&&(Mt||ae),vertexNormals:!!C.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!C.attributes.color&&C.attributes.color.itemSize===4,pointsUvs:I.isPoints===!0&&!!C.attributes.uv&&(pt||rt),fog:!!O,useFog:x.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||C.attributes.normal===void 0&&Mt===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:Y,skinning:I.isSkinnedMesh===!0,hasPositionAttribute:C.attributes.position!==void 0,morphTargets:C.morphAttributes.position!==void 0,morphNormals:C.morphAttributes.normal!==void 0,morphColors:C.morphAttributes.color!==void 0,morphTargetsCount:J,morphTextureStride:Z,numSunLights:S.sun.length,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numSunLightShadows:S.sunShadowMap.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numLightProbeGrids:U.filter(It=>It.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:s.shadowMap.enabled&&P.length>0,shadowMapType:s.shadowMap.type,toneMapping:gt,decodeVideoTexture:pt&&x.map.isVideoTexture===!0&&ie.getTransfer(x.map.colorSpace)===fe,decodeVideoTextureEmissive:Ft&&x.emissiveMap.isVideoTexture===!0&&ie.getTransfer(x.emissiveMap.colorSpace)===fe,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===Nn,flipSided:x.side===$e,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:Xt&&x.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Xt&&x.extensions.multiDraw===!0||mt)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Jt.vertexUv1s=l.has(1),Jt.vertexUv2s=l.has(2),Jt.vertexUv3s=l.has(3),l.clear(),Jt}function _(x){let S=[];if(x.shaderID?S.push(x.shaderID):(S.push(x.customVertexShaderID),S.push(x.customFragmentShaderID)),x.defines!==void 0)for(let P in x.defines)S.push(P),S.push(x.defines[P]);return x.isRawShaderMaterial===!1&&(m(S,x),g(S,x),S.push(s.outputColorSpace)),S.push(x.customProgramCacheKey),S.join()}function m(x,S){x.push(S.precision),x.push(S.outputColorSpace),x.push(S.envMapMode),x.push(S.envMapPMREM),x.push(S.envMapMaxLod),x.push(S.envMapSize),x.push(S.mapUv),x.push(S.alphaMapUv),x.push(S.lightMapUv),x.push(S.aoMapUv),x.push(S.bumpMapUv),x.push(S.normalMapUv),x.push(S.displacementMapUv),x.push(S.emissiveMapUv),x.push(S.metalnessMapUv),x.push(S.roughnessMapUv),x.push(S.anisotropyMapUv),x.push(S.clearcoatMapUv),x.push(S.clearcoatNormalMapUv),x.push(S.clearcoatRoughnessMapUv),x.push(S.diffuseRoughnessMapUv),x.push(S.iridescenceMapUv),x.push(S.iridescenceThicknessMapUv),x.push(S.sheenColorMapUv),x.push(S.sheenRoughnessMapUv),x.push(S.specularMapUv),x.push(S.specularColorMapUv),x.push(S.specularIntensityMapUv),x.push(S.transmissionMapUv),x.push(S.thicknessMapUv),x.push(S.combine),x.push(S.fogExp2),x.push(S.sizeAttenuation),x.push(S.morphTargetsCount),x.push(S.numSunLights),x.push(S.numDirLights),x.push(S.numPointLights),x.push(S.numSpotLights),x.push(S.numSpotLightMaps),x.push(S.numHemiLights),x.push(S.numRectAreaLights),x.push(S.numSunLightShadows),x.push(S.numDirLightShadows),x.push(S.numPointLightShadows),x.push(S.numSpotLightShadows),x.push(S.numSpotLightShadowsWithMaps),x.push(S.numLightProbes),x.push(S.numLightProbeGrids),x.push(S.shadowMapType),x.push(S.toneMapping),x.push(S.numClippingPlanes),x.push(S.numClipIntersection),x.push(S.depthPacking)}function g(x,S){a.disableAll(),S.instancing&&a.enable(0),S.instancingColor&&a.enable(1),S.instancingMorph&&a.enable(2),S.matcap&&a.enable(3),S.envMap&&a.enable(4),S.normalMapObjectSpace&&a.enable(5),S.normalMapTangentSpace&&a.enable(6),S.clearcoat&&a.enable(7),S.iridescence&&a.enable(8),S.alphaTest&&a.enable(9),S.vertexColors&&a.enable(10),S.vertexAlphas&&a.enable(11),S.vertexUv1s&&a.enable(12),S.vertexUv2s&&a.enable(13),S.vertexUv3s&&a.enable(14),S.vertexTangents&&a.enable(15),S.anisotropy&&a.enable(16),S.alphaHash&&a.enable(17),S.batching&&a.enable(18),S.dispersion&&a.enable(19),S.retroreflection&&a.enable(24),S.diffuseRoughness&&a.enable(25),S.batchingColor&&a.enable(20),S.gradientMap&&a.enable(21),S.packedNormalMap&&a.enable(22),S.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reversedDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),S.numLightProbeGrids>0&&a.enable(22),S.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function y(x){let S=f[x.type],P;if(S){let R=di[S];P=Rf.clone(R.uniforms)}else P=x.uniforms;return P}function M(x,S){let P=h.get(S);return P!==void 0?++P.usedTimes:(P=new qS(s,S,x,i),c.push(P),h.set(S,P)),P}function v(x){if(--x.usedTimes===0){let S=c.indexOf(x);c[S]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function w(x){o.remove(x)}function E(){o.dispose()}return{getParameters:p,getProgramCacheKey:_,getUniforms:y,acquireProgram:M,releaseProgram:v,releaseShaderCache:w,programs:c,dispose:E}}function JS(){let s=new WeakMap;function t(a){return s.has(a)}function e(a){let o=s.get(a);return o===void 0&&(o={},s.set(a,o)),o}function n(a){s.delete(a)}function i(a,o,l){s.get(a)[o]=l}function r(){s=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:r}}function KS(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.materialVariant!==t.materialVariant?s.materialVariant-t.materialVariant:s.z!==t.z?s.z-t.z:s.id-t.id}function jm(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function Qm(){let s=[],t=0,e=[],n=[],i=[];function r(){t=0,e.length=0,n.length=0,i.length=0}function a(f){let d=0;return f.isInstancedMesh&&(d+=2),f.isSkinnedMesh&&(d+=1),d}function o(f,d,p,_,m,g){let y=s[t];return y===void 0?(y={id:f.id,object:f,geometry:d,material:p,materialVariant:a(f),groupOrder:_,renderOrder:f.renderOrder,z:m,group:g},s[t]=y):(y.id=f.id,y.object=f,y.geometry=d,y.material=p,y.materialVariant=a(f),y.groupOrder=_,y.renderOrder=f.renderOrder,y.z=m,y.group=g),t++,y}function l(f,d,p,_,m,g,y){y.reversedDepth===!0&&(m=-m);let M=o(f,d,p,_,m,g);p.transmission>0?n.push(M):p.transparent===!0?i.push(M):e.push(M)}function c(f,d,p,_,m,g){let y=o(f,d,p,_,m,g);p.transmission>0?n.unshift(y):p.transparent===!0?i.unshift(y):e.unshift(y)}function h(f,d){e.length>1&&e.sort(f||KS),n.length>1&&n.sort(d||jm),i.length>1&&i.sort(d||jm)}function u(){for(let f=t,d=s.length;f<d;f++){let p=s[f];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:i,init:r,push:l,unshift:c,finish:u,sort:h}}function jS(){let s=new WeakMap;function t(n,i){let r=s.get(n),a;return r===void 0?(a=new Qm,s.set(n,[a])):i>=r.length?(a=new Qm,r.push(a)):a=r[i],a}function e(){s=new WeakMap}return{get:t,dispose:e}}function QS(){let s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new L,color:new Lt};break;case"SpotLight":e={position:new L,direction:new L,color:new Lt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new L,color:new Lt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new L,skyColor:new Lt,groundColor:new Lt};break;case"RectAreaLight":e={color:new Lt,position:new L,halfWidth:new L,halfHeight:new L};break}return s[t.id]=e,e}}}function tb(){let s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ct,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}var eb=0;function nb(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function ib(s){let t=new QS,e=tb(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new L);let i=new L,r=new Zt,a=new Zt;function o(c){let h=0,u=0,f=0;for(let U=0;U<9;U++)n.probe[U].set(0,0,0);let d=0,p=0,_=0,m=0,g=0,y=0,M=0,v=0,w=0,E=0,x=0,S=0,P=0,R=0;c.sort(nb);for(let U=0,O=c.length;U<O;U++){let C=c[U],F=C.color,H=C.intensity,B=C.distance,Q=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===qi?Q=C.shadow.map.texture:Q=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)h+=F.r*H,u+=F.g*H,f+=F.b*H;else if(C.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(C.sh.coefficients[k],H);R++}else if(C.isSunLight){let k=t.get(C);if(k.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let tt=C.shadow,J=e.get(C);J.shadowIntensity=tt.intensity,J.shadowBias=tt.bias,J.shadowNormalBias=tt.normalBias,J.shadowRadius=tt.radius,J.shadowMapSize.copy(tt.mapSize).multiply(tt.getFrameExtents()),n.sunShadow[p]=J,n.sunShadowMap[p]=Q;let Z=tt.getViewportCount();for(let ht=0;ht<Z;ht++)n.sunShadowMatrix[_+ht]=tt.getMatrix(ht),n.sunShadowCascade[_+ht]=tt._cascadeData[ht];_+=Z,p++}n.sun[d]=k,d++}else if(C.isDirectionalLight){let k=t.get(C);if(k.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){let tt=C.shadow,J=e.get(C);J.shadowIntensity=tt.intensity,J.shadowBias=tt.bias,J.shadowNormalBias=tt.normalBias,J.shadowRadius=tt.radius,J.shadowMapSize=tt.mapSize,n.directionalShadow[m]=J,n.directionalShadowMap[m]=Q,n.directionalShadowMatrix[m]=C.shadow.matrix,w++}n.directional[m]=k,m++}else if(C.isSpotLight){let k=t.get(C);k.position.setFromMatrixPosition(C.matrixWorld),k.color.copy(F).multiplyScalar(H),k.distance=B,k.coneCos=Math.cos(C.angle),k.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),k.decay=C.decay,n.spot[y]=k;let tt=C.shadow;if(C.map&&(n.spotLightMap[S]=C.map,S++,tt.updateMatrices(C),C.castShadow&&P++),n.spotLightMatrix[y]=tt.matrix,C.castShadow){let J=e.get(C);J.shadowIntensity=tt.intensity,J.shadowBias=tt.bias,J.shadowNormalBias=tt.normalBias,J.shadowRadius=tt.radius,J.shadowMapSize=tt.mapSize,n.spotShadow[y]=J,n.spotShadowMap[y]=Q,x++}y++}else if(C.isRectAreaLight){let k=t.get(C);k.color.copy(F).multiplyScalar(H),k.halfWidth.set(C.width*.5,0,0),k.halfHeight.set(0,C.height*.5,0),n.rectArea[M]=k,M++}else if(C.isPointLight){let k=t.get(C);if(k.color.copy(C.color).multiplyScalar(C.intensity),k.distance=C.distance,k.decay=C.decay,C.castShadow){let tt=C.shadow,J=e.get(C);J.shadowIntensity=tt.intensity,J.shadowBias=tt.bias,J.shadowNormalBias=tt.normalBias,J.shadowRadius=tt.radius,J.shadowMapSize=tt.mapSize,J.shadowCameraNear=tt.camera.near,J.shadowCameraFar=tt.camera.far,n.pointShadow[g]=J,n.pointShadowMap[g]=Q,n.pointShadowMatrix[g]=C.shadow.matrix,E++}n.point[g]=k,g++}else if(C.isHemisphereLight){let k=t.get(C);k.skyColor.copy(C.color).multiplyScalar(H),k.groundColor.copy(C.groundColor).multiplyScalar(H),n.hemi[v]=k,v++}}M>0&&(s.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Pt.LTC_FLOAT_1,n.rectAreaLTC2=Pt.LTC_FLOAT_2):(n.rectAreaLTC1=Pt.LTC_HALF_1,n.rectAreaLTC2=Pt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=f;let I=n.hash;(I.sunLength!==d||I.directionalLength!==m||I.pointLength!==g||I.spotLength!==y||I.rectAreaLength!==M||I.hemiLength!==v||I.numSunShadows!==p||I.numDirectionalShadows!==w||I.numPointShadows!==E||I.numSpotShadows!==x||I.numSpotMaps!==S||I.numLightProbes!==R)&&(n.sun.length=d,n.directional.length=m,n.spot.length=y,n.rectArea.length=M,n.point.length=g,n.hemi.length=v,n.sunShadow.length=p,n.sunShadowMap.length=p,n.sunShadowMatrix.length=_,n.sunShadowCascade.length=_,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.directionalShadowMatrix.length=w,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=x,n.spotShadowMap.length=x,n.spotLightMatrix.length=x+S-P,n.spotLightMap.length=S,n.numSpotLightShadowsWithMaps=P,n.numLightProbes=R,I.sunLength=d,I.directionalLength=m,I.pointLength=g,I.spotLength=y,I.rectAreaLength=M,I.hemiLength=v,I.numSunShadows=p,I.numDirectionalShadows=w,I.numPointShadows=E,I.numSpotShadows=x,I.numSpotMaps=S,I.numLightProbes=R,n.version=eb++)}function l(c,h){let u=0,f=0,d=0,p=0,_=0,m=0,g=h.matrixWorldInverse;for(let y=0,M=c.length;y<M;y++){let v=c[y];if(v.isSunLight){let w=n.sun[u];w.direction.setFromMatrixPosition(v.matrixWorld),w.direction.transformDirection(g),u++}else if(v.isDirectionalLight){let w=n.directional[f];w.direction.setFromMatrixPosition(v.matrixWorld),i.setFromMatrixPosition(v.target.matrixWorld),w.direction.sub(i),w.direction.transformDirection(g),f++}else if(v.isSpotLight){let w=n.spot[p];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(g),w.direction.setFromMatrixPosition(v.matrixWorld),i.setFromMatrixPosition(v.target.matrixWorld),w.direction.sub(i),w.direction.transformDirection(g),p++}else if(v.isRectAreaLight){let w=n.rectArea[_];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(g),a.identity(),r.copy(v.matrixWorld),r.premultiply(g),a.extractRotation(r),w.halfWidth.set(v.width*.5,0,0),w.halfHeight.set(0,v.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),_++}else if(v.isPointLight){let w=n.point[d];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(g),d++}else if(v.isHemisphereLight){let w=n.hemi[m];w.direction.setFromMatrixPosition(v.matrixWorld),w.direction.transformDirection(g),m++}}}return{setup:o,setupView:l,state:n}}function tg(s){let t=new ib(s),e=[],n=[],i=[];function r(u){h.camera=u,e.length=0,n.length=0,i.length=0}function a(u){u.isLightProbeGrid?i.push(u):e.push(u)}function o(u){n.push(u)}function l(){t.setup(e),i.sort((u,f)=>u.priority-f.priority||u.id-f.id)}function c(u){t.setupView(e,u)}let h={lightsArray:e,shadowsArray:n,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:h,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function sb(s){let t=new WeakMap;function e(i,r=0){let a=t.get(i),o;return a===void 0?(o=new tg(s),t.set(i,[o])):r>=a.length?(o=new tg(s),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var rb=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ab=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,ob=[new L(1,0,0),new L(-1,0,0),new L(0,1,0),new L(0,-1,0),new L(0,0,1),new L(0,0,-1)],lb=[new L(0,-1,0),new L(0,-1,0),new L(0,0,1),new L(0,0,-1),new L(0,-1,0),new L(0,-1,0)],eg=new Zt,ec=new L,Bf=new L;function cb(s,t,e){let n=new xi,i=new ct,r=new ct,a=new _e,o=new fa,l=new pa,c={},h=e.maxTextureSize,u={[Xi]:$e,[$e]:Xi,[Nn]:Nn},f=new Hn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ct},radius:{value:4}},vertexShader:rb,fragmentShader:ab}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let p=new jt;p.setAttribute("position",new ve(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let _=new ue(p,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ms;let g=this.type;this.render=function(E,x,S){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||E.length===0)return;this.type===Hd&&(Rt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=ms);let P=s.getRenderTarget(),R=s.getActiveCubeFace(),I=s.getActiveMipmapLevel(),U=s.state;U.setBlending(gs),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let O=g!==this.type;O&&x.traverse(function(C){C.material&&(Array.isArray(C.material)?C.material.forEach(F=>F.needsUpdate=!0):C.material.needsUpdate=!0)});for(let C=0,F=E.length;C<F;C++){let H=E[C],B=H.shadow;if(B===void 0){Rt("WebGLShadowMap:",H,"has no shadow.");continue}if(B.autoUpdate===!1&&B.needsUpdate===!1)continue;i.copy(B.mapSize);let Q=B.getFrameExtents();i.multiply(Q),r.copy(B.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(r.x=Math.floor(h/Q.x),i.x=r.x*Q.x,B.mapSize.x=r.x),i.y>h&&(r.y=Math.floor(h/Q.y),i.y=r.y*Q.y,B.mapSize.y=r.y));let k=s.state.buffers.depth.getReversed();if(B.camera._reversedDepth=k,B.map===null||O===!0){if(B.map!==null&&(B.map.depthTexture!==null&&(B.map.depthTexture.dispose(),B.map.depthTexture=null),B.map.dispose()),this.type===lr){if(H.isPointLight){Rt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}B.map=new cn(i.x,i.y,{format:qi,type:qn,minFilter:Ee,magFilter:Ee,generateMipmaps:!1}),B.map.texture.name=H.name+".shadowMap",B.map.depthTexture=new yi(i.x,i.y,ln),B.map.depthTexture.name=H.name+".shadowMapDepth",B.map.depthTexture.format=_i,B.map.depthTexture.compareFunction=null,B.map.depthTexture.minFilter=Pe,B.map.depthTexture.magFilter=Pe}else H.isPointLight?(B.map=new Fa(i.x),B.map.depthTexture=new ea(i.x,Un)):(B.map=new cn(i.x,i.y),B.map.depthTexture=new yi(i.x,i.y,Un)),B.map.depthTexture.name=H.name+".shadowMap",B.map.depthTexture.format=_i,this.type===ms?(B.map.depthTexture.compareFunction=k?Tu:Eu,B.map.depthTexture.minFilter=Ee,B.map.depthTexture.magFilter=Ee):(B.map.depthTexture.compareFunction=null,B.map.depthTexture.minFilter=Pe,B.map.depthTexture.magFilter=Pe);B.camera.updateProjectionMatrix()}B.map.isWebGLCubeRenderTarget!==!0&&(B.map.width!==i.x||B.map.height!==i.y)&&B.map.setSize(i.x,i.y);let tt=B.map.isWebGLCubeRenderTarget?6:B.getViewportCount();H.isPointLight!==!0&&B.updateMatrices(H,S);let J=(B.camera.layers.mask&4294967294)!==0?B.camera.layers:S.layers;for(let Z=0;Z<tt;Z++){let ht=B.getCamera(Z);if(H.isPointLight){let X=B.camera,q=B.matrix,$=H.distance||X.far;$!==X.far&&(X.far=$,X.updateProjectionMatrix()),ec.setFromMatrixPosition(H.matrixWorld),X.position.copy(ec),Bf.copy(X.position),Bf.add(ob[Z]),X.up.copy(lb[Z]),X.lookAt(Bf),X.updateMatrixWorld(),q.makeTranslation(-ec.x,-ec.y,-ec.z),eg.multiplyMatrices(X.projectionMatrix,X.matrixWorldInverse),B._frustum.setFromProjectionMatrix(eg,X.coordinateSystem,X.reversedDepth)}if(B.map.isWebGLCubeRenderTarget)s.setRenderTarget(B.map,Z),s.clear();else{Z===0&&(s.setRenderTarget(B.map),s.clear());let X=B.getViewport(Z);a.set(r.x*X.x,r.y*X.y,r.x*X.z,r.y*X.w),U.viewport(a)}n=B.getFrustum(Z),v(x,S,ht,H,J,this.type)}B.isPointLightShadow!==!0&&this.type===lr&&y(B,S),B.needsUpdate=!1}g=this.type,m.needsUpdate=!1,s.setRenderTarget(P,R,I)};function y(E,x){let S=t.update(_);f.defines.VSM_SAMPLES!==E.blurSamples&&(f.defines.VSM_SAMPLES=E.blurSamples,d.defines.VSM_SAMPLES=E.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),E.mapPass===null?E.mapPass=new cn(i.x,i.y,{format:qi,type:qn}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),f.uniforms.shadow_pass.value=E.map.depthTexture,f.uniforms.resolution.value.set(E.map.width,E.map.height),f.uniforms.radius.value=E.radius,s.setRenderTarget(E.mapPass),s.clear(),s.renderBufferDirect(x,null,S,f,_,null),d.uniforms.shadow_pass.value=E.mapPass.texture,d.uniforms.resolution.value.set(E.map.width,E.map.height),d.uniforms.radius.value=E.radius,s.setRenderTarget(E.map),s.clear(),s.renderBufferDirect(x,null,S,d,_,null)}function M(E,x,S,P){let R=null,I=S.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(I!==void 0)R=I;else if(R=S.isPointLight===!0?l:o,s.localClippingEnabled&&x.clipShadows===!0&&Array.isArray(x.clippingPlanes)&&x.clippingPlanes.length!==0||x.displacementMap&&x.displacementScale!==0||x.alphaMap&&x.alphaTest>0||x.map&&x.alphaTest>0||x.alphaToCoverage===!0){let U=R.uuid,O=x.uuid,C=c[U];C===void 0&&(C={},c[U]=C);let F=C[O];F===void 0&&(F=R.clone(),C[O]=F,x.addEventListener("dispose",w)),R=F}if(R.visible=x.visible,R.wireframe=x.wireframe,P===lr?R.side=x.shadowSide!==null?x.shadowSide:x.side:R.side=x.shadowSide!==null?x.shadowSide:u[x.side],R.alphaMap=x.alphaMap,R.alphaTest=x.alphaToCoverage===!0?.5:x.alphaTest,R.map=x.map,R.clipShadows=x.clipShadows,R.clippingPlanes=x.clippingPlanes,R.clipIntersection=x.clipIntersection,R.displacementMap=x.displacementMap,R.displacementScale=x.displacementScale,R.displacementBias=x.displacementBias,R.wireframeLinewidth=x.wireframeLinewidth,R.linewidth=x.linewidth,S.isPointLight===!0&&R.isMeshDistanceMaterial===!0){let U=s.properties.get(R);U.light=S}return R}function v(E,x,S,P,R,I){if(E.visible===!1)return;if(E.layers.test(R)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&I===lr)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(S.matrixWorldInverse,E.matrixWorld);let C=t.update(E),F=E.material;if(Array.isArray(F)){let H=C.groups;for(let B=0,Q=H.length;B<Q;B++){let k=H[B],tt=F[k.materialIndex];if(tt&&tt.visible){let J=M(E,tt,P,I);E.onBeforeShadow(s,E,x,S,C,J,k),s.renderBufferDirect(S,null,C,J,E,k),E.onAfterShadow(s,E,x,S,C,J,k)}}}else if(F.visible){let H=M(E,F,P,I);E.onBeforeShadow(s,E,x,S,C,H,null),s.renderBufferDirect(S,null,C,H,E,null),E.onAfterShadow(s,E,x,S,C,H,null)}}let O=E.children;for(let C=0,F=O.length;C<F;C++)v(O[C],x,S,P,R,I)}function w(E){E.target.removeEventListener("dispose",w);for(let S in c){let P=c[S],R=E.target.uuid;R in P&&(P[R].dispose(),delete P[R])}}}function hb(s,t){function e(){let b=!1,N=new _e,z=null,it=new _e(0,0,0,0);return{setMask:function(rt){z!==rt&&!b&&(s.colorMask(rt,rt,rt,rt),z=rt)},setLocked:function(rt){b=rt},setClear:function(rt,dt,yt,Xt,gt){gt===!0&&(rt*=Xt,dt*=Xt,yt*=Xt),N.set(rt,dt,yt,Xt),it.equals(N)===!1&&(s.clearColor(rt,dt,yt,Xt),it.copy(N))},reset:function(){b=!1,z=null,it.set(-1,0,0,0)}}}function n(){let b=!1,N=!1,z=null,it=null,rt=null;return{setReversed:function(dt){if(N!==dt){let yt=t.get("EXT_clip_control");dt?yt.clipControlEXT(yt.LOWER_LEFT_EXT,yt.ZERO_TO_ONE_EXT):yt.clipControlEXT(yt.LOWER_LEFT_EXT,yt.NEGATIVE_ONE_TO_ONE_EXT),N=dt;let Xt=rt;rt=null,this.setClear(Xt)}},getReversed:function(){return N},setTest:function(dt){dt?Y(s.DEPTH_TEST):W(s.DEPTH_TEST)},setMask:function(dt){z!==dt&&!b&&(s.depthMask(dt),z=dt)},setFunc:function(dt){if(N&&(dt=Em[dt]),it!==dt){switch(dt){case lo:s.depthFunc(s.NEVER);break;case co:s.depthFunc(s.ALWAYS);break;case ho:s.depthFunc(s.LESS);break;case Fs:s.depthFunc(s.LEQUAL);break;case uo:s.depthFunc(s.EQUAL);break;case fo:s.depthFunc(s.GEQUAL);break;case po:s.depthFunc(s.GREATER);break;case mo:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}it=dt}},setLocked:function(dt){b=dt},setClear:function(dt){rt!==dt&&(rt=dt,N&&(dt=1-dt),s.clearDepth(dt))},reset:function(){b=!1,z=null,it=null,rt=null,N=!1}}}function i(){let b=!1,N=null,z=null,it=null,rt=null,dt=null,yt=null,Xt=null,gt=null;return{setTest:function(Gt){b||(Gt?Y(s.STENCIL_TEST):W(s.STENCIL_TEST))},setMask:function(Gt){N!==Gt&&!b&&(s.stencilMask(Gt),N=Gt)},setFunc:function(Gt,Jt,It){(z!==Gt||it!==Jt||rt!==It)&&(s.stencilFunc(Gt,Jt,It),z=Gt,it=Jt,rt=It)},setOp:function(Gt,Jt,It){(dt!==Gt||yt!==Jt||Xt!==It)&&(s.stencilOp(Gt,Jt,It),dt=Gt,yt=Jt,Xt=It)},setLocked:function(Gt){b=Gt},setClear:function(Gt){gt!==Gt&&(s.clearStencil(Gt),gt=Gt)},reset:function(){b=!1,N=null,z=null,it=null,rt=null,dt=null,yt=null,Xt=null,gt=null}}}let r=new e,a=new n,o=new i,l={},c=new WeakMap,h={},u={},f={},d=new WeakMap,p=[],_=null,m=!1,g=null,y=null,M=null,v=null,w=null,E=null,x=null,S=new Lt(0,0,0),P=0,R=!1,I=null,U=null,O=null,C=null,F=null,H=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS),B=!1,Q=0,k=s.getParameter(s.VERSION);k.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(k)[1]),B=Q>=1):k.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(k)[1]),B=Q>=2);let tt=null,J={},Z=s.getParameter(s.SCISSOR_BOX),ht=s.getParameter(s.VIEWPORT),X=new _e().fromArray(Z),q=new _e().fromArray(ht);function $(b,N,z,it){let rt=new Uint8Array(4),dt=s.createTexture();s.bindTexture(b,dt),s.texParameteri(b,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(b,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let yt=0;yt<z;yt++)b===s.TEXTURE_3D||b===s.TEXTURE_2D_ARRAY?s.texImage3D(N,0,s.RGBA,1,1,it,0,s.RGBA,s.UNSIGNED_BYTE,rt):s.texImage2D(N+yt,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,rt);return dt}let lt={};lt[s.TEXTURE_2D]=$(s.TEXTURE_2D,s.TEXTURE_2D,1),lt[s.TEXTURE_CUBE_MAP]=$(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),lt[s.TEXTURE_2D_ARRAY]=$(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),lt[s.TEXTURE_3D]=$(s.TEXTURE_3D,s.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),Y(s.DEPTH_TEST),a.setFunc(Fs),Dt(!1),Mt(su),Y(s.CULL_FACE),ft(gs);function Y(b){h[b]!==!0&&(s.enable(b),h[b]=!0)}function W(b){h[b]!==!1&&(s.disable(b),h[b]=!1)}function mt(b,N){return f[b]!==N?(s.bindFramebuffer(b,N),f[b]=N,b===s.DRAW_FRAMEBUFFER&&(f[s.FRAMEBUFFER]=N),b===s.FRAMEBUFFER&&(f[s.DRAW_FRAMEBUFFER]=N),!0):!1}function pt(b,N){let z=p,it=!1;if(b){z=d.get(N),z===void 0&&(z=[],d.set(N,z));let rt=b.textures;if(z.length!==rt.length||z[0]!==s.COLOR_ATTACHMENT0){for(let dt=0,yt=rt.length;dt<yt;dt++)z[dt]=s.COLOR_ATTACHMENT0+dt;z.length=rt.length,it=!0}}else z[0]!==s.BACK&&(z[0]=s.BACK,it=!0);it&&s.drawBuffers(z)}function St(b){return _!==b?(s.useProgram(b),_=b,!0):!1}let Ct={[_s]:s.FUNC_ADD,[Xd]:s.FUNC_SUBTRACT,[qd]:s.FUNC_REVERSE_SUBTRACT};Ct[Yd]=s.MIN,Ct[Zd]=s.MAX;let nt={[$d]:s.ZERO,[Jd]:s.ONE,[Kd]:s.SRC_COLOR,[lu]:s.SRC_ALPHA,[sf]:s.SRC_ALPHA_SATURATE,[ef]:s.DST_COLOR,[Qd]:s.DST_ALPHA,[jd]:s.ONE_MINUS_SRC_COLOR,[cu]:s.ONE_MINUS_SRC_ALPHA,[nf]:s.ONE_MINUS_DST_COLOR,[tf]:s.ONE_MINUS_DST_ALPHA,[rf]:s.CONSTANT_COLOR,[af]:s.ONE_MINUS_CONSTANT_COLOR,[of]:s.CONSTANT_ALPHA,[lf]:s.ONE_MINUS_CONSTANT_ALPHA};function ft(b,N,z,it,rt,dt,yt,Xt,gt,Gt){if(b===gs){m===!0&&(W(s.BLEND),m=!1);return}if(m===!1&&(Y(s.BLEND),m=!0),b!==Wd){if(b!==g||Gt!==R){if((y!==_s||w!==_s)&&(s.blendEquation(s.FUNC_ADD),y=_s,w=_s),Gt)switch(b){case cr:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case ru:s.blendFunc(s.ONE,s.ONE);break;case au:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case ou:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:Ht("WebGLState: Invalid blending: ",b);break}else switch(b){case cr:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case ru:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case au:Ht("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case ou:Ht("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Ht("WebGLState: Invalid blending: ",b);break}M=null,v=null,E=null,x=null,S.set(0,0,0),P=0,g=b,R=Gt}return}rt=rt||N,dt=dt||z,yt=yt||it,(N!==y||rt!==w)&&(s.blendEquationSeparate(Ct[N],Ct[rt]),y=N,w=rt),(z!==M||it!==v||dt!==E||yt!==x)&&(s.blendFuncSeparate(nt[z],nt[it],nt[dt],nt[yt]),M=z,v=it,E=dt,x=yt),(Xt.equals(S)===!1||gt!==P)&&(s.blendColor(Xt.r,Xt.g,Xt.b,gt),S.copy(Xt),P=gt),g=b,R=!1}function _t(b,N){b.side===Nn?W(s.CULL_FACE):Y(s.CULL_FACE);let z=b.side===$e;N&&(z=!z),Dt(z),b.blending===cr&&b.transparent===!1?ft(gs):ft(b.blending,b.blendEquation,b.blendSrc,b.blendDst,b.blendEquationAlpha,b.blendSrcAlpha,b.blendDstAlpha,b.blendColor,b.blendAlpha,b.premultipliedAlpha),a.setFunc(b.depthFunc),a.setTest(b.depthTest),a.setMask(b.depthWrite),r.setMask(b.colorWrite);let it=b.stencilWrite;o.setTest(it),it&&(o.setMask(b.stencilWriteMask),o.setFunc(b.stencilFunc,b.stencilRef,b.stencilFuncMask),o.setOp(b.stencilFail,b.stencilZFail,b.stencilZPass)),Ft(b.polygonOffset,b.polygonOffsetFactor,b.polygonOffsetUnits),b.alphaToCoverage===!0?Y(s.SAMPLE_ALPHA_TO_COVERAGE):W(s.SAMPLE_ALPHA_TO_COVERAGE)}function Dt(b){I!==b&&(b?s.frontFace(s.CW):s.frontFace(s.CCW),I=b)}function Mt(b){b!==Gd?(Y(s.CULL_FACE),b!==U&&(b===su?s.cullFace(s.BACK):b===Vd?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):W(s.CULL_FACE),U=b}function qt(b){b!==O&&(B&&s.lineWidth(b),O=b)}function Ft(b,N,z){b?(Y(s.POLYGON_OFFSET_FILL),(C!==N||F!==z)&&(C=N,F=z,a.getReversed()&&(N=-N,z=-z),s.polygonOffset(N,z))):W(s.POLYGON_OFFSET_FILL)}function ee(b){b?Y(s.SCISSOR_TEST):W(s.SCISSOR_TEST)}function ne(b){b===void 0&&(b=s.TEXTURE0+H-1),tt!==b&&(s.activeTexture(b),tt=b)}function ae(b,N,z){z===void 0&&(tt===null?z=s.TEXTURE0+H-1:z=tt);let it=J[z];it===void 0&&(it={type:void 0,texture:void 0},J[z]=it),(it.type!==b||it.texture!==N)&&(tt!==z&&(s.activeTexture(z),tt=z),s.bindTexture(b,N||lt[b]),it.type=b,it.texture=N)}function V(){let b=J[tt];b!==void 0&&b.type!==void 0&&(s.bindTexture(b.type,null),b.type=void 0,b.texture=void 0)}function Te(){try{s.compressedTexImage2D(...arguments)}catch(b){Ht("WebGLState:",b)}}function Qt(){try{s.compressedTexImage3D(...arguments)}catch(b){Ht("WebGLState:",b)}}function he(){try{s.texSubImage2D(...arguments)}catch(b){Ht("WebGLState:",b)}}function Et(){try{s.texSubImage3D(...arguments)}catch(b){Ht("WebGLState:",b)}}function be(){try{s.compressedTexSubImage2D(...arguments)}catch(b){Ht("WebGLState:",b)}}function Nt(){try{s.compressedTexSubImage3D(...arguments)}catch(b){Ht("WebGLState:",b)}}function Wt(){try{s.texStorage2D(...arguments)}catch(b){Ht("WebGLState:",b)}}function D(){try{s.texStorage3D(...arguments)}catch(b){Ht("WebGLState:",b)}}function T(){try{s.texImage2D(...arguments)}catch(b){Ht("WebGLState:",b)}}function K(){try{s.texImage3D(...arguments)}catch(b){Ht("WebGLState:",b)}}function xt(b){return u[b]!==void 0?u[b]:s.getParameter(b)}function ut(b,N){u[b]!==N&&(s.pixelStorei(b,N),u[b]=N)}function vt(b){X.equals(b)===!1&&(s.scissor(b.x,b.y,b.z,b.w),X.copy(b))}function Tt(b){q.equals(b)===!1&&(s.viewport(b.x,b.y,b.z,b.w),q.copy(b))}function at(b,N){let z=c.get(N);z===void 0&&(z=new WeakMap,c.set(N,z));let it=z.get(b);it===void 0&&(it=s.getUniformBlockIndex(N,b.name),s.uniformBlockBinding(N,it,it),z.set(b,it))}function ot(b,N,z){let rt=c.get(N).get(b);l[rt]!==z&&(s.bindBufferBase(s.UNIFORM_BUFFER,rt,z),l[rt]=z)}function bt(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),a.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),h={},u={},tt=null,J={},f={},l={},d=new WeakMap,p=[],_=null,m=!1,g=null,y=null,M=null,v=null,w=null,E=null,x=null,S=new Lt(0,0,0),P=0,R=!1,I=null,U=null,O=null,C=null,F=null,X.set(0,0,s.canvas.width,s.canvas.height),q.set(0,0,s.canvas.width,s.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:Y,disable:W,bindFramebuffer:mt,drawBuffers:pt,useProgram:St,setBlending:ft,setMaterial:_t,setFlipSided:Dt,setCullFace:Mt,setLineWidth:qt,setPolygonOffset:Ft,setScissorTest:ee,activeTexture:ne,bindTexture:ae,unbindTexture:V,compressedTexImage2D:Te,compressedTexImage3D:Qt,texImage2D:T,texImage3D:K,pixelStorei:ut,getParameter:xt,updateUBOMapping:at,uniformBlockBinding:ot,texStorage2D:Wt,texStorage3D:D,texSubImage2D:he,texSubImage3D:Et,compressedTexSubImage2D:be,compressedTexSubImage3D:Nt,scissor:vt,viewport:Tt,reset:bt}}function ub(s,t,e,n,i,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ct,h=new WeakMap,u=new Set,f,d=new WeakMap,p=new Set,_=new FinalizationRegistry(D=>p.delete(D)),m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(D,T){return m?new OffscreenCanvas(D,T):Xr("canvas")}function y(D,T,K){let xt=1,ut=Wt(D);if((ut.width>K||ut.height>K)&&(xt=K/Math.max(ut.width,ut.height)),xt<1)if(typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&D instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&D instanceof ImageBitmap||typeof VideoFrame<"u"&&D instanceof VideoFrame){let vt=Math.floor(xt*ut.width),Tt=Math.floor(xt*ut.height);f===void 0&&(f=g(vt,Tt));let at=T?g(vt,Tt):f;return at.width=vt,at.height=Tt,at.getContext("2d").drawImage(D,0,0,vt,Tt),Rt("WebGLRenderer: Texture has been resized from ("+ut.width+"x"+ut.height+") to ("+vt+"x"+Tt+")."),at}else return"data"in D&&Rt("WebGLRenderer: Image in DataTexture is too big ("+ut.width+"x"+ut.height+")."),D;return D}function M(D){return D.generateMipmaps}function v(D){s.generateMipmap(D)}function w(D){return D.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:D.isWebGL3DRenderTarget?s.TEXTURE_3D:D.isWebGLArrayRenderTarget||D.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function E(D,T,K,xt,ut,vt=!1){if(D!==null){if(s[D]!==void 0)return s[D];Rt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+D+"'")}let Tt;xt&&(Tt=t.get("EXT_texture_norm16"),Tt||Rt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let at=T;if(T===s.RED&&(K===s.FLOAT&&(at=s.R32F),K===s.HALF_FLOAT&&(at=s.R16F),K===s.UNSIGNED_BYTE&&(at=s.R8),K===s.UNSIGNED_SHORT&&Tt&&(at=Tt.R16_EXT),K===s.SHORT&&Tt&&(at=Tt.R16_SNORM_EXT)),T===s.RED_INTEGER&&(K===s.UNSIGNED_BYTE&&(at=s.R8UI),K===s.UNSIGNED_SHORT&&(at=s.R16UI),K===s.UNSIGNED_INT&&(at=s.R32UI),K===s.BYTE&&(at=s.R8I),K===s.SHORT&&(at=s.R16I),K===s.INT&&(at=s.R32I)),T===s.RG&&(K===s.FLOAT&&(at=s.RG32F),K===s.HALF_FLOAT&&(at=s.RG16F),K===s.UNSIGNED_BYTE&&(at=s.RG8),K===s.UNSIGNED_SHORT&&Tt&&(at=Tt.RG16_EXT),K===s.SHORT&&Tt&&(at=Tt.RG16_SNORM_EXT)),T===s.RG_INTEGER&&(K===s.UNSIGNED_BYTE&&(at=s.RG8UI),K===s.UNSIGNED_SHORT&&(at=s.RG16UI),K===s.UNSIGNED_INT&&(at=s.RG32UI),K===s.BYTE&&(at=s.RG8I),K===s.SHORT&&(at=s.RG16I),K===s.INT&&(at=s.RG32I)),T===s.RGB_INTEGER&&(K===s.UNSIGNED_BYTE&&(at=s.RGB8UI),K===s.UNSIGNED_SHORT&&(at=s.RGB16UI),K===s.UNSIGNED_INT&&(at=s.RGB32UI),K===s.BYTE&&(at=s.RGB8I),K===s.SHORT&&(at=s.RGB16I),K===s.INT&&(at=s.RGB32I)),T===s.RGBA_INTEGER&&(K===s.UNSIGNED_BYTE&&(at=s.RGBA8UI),K===s.UNSIGNED_SHORT&&(at=s.RGBA16UI),K===s.UNSIGNED_INT&&(at=s.RGBA32UI),K===s.BYTE&&(at=s.RGBA8I),K===s.SHORT&&(at=s.RGBA16I),K===s.INT&&(at=s.RGBA32I)),T===s.RGB&&(K===s.UNSIGNED_SHORT&&Tt&&(at=Tt.RGB16_EXT),K===s.SHORT&&Tt&&(at=Tt.RGB16_SNORM_EXT),K===s.UNSIGNED_INT_5_9_9_9_REV&&(at=s.RGB9_E5),K===s.UNSIGNED_INT_10F_11F_11F_REV&&(at=s.R11F_G11F_B10F)),T===s.RGBA){let ot=vt?Wr:ie.getTransfer(ut);K===s.FLOAT&&(at=s.RGBA32F),K===s.HALF_FLOAT&&(at=s.RGBA16F),K===s.UNSIGNED_BYTE&&(at=ot===fe?s.SRGB8_ALPHA8:s.RGBA8),K===s.UNSIGNED_SHORT&&Tt&&(at=Tt.RGBA16_EXT),K===s.SHORT&&Tt&&(at=Tt.RGBA16_SNORM_EXT),K===s.UNSIGNED_SHORT_4_4_4_4&&(at=s.RGBA4),K===s.UNSIGNED_SHORT_5_5_5_1&&(at=s.RGB5_A1)}return(at===s.R16F||at===s.R32F||at===s.RG16F||at===s.RG32F||at===s.RGBA16F||at===s.RGBA32F)&&t.get("EXT_color_buffer_float"),at}function x(D,T){let K;return D?T===null||T===Un||T===ys?K=s.DEPTH24_STENCIL8:T===ln?K=s.DEPTH32F_STENCIL8:T===ur&&(K=s.DEPTH24_STENCIL8,Rt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):T===null||T===Un||T===ys?K=s.DEPTH_COMPONENT24:T===ln?K=s.DEPTH_COMPONENT32F:T===ur&&(K=s.DEPTH_COMPONENT16),K}function S(D,T){return M(D)===!0||D.isFramebufferTexture&&D.minFilter!==Pe&&D.minFilter!==Ee?Math.log2(Math.max(T.width,T.height))+1:D.mipmaps.length>0?D.mipmaps.length:D.isCompressedTexture&&Array.isArray(D.image)?T.mipmaps.length:1}function P(D){let T=new WeakRef(D);n.get(D).__ref=T,p.add(T),_.register(D,T,T)}function R(D){let T=n.get(D).__ref;T!==void 0&&(p.delete(T),_.unregister(T))}function I(D){O(D.target)}function U(D){C(D.target)}function O(D){D.removeEventListener("dispose",I),R(D),H(D),D.isVideoTexture&&h.delete(D),D.isHTMLTexture&&u.delete(D)}function C(D){D.removeEventListener("dispose",U),R(D),Q(D)}function F(){for(let D of p){let T=D.deref();T!==void 0&&(T.isRenderTarget===!0?C(T):O(T))}p.clear(),u.clear()}function H(D){let T=n.get(D);if(T.__webglInit===void 0)return;let K=D.source,xt=d.get(K);if(xt){let ut=xt[T.__cacheKey];ut.usedTimes--,ut.usedTimes===0&&B(D),Object.keys(xt).length===0&&d.delete(K)}n.remove(D)}function B(D){let T=n.get(D);s.deleteTexture(T.__webglTexture);let K=D.source,xt=d.get(K);delete xt[T.__cacheKey],a.memory.textures--}function Q(D){let T=n.get(D);T.__depthDisposeCallback&&T.__depthDisposeCallback();let K=D.depthTexture;if(K&&K.renderTarget===D&&O(K),D.isWebGLCubeRenderTarget)for(let ut=0;ut<6;ut++){if(Array.isArray(T.__webglFramebuffer[ut]))for(let vt=0;vt<T.__webglFramebuffer[ut].length;vt++)s.deleteFramebuffer(T.__webglFramebuffer[ut][vt]);else s.deleteFramebuffer(T.__webglFramebuffer[ut]);T.__webglDepthbuffer&&s.deleteRenderbuffer(T.__webglDepthbuffer[ut])}else{if(Array.isArray(T.__webglFramebuffer))for(let ut=0;ut<T.__webglFramebuffer.length;ut++)s.deleteFramebuffer(T.__webglFramebuffer[ut]);else s.deleteFramebuffer(T.__webglFramebuffer);if(T.__webglDepthbuffer&&s.deleteRenderbuffer(T.__webglDepthbuffer),T.__webglMultisampledFramebuffer&&s.deleteFramebuffer(T.__webglMultisampledFramebuffer),T.__webglColorRenderbuffer)for(let ut=0;ut<T.__webglColorRenderbuffer.length;ut++)T.__webglColorRenderbuffer[ut]&&s.deleteRenderbuffer(T.__webglColorRenderbuffer[ut]);T.__webglDepthRenderbuffer&&s.deleteRenderbuffer(T.__webglDepthRenderbuffer)}let xt=D.textures;for(let ut=0,vt=xt.length;ut<vt;ut++){let Tt=n.get(xt[ut]);Tt.__webglTexture&&(s.deleteTexture(Tt.__webglTexture),a.memory.textures--),n.remove(xt[ut])}n.remove(D)}let k=0;function tt(){k=0}function J(){return k}function Z(D){k=D}function ht(){let D=k;return D>=i.maxTextures&&Rt("WebGLTextures: Trying to use "+(D+1)+" texture units while this GPU supports only "+i.maxTextures),k+=1,D}function X(D){let T=[];return T.push(D.wrapS),T.push(D.wrapT),T.push(D.wrapR||0),T.push(D.magFilter),T.push(D.minFilter),T.push(D.anisotropy),T.push(D.internalFormat),T.push(D.format),T.push(D.type),T.push(D.generateMipmaps),T.push(D.mipmapsAutoUpdate),T.push(D.premultiplyAlpha),T.push(D.flipY),T.push(D.unpackAlignment),T.push(D.colorSpace),T.join()}function q(D,T){let K=n.get(D);if(D.isVideoTexture&&be(D),D.isRenderTargetTexture===!1&&D.isExternalTexture!==!0&&D.version>0&&K.__version!==D.version){let xt=D.image;if(xt===null)Rt("WebGLRenderer: Texture marked for update but no image data found.");else if(xt.complete===!1)Rt("WebGLRenderer: Texture marked for update but image is incomplete");else{_t(K,D,T);return}}else D.isExternalTexture&&(K.__webglTexture=D.sourceTexture?D.sourceTexture:null);e.bindTexture(s.TEXTURE_2D,K.__webglTexture,s.TEXTURE0+T)}function $(D,T){let K=n.get(D);if(D.isRenderTargetTexture===!1&&D.version>0&&K.__version!==D.version){_t(K,D,T);return}else D.isExternalTexture&&(K.__webglTexture=D.sourceTexture?D.sourceTexture:null);e.bindTexture(s.TEXTURE_2D_ARRAY,K.__webglTexture,s.TEXTURE0+T)}function lt(D,T){let K=n.get(D);if(D.isRenderTargetTexture===!1&&D.version>0&&K.__version!==D.version){_t(K,D,T);return}e.bindTexture(s.TEXTURE_3D,K.__webglTexture,s.TEXTURE0+T)}function Y(D,T){let K=n.get(D);if(D.version>0&&K.__version!==D.version){Dt(K,D,T);return}e.bindTexture(s.TEXTURE_CUBE_MAP,K.__webglTexture,s.TEXTURE0+T)}let W={[Bi]:s.REPEAT,[pn]:s.CLAMP_TO_EDGE,[kr]:s.MIRRORED_REPEAT},mt={[Pe]:s.NEAREST,[gu]:s.NEAREST_MIPMAP_NEAREST,[hr]:s.NEAREST_MIPMAP_LINEAR,[Ee]:s.LINEAR,[Ra]:s.LINEAR_MIPMAP_NEAREST,[Xn]:s.LINEAR_MIPMAP_LINEAR},pt={[xf]:s.NEVER,[wu]:s.ALWAYS,[yf]:s.LESS,[Eu]:s.LEQUAL,[vf]:s.EQUAL,[Tu]:s.GEQUAL,[Mf]:s.GREATER,[Sf]:s.NOTEQUAL};function St(D,T){if(T.type===ln&&t.has("OES_texture_float_linear")===!1&&(T.magFilter===Ee||T.magFilter===Ra||T.magFilter===hr||T.magFilter===Xn||T.minFilter===Ee||T.minFilter===Ra||T.minFilter===hr||T.minFilter===Xn)&&Rt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(D,s.TEXTURE_WRAP_S,W[T.wrapS]),s.texParameteri(D,s.TEXTURE_WRAP_T,W[T.wrapT]),(D===s.TEXTURE_3D||D===s.TEXTURE_2D_ARRAY)&&s.texParameteri(D,s.TEXTURE_WRAP_R,W[T.wrapR]),s.texParameteri(D,s.TEXTURE_MAG_FILTER,mt[T.magFilter]),s.texParameteri(D,s.TEXTURE_MIN_FILTER,mt[T.minFilter]),T.compareFunction&&(s.texParameteri(D,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(D,s.TEXTURE_COMPARE_FUNC,pt[T.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(T.magFilter===Pe||T.minFilter!==hr&&T.minFilter!==Xn||T.type===ln&&t.has("OES_texture_float_linear")===!1)return;if(T.anisotropy>1||n.get(T).__currentAnisotropy){let K=t.get("EXT_texture_filter_anisotropic");s.texParameterf(D,K.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(T.anisotropy,i.getMaxAnisotropy())),n.get(T).__currentAnisotropy=T.anisotropy}}}function Ct(D,T){let K=!1;D.__webglInit===void 0&&(D.__webglInit=!0,T.addEventListener("dispose",I),P(T));let xt=T.source,ut=d.get(xt);ut===void 0&&(ut={},d.set(xt,ut));let vt=X(T);if(vt!==D.__cacheKey){ut[vt]===void 0&&(ut[vt]={texture:s.createTexture(),usedTimes:0},a.memory.textures++,K=!0),ut[vt].usedTimes++;let Tt=ut[D.__cacheKey];Tt!==void 0&&(ut[D.__cacheKey].usedTimes--,Tt.usedTimes===0&&B(T)),D.__cacheKey=vt,D.__webglTexture=ut[vt].texture}return K}function nt(D,T,K){return Math.floor(Math.floor(D/K)/T)}function ft(D,T,K,xt){let vt=D.updateRanges;if(vt.length===0)e.texSubImage2D(s.TEXTURE_2D,0,0,0,T.width,T.height,K,xt,T.data);else{vt.sort((b,N)=>b.start-N.start);let Tt=0;for(let b=1;b<vt.length;b++){let N=vt[Tt],z=vt[b],it=N.start+N.count,rt=nt(z.start,T.width,4),dt=nt(N.start,T.width,4);z.start<=it+1&&rt===dt&&nt(z.start+z.count-1,T.width,4)===rt?N.count=Math.max(N.count,z.start+z.count-N.start):(++Tt,vt[Tt]=z)}vt.length=Tt+1;let at=e.getParameter(s.UNPACK_ROW_LENGTH),ot=e.getParameter(s.UNPACK_SKIP_PIXELS),bt=e.getParameter(s.UNPACK_SKIP_ROWS);e.pixelStorei(s.UNPACK_ROW_LENGTH,T.width);for(let b=0,N=vt.length;b<N;b++){let z=vt[b],it=Math.floor(z.start/4),rt=Math.ceil(z.count/4),dt=it%T.width,yt=Math.floor(it/T.width),Xt=rt,gt=1;e.pixelStorei(s.UNPACK_SKIP_PIXELS,dt),e.pixelStorei(s.UNPACK_SKIP_ROWS,yt),e.texSubImage2D(s.TEXTURE_2D,0,dt,yt,Xt,gt,K,xt,T.data)}D.clearUpdateRanges(),e.pixelStorei(s.UNPACK_ROW_LENGTH,at),e.pixelStorei(s.UNPACK_SKIP_PIXELS,ot),e.pixelStorei(s.UNPACK_SKIP_ROWS,bt)}}function _t(D,T,K){let xt=s.TEXTURE_2D;(T.isDataArrayTexture||T.isCompressedArrayTexture)&&(xt=s.TEXTURE_2D_ARRAY),T.isData3DTexture&&(xt=s.TEXTURE_3D);let ut=Ct(D,T),vt=T.source;e.bindTexture(xt,D.__webglTexture,s.TEXTURE0+K);let Tt=n.get(vt);if(vt.version!==Tt.__version||ut===!0){if(e.activeTexture(s.TEXTURE0+K),(typeof ImageBitmap<"u"&&T.image instanceof ImageBitmap)===!1){let gt=ie.getPrimaries(ie.workingColorSpace),Gt=T.colorSpace===Ti?null:ie.getPrimaries(T.colorSpace),Jt=T.colorSpace===Ti||gt===Gt?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,T.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,Jt)}e.pixelStorei(s.UNPACK_ALIGNMENT,T.unpackAlignment);let ot=y(T.image,!1,i.maxTextureSize);ot=Nt(T,ot);let bt=r.convert(T.format,T.colorSpace),b=r.convert(T.type),N=E(T.internalFormat,bt,b,T.normalized,T.colorSpace,T.isVideoTexture);St(xt,T);let z,it=T.mipmaps,rt=T.isVideoTexture!==!0,dt=Tt.__version===void 0||ut===!0,yt=vt.dataReady,Xt=S(T,ot);if(T.isDepthTexture)N=x(T.format===bi,T.type),dt&&(rt?e.texStorage2D(s.TEXTURE_2D,1,N,ot.width,ot.height):e.texImage2D(s.TEXTURE_2D,0,N,ot.width,ot.height,0,bt,b,null));else if(T.isDataTexture)if(it.length>0){rt&&dt&&e.texStorage2D(s.TEXTURE_2D,Xt,N,it[0].width,it[0].height);for(let gt=0,Gt=it.length;gt<Gt;gt++)z=it[gt],rt?yt&&e.texSubImage2D(s.TEXTURE_2D,gt,0,0,z.width,z.height,bt,b,z.data):e.texImage2D(s.TEXTURE_2D,gt,N,z.width,z.height,0,bt,b,z.data);T.generateMipmaps=!1}else rt?(dt&&e.texStorage2D(s.TEXTURE_2D,Xt,N,ot.width,ot.height),yt&&ft(T,ot,bt,b)):e.texImage2D(s.TEXTURE_2D,0,N,ot.width,ot.height,0,bt,b,ot.data);else if(T.isCompressedTexture)if(T.isCompressedArrayTexture){rt&&dt&&e.texStorage3D(s.TEXTURE_2D_ARRAY,Xt,N,it[0].width,it[0].height,ot.depth);for(let gt=0,Gt=it.length;gt<Gt;gt++)if(z=it[gt],T.format!==gn)if(bt!==null)if(rt){if(yt)if(T.layerUpdates.size>0){let Jt=Pu(z.width,z.height,T.format,T.type);for(let It of T.layerUpdates){let xe=z.data.subarray(It*Jt/z.data.BYTES_PER_ELEMENT,(It+1)*Jt/z.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,gt,0,0,It,z.width,z.height,1,bt,xe)}}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,gt,0,0,0,z.width,z.height,ot.depth,bt,z.data)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,gt,N,z.width,z.height,ot.depth,0,z.data,0,0);else Rt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else rt?yt&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,gt,0,0,0,z.width,z.height,ot.depth,bt,b,z.data):e.texImage3D(s.TEXTURE_2D_ARRAY,gt,N,z.width,z.height,ot.depth,0,bt,b,z.data);T.layerUpdates.size>0&&T.clearLayerUpdates()}else{rt&&dt&&e.texStorage2D(s.TEXTURE_2D,Xt,N,it[0].width,it[0].height);for(let gt=0,Gt=it.length;gt<Gt;gt++)z=it[gt],T.format!==gn?bt!==null?rt?yt&&e.compressedTexSubImage2D(s.TEXTURE_2D,gt,0,0,z.width,z.height,bt,z.data):e.compressedTexImage2D(s.TEXTURE_2D,gt,N,z.width,z.height,0,z.data):Rt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):rt?yt&&e.texSubImage2D(s.TEXTURE_2D,gt,0,0,z.width,z.height,bt,b,z.data):e.texImage2D(s.TEXTURE_2D,gt,N,z.width,z.height,0,bt,b,z.data)}else if(T.isDataArrayTexture)if(rt){if(dt&&e.texStorage3D(s.TEXTURE_2D_ARRAY,Xt,N,ot.width,ot.height,ot.depth),yt)if(T.layerUpdates.size>0){let gt=Pu(ot.width,ot.height,T.format,T.type);for(let Gt of T.layerUpdates){let Jt=ot.data.subarray(Gt*gt/ot.data.BYTES_PER_ELEMENT,(Gt+1)*gt/ot.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,Gt,ot.width,ot.height,1,bt,b,Jt)}T.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,ot.width,ot.height,ot.depth,bt,b,ot.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,N,ot.width,ot.height,ot.depth,0,bt,b,ot.data);else if(T.isData3DTexture)rt?(dt&&e.texStorage3D(s.TEXTURE_3D,Xt,N,ot.width,ot.height,ot.depth),yt&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,ot.width,ot.height,ot.depth,bt,b,ot.data)):e.texImage3D(s.TEXTURE_3D,0,N,ot.width,ot.height,ot.depth,0,bt,b,ot.data);else if(T.isFramebufferTexture){if(dt)if(rt)e.texStorage2D(s.TEXTURE_2D,Xt,N,ot.width,ot.height);else{let gt=ot.width,Gt=ot.height;for(let Jt=0;Jt<Xt;Jt++)e.texImage2D(s.TEXTURE_2D,Jt,N,gt,Gt,0,bt,b,null),gt>>=1,Gt>>=1}}else if(T.isHTMLTexture){if("texElementImage2D"in s){let gt=s.canvas;if(gt.hasAttribute("layoutsubtree")||gt.setAttribute("layoutsubtree","true"),ot.parentNode!==gt){gt.appendChild(ot),u.add(T),gt.onpaint=Gt=>{let Jt=Gt.changedElements;for(let It of u)Jt.includes(It.image)&&(It.needsUpdate=!0)},gt.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,ot);else{let Jt=s.RGBA,It=s.RGBA,xe=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,Jt,It,xe,ot)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(it.length>0){if(rt&&dt){let gt=Wt(it[0]);e.texStorage2D(s.TEXTURE_2D,Xt,N,gt.width,gt.height)}for(let gt=0,Gt=it.length;gt<Gt;gt++)z=it[gt],rt?yt&&e.texSubImage2D(s.TEXTURE_2D,gt,0,0,bt,b,z):e.texImage2D(s.TEXTURE_2D,gt,N,bt,b,z);T.generateMipmaps=!1}else if(rt){if(dt){let gt=Wt(ot);e.texStorage2D(s.TEXTURE_2D,Xt,N,gt.width,gt.height)}yt&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,bt,b,ot)}else e.texImage2D(s.TEXTURE_2D,0,N,bt,b,ot);M(T)&&T.mipmapsAutoUpdate===!0&&v(xt),Tt.__version=vt.version,T.onUpdate&&T.onUpdate(T)}D.__version=T.version}function Dt(D,T,K){if(T.image.length!==6)return;let xt=Ct(D,T),ut=T.source;e.bindTexture(s.TEXTURE_CUBE_MAP,D.__webglTexture,s.TEXTURE0+K);let vt=n.get(ut);if(ut.version!==vt.__version||xt===!0){e.activeTexture(s.TEXTURE0+K);let Tt=ie.getPrimaries(ie.workingColorSpace),at=T.colorSpace===Ti?null:ie.getPrimaries(T.colorSpace),ot=T.colorSpace===Ti||Tt===at?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,T.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,T.premultiplyAlpha),e.pixelStorei(s.UNPACK_ALIGNMENT,T.unpackAlignment),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,ot);let bt=T.isCompressedTexture||T.image[0].isCompressedTexture,b=T.image[0]&&T.image[0].isDataTexture,N=[];for(let It=0;It<6;It++)!bt&&!b?N[It]=y(T.image[It],!0,i.maxCubemapSize):N[It]=b?T.image[It].image:T.image[It],N[It]=Nt(T,N[It]);let z=N[0],it=r.convert(T.format,T.colorSpace),rt=r.convert(T.type),dt=E(T.internalFormat,it,rt,T.normalized,T.colorSpace),yt=T.isVideoTexture!==!0,Xt=vt.__version===void 0||xt===!0,gt=ut.dataReady,Gt=S(T,z);St(s.TEXTURE_CUBE_MAP,T);let Jt;if(T.isDepthTexture){if(dt=x(T.format===bi,T.type),Xt)if(yt)e.texStorage2D(s.TEXTURE_CUBE_MAP,1,dt,z.width,z.height);else for(let It=0;It<6;It++)e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,0,dt,z.width,z.height,0,it,rt,null)}else if(bt){yt&&Xt&&e.texStorage2D(s.TEXTURE_CUBE_MAP,Gt,dt,z.width,z.height);for(let It=0;It<6;It++){Jt=N[It].mipmaps;for(let xe=0;xe<Jt.length;xe++){let Xe=Jt[xe];T.format!==gn?it!==null?yt?gt&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe,0,0,Xe.width,Xe.height,it,Xe.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe,dt,Xe.width,Xe.height,0,Xe.data):Rt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):yt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe,0,0,Xe.width,Xe.height,it,rt,Xe.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe,dt,Xe.width,Xe.height,0,it,rt,Xe.data)}}}else{if(Jt=T.mipmaps,yt&&Xt){Jt.length>0&&Gt++;let It=Wt(N[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,Gt,dt,It.width,It.height)}for(let It=0;It<6;It++)if(b){yt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,0,0,0,N[It].width,N[It].height,it,rt,N[It].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,0,dt,N[It].width,N[It].height,0,it,rt,N[It].data);for(let xe=0;xe<Jt.length;xe++){let $i=Jt[xe].image[It].image;yt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe+1,0,0,$i.width,$i.height,it,rt,$i.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe+1,dt,$i.width,$i.height,0,it,rt,$i.data)}}else{yt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,0,0,0,it,rt,N[It]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,0,dt,it,rt,N[It]);for(let xe=0;xe<Jt.length;xe++){let Xe=Jt[xe];yt?gt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe+1,0,0,it,rt,Xe.image[It]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+It,xe+1,dt,it,rt,Xe.image[It])}}}M(T)&&T.mipmapsAutoUpdate===!0&&v(s.TEXTURE_CUBE_MAP),vt.__version=ut.version,T.onUpdate&&T.onUpdate(T)}D.__version=T.version}function Mt(D,T,K,xt,ut,vt){let Tt=r.convert(K.format,K.colorSpace),at=r.convert(K.type),ot=E(K.internalFormat,Tt,at,K.normalized,K.colorSpace),bt=n.get(T),b=n.get(K);if(b.__renderTarget=T,!bt.__hasExternalTextures){let N=Math.max(1,T.width>>vt),z=Math.max(1,T.height>>vt);ut===s.TEXTURE_3D||ut===s.TEXTURE_2D_ARRAY?e.texImage3D(ut,vt,ot,N,z,T.depth,0,Tt,at,null):e.texImage2D(ut,vt,ot,N,z,0,Tt,at,null)}e.bindFramebuffer(s.FRAMEBUFFER,D),Et(T)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,xt,ut,b.__webglTexture,0,he(T)):(ut===s.TEXTURE_2D||ut>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&ut<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,xt,ut,b.__webglTexture,vt),e.bindFramebuffer(s.FRAMEBUFFER,null)}function qt(D,T,K){if(s.bindRenderbuffer(s.RENDERBUFFER,D),T.depthBuffer){let xt=T.depthTexture,ut=xt&&xt.isDepthTexture?xt.type:null,vt=x(T.stencilBuffer,ut),Tt=T.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;Et(T)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,he(T),vt,T.width,T.height):K?s.renderbufferStorageMultisample(s.RENDERBUFFER,he(T),vt,T.width,T.height):s.renderbufferStorage(s.RENDERBUFFER,vt,T.width,T.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,Tt,s.RENDERBUFFER,D)}else{let xt=T.textures;for(let ut=0;ut<xt.length;ut++){let vt=xt[ut],Tt=r.convert(vt.format,vt.colorSpace),at=r.convert(vt.type),ot=E(vt.internalFormat,Tt,at,vt.normalized,vt.colorSpace);Et(T)?o.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,he(T),ot,T.width,T.height):K?s.renderbufferStorageMultisample(s.RENDERBUFFER,he(T),ot,T.width,T.height):s.renderbufferStorage(s.RENDERBUFFER,ot,T.width,T.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function Ft(D,T,K){let xt=T.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(s.FRAMEBUFFER,D),!(T.depthTexture&&T.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let ut=n.get(T.depthTexture);ut.__renderTarget=T;let vt=xt?T.depthTexture.image[0]:T.depthTexture.image;(!ut.__webglTexture||vt.width!==T.width||vt.height!==T.height)&&(vt.width=T.width,vt.height=T.height,T.depthTexture.needsUpdate=!0),xt?Y(T.depthTexture,0):q(T.depthTexture,0);let Tt=ut.__webglTexture,at=he(T),ot=xt?s.TEXTURE_CUBE_MAP_POSITIVE_X+K:s.TEXTURE_2D,bt=T.depthTexture.format===bi?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(T.depthTexture.format===_i)Et(T)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,bt,ot,Tt,0,at):s.framebufferTexture2D(s.FRAMEBUFFER,bt,ot,Tt,0);else if(T.depthTexture.format===bi)Et(T)?o.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,bt,ot,Tt,0,at):s.framebufferTexture2D(s.FRAMEBUFFER,bt,ot,Tt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ee(D){let T=n.get(D),K=D.isWebGLCubeRenderTarget===!0;if(T.__boundDepthTexture!==D.depthTexture){let xt=D.depthTexture;if(T.__depthDisposeCallback&&T.__depthDisposeCallback(),xt){let ut=()=>{delete T.__boundDepthTexture,delete T.__depthDisposeCallback,xt.removeEventListener("dispose",ut)};xt.addEventListener("dispose",ut),T.__depthDisposeCallback=ut}T.__boundDepthTexture=xt}if(D.depthTexture&&!T.__autoAllocateDepthBuffer)if(K)for(let xt=0;xt<6;xt++)Ft(T.__webglFramebuffer[xt],D,xt);else D.texture.mipmaps.length>0?Ft(T.__webglFramebuffer[0],D,0):Ft(T.__webglFramebuffer,D,0);else if(K){T.__webglDepthbuffer=[];for(let xt=0;xt<6;xt++)if(e.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer[xt]),T.__webglDepthbuffer[xt]===void 0)T.__webglDepthbuffer[xt]=s.createRenderbuffer(),qt(T.__webglDepthbuffer[xt],D,!1);else{let ut=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,vt=T.__webglDepthbuffer[xt];s.bindRenderbuffer(s.RENDERBUFFER,vt),s.framebufferRenderbuffer(s.FRAMEBUFFER,ut,s.RENDERBUFFER,vt)}}else if(D.texture.mipmaps.length>0?e.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer[0]):e.bindFramebuffer(s.FRAMEBUFFER,T.__webglFramebuffer),T.__webglDepthbuffer===void 0)T.__webglDepthbuffer=s.createRenderbuffer(),qt(T.__webglDepthbuffer,D,!1);else{let ut=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,vt=T.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,vt),s.framebufferRenderbuffer(s.FRAMEBUFFER,ut,s.RENDERBUFFER,vt)}e.bindFramebuffer(s.FRAMEBUFFER,null)}function ne(D,T,K){let xt=n.get(D);T!==void 0&&Mt(xt.__webglFramebuffer,D,D.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),K!==void 0&&ee(D)}function ae(D){let T=D.texture,K=n.get(D),xt=n.get(T);D.addEventListener("dispose",U),P(D);let ut=D.textures,vt=D.isWebGLCubeRenderTarget===!0,Tt=ut.length>1;if(Tt||(xt.__webglTexture===void 0&&(xt.__webglTexture=s.createTexture()),xt.__version=T.version,a.memory.textures++),vt){K.__webglFramebuffer=[];for(let at=0;at<6;at++)if(T.mipmaps.length>0){K.__webglFramebuffer[at]=[];for(let ot=0;ot<T.mipmaps.length;ot++)K.__webglFramebuffer[at][ot]=s.createFramebuffer()}else K.__webglFramebuffer[at]=s.createFramebuffer()}else{if(T.mipmaps.length>0){K.__webglFramebuffer=[];for(let at=0;at<T.mipmaps.length;at++)K.__webglFramebuffer[at]=s.createFramebuffer()}else K.__webglFramebuffer=s.createFramebuffer();if(Tt)for(let at=0,ot=ut.length;at<ot;at++){let bt=n.get(ut[at]);bt.__webglTexture===void 0&&(bt.__webglTexture=s.createTexture(),a.memory.textures++)}if(D.samples>0&&Et(D)===!1){K.__webglMultisampledFramebuffer=s.createFramebuffer(),K.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,K.__webglMultisampledFramebuffer);for(let at=0;at<ut.length;at++){let ot=ut[at];K.__webglColorRenderbuffer[at]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,K.__webglColorRenderbuffer[at]);let bt=r.convert(ot.format,ot.colorSpace),b=r.convert(ot.type),N=E(ot.internalFormat,bt,b,ot.normalized,ot.colorSpace,D.isXRRenderTarget===!0),z=he(D);s.renderbufferStorageMultisample(s.RENDERBUFFER,z,N,D.width,D.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+at,s.RENDERBUFFER,K.__webglColorRenderbuffer[at])}s.bindRenderbuffer(s.RENDERBUFFER,null),D.depthBuffer&&(K.__webglDepthRenderbuffer=s.createRenderbuffer(),qt(K.__webglDepthRenderbuffer,D,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(vt){e.bindTexture(s.TEXTURE_CUBE_MAP,xt.__webglTexture),St(s.TEXTURE_CUBE_MAP,T);for(let at=0;at<6;at++)if(T.mipmaps.length>0)for(let ot=0;ot<T.mipmaps.length;ot++)Mt(K.__webglFramebuffer[at][ot],D,T,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+at,ot);else Mt(K.__webglFramebuffer[at],D,T,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+at,0);M(T)?v(s.TEXTURE_CUBE_MAP):T.mipmaps.length>0&&s.texParameteri(s.TEXTURE_CUBE_MAP,s.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),e.unbindTexture()}else if(Tt){for(let at=0,ot=ut.length;at<ot;at++){let bt=ut[at],b=n.get(bt),N=s.TEXTURE_2D;(D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(N=D.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(N,b.__webglTexture),St(N,bt),Mt(K.__webglFramebuffer,D,bt,s.COLOR_ATTACHMENT0+at,N,0),M(bt)&&v(N)}e.unbindTexture()}else{let at=s.TEXTURE_2D;if((D.isWebGL3DRenderTarget||D.isWebGLArrayRenderTarget)&&(at=D.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(at,xt.__webglTexture),St(at,T),T.mipmaps.length>0)for(let ot=0;ot<T.mipmaps.length;ot++)Mt(K.__webglFramebuffer[ot],D,T,s.COLOR_ATTACHMENT0,at,ot);else Mt(K.__webglFramebuffer,D,T,s.COLOR_ATTACHMENT0,at,0);M(T)?v(at):T.mipmaps.length>0&&s.texParameteri(at,s.TEXTURE_MAX_LEVEL,T.mipmaps.length-1),e.unbindTexture()}D.depthBuffer&&ee(D)}function V(D){let T=D.textures;for(let K=0,xt=T.length;K<xt;K++){let ut=T[K];if(M(ut)&&ut.mipmapsAutoUpdate===!0){let vt=w(D),Tt=n.get(ut).__webglTexture;e.bindTexture(vt,Tt),v(vt),e.unbindTexture()}}}let Te=[];function Qt(D){if(D.samples>0){if(Et(D)===!1){let T=D.textures,K=D.width,xt=D.height,ut=s.COLOR_BUFFER_BIT,vt=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,Tt=n.get(D),at=T.length>1;if(at)for(let bt=0;bt<T.length;bt++)e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),D.texture.mipmaps.length>0?e.bindFramebuffer(s.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer[0]):e.bindFramebuffer(s.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer);for(let bt=0;bt<T.length;bt++){if(D.resolveDepthBuffer&&(D.depthBuffer&&(ut|=s.DEPTH_BUFFER_BIT),D.stencilBuffer&&D.resolveStencilBuffer&&(ut|=s.STENCIL_BUFFER_BIT)),at){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,Tt.__webglColorRenderbuffer[bt]);let b=n.get(T[bt]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,b,0)}s.blitFramebuffer(0,0,K,xt,0,0,K,xt,ut,s.NEAREST),l===!0&&(Te.length=0,Te.push(s.COLOR_ATTACHMENT0+bt),D.depthBuffer&&D.storeMultisampledDepthBuffer===!1&&Te.push(vt),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,Te))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),at)for(let bt=0;bt<T.length;bt++){e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.RENDERBUFFER,Tt.__webglColorRenderbuffer[bt]);let b=n.get(T[bt]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,Tt.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+bt,s.TEXTURE_2D,b,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer)}else if(D.depthBuffer&&D.storeMultisampledDepthBuffer===!1&&l){let T=D.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[T])}}}function he(D){return Math.min(i.maxSamples,D.samples)}function Et(D){let T=n.get(D);return D.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&T.__useRenderToTexture!==!1}function be(D){let T=a.render.frame;h.get(D)!==T&&(h.set(D,T),D.update())}function Nt(D,T){let K=D.colorSpace,xt=D.format,ut=D.type;return D.isCompressedTexture===!0||D.isVideoTexture===!0||K!==Hr&&K!==Ti&&(ie.getTransfer(K)===fe?(xt!==gn||ut!==xn)&&Rt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Ht("WebGLTextures: Unsupported texture color space:",K)),T}function Wt(D){return typeof HTMLImageElement<"u"&&D instanceof HTMLImageElement?(c.width=D.naturalWidth||D.width,c.height=D.naturalHeight||D.height):typeof VideoFrame<"u"&&D instanceof VideoFrame?(c.width=D.displayWidth,c.height=D.displayHeight):(c.width=D.width,c.height=D.height),c}this.allocateTextureUnit=ht,this.resetTextureUnits=tt,this.getTextureUnits=J,this.setTextureUnits=Z,this.setTexture2D=q,this.setTexture2DArray=$,this.setTexture3D=lt,this.setTextureCube=Y,this.rebindTextures=ne,this.setupRenderTarget=ae,this.updateRenderTargetMipmap=V,this.updateMultisampleRenderTarget=Qt,this.setupDepthRenderbuffer=ee,this.setupFrameBufferTexture=Mt,this.useMultisampledRTT=Et,this.dispose=F}function dg(s,t){function e(n,i=Ti){let r,a=ie.getTransfer(i);if(n===xn)return s.UNSIGNED_BYTE;if(n===xl)return s.UNSIGNED_SHORT_4_4_4_4;if(n===yl)return s.UNSIGNED_SHORT_5_5_5_1;if(n===yu)return s.UNSIGNED_INT_5_9_9_9_REV;if(n===vu)return s.UNSIGNED_INT_10F_11F_11F_REV;if(n===_u)return s.BYTE;if(n===xu)return s.SHORT;if(n===ur)return s.UNSIGNED_SHORT;if(n===_l)return s.INT;if(n===Un)return s.UNSIGNED_INT;if(n===ln)return s.FLOAT;if(n===qn)return s.HALF_FLOAT;if(n===Mu)return s.ALPHA;if(n===Su)return s.RGB;if(n===gn)return s.RGBA;if(n===_i)return s.DEPTH_COMPONENT;if(n===bi)return s.DEPTH_STENCIL;if(n===vl)return s.RED;if(n===Ca)return s.RED_INTEGER;if(n===qi)return s.RG;if(n===Ml)return s.RG_INTEGER;if(n===Sl)return s.RGBA_INTEGER;if(n===Pa||n===Ia||n===La||n===Da)if(a===fe)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Pa)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ia)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===La)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Da)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Pa)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ia)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===La)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Da)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===bl||n===El||n===Tl||n===wl)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===bl)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===El)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Tl)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===wl)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Al||n===Rl||n===Cl||n===Pl||n===Il||n===Na||n===Ll)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Al||n===Rl)return a===fe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Cl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Pl)return r.COMPRESSED_R11_EAC;if(n===Il)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Na)return r.COMPRESSED_RG11_EAC;if(n===Ll)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Dl||n===Nl||n===Ul||n===Ol||n===Fl||n===Bl||n===zl||n===kl||n===Gl||n===Vl||n===Hl||n===Wl||n===Xl||n===ql)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Dl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Nl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ul)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ol)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Fl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Bl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===zl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===kl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Gl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Vl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Hl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Wl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Xl)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ql)return a===fe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Yl||n===Zl||n===$l)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Yl)return a===fe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Zl)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===$l)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Jl||n===Kl||n===Ua||n===jl)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Jl)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Kl)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ua)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===jl)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ys?s.UNSIGNED_INT_24_8:s[n]!==void 0?s[n]:null}return{convert:e}}var db=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,fb=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Xf=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new na(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new Hn({vertexShader:db,fragmentShader:fb,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ue(new li(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},qf=class extends En{constructor(t,e){super();let n=this,i=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,p=null,_=typeof XRWebGLBinding<"u",m=new Xf,g={},y=e.getContextAttributes(),M=null,v=null,w=[],E=[],x=new ct,S=null,P=null,R=new De;R.viewport=new _e;let I=new De;I.viewport=new _e;let U=[R,I],O=new hl,C=null,F=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(X){let q=w[X];return q===void 0&&(q=new Vs,w[X]=q),q.getTargetRaySpace()},this.getControllerGrip=function(X){let q=w[X];return q===void 0&&(q=new Vs,w[X]=q),q.getGripSpace()},this.getHand=function(X){let q=w[X];return q===void 0&&(q=new Vs,w[X]=q),q.getHandSpace()};function H(X){let q=E.indexOf(X.inputSource);if(q===-1)return;let $=w[q];$!==void 0&&($.update(X.inputSource,X.frame,c||a),$.dispatchEvent({type:X.type,data:X.inputSource}))}function B(){i.removeEventListener("select",H),i.removeEventListener("selectstart",H),i.removeEventListener("selectend",H),i.removeEventListener("squeeze",H),i.removeEventListener("squeezestart",H),i.removeEventListener("squeezeend",H),i.removeEventListener("end",B),i.removeEventListener("inputsourceschange",Q);for(let X=0;X<w.length;X++){let q=E[X];q!==null&&(E[X]=null,w[X].disconnect(q))}C=null,F=null,m.reset();for(let X in g)delete g[X];if(t.setRenderTarget(M),d=null,f=null,u=null,i=null,v=null,ht.stop(),n.isPresenting=!1,t.setPixelRatio(S),t.setSize(x.width,x.height,!1),P!==null){let X=P.camera;X.fov=P.fov,X.zoom=P.zoom,X.updateProjectionMatrix(),P=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(X){r=X,n.isPresenting===!0&&Rt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(X){o=X,n.isPresenting===!0&&Rt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(X){c=X},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(i,e)),u},this.getFrame=function(){return p},this.getSession=function(){return i},this.setSession=async function(X){if(i=X,i!==null){if(M=t.getRenderTarget(),i.addEventListener("select",H),i.addEventListener("selectstart",H),i.addEventListener("selectend",H),i.addEventListener("squeeze",H),i.addEventListener("squeezestart",H),i.addEventListener("squeezeend",H),i.addEventListener("end",B),i.addEventListener("inputsourceschange",Q),y.xrCompatible!==!0&&await e.makeXRCompatible(),S=t.getPixelRatio(),t.getSize(x),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let $=null,lt=null,Y=null;y.depth&&(Y=y.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,$=y.stencil?bi:_i,lt=y.stencil?ys:Un);let W={colorFormat:e.RGBA8,depthFormat:Y,scaleFactor:r};u=this.getBinding(),f=u.createProjectionLayer(W),i.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),v=new cn(f.textureWidth,f.textureHeight,{format:gn,type:xn,depthTexture:new yi(f.textureWidth,f.textureHeight,lt,void 0,void 0,void 0,void 0,void 0,void 0,$),stencilBuffer:y.stencil,colorSpace:t.outputColorSpace,samples:y.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{let $={antialias:y.antialias,alpha:!0,depth:y.depth,stencil:y.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(i,e,$),i.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new cn(d.framebufferWidth,d.framebufferHeight,{format:gn,type:xn,colorSpace:t.outputColorSpace,stencilBuffer:y.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),ht.setContext(i),ht.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Q(X){for(let q=0;q<X.removed.length;q++){let $=X.removed[q],lt=E.indexOf($);lt>=0&&(E[lt]=null,w[lt].disconnect($))}for(let q=0;q<X.added.length;q++){let $=X.added[q],lt=E.indexOf($);if(lt===-1){for(let W=0;W<w.length;W++)if(W>=E.length){E.push($),lt=W;break}else if(E[W]===null){E[W]=$,lt=W;break}if(lt===-1)break}let Y=w[lt];Y&&Y.connect($)}}function k(X,q){q===null?X.matrixWorld.copy(X.matrix):X.matrixWorld.multiplyMatrices(q.matrixWorld,X.matrix),X.matrixWorldInverse.copy(X.matrixWorld).invert()}this.updateCamera=function(X){if(i===null)return;let q=X.near,$=X.far;m.texture!==null&&(m.depthNear>0&&(q=m.depthNear),m.depthFar>0&&($=m.depthFar)),O.near=I.near=R.near=q,O.far=I.far=R.far=$,(C!==O.near||F!==O.far)&&(i.updateRenderState({depthNear:O.near,depthFar:O.far}),C=O.near,F=O.far),O.layers.mask=X.layers.mask|6,R.layers.mask=O.layers.mask&-5,I.layers.mask=O.layers.mask&-3;let lt=X.parent,Y=O.cameras;k(O,lt);for(let W=0;W<Y.length;W++)k(Y[W],lt);O.projectionMatrix.copy(R.projectionMatrix),O.projectionMatrixInverse.copy(R.projectionMatrixInverse),P===null&&X.isPerspectiveCamera&&(P={camera:X,fov:X.fov,zoom:X.zoom}),tt(X,O,lt)};function tt(X,q,$){$===null?X.matrix.copy(q.matrixWorld):(X.matrix.copy($.matrixWorld),X.matrix.invert(),X.matrix.multiply(q.matrixWorld)),X.matrix.decompose(X.position,X.quaternion,X.scale),X.updateMatrixWorld(!0),X.projectionMatrix.copy(q.projectionMatrix),X.projectionMatrixInverse.copy(q.projectionMatrixInverse),X.isPerspectiveCamera&&(X.fov=Bs*2*Math.atan(1/X.projectionMatrix.elements[5]),X.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(X){l=X,f!==null&&(f.fixedFoveation=X),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=X)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(O)},this.getCameraTexture=function(X){return g[X]};let J=null;function Z(X,q){if(h=q.getViewerPose(c||a),p=q,h!==null){let $=h.views;d!==null&&(t.setRenderTargetFramebuffer(v,d.framebuffer),t.setRenderTarget(v));let lt=!1;$.length!==O.cameras.length&&(O.cameras.length=0,lt=!0);for(let pt=0;pt<$.length;pt++){let St=$[pt],Ct=null;if(d!==null)Ct=d.getViewport(St);else{let ft=u.getViewSubImage(f,St);Ct=ft.viewport,pt===0&&(t.setRenderTargetTextures(v,ft.colorTexture,ft.depthStencilTexture),t.setRenderTarget(v))}let nt=U[pt];nt===void 0&&(nt=new De,nt.layers.enable(pt),nt.viewport=new _e,U[pt]=nt),nt.matrix.fromArray(St.transform.matrix),nt.matrix.decompose(nt.position,nt.quaternion,nt.scale),nt.projectionMatrix.fromArray(St.projectionMatrix),nt.projectionMatrixInverse.copy(nt.projectionMatrix).invert(),nt.viewport.set(Ct.x,Ct.y,Ct.width,Ct.height),pt===0&&(O.matrix.copy(nt.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),lt===!0&&O.cameras.push(nt)}let Y=i.enabledFeatures;if(Y&&Y.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&_){u=n.getBinding();let pt=u.getDepthInformation($[0]);pt&&pt.isValid&&pt.texture&&m.init(pt,i.renderState)}if(Y&&Y.includes("camera-access")&&_){t.state.unbindTexture(),u=n.getBinding();for(let pt=0;pt<$.length;pt++){let St=$[pt].camera;if(St){let Ct=g[St];Ct||(Ct=new na,g[St]=Ct);let nt=u.getCameraImage(St);Ct.sourceTexture=nt}}}}for(let $=0;$<w.length;$++){let lt=E[$],Y=w[$];lt!==null&&Y!==void 0&&Y.update(lt,q,c||a)}J&&J(X,q),q.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:q}),p=null}let ht=new ng;ht.setAnimationLoop(Z),this.setAnimationLoop=function(X){J=X},this.dispose=function(){}}},pb=new Zt,fg=new $t;fg.set(-1,0,0,0,1,0,0,0,1);function mb(s,t){function e(m,g){m.matrixAutoUpdate===!0&&m.updateMatrix(),g.value.copy(m.matrix)}function n(m,g){g.color.getRGB(m.fogColor.value,Af(s)),g.isFog?(m.fogNear.value=g.near,m.fogFar.value=g.far):g.isFogExp2&&(m.fogDensity.value=g.density)}function i(m,g,y,M,v){g.isNodeMaterial?g.uniformsNeedUpdate=!1:g.isMeshBasicMaterial?r(m,g):g.isMeshLambertMaterial?(r(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshToonMaterial?(r(m,g),u(m,g)):g.isMeshPhongMaterial?(r(m,g),h(m,g),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)):g.isMeshStandardMaterial?(r(m,g),f(m,g),g.isMeshPhysicalMaterial&&d(m,g,v)):g.isMeshMatcapMaterial?(r(m,g),p(m,g)):g.isMeshDepthMaterial?r(m,g):g.isMeshDistanceMaterial?(r(m,g),_(m,g)):g.isMeshNormalMaterial?r(m,g):g.isLineBasicMaterial?(a(m,g),g.isLineDashedMaterial&&o(m,g)):g.isPointsMaterial?l(m,g,y,M):g.isSpriteMaterial?c(m,g):g.isShadowMaterial?(m.color.value.copy(g.color),m.opacity.value=g.opacity):g.isShaderMaterial&&(g.uniformsNeedUpdate=!1)}function r(m,g){m.opacity.value=g.opacity,g.color&&m.diffuse.value.copy(g.color),g.emissive&&m.emissive.value.copy(g.emissive).multiplyScalar(g.emissiveIntensity),g.map&&(m.map.value=g.map,e(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,e(g.alphaMap,m.alphaMapTransform)),g.bumpMap&&(m.bumpMap.value=g.bumpMap,e(g.bumpMap,m.bumpMapTransform),m.bumpScale.value=g.bumpScale,g.side===$e&&(m.bumpScale.value*=-1)),g.normalMap&&(m.normalMap.value=g.normalMap,e(g.normalMap,m.normalMapTransform),m.normalScale.value.copy(g.normalScale),g.side===$e&&m.normalScale.value.negate()),g.displacementMap&&(m.displacementMap.value=g.displacementMap,e(g.displacementMap,m.displacementMapTransform),m.displacementScale.value=g.displacementScale,m.displacementBias.value=g.displacementBias),g.emissiveMap&&(m.emissiveMap.value=g.emissiveMap,e(g.emissiveMap,m.emissiveMapTransform)),g.specularMap&&(m.specularMap.value=g.specularMap,e(g.specularMap,m.specularMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest);let y=t.get(g),M=y.envMap,v=y.envMapRotation;M&&(m.envMap.value=M,m.envMapRotation.value.setFromMatrix4(pb.makeRotationFromEuler(v)).transpose(),M.isCubeTexture&&M.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(fg),m.reflectivity.value=g.reflectivity,m.ior.value=g.ior,m.refractionRatio.value=g.refractionRatio),g.lightMap&&(m.lightMap.value=g.lightMap,m.lightMapIntensity.value=g.lightMapIntensity,e(g.lightMap,m.lightMapTransform)),g.aoMap&&(m.aoMap.value=g.aoMap,m.aoMapIntensity.value=g.aoMapIntensity,e(g.aoMap,m.aoMapTransform))}function a(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,g.map&&(m.map.value=g.map,e(g.map,m.mapTransform))}function o(m,g){m.dashSize.value=g.dashSize,m.totalSize.value=g.dashSize+g.gapSize,m.scale.value=g.scale}function l(m,g,y,M){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.size.value=g.size*y,m.scale.value=M*.5,g.map&&(m.map.value=g.map,e(g.map,m.uvTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,e(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function c(m,g){m.diffuse.value.copy(g.color),m.opacity.value=g.opacity,m.rotation.value=g.rotation,g.map&&(m.map.value=g.map,e(g.map,m.mapTransform)),g.alphaMap&&(m.alphaMap.value=g.alphaMap,e(g.alphaMap,m.alphaMapTransform)),g.alphaTest>0&&(m.alphaTest.value=g.alphaTest)}function h(m,g){m.specular.value.copy(g.specular),m.shininess.value=Math.max(g.shininess,1e-4)}function u(m,g){g.gradientMap&&(m.gradientMap.value=g.gradientMap)}function f(m,g){m.metalness.value=g.metalness,g.metalnessMap&&(m.metalnessMap.value=g.metalnessMap,e(g.metalnessMap,m.metalnessMapTransform)),m.roughness.value=g.roughness,g.roughnessMap&&(m.roughnessMap.value=g.roughnessMap,e(g.roughnessMap,m.roughnessMapTransform)),g.envMap&&(m.envMapIntensity.value=g.envMapIntensity)}function d(m,g,y){m.ior.value=g.ior,g.diffuseRoughness>0&&(m.diffuseRoughness.value=g.diffuseRoughness,g.diffuseRoughnessMap&&(m.diffuseRoughnessMap.value=g.diffuseRoughnessMap,e(g.diffuseRoughnessMap,m.diffuseRoughnessMapTransform))),g.sheen>0&&(m.sheenColor.value.copy(g.sheenColor).multiplyScalar(g.sheen),m.sheenRoughness.value=g.sheenRoughness,g.sheenColorMap&&(m.sheenColorMap.value=g.sheenColorMap,e(g.sheenColorMap,m.sheenColorMapTransform)),g.sheenRoughnessMap&&(m.sheenRoughnessMap.value=g.sheenRoughnessMap,e(g.sheenRoughnessMap,m.sheenRoughnessMapTransform))),g.clearcoat>0&&(m.clearcoat.value=g.clearcoat,m.clearcoatRoughness.value=g.clearcoatRoughness,g.clearcoatMap&&(m.clearcoatMap.value=g.clearcoatMap,e(g.clearcoatMap,m.clearcoatMapTransform)),g.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=g.clearcoatRoughnessMap,e(g.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),g.clearcoatNormalMap&&(m.clearcoatNormalMap.value=g.clearcoatNormalMap,e(g.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(g.clearcoatNormalScale),g.side===$e&&m.clearcoatNormalScale.value.negate())),g.dispersion>0&&(m.dispersion.value=g.dispersion),g.retroreflectivity>0&&(m.retroreflectivity.value=g.retroreflectivity),g.iridescence>0&&(m.iridescence.value=g.iridescence,m.iridescenceIOR.value=g.iridescenceIOR,m.iridescenceThicknessMinimum.value=g.iridescenceThicknessMinimum,m.iridescenceThicknessMaximum.value=g.iridescenceThicknessMaximum,g.iridescenceMap&&(m.iridescenceMap.value=g.iridescenceMap,e(g.iridescenceMap,m.iridescenceMapTransform)),g.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=g.iridescenceThicknessMap,e(g.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),g.transmission>0&&(m.transmission.value=g.transmission,m.transmissionSamplerMap.value=y.texture,m.transmissionSamplerSize.value.set(y.width,y.height),g.transmissionMap&&(m.transmissionMap.value=g.transmissionMap,e(g.transmissionMap,m.transmissionMapTransform)),m.thickness.value=g.thickness,g.thicknessMap&&(m.thicknessMap.value=g.thicknessMap,e(g.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=g.attenuationDistance,m.attenuationColor.value.copy(g.attenuationColor)),g.anisotropy>0&&(m.anisotropyVector.value.set(g.anisotropy*Math.cos(g.anisotropyRotation),g.anisotropy*Math.sin(g.anisotropyRotation)),g.anisotropyMap&&(m.anisotropyMap.value=g.anisotropyMap,e(g.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=g.specularIntensity,m.specularColor.value.copy(g.specularColor),g.specularColorMap&&(m.specularColorMap.value=g.specularColorMap,e(g.specularColorMap,m.specularColorMapTransform)),g.specularIntensityMap&&(m.specularIntensityMap.value=g.specularIntensityMap,e(g.specularIntensityMap,m.specularIntensityMapTransform))}function p(m,g){g.matcap&&(m.matcap.value=g.matcap)}function _(m,g){let y=t.get(g).light;m.referencePosition.value.setFromMatrixPosition(y.matrixWorld),m.nearDistance.value=y.shadow.camera.near,m.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function gb(s,t,e,n){let i={},r={};function a(y,M){let v=M.program;n.uniformBlockBinding(y,v,i[y.id])}function o(y,M){let v=i[y.id];v===void 0&&(p(y),v=l(y),i[y.id]=v,y.addEventListener("dispose",m));let w=M.program;n.updateUBOMapping(y,w);let E=t.render.frame;r[y.id]!==E&&(c(y),r[y.id]=E)}function l(y){let M=s.createBuffer(),v=y.__size,w=y.usage;return s.bindBuffer(s.UNIFORM_BUFFER,M),s.bufferData(s.UNIFORM_BUFFER,v,w),s.bindBuffer(s.UNIFORM_BUFFER,null),M}function c(y){let M=i[y.id],v=y.uniforms,w=y.__cache;s.bindBuffer(s.UNIFORM_BUFFER,M);for(let E=0,x=v.length;E<x;E++){let S=v[E];if(Array.isArray(S))for(let P=0,R=S.length;P<R;P++)h(S[P],E,P,w);else h(S,E,0,w)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function h(y,M,v,w){if(f(y,M,v,w)===!0){let E=y.__offset,x=y.value;if(Array.isArray(x)){let S=0;for(let P=0;P<x.length;P++){let R=x[P],I=_(R,!0);u(R,y.__data,S),S+=I.storage/Float32Array.BYTES_PER_ELEMENT}}else u(x,y.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,E,y.__data)}}function u(y,M,v){typeof y=="number"||typeof y=="boolean"?M[v]=y:y.isMatrix3?(M[v]=y.elements[0],M[v+1]=y.elements[1],M[v+2]=y.elements[2],M[v+3]=0,M[v+4]=y.elements[3],M[v+5]=y.elements[4],M[v+6]=y.elements[5],M[v+7]=0,M[v+8]=y.elements[6],M[v+9]=y.elements[7],M[v+10]=y.elements[8],M[v+11]=0):ArrayBuffer.isView(y)?M.set(y.subarray(0,M.length-v),v):y.toArray(M,v)}function f(y,M,v,w){let E=y.value,x=M+"_"+v;if(Array.isArray(E)){w[x]===void 0&&(w[x]=[]);let S=w[x],P=!1;for(let R=0;R<E.length;R++)d(E[R],S,R)===!0&&(P=!0);return P}return d(E,w,x)}function d(y,M,v){if(M[v]===void 0)return typeof y=="number"||typeof y=="boolean"?M[v]=y:ArrayBuffer.isView(y)?M[v]=y.slice():M[v]=y.clone(),!0;{let w=M[v];if(typeof y=="number"||typeof y=="boolean"){if(w!==y)return M[v]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(w.equals(y)===!1)return w.copy(y),!0}}return!1}function p(y){let M=y.uniforms,v=0,w=16;for(let x=0,S=M.length;x<S;x++){let P=Array.isArray(M[x])?M[x]:[M[x]];for(let R=0,I=P.length;R<I;R++){let U=P[R],O=Array.isArray(U.value)?U.value:[U.value],C=Array.isArray(M[x])||Array.isArray(U.value),F=v;for(let B=0,Q=O.length;B<Q;B++){let k=O[B],tt=_(k,C),J=v%w,Z=J%tt.boundary,ht=J+Z;v+=Z,ht!==0&&w-ht<tt.storage&&(v+=w-ht),B===0&&(F=v),v+=tt.storage}let H=U.type==="int"?Int32Array:U.type==="uint"?Uint32Array:Float32Array;U.__data=new H((v-F)/Float32Array.BYTES_PER_ELEMENT),U.__offset=F}}let E=v%w;return E>0&&(v+=w-E),y.__size=v,y.__cache={},this}function _(y,M){let v={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(v.boundary=4,v.storage=4):y.isVector2?(v.boundary=8,v.storage=8):y.isVector3||y.isColor?(v.boundary=16,v.storage=12):y.isVector4?(v.boundary=16,v.storage=16):y.isMatrix3?(v.boundary=16,v.storage=48):y.isMatrix4?(v.boundary=16,v.storage=64):y.isTexture?Rt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(v.boundary=16,v.storage=y.byteLength):Rt("WebGLRenderer: Unsupported uniform value type.",y),M===!0&&(v.boundary=16,v.storage=Math.ceil(v.storage/16)*16),v}function m(y){let M=y.target;M.removeEventListener("dispose",m),s.deleteBuffer(i[M.id]),delete i[M.id],delete r[M.id]}function g(){for(let y in i)s.deleteBuffer(i[y]);i={},r={}}return{bind:a,update:o,dispose:g}}var _b=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),wi=null;function xb(){return wi===null&&(wi=new mn(_b,16,16,qi,qn),wi.name="DFG_LUT",wi.minFilter=Ee,wi.magFilter=Ee,wi.wrapS=pn,wi.wrapT=pn,wi.generateMipmaps=!1,wi.needsUpdate=!0),wi}var ic=class{constructor(t={}){let{canvas:e=bf(),context:n=null,depth:i=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1,outputBufferType:d=xn}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;let _=d,m=new Set([Sl,Ml,Ca]),g=new Set([xn,Un,ur,ys,xl,yl]),y=new Uint32Array(4),M=new Int32Array(4),v={textures:[],min:[],max:[],resolution:[]},w=null,E=null,x=[],S=[],P=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ui,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let R=this,I=!1,U=null,O=null,C=null,F=null;this._outputColorSpace=je;let H=0,B=0,Q=null,k=-1,tt=null,J=new _e,Z=new _e,ht=null,X=new Lt(0),q=0,$=e.width,lt=e.height,Y=1,W=null,mt=null,pt=new _e(0,0,$,lt),St=new _e(0,0,$,lt),Ct=!1,nt=new xi,ft=new jr,_t=!1,Dt=!1,Mt=new Zt,qt=new L,Ft=new _e,ee={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ne=!1;function ae(){return Q===null?Y:1}let V=n;function Te(A,G){return e.getContext(A,G)}let Qt,he,Et,be,Nt,Wt,D,T,K,xt,ut,vt,Tt,at,ot,bt,b,N,z,it,rt,dt,yt;try{let A={alpha:!0,depth:i,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"187"}`),e.addEventListener("webglcontextlost",Gt,!1),e.addEventListener("webglcontextrestored",Jt,!1),e.addEventListener("webglcontextcreationerror",It,!1),V===null){let G="webgl2";if(V=Te(G,A),V===null)throw Te(G)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Xt()}catch(A){throw e.removeEventListener("webglcontextlost",Gt,!1),e.removeEventListener("webglcontextrestored",Jt,!1),e.removeEventListener("webglcontextcreationerror",It,!1),Ht("WebGLRenderer: "+A.message),A}function Xt(){Qt=new PM(V),Qt.init(),rt=new dg(V,Qt),he=new yM(V,Qt,t,rt),Et=new hb(V,Qt),he.reversedDepthBuffer&&f&&Et.buffers.depth.setReversed(!0),O=V.createFramebuffer(),C=V.createFramebuffer(),F=V.createFramebuffer(),be=new DM(V),Nt=new JS,Wt=new ub(V,Qt,Et,Nt,he,rt,be),D=new CM(R),T=new Ux(V),dt=new _M(V,T),K=new IM(V,T,be,dt),xt=new UM(V,K,T,dt,be),N=new NM(V,he,Wt),ot=new vM(Nt),ut=new $S(R,D,Qt,he,dt,ot),vt=new mb(R,Nt),Tt=new jS,at=new sb(Qt),b=new gM(R,D,Et,xt,p,l),bt=new cb(R,xt,he),yt=new gb(V,be,he,Et),z=new xM(V,Qt,be),it=new LM(V,Qt,be),be.programs=ut.programs,R.capabilities=he,R.extensions=Qt,R.properties=Nt,R.renderLists=Tt,R.shadowMap=bt,R.state=Et,R.info=be}_!==xn&&(P=new FM(_,e.width,e.height,o,i,r));let gt=new qf(R,V);this.xr=gt,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let A=Qt.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){let A=Qt.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return Y},this.setPixelRatio=function(A){A!==void 0&&(Y=A,this.setSize($,lt,!1))},this.getSize=function(A){return A.set($,lt)},this.setSize=function(A,G,st=!0){if(gt.isPresenting){Rt("WebGLRenderer: Can't change size while VR device is presenting.");return}$=A,lt=G,e.width=Math.floor(A*Y),e.height=Math.floor(G*Y),st===!0&&(e.style.width=A+"px",e.style.height=G+"px"),P!==null&&P.setSize(e.width,e.height),this.setViewport(0,0,A,G)},this.getDrawingBufferSize=function(A){return A.set($*Y,lt*Y).floor()},this.setDrawingBufferSize=function(A,G,st){$=A,lt=G,Y=st,e.width=Math.floor(A*st),e.height=Math.floor(G*st),this.setViewport(0,0,A,G)},this.setEffects=function(A){if(_===xn){Ht("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(A){for(let G=0;G<A.length;G++)if(A[G].isOutputPass===!0){Rt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}P.setEffects(A||[])},this.getCurrentViewport=function(A){return A.copy(J)},this.getViewport=function(A){return A.copy(pt)},this.setViewport=function(A,G,st,j){A.isVector4?pt.set(A.x,A.y,A.z,A.w):pt.set(A,G,st,j),Et.viewport(J.copy(pt).multiplyScalar(ae()).round())},this.getScissor=function(A){return A.copy(St)},this.setScissor=function(A,G,st,j){A.isVector4?St.set(A.x,A.y,A.z,A.w):St.set(A,G,st,j),Et.scissor(Z.copy(St).multiplyScalar(ae()).round())},this.getScissorTest=function(){return Ct},this.setScissorTest=function(A){Et.setScissorTest(Ct=A)},this.setOpaqueSort=function(A){W=A},this.setTransparentSort=function(A){mt=A},this.getClearColor=function(A){return A.copy(b.getClearColor())},this.setClearColor=function(){b.setClearColor(...arguments)},this.getClearAlpha=function(){return b.getClearAlpha()},this.setClearAlpha=function(){b.setClearAlpha(...arguments)},this.clear=function(A=!0,G=!0,st=!0){let j=0;if(A){let et=!1;if(Q!==null){let At=Q.texture.format;et=m.has(At)}if(et){let At=Q.texture.type,Bt=g.has(At),wt=b.getClearColor(),Ut=b.getClearAlpha(),Vt=wt.r,Kt=wt.g,se=wt.b;Bt?(y[0]=Vt,y[1]=Kt,y[2]=se,y[3]=Ut,V.clearBufferuiv(V.COLOR,0,y)):(M[0]=Vt,M[1]=Kt,M[2]=se,M[3]=Ut,V.clearBufferiv(V.COLOR,0,M))}else j|=V.COLOR_BUFFER_BIT}G&&(j|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),st&&(j|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),j!==0&&V.clear(j)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(A){A.setRenderer(this),U=A},this.dispose=function(){e.removeEventListener("webglcontextlost",Gt,!1),e.removeEventListener("webglcontextrestored",Jt,!1),e.removeEventListener("webglcontextcreationerror",It,!1),b.dispose(),Tt.dispose(),at.dispose(),Wt.dispose(),Nt.dispose(),D.dispose(),xt.dispose(),K.dispose(),dt.dispose(),yt.dispose(),ut.dispose(),gt.dispose(),gt.removeEventListener("sessionstart",ip),gt.removeEventListener("sessionend",sp),Ms.stop()};function Gt(A){A.preventDefault(),qr("WebGLRenderer: Context Lost."),I=!0}function Jt(){qr("WebGLRenderer: Context Restored."),I=!1;let A=be.autoReset,G=bt.enabled,st=bt.autoUpdate,j=bt.needsUpdate,et=bt.type;Xt(),be.autoReset=A,bt.enabled=G,bt.autoUpdate=st,bt.needsUpdate=j,bt.type=et}function It(A){Ht("WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function xe(A){let G=A.target;G.removeEventListener("dispose",xe),Xe(G)}function Xe(A){$i(A),Nt.remove(A)}function $i(A){let G=Nt.get(A).programs;G!==void 0&&(G.forEach(function(st){ut.releaseProgram(st)}),A.isShaderMaterial&&ut.releaseShaderCache(A))}this.renderBufferDirect=function(A,G,st,j,et,At){G===null&&(G=ee);let Bt=et.isMesh&&et.matrixWorld.determinantAffine()<0,wt=Lg(A,G,st,j,et);Et.setMaterial(j,Bt);let Ut=st.index,Vt=1;if(j.wireframe===!0){if(Ut=K.getWireframeAttribute(st),Ut===void 0)return;Vt=2}let Kt=st.drawRange,se=st.attributes.position,zt=Kt.start*Vt,re=(Kt.start+Kt.count)*Vt;At!==null&&(zt=Math.max(zt,At.start*Vt),re=Math.min(re,(At.start+At.count)*Vt)),Ut!==null?(zt=Math.max(zt,0),re=Math.min(re,Ut.count)):se!=null&&(zt=Math.max(zt,0),re=Math.min(re,se.count));let Oe=re-zt;if(Oe<0||Oe===1/0)return;dt.setup(et,j,wt,st,Ut);let Se,Me=z;if(Ut!==null&&(Se=T.get(Ut),Me=it,Me.setIndex(Se)),et.isMesh)j.wireframe===!0?(Et.setLineWidth(j.wireframeLinewidth*ae()),Me.setMode(V.LINES)):Me.setMode(V.TRIANGLES);else if(et.isLine){let tn=j.linewidth;tn===void 0&&(tn=1),Et.setLineWidth(tn*ae()),et.isLineSegments?Me.setMode(V.LINES):et.isLineLoop?Me.setMode(V.LINE_LOOP):Me.setMode(V.LINE_STRIP)}else et.isPoints?Me.setMode(V.POINTS):et.isSprite&&Me.setMode(V.TRIANGLES);if(et.isBatchedMesh)if(Qt.get("WEBGL_multi_draw"))Me.renderMultiDraw(et._multiDrawStarts,et._multiDrawCounts,et._multiDrawCount);else{let tn=et._multiDrawStarts,kt=et._multiDrawCounts,dn=et._multiDrawCount,de=Ut?T.get(Ut).bytesPerElement:1,Ss=Nt.get(j).currentProgram.getUniforms();for(let en=0;en<dn;en++)Ss.setValue(V,"_gl_DrawID",en),Me.render(tn[en]/de,kt[en])}else if(et.isInstancedMesh)Me.renderInstances(zt,Oe,et.count);else if(st.isInstancedBufferGeometry){let tn=st._maxInstanceCount!==void 0?st._maxInstanceCount:1/0,kt=Math.min(st.instanceCount,tn);Me.renderInstances(zt,Oe,kt)}else Me.render(zt,Oe)};function np(A,G,st,j){U!==null&&A.isNodeMaterial&&U.setObject(j,A),_t===!0&&ot.setState(A,st,!1),A.transparent===!0&&A.side===Nn&&A.forceSinglePass===!1?(A.side=$e,A.needsUpdate=!0,Ha(A,G,j),A.side=Xi,A.needsUpdate=!0,Ha(A,G,j),A.side=Nn):Ha(A,G,j)}this.compile=function(A,G,st=null){st===null&&(st=A),U!==null&&U.renderStart(A,G,st),E=at.get(st),E.init(G),S.push(E),st.traverseVisible(function(et){et.isLight&&et.layers.test(G.layers)&&(E.pushLight(et),et.castShadow&&E.pushShadow(et))}),A!==st&&A.traverseVisible(function(et){et.isLight&&et.layers.test(G.layers)&&(E.pushLight(et),et.castShadow&&E.pushShadow(et))}),E.setupLights(),U!==null&&U.updateLights(E.state.lightsArray),Dt=this.localClippingEnabled,_t=ot.init(this.clippingPlanes,Dt),_t===!0&&ot.setGlobalState(this.clippingPlanes,G),U!==null&&bt.render(E.state.shadowsArray,st,G);let j=new Set;return A.traverse(function(et){if(!(et.isMesh||et.isPoints||et.isLine||et.isSprite))return;let At=et.material;if(At)if(Array.isArray(At))for(let Bt=0;Bt<At.length;Bt++){let wt=At[Bt];np(wt,st,G,et),j.add(wt)}else np(At,st,G,et),j.add(At)}),E=S.pop(),U!==null&&U.renderEnd(),j},this.compileAsync=function(A,G,st=null){let j=this.compile(A,G,st);return new Promise(et=>{function At(){if(j.forEach(function(Bt){let Ut=Nt.get(Bt).currentProgram;(Ut===void 0||Ut.isReady())&&j.delete(Bt)}),j.size===0){et(A);return}setTimeout(At,10)}Qt.get("KHR_parallel_shader_compile")!==null?At():setTimeout(At,10)})};let Vu=null;function Pg(A){Vu&&Vu(A)}function ip(){Ms.stop()}function sp(){Ms.start()}let Ms=new ng;Ms.setAnimationLoop(Pg),typeof self<"u"&&Ms.setContext(self),this.setAnimationLoop=function(A){Vu=A,gt.setAnimationLoop(A),A===null?Ms.stop():Ms.start()},gt.addEventListener("sessionstart",ip),gt.addEventListener("sessionend",sp),this.render=function(A,G){if(G!==void 0&&G.isCamera!==!0){Ht("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;U!==null&&U.renderStart(A,G);let st=gt.enabled===!0&&gt.isPresenting===!0,j=P!==null&&(Q===null||st)&&P.begin(R,Q);if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),gt.enabled===!0&&gt.isPresenting===!0&&(P===null||P.isCompositing()===!1)&&(gt.cameraAutoUpdate===!0&&gt.updateCamera(G),G=gt.getCamera()),A.isScene===!0&&A.onBeforeRender(R,A,G,Q),E=at.get(A,S.length),E.init(G),E.state.textureUnits=Wt.getTextureUnits(),S.push(E),Mt.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),G.isArrayCamera?ft.setFromArrayCamera(G):nt.setFromProjectionMatrix(Mt,bn,G.reversedDepth),Dt=this.localClippingEnabled,_t=ot.init(this.clippingPlanes,Dt),w=Tt.get(A,x.length),w.init(),x.push(w),this.info.render.frame++,gt.enabled===!0&&gt.isPresenting===!0){let Bt=R.xr.getDepthSensingMesh();Bt!==null&&Hu(Bt,G,-1/0,R.sortObjects)}Hu(A,G,0,R.sortObjects),w.finish(),U!==null&&U.updateLights(E.state.lightsArray),R.sortObjects===!0&&w.sort(W,mt),ne=gt.enabled===!1||gt.isPresenting===!1||gt.hasDepthSensing()===!1,ne&&b.addToRenderList(w,A),this.info.autoReset===!0&&this.info.reset(),_t===!0&&ot.beginShadows();let et=E.state.shadowsArray;if(bt.render(et,A,G),_t===!0&&ot.endShadows(),(j&&P.hasRenderPass())===!1){let Bt=w.opaque,wt=w.transmissive;if(E.setupLights(),G.isArrayCamera){let Ut=G.cameras;if(wt.length>0)for(let Vt=0,Kt=Ut.length;Vt<Kt;Vt++){let se=Ut[Vt];ap(Bt,wt,A,se)}ne&&b.render(A);for(let Vt=0,Kt=Ut.length;Vt<Kt;Vt++){let se=Ut[Vt];rp(w,A,se,se.viewport)}}else wt.length>0&&ap(Bt,wt,A,G),ne&&b.render(A),rp(w,A,G)}Q!==null&&B===0&&(Wt.updateMultisampleRenderTarget(Q),Wt.updateRenderTargetMipmap(Q)),j&&P.end(R),A.isScene===!0&&A.onAfterRender(R,A,G),dt.resetDefaultState(),k=-1,tt=null,S.pop(),S.length>0?(E=S[S.length-1],Wt.setTextureUnits(E.state.textureUnits),_t===!0&&ot.setGlobalState(R.clippingPlanes,E.state.camera)):E=null,x.pop(),x.length>0?w=x[x.length-1]:w=null,U!==null&&U.renderEnd()};function Hu(A,G,st,j){if(A.visible===!1)return;if(A.layers.test(G.layers)){if(A.isGroup)st=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(G);else if(A.isLight)E.pushLight(A),A.castShadow&&E.pushShadow(A);else if(A.isSprite){let Bt=G.isArrayCamera?ft:nt;if(!A.frustumCulled||A.intersectsFrustum(Bt)){j&&Ft.setFromMatrixPosition(A.matrixWorld).applyMatrix4(Mt);let wt=xt.update(A),Ut=A.material;Ut.visible&&w.push(A,wt,Ut,st,Ft.z,null,G)}}else if(A.isMesh||A.isLine||A.isPoints){let Bt=G.isArrayCamera?ft:nt;if(!A.frustumCulled||A.intersectsFrustum(Bt)){let wt=xt.update(A),Ut=A.material;if(j&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),Ft.copy(A.boundingSphere.center)):(wt.boundingSphere===null&&wt.computeBoundingSphere(),Ft.copy(wt.boundingSphere.center)),Ft.applyMatrix4(A.matrixWorld).applyMatrix4(Mt)),Array.isArray(Ut)){let Vt=wt.groups;for(let Kt=0,se=Vt.length;Kt<se;Kt++){let zt=Vt[Kt],re=Ut[zt.materialIndex];re&&re.visible&&w.push(A,wt,re,st,Ft.z,zt,G)}}else Ut.visible&&w.push(A,wt,Ut,st,Ft.z,null,G)}}}let At=A.children;for(let Bt=0,wt=At.length;Bt<wt;Bt++)Hu(At[Bt],G,st,j)}function rp(A,G,st,j){let{opaque:et,transmissive:At,transparent:Bt}=A;E.setupLightsView(st),_t===!0&&ot.setGlobalState(R.clippingPlanes,st),j&&Et.viewport(J.copy(j)),et.length>0&&oc(et,G,st),At.length>0&&oc(At,G,st),Bt.length>0&&oc(Bt,G,st),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function ap(A,G,st,j){if((st.isScene===!0?st.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[j.id]===void 0){let zt=Qt.has("EXT_color_buffer_half_float")||Qt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[j.id]=new cn(1,1,{generateMipmaps:!0,type:zt?qn:xn,minFilter:Xn,samples:Math.max(4,he.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ie.workingColorSpace})}let At=E.state.transmissionRenderTarget[j.id],Bt=j.viewport||J;At.setSize(Bt.z*R.transmissionResolutionScale,Bt.w*R.transmissionResolutionScale);let wt=R.getRenderTarget(),Ut=R.getActiveCubeFace(),Vt=R.getActiveMipmapLevel();R.setRenderTarget(At),R.getClearColor(X),q=R.getClearAlpha(),q<1&&R.setClearColor(16777215,.5),R.clear(),ne&&b.render(st);let Kt=R.toneMapping;R.toneMapping=ui;let se=j.viewport;if(j.viewport!==void 0&&(j.viewport=void 0),E.setupLightsView(j),_t===!0&&ot.setGlobalState(R.clippingPlanes,j),oc(A,st,j),Wt.updateMultisampleRenderTarget(At),Wt.updateRenderTargetMipmap(At),Qt.has("WEBGL_multisampled_render_to_texture")===!1){let zt=!1;for(let re=0,Oe=G.length;re<Oe;re++){let Se=G[re],{object:Me,geometry:tn,material:kt,group:dn}=Se;if(kt.side===Nn&&Me.layers.test(j.layers)){let de=kt.side;kt.side=$e,kt.needsUpdate=!0,op(Me,st,j,tn,kt,dn),kt.side=de,kt.needsUpdate=!0,zt=!0}}zt===!0&&(Wt.updateMultisampleRenderTarget(At),Wt.updateRenderTargetMipmap(At))}R.setRenderTarget(wt,Ut,Vt),R.setClearColor(X,q),se!==void 0&&(j.viewport=se),R.toneMapping=Kt}function oc(A,G,st){let j=G.isScene===!0?G.overrideMaterial:null;for(let et=0,At=A.length;et<At;et++){let Bt=A[et],{object:wt,geometry:Ut,group:Vt}=Bt,Kt=Bt.material;Kt.allowOverride===!0&&j!==null&&(Kt=j),wt.layers.test(st.layers)&&op(wt,G,st,Ut,Kt,Vt)}}function op(A,G,st,j,et,At){U!==null&&et.isNodeMaterial&&U.setObject(A,et),A.onBeforeRender(R,G,st,j,et,At),A.modelViewMatrix.multiplyMatrices(st.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),et.onBeforeRender(R,G,st,j,A,At),et.transparent===!0&&et.side===Nn&&et.forceSinglePass===!1?(et.side=$e,et.needsUpdate=!0,R.renderBufferDirect(st,G,j,et,A,At),et.side=Xi,et.needsUpdate=!0,R.renderBufferDirect(st,G,j,et,A,At),et.side=Nn):R.renderBufferDirect(st,G,j,et,A,At),A.onAfterRender(R,G,st,j,et,At)}function lp(A){let G=0;for(let st of A)st.texture!==null&&G++;return G}function Ha(A,G,st){G.isScene!==!0&&(G=ee);let j=Nt.get(A),et=E.state.lights,At=E.state.shadowsArray,Bt=et.state.version,wt=ut.getParameters(A,et.state,At,G,st,E.state.lightProbeGridArray),Ut=ut.getProgramCacheKey(wt),Vt=j.programs;j.environment=A.isMeshStandardMaterial||A.isMeshLambertMaterial||A.isMeshPhongMaterial?G.environment:null,j.fog=G.fog;let Kt=A.isMeshStandardMaterial||A.isMeshLambertMaterial&&!A.envMap||A.isMeshPhongMaterial&&!A.envMap;j.envMap=D.get(A.envMap||j.environment,Kt),j.envMapRotation=j.environment!==null&&A.envMap===null?G.environmentRotation:A.envMapRotation,Vt===void 0&&(A.addEventListener("dispose",xe),Vt=new Map,j.programs=Vt,j.programVariants=new Map);let se=Vt.get(Ut);if(se!==void 0){if(j.currentProgram===se&&j.lightsStateVersion===Bt)return hp(A,wt),se}else wt.uniforms=ut.getUniforms(A),U!==null&&A.isNodeMaterial&&U.build(A,st,wt),A.onBeforeCompile(wt,R),se=ut.acquireProgram(wt,Ut),Vt.set(Ut,se),j.uniforms=wt.uniforms;let zt=j.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(zt.clippingPlanes=ot.uniform),hp(A,wt),j.needsLights=Ng(A),j.lightsStateVersion=Bt,j.needsLights&&(zt.ambientLightColor.value=et.state.ambient,zt.lightProbe.value=et.state.probe,zt.sunLights.value=et.state.sun,zt.sunLightShadows.value=et.state.sunShadow,zt.directionalLights.value=et.state.directional,zt.directionalLightShadows.value=et.state.directionalShadow,zt.spotLights.value=et.state.spot,zt.spotLightShadows.value=et.state.spotShadow,zt.rectAreaLights.value=et.state.rectArea,zt.ltc_1.value=et.state.rectAreaLTC1,zt.ltc_2.value=et.state.rectAreaLTC2,zt.pointLights.value=et.state.point,zt.pointLightShadows.value=et.state.pointShadow,zt.hemisphereLights.value=et.state.hemi,zt.sunShadowMatrix.value=et.state.sunShadowMatrix,zt.sunShadowCascade.value=et.state.sunShadowCascade,zt.directionalShadowMatrix.value=et.state.directionalShadowMatrix,zt.spotLightMatrix.value=et.state.spotLightMatrix,zt.spotLightMap.value=et.state.spotLightMap,zt.pointShadowMatrix.value=et.state.pointShadowMatrix),j.numLightProbeGrids=lp(E.state.lightProbeGridArray),j.currentProgram=se,j.uniformsList=null,se}function Ig(A,G,st,j,et){let At=Nt.get(A),Bt=At.currentProgram.id+","+j+","+et,wt=At.programVariants.get(Bt);return wt===void 0?(wt=Ha(A,G,st),At.programVariants.set(Bt,wt)):(At.currentProgram=wt,At.uniformsList=null,At.outputColorSpace=j,At.toneMapping=et),wt}function cp(A){if(A.uniformsList===null){let G=A.currentProgram.getUniforms();A.uniformsList=Oa.seqWithValue(G.seq,A.uniforms)}return A.uniformsList}function hp(A,G){let st=Nt.get(A);st.outputColorSpace=G.outputColorSpace,st.batching=G.batching,st.batchingColor=G.batchingColor,st.instancing=G.instancing,st.instancingColor=G.instancingColor,st.instancingMorph=G.instancingMorph,st.skinning=G.skinning,st.morphTargets=G.morphTargets,st.morphNormals=G.morphNormals,st.morphColors=G.morphColors,st.morphTargetsCount=G.morphTargetsCount,st.numClippingPlanes=G.numClippingPlanes,st.numIntersection=G.numClipIntersection,st.vertexAlphas=G.vertexAlphas,st.vertexTangents=G.vertexTangents,st.toneMapping=G.toneMapping}function Lg(A,G,st,j,et){G.isScene!==!0&&(G=ee),Wt.resetTextureUnits();let At=G.fog,Bt=j.isMeshStandardMaterial||j.isMeshLambertMaterial||j.isMeshPhongMaterial?G.environment:null,wt=Q===null?R.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:ie.workingColorSpace,Ut=j.isMeshStandardMaterial||j.isMeshLambertMaterial&&!j.envMap||j.isMeshPhongMaterial&&!j.envMap,Vt=D.get(j.envMap||Bt,Ut),Kt=j.vertexColors===!0&&!!st.attributes.color&&st.attributes.color.itemSize===4,se=!!st.attributes.tangent&&(!!j.normalMap||j.anisotropy>0),zt=!!st.morphAttributes.position,re=!!st.morphAttributes.normal,Oe=!!st.morphAttributes.color,Se=ui;j.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Se=R.toneMapping);let Me=st.morphAttributes.position||st.morphAttributes.normal||st.morphAttributes.color,tn=Me!==void 0?Me.length:0,kt=Nt.get(j),dn=E.state.lights;if(_t===!0&&(Dt===!0||A!==tt)){let we=A===tt&&j.id===k;ot.setState(j,A,we)}let de=!1,Ss=!1;j.version===kt.__version?kt.needsLights&&kt.lightsStateVersion!==dn.state.version||et.isBatchedMesh&&kt.batching===!1||!et.isBatchedMesh&&kt.batching===!0||et.isBatchedMesh&&kt.batchingColor===!0&&et._colorsTexture===null||et.isBatchedMesh&&kt.batchingColor===!1&&et._colorsTexture!==null||et.isInstancedMesh&&kt.instancing===!1||!et.isInstancedMesh&&kt.instancing===!0||et.isSkinnedMesh&&kt.skinning===!1||!et.isSkinnedMesh&&kt.skinning===!0||et.isInstancedMesh&&kt.instancingColor===!0&&et.instanceColor===null||et.isInstancedMesh&&kt.instancingColor===!1&&et.instanceColor!==null||et.isInstancedMesh&&kt.instancingMorph===!0&&et.morphTexture===null||et.isInstancedMesh&&kt.instancingMorph===!1&&et.morphTexture!==null||kt.envMap!==Vt||j.fog===!0&&kt.fog!==At||kt.numClippingPlanes!==void 0&&(kt.numClippingPlanes!==ot.numPlanes||kt.numIntersection!==ot.numIntersection)||kt.vertexAlphas!==Kt||kt.vertexTangents!==se||kt.morphTargets!==zt||kt.morphNormals!==re||kt.morphColors!==Oe||kt.morphTargetsCount!==tn||kt.numLightProbeGrids!==lp(E.state.lightProbeGridArray)?de=!0:(kt.outputColorSpace!==wt||kt.toneMapping!==Se)&&(Ss=!0):(de=!0,kt.__version=j.version);let en=kt.currentProgram;(de===!0||Ss===!0)&&(en=Ss===!0?Ig(j,G,et,wt,Se):Ha(j,G,et),U&&j.isNodeMaterial&&U.onUpdateProgram(j,en,kt));let lc=!1,Ji=!1,bs=!1,le=en.getUniforms(),Ke=kt.uniforms;if(Et.useProgram(en.program)&&(lc=!0,Ji=!0,bs=!0),j.id!==k&&(k=j.id,Ji=!0),lc||tt!==A){Et.buffers.depth.getReversed()&&A.reversedDepth!==!0&&(A._reversedDepth=!0,A.updateProjectionMatrix()),le.setValue(V,"projectionMatrix",A.projectionMatrix),le.setValue(V,"viewMatrix",A.matrixWorldInverse);let qe=le.map.cameraPosition;qe!==void 0&&qe.setValue(V,qt.setFromMatrixPosition(A.matrixWorld)),he.logarithmicDepthBuffer&&le.setValue(V,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(j.isMeshPhongMaterial||j.isMeshToonMaterial||j.isMeshLambertMaterial||j.isMeshBasicMaterial||j.isMeshStandardMaterial||j.isShaderMaterial)&&le.setValue(V,"isOrthographic",A.isOrthographicCamera===!0),tt!==A&&(tt=A,Ji=!0,bs=!0)}if(kt.needsLights&&(dn.state.sunShadowMap.length>0&&le.setValue(V,"sunShadowMap",dn.state.sunShadowMap,Wt),dn.state.directionalShadowMap.length>0&&le.setValue(V,"directionalShadowMap",dn.state.directionalShadowMap,Wt),dn.state.spotShadowMap.length>0&&le.setValue(V,"spotShadowMap",dn.state.spotShadowMap,Wt),dn.state.pointShadowMap.length>0&&le.setValue(V,"pointShadowMap",dn.state.pointShadowMap,Wt)),et.isSkinnedMesh){le.setOptional(V,et,"bindMatrix"),le.setOptional(V,et,"bindMatrixInverse");let we=et.skeleton;we&&(we.boneTexture===null&&we.computeBoneTexture(),le.setValue(V,"boneTexture",we.boneTexture,Wt))}et.isBatchedMesh&&(le.setOptional(V,et,"batchingTexture"),le.setValue(V,"batchingTexture",et._matricesTexture,Wt),le.setOptional(V,et,"batchingIdTexture"),le.setValue(V,"batchingIdTexture",et._indirectTexture,Wt),le.setOptional(V,et,"batchingColorTexture"),et._colorsTexture!==null&&le.setValue(V,"batchingColorTexture",et._colorsTexture,Wt));let jn=st.morphAttributes;if((jn.position!==void 0||jn.normal!==void 0||jn.color!==void 0)&&N.update(et,st,en),(Ji||kt.receiveShadow!==et.receiveShadow)&&(kt.receiveShadow=et.receiveShadow,le.setValue(V,"receiveShadow",et.receiveShadow)),(j.isMeshStandardMaterial||j.isMeshLambertMaterial||j.isMeshPhongMaterial)&&j.envMap===null&&G.environment!==null&&(Ke.envMapIntensity.value=G.environmentIntensity),Ke.dfgLUT!==void 0&&(Ke.dfgLUT.value=xb()),Ji){if(le.setValue(V,"toneMappingExposure",R.toneMappingExposure),kt.needsLights&&Dg(Ke,bs),At&&j.fog===!0&&vt.refreshFogUniforms(Ke,At),vt.refreshMaterialUniforms(Ke,j,Y,lt,E.state.transmissionRenderTarget[A.id]),kt.needsLights&&kt.numLightProbeGrids>0){let we=v,qe=0;for(let Ci of E.state.lightProbeGridArray)Ci.texture!==null&&(we.textures[qe]=Ci.texture,we.min[qe]=Ci.boundingBox.min,we.max[qe]=Ci.boundingBox.max,we.resolution[qe]=Ci.resolution,qe++);for(let Ci in we)we[Ci].length=qe;Ke.probesSH.value=we.textures,Ke.probesMin.value=we.min,Ke.probesMax.value=we.max,Ke.probesResolution.value=we.resolution}Oa.upload(V,cp(kt),Ke,Wt)}if(j.isShaderMaterial&&j.uniformsNeedUpdate===!0&&(Oa.upload(V,cp(kt),Ke,Wt),j.uniformsNeedUpdate=!1),j.isSpriteMaterial&&le.setValue(V,"center",et.center),le.setValue(V,"modelViewMatrix",et.modelViewMatrix),le.setValue(V,"normalMatrix",et.normalMatrix),le.setValue(V,"modelMatrix",et.matrixWorld),j.uniformsGroups!==void 0){let we=j.uniformsGroups;for(let qe=0,Ci=we.length;qe<Ci;qe++){let dp=we[qe];yt.update(dp,en),yt.bind(dp,en)}}return en}function Dg(A,G){A.ambientLightColor.needsUpdate=G,A.lightProbe.needsUpdate=G,A.sunLights.needsUpdate=G,A.sunLightShadows.needsUpdate=G,A.directionalLights.needsUpdate=G,A.directionalLightShadows.needsUpdate=G,A.pointLights.needsUpdate=G,A.pointLightShadows.needsUpdate=G,A.spotLights.needsUpdate=G,A.spotLightShadows.needsUpdate=G,A.rectAreaLights.needsUpdate=G,A.hemisphereLights.needsUpdate=G}function Ng(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return H},this.getActiveMipmapLevel=function(){return B},this.getRenderTarget=function(){return Q},this.setRenderTargetTextures=function(A,G,st){let j=Nt.get(A);j.__autoAllocateDepthBuffer=A.resolveDepthBuffer===!1,j.__autoAllocateDepthBuffer===!1&&(j.__useRenderToTexture=!1),Nt.get(A.texture).__webglTexture=G,Nt.get(A.depthTexture).__webglTexture=j.__autoAllocateDepthBuffer?void 0:st,j.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(A,G){let st=Nt.get(A);st.__webglFramebuffer=G,st.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(A,G=0,st=0){Q=A,H=G,B=st;let j=null,et=!1,At=!1;if(A){let wt=Nt.get(A);if(wt.__useDefaultFramebuffer!==void 0){Et.bindFramebuffer(V.FRAMEBUFFER,wt.__webglFramebuffer),J.copy(A.viewport),Z.copy(A.scissor),ht=A.scissorTest,Et.viewport(J),Et.scissor(Z),Et.setScissorTest(ht),k=-1;return}else if(wt.__webglFramebuffer===void 0)Wt.setupRenderTarget(A);else if(wt.__hasExternalTextures)Wt.rebindTextures(A,Nt.get(A.texture).__webglTexture,Nt.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){let Kt=A.depthTexture;if(wt.__boundDepthTexture!==Kt){if(Kt!==null&&Nt.has(Kt)&&(A.width!==Kt.image.width||A.height!==Kt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Wt.setupDepthRenderbuffer(A)}}let Ut=A.texture;(Ut.isData3DTexture||Ut.isDataArrayTexture||Ut.isCompressedArrayTexture)&&(At=!0);let Vt=Nt.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Vt[G])?j=Vt[G][st]:j=Vt[G],et=!0):A.samples>0&&Wt.useMultisampledRTT(A)===!1?j=Nt.get(A).__webglMultisampledFramebuffer:Array.isArray(Vt)?j=Vt[st]:j=Vt,J.copy(A.viewport),Z.copy(A.scissor),ht=A.scissorTest}else J.copy(pt).multiplyScalar(Y).floor(),Z.copy(St).multiplyScalar(Y).floor(),ht=Ct;if(st!==0&&(j=O),Et.bindFramebuffer(V.FRAMEBUFFER,j)&&Et.drawBuffers(A,j),Et.viewport(J),Et.scissor(Z),Et.setScissorTest(ht),et){let wt=Nt.get(A.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+G,wt.__webglTexture,st)}else if(At){let wt=G;for(let Ut=0;Ut<A.textures.length;Ut++){let Vt=Nt.get(A.textures[Ut]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+Ut,Vt.__webglTexture,st,wt)}}else if(A!==null&&st!==0){let wt=Nt.get(A.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,wt.__webglTexture,st)}k=-1};function up(A){let G=Nt.get(A);return(G.__readFormat!==A.format||G.__readType!==A.type)&&(G.__readFormat=A.format,G.__readType=A.type,G.__formatReadable=he.textureFormatReadable(A.format),G.__typeReadable=he.textureTypeReadable(A.type)),G}this.readRenderTargetPixels=function(A,G,st,j,et,At,Bt,wt=0){if(!(A&&A.isWebGLRenderTarget)){Ht("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ut=Nt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Bt!==void 0&&(Ut=Ut[Bt],Array.isArray(Ut)&&(Ut=Ut[0])),Ut){Et.bindFramebuffer(V.FRAMEBUFFER,Ut);try{let Vt=A.textures[wt],Kt=Vt.format,se=Vt.type;A.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+wt);let zt=up(Vt);if(zt.__formatReadable===!1){Ht("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(zt.__typeReadable===!1){Ht("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=A.width-j&&st>=0&&st<=A.height-et&&V.readPixels(G,st,j,et,rt.convert(Kt),rt.convert(se),At)}finally{let Vt=Q!==null?Nt.get(Q).__webglFramebuffer:null;Et.bindFramebuffer(V.FRAMEBUFFER,Vt)}}},this.readRenderTargetPixelsAsync=async function(A,G,st,j,et,At,Bt,wt=0){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ut=Nt.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&Bt!==void 0&&(Ut=Ut[Bt],Array.isArray(Ut)&&(Ut=Ut[0])),Ut)if(G>=0&&G<=A.width-j&&st>=0&&st<=A.height-et){Et.bindFramebuffer(V.FRAMEBUFFER,Ut);let Vt=A.textures[wt],Kt=Vt.format,se=Vt.type;A.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+wt);let zt=up(Vt);if(zt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(zt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let re=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,re),V.bufferData(V.PIXEL_PACK_BUFFER,At.byteLength,V.STREAM_READ),V.readPixels(G,st,j,et,rt.convert(Kt),rt.convert(se),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);let Oe=Q!==null?Nt.get(Q).__webglFramebuffer:null;Et.bindFramebuffer(V.FRAMEBUFFER,Oe);let Se=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await bm(V,Se,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,re),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,At),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(re),V.deleteSync(Se),At}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(A,G=null,st=0){let j=Math.pow(2,-st),et=Math.floor(A.image.width*j),At=Math.floor(A.image.height*j),Bt=G!==null?G.x:0,wt=G!==null?G.y:0;Wt.setTexture2D(A,0),V.copyTexSubImage2D(V.TEXTURE_2D,st,0,0,Bt,wt,et,At),Et.unbindTexture()},this.copyTextureToTexture=function(A,G,st=null,j=null,et=0,At=0){let Bt,wt,Ut,Vt,Kt,se,zt,re,Oe,Se=A.isCompressedTexture?A.mipmaps[At]:A.image;if(st!==null)Bt=st.max.x-st.min.x,wt=st.max.y-st.min.y,Ut=st.isBox3?st.max.z-st.min.z:1,Vt=st.min.x,Kt=st.min.y,se=st.isBox3?st.min.z:0;else{let le=Math.pow(2,-et);Bt=Math.floor(Se.width*le),wt=Math.floor(Se.height*le),A.isDataArrayTexture?Ut=Se.depth:A.isData3DTexture?Ut=Math.floor(Se.depth*le):Ut=1,Vt=0,Kt=0,se=0}j!==null?(zt=j.x,re=j.y,Oe=j.z):(zt=0,re=0,Oe=0);let Me=rt.convert(G.format),tn=rt.convert(G.type),kt;G.isData3DTexture?(Wt.setTexture3D(G,0),kt=V.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(Wt.setTexture2DArray(G,0),kt=V.TEXTURE_2D_ARRAY):(Wt.setTexture2D(G,0),kt=V.TEXTURE_2D),Et.activeTexture(V.TEXTURE0),Et.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,G.flipY),Et.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),Et.pixelStorei(V.UNPACK_ALIGNMENT,G.unpackAlignment);let dn=Et.getParameter(V.UNPACK_ROW_LENGTH),de=Et.getParameter(V.UNPACK_IMAGE_HEIGHT),Ss=Et.getParameter(V.UNPACK_SKIP_PIXELS),en=Et.getParameter(V.UNPACK_SKIP_ROWS),lc=Et.getParameter(V.UNPACK_SKIP_IMAGES);Et.pixelStorei(V.UNPACK_ROW_LENGTH,Se.width),Et.pixelStorei(V.UNPACK_IMAGE_HEIGHT,Se.height),Et.pixelStorei(V.UNPACK_SKIP_PIXELS,Vt),Et.pixelStorei(V.UNPACK_SKIP_ROWS,Kt),Et.pixelStorei(V.UNPACK_SKIP_IMAGES,se);let Ji=A.isDataArrayTexture||A.isData3DTexture,bs=G.isDataArrayTexture||G.isData3DTexture;if(A.isDepthTexture){let le=Nt.get(A),Ke=Nt.get(G),jn=Nt.get(le.__renderTarget),we=Nt.get(Ke.__renderTarget);Et.bindFramebuffer(V.READ_FRAMEBUFFER,jn.__webglFramebuffer),Et.bindFramebuffer(V.DRAW_FRAMEBUFFER,we.__webglFramebuffer);for(let qe=0;qe<Ut;qe++)Ji&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Nt.get(A).__webglTexture,et,se+qe),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Nt.get(G).__webglTexture,At,Oe+qe)),V.blitFramebuffer(Vt,Kt,Vt+Bt,Kt+wt,zt,re,zt+Bt,re+wt,V.DEPTH_BUFFER_BIT,V.NEAREST);Et.bindFramebuffer(V.READ_FRAMEBUFFER,null),Et.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(et!==0||A.isRenderTargetTexture||Nt.has(A)){let le=Nt.get(A),Ke=Nt.get(G);Et.bindFramebuffer(V.READ_FRAMEBUFFER,C),Et.bindFramebuffer(V.DRAW_FRAMEBUFFER,F);for(let jn=0;jn<Ut;jn++)Ji?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,le.__webglTexture,et,se+jn):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,le.__webglTexture,et),bs?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,Ke.__webglTexture,At,Oe+jn):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,Ke.__webglTexture,At),et!==0?V.blitFramebuffer(Vt,Kt,Vt+Bt,Kt+wt,zt,re,zt+Bt,re+wt,V.COLOR_BUFFER_BIT,V.NEAREST):bs?V.copyTexSubImage3D(kt,At,zt,re,Oe+jn,Vt,Kt,Bt,wt):V.copyTexSubImage2D(kt,At,zt,re,Vt,Kt,Bt,wt);Et.bindFramebuffer(V.READ_FRAMEBUFFER,null),Et.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else bs?A.isDataTexture||A.isData3DTexture?V.texSubImage3D(kt,At,zt,re,Oe,Bt,wt,Ut,Me,tn,Se.data):G.isCompressedArrayTexture?V.compressedTexSubImage3D(kt,At,zt,re,Oe,Bt,wt,Ut,Me,Se.data):V.texSubImage3D(kt,At,zt,re,Oe,Bt,wt,Ut,Me,tn,Se):A.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,At,zt,re,Bt,wt,Me,tn,Se.data):A.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,At,zt,re,Se.width,Se.height,Me,Se.data):V.texSubImage2D(V.TEXTURE_2D,At,zt,re,Bt,wt,Me,tn,Se);Et.pixelStorei(V.UNPACK_ROW_LENGTH,dn),Et.pixelStorei(V.UNPACK_IMAGE_HEIGHT,de),Et.pixelStorei(V.UNPACK_SKIP_PIXELS,Ss),Et.pixelStorei(V.UNPACK_SKIP_ROWS,en),Et.pixelStorei(V.UNPACK_SKIP_IMAGES,lc),At===0&&G.generateMipmaps===!0&&G.mipmapsAutoUpdate===!0&&V.generateMipmap(kt),Et.unbindTexture()},this.initRenderTarget=function(A){Nt.get(A).__webglFramebuffer===void 0&&Wt.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?Wt.setTextureCube(A,0):A.isData3DTexture?Wt.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?Wt.setTexture2DArray(A,0):Wt.setTexture2D(A,0),Et.unbindTexture()},this.resetState=function(){H=0,B=0,Q=null,Et.reset(),dt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=ie._getDrawingBufferColorSpace(t),e.unpackColorSpace=ie._getUnpackColorSpace()}};var pg={type:"change"},$f={type:"start"},gg={type:"end"},Uu=new ai,mg=new on,yb=Math.cos(70*Cu.DEG2RAD),We=new L,An=2*Math.PI,pe={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Zf=1e-6,Ou=class extends ba{constructor(t,e=null){super(t,e),this.state=pe.NONE,this.target=new L,this.cursor=new L,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Hi.ROTATE,MIDDLE:Hi.DOLLY,RIGHT:Hi.PAN},this.touches={ONE:Wi.ROTATE,TWO:Wi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new L,this._lastQuaternion=new Ne,this._lastTargetPosition=new L,this._quat=new Ne().setFromUnitVectors(t.up,new L(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new or,this._sphericalDelta=new or,this._scale=1,this._panOffset=new L,this._rotateStart=new ct,this._rotateEnd=new ct,this._rotateDelta=new ct,this._panStart=new ct,this._panEnd=new ct,this._panDelta=new ct,this._dollyStart=new ct,this._dollyEnd=new ct,this._dollyDelta=new ct,this._dollyDirection=new L,this._mouse=new ct,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=Mb.bind(this),this._onPointerDown=vb.bind(this),this._onPointerUp=Sb.bind(this),this._onContextMenu=Cb.bind(this),this._onMouseWheel=Tb.bind(this),this._onKeyDown=wb.bind(this),this._onTouchStart=Ab.bind(this),this._onTouchMove=Rb.bind(this),this._onMouseDown=bb.bind(this),this._onMouseMove=Eb.bind(this),this._interceptControlDown=Pb.bind(this),this._interceptControlUp=Ib.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.ownerDocument.addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=pe.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.ownerDocument.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(pg),this.update(),this.state=pe.NONE}pan(t,e){this._pan(t,e),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let e=this.object.position;We.copy(e).sub(this.target),We.applyQuaternion(this._quat),this._spherical.setFromVector3(We),this.autoRotate&&this.state===pe.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,i=this.maxAzimuthAngle;isFinite(n)&&isFinite(i)&&(n<-Math.PI?n+=An:n>Math.PI&&(n-=An),i<-Math.PI?i+=An:i>Math.PI&&(i-=An),n<=i?this._spherical.theta=Math.max(n,Math.min(i,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+i)/2?Math.max(n,this._spherical.theta):Math.min(i,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(We.setFromSpherical(this._spherical),We.applyQuaternion(this._quatInverse),e.copy(this.target).add(We),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){let o=We.length();a=this._clampDistance(o*this._scale);let l=o-a;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),r=!!l}else if(this.object.isOrthographicCamera){let o=new L(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=l!==this.object.zoom;let c=new L(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),a=We.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(Uu.origin.copy(this.object.position),Uu.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Uu.direction))<yb?this.object.lookAt(this.target):(mg.setFromNormalAndCoplanarPoint(this.object.up,this.target),Uu.intersectPlane(mg,this.target))))}else if(this.object.isOrthographicCamera){let a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Zf||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Zf||this._lastTargetPosition.distanceToSquared(this.target)>Zf?(this.dispatchEvent(pg),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?An/60*this.autoRotateSpeed*t:An/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){We.setFromMatrixColumn(e,0),We.multiplyScalar(-t),this._panOffset.add(We)}_panUp(t,e){this.screenSpacePanning===!0?We.setFromMatrixColumn(e,1):(We.setFromMatrixColumn(e,0),We.crossVectors(this.object.up,We)),We.multiplyScalar(t),this._panOffset.add(We)}_pan(t,e){let n=this.domElement;if(this.object.isPerspectiveCamera){let i=this.object.position;We.copy(i).sub(this.target);let r=We.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),i=t-n.left,r=e-n.top,a=n.width,o=n.height;this._mouse.x=i/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientY),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(An*this._rotateDelta.x/e.clientHeight),this._rotateUp(An*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.zoomToCursor&&(this._performCursorZoom=!0,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(An*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-An*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(An*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-An*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._rotateStart.set(n,i)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._panStart.set(n,i)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,i=t.pageY-e.y,r=Math.sqrt(n*n+i*i);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(i,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(An*this._rotateDelta.x/e.clientHeight),this._rotateUp(An*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);this._panEnd.set(n,i)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,i=t.pageY-e.y,r=Math.sqrt(n*n+i*i);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new ct,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function vb(s){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(s.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(s)&&(this._addPointer(s),s.pointerType==="touch"?this._onTouchStart(s):this._onMouseDown(s),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function Mb(s){this.enabled!==!1&&(s.pointerType==="touch"?this._onTouchMove(s):this._onMouseMove(s))}function Sb(s){switch(this._removePointer(s),this._pointers.length){case 0:this.domElement.releasePointerCapture(s.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(gg),this.state=pe.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function bb(s){let t;switch(s.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Hi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(s),this.state=pe.DOLLY;break;case Hi.ROTATE:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=pe.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=pe.ROTATE}break;case Hi.PAN:if(s.ctrlKey||s.metaKey||s.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(s),this.state=pe.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(s),this.state=pe.PAN}break;default:this.state=pe.NONE}this.state!==pe.NONE&&this.dispatchEvent($f)}function Eb(s){switch(this.state){case pe.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(s);break;case pe.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(s);break;case pe.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(s);break}}function Tb(s){this.enabled===!1||this.enableZoom===!1||this.state!==pe.NONE||(s.preventDefault(),this.dispatchEvent($f),this._handleMouseWheel(this._customWheelEvent(s)),this.dispatchEvent(gg))}function wb(s){this.enabled!==!1&&this._handleKeyDown(s)}function Ab(s){switch(this._trackPointer(s),this._pointers.length){case 1:switch(this.touches.ONE){case Wi.ROTATE:if(this.enableRotate===!1){this.state=pe.NONE;break}this._handleTouchStartRotate(s),this.state=pe.TOUCH_ROTATE;break;case Wi.PAN:if(this.enablePan===!1){this.state=pe.NONE;break}this._handleTouchStartPan(s),this.state=pe.TOUCH_PAN;break;default:this.state=pe.NONE}break;case 2:switch(this.touches.TWO){case Wi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(s),this.state=pe.TOUCH_DOLLY_PAN;break;case Wi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(s),this.state=pe.TOUCH_DOLLY_ROTATE;break;default:this.state=pe.NONE}break;default:this.state=pe.NONE}this.state!==pe.NONE&&this.dispatchEvent($f)}function Rb(s){switch(this._trackPointer(s),this.state){case pe.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(s),this.update();break;case pe.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(s),this.update();break;case pe.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(s),this.update();break;case pe.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(s),this.update();break;default:this.state=pe.NONE}}function Cb(s){this.enabled!==!1&&s.preventDefault()}function Pb(s){s.key==="Control"&&(this._controlActive=!0,this.domElement.ownerDocument.addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Ib(s){s.key==="Control"&&(this._controlActive=!1,this.domElement.ownerDocument.removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var Fu=class extends zi{constructor(){super(),this.name="RoomEnvironment",this.position.y=-3.5;let t=new Tn;t.deleteAttribute("uv");let e=new ci({side:$e}),n=new ci,i=new sr(16777215,900,28,2);i.position.set(.418,16.199,.3),this.add(i);let r=new ue(t,e);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let a=new Xs(t,n,6),o=new oe;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),a.setMatrixAt(0,o.matrix),o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),a.setMatrixAt(1,o.matrix),o.position.set(6.167,.857,7.803),o.rotation.set(0,.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),a.setMatrixAt(2,o.matrix),o.position.set(-2.017,.018,6.124),o.rotation.set(0,.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),a.setMatrixAt(3,o.matrix),o.position.set(2.291,-.756,-2.621),o.rotation.set(0,-.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),a.setMatrixAt(4,o.matrix),o.position.set(-2.193,-.369,-5.547),o.rotation.set(0,.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),a.setMatrixAt(5,o.matrix),this.add(a);let l=new ue(t,za(50));l.position.set(-16.116,14.37,8.208),l.scale.set(.1,2.428,2.739),this.add(l);let c=new ue(t,za(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(.1,2.425,2.751),this.add(c);let h=new ue(t,za(17));h.position.set(14.904,12.198,-1.832),h.scale.set(.15,4.265,6.331),this.add(h);let u=new ue(t,za(43));u.position.set(-.462,8.89,14.52),u.scale.set(4.38,5.441,.088),this.add(u);let f=new ue(t,za(20));f.position.set(3.235,11.486,-12.541),f.scale.set(2.5,2,.1),this.add(f);let d=new ue(t,za(100));d.position.set(0,20,0),d.scale.set(1,.1,1),this.add(d)}dispose(){let t=new Set;this.traverse(e=>{e.isMesh&&(t.add(e.geometry),t.add(e.material))});for(let e of t)e.dispose()}};function za(s){return new js({color:0,emissive:16777215,emissiveIntensity:s})}var rc=new L;function Zn(s,t,e,n,i,r){let a=2*Math.PI*i/4,o=Math.max(r-2*i,0),l=Math.PI/4;rc.copy(t),rc[n]=0,rc.normalize();let c=.5*a/(a+o),h=1-rc.angleTo(s)/l;return Math.sign(rc[e])===1?h*c:o/(a+o)+c+c*(1-h)}var Bu=class s extends Tn{constructor(t=1,e=1,n=1,i=2,r=.1){let a=i*2+1;if(r=Math.min(t/2,e/2,n/2,r),super(1,1,1,a,a,a),this.type="RoundedBoxGeometry",this.parameters={width:t,height:e,depth:n,segments:i,radius:r},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let l=new L,c=new L,h=new L(t,e,n).divideScalar(2).subScalar(r),u=this.attributes.position.array,f=this.attributes.normal.array,d=this.attributes.uv.array,p=u.length/6,_=new L,m=.5/a;for(let g=0,y=0;g<u.length;g+=3,y+=2)switch(l.fromArray(u,g),c.copy(l),c.x-=Math.sign(c.x)*m,c.y-=Math.sign(c.y)*m,c.z-=Math.sign(c.z)*m,c.normalize(),u[g+0]=h.x*Math.sign(l.x)+c.x*r,u[g+1]=h.y*Math.sign(l.y)+c.y*r,u[g+2]=h.z*Math.sign(l.z)+c.z*r,f[g+0]=c.x,f[g+1]=c.y,f[g+2]=c.z,Math.floor(g/p)){case 0:_.set(1,0,0),d[y+0]=Zn(_,c,"z","y",r,n),d[y+1]=1-Zn(_,c,"y","z",r,e);break;case 1:_.set(-1,0,0),d[y+0]=1-Zn(_,c,"z","y",r,n),d[y+1]=1-Zn(_,c,"y","z",r,e);break;case 2:_.set(0,1,0),d[y+0]=1-Zn(_,c,"x","z",r,t),d[y+1]=Zn(_,c,"z","x",r,n);break;case 3:_.set(0,-1,0),d[y+0]=1-Zn(_,c,"x","z",r,t),d[y+1]=1-Zn(_,c,"z","x",r,n);break;case 4:_.set(0,0,1),d[y+0]=1-Zn(_,c,"x","y",r,t),d[y+1]=1-Zn(_,c,"y","x",r,e);break;case 5:_.set(0,0,-1),d[y+0]=Zn(_,c,"x","y",r,t),d[y+1]=1-Zn(_,c,"y","x",r,e);break}}static fromJSON(t){return new s(t.width,t.height,t.depth,t.segments,t.radius)}};var $n=[[500,2097152,0],[700,9049344,.22],[900,16727040,.55],[1100,16747034,.85],[1200,16757575,1]];function un(s){let{THREE:t,mat:e,add:n,small:i,ghost:r,decal:a,cyl:o,cube:l,box:c,facing:h,plate:u,label:f,control:d,info:p}=s,_=s.root,m=new t.Color,g=new t.Color;function y(P,R){if(P<=$n[0][0])return R.setHex(0),0;for(let I=1;I<$n.length;I++)if(P<=$n[I][0]){let U=(P-$n[I-1][0])/($n[I][0]-$n[I-1][0]);return R.copy(m.setHex($n[I-1][1])).lerp(g.setHex($n[I][1]),U),$n[I-1][2]+($n[I][2]-$n[I-1][2])*U}return R.setHex($n.at(-1)[1]),1}function M(P,R,{w:I=.4,h:U=1.5,d:O=.46}={}){n(c(I,U,O,.012),e.paint,_,[P,U/2,R-O/2]),n(c(I+.01,.08,O+.01,.006),e.graphite,_,[P,.04,R-O/2])}function v(P,R,I,U=.31){let O=new t.Group;O.position.set(P,R,I),_.add(O),n(c(U+.03,U*.626+.032,.02,.006),e.anodized,O,[0,0,.008]);let C=document.createElement("canvas");C.width=1024,C.height=640;let F=new t.CanvasTexture(C);return F.colorSpace=t.SRGBColorSpace,F.anisotropy=8,a(n(new t.PlaneGeometry(U,U*.626),new t.MeshBasicMaterial({map:F,toneMapped:!1}),O,[0,0,.0186])).receiveShadow=!1,p("hmi",O,new t.Vector3(P,R,I+.02)),{canvas:C,refresh(){F.needsUpdate=!0},at:[P,R,I+.02]}}function w(P,R,I,U,{min:O,max:C,major:F,minor:H,unit:B,perPixel:Q,wheel:k,title:tt="SET",format:J=X=>String(Math.round(X)),tick:Z=J,readout:ht=X=>`${J(X)} ${B}`}){let X=new t.Group;X.position.set(R,I,U),_.add(X),u(.19,.19,(W,mt)=>{W.fillStyle="#f3f4f6",W.fillRect(0,0,mt,mt),W.translate(mt/2,mt/2),W.strokeStyle="#1f2933",W.fillStyle="#1f2933",W.textAlign="center",W.textBaseline="middle";for(let pt=O;pt<=C+1e-9;pt+=H){let St=(-225+(pt-O)/(C-O)*270)*Math.PI/180,Ct=Math.abs(pt/F-Math.round(pt/F))<1e-6,nt=mt*.36,ft=mt*(Ct?.42:.395);W.lineWidth=Ct?mt*.014:mt*.008,W.beginPath(),W.moveTo(Math.cos(St)*nt,Math.sin(St)*nt),W.lineTo(Math.cos(St)*ft,Math.sin(St)*ft),W.stroke(),Ct&&(W.font=`600 ${mt*.058}px "Segoe UI", Arial, sans-serif`,W.fillText(Z(pt),Math.cos(St)*mt*.455,Math.sin(St)*mt*.455+(Math.abs(pt-O)<1e-6||Math.abs(pt-C)<1e-6?mt*.03:0)))}W.font=`700 ${mt*.058}px "Segoe UI", Arial, sans-serif`,W.fillText(B,0,mt*.43)},X,[0,0,.0012]);let q=new t.Group;q.position.z=.002,X.add(q),h(n(o(.05,.054,.012,40),e.anodized,q,[0,0,.006]),"z"),h(n(o(.038,.042,.034,40),e.aluminum,q,[0,0,.029]),"z"),i(l(.006,.03,.004),e.red,q,[0,.026,.047]),d(P,X,new t.Vector3(R,I,U+.05),{drag:"slide",perPixel:Q,wheel:k});let $=document.createElement("canvas");$.width=256,$.height=80;let lt=new t.CanvasTexture($);lt.colorSpace=t.SRGBColorSpace,a(n(new t.PlaneGeometry(.13,.0406),new t.MeshBasicMaterial({map:lt,toneMapped:!1}),_,[R,I+.127,U+.0012]));let Y=null;return{at:[R,I,U+.05],set(W){if(q.rotation.z=(135-(W-O)/(C-O)*270)*Math.PI/180,W===Y)return;Y=W;let mt=$.getContext("2d");mt.fillStyle="#0f172a",mt.fillRect(0,0,256,80),mt.fillStyle="#7dd3fc",mt.font='600 22px "Segoe UI", Arial, sans-serif',mt.textBaseline="middle",mt.textAlign="left",mt.fillText(tt,12,42),mt.fillStyle="#f8fafc",mt.font='700 40px "Segoe UI", Arial, sans-serif',mt.textAlign="right",mt.fillText(ht(W),246,43),lt.needsUpdate=!0}}}function E(P,R,I,U,O,C=e.anodized){let F=new t.Group;F.position.set(I+.03,U,O),_.add(F),h(n(o(.03,.03,.04,6),e.stainless,F,[0,0,.02]),"z"),h(i(o(.012,.012,.024,14),e.satin,F,[0,0,.05]),"z");let H=new t.Group;H.position.z=.066,F.add(H),n(c(.13,.026,.014,.005),C,H,[.04,0,0]);let B=r(h(n(o(.009,.009,.004,14),new t.MeshStandardMaterial({color:2067020,emissive:2278750,emissiveIntensity:.05,roughness:.4}),_,[I+.155,U,O+.002]),"z"));u(.085,.05,f([R],{bg:"#f3f4f6",fg:"#1f2933",size:.62}),_,[I-.115,U,O+.0012]),d(P,F,new t.Vector3(I+.05,U,O+.07),{click:!0});let Q=0;return{at:[I+.06,U,O+.07],set(k,tt){Q+=((k?Math.PI/2:0)-Q)*Math.min(1,tt*10),H.rotation.z=Q,B.material.emissiveIntensity=k?1.6:.05}}}function x(P,R,I,U,O,C=2278750){let F=new t.Group;F.position.set(I,U,O),_.add(F),h(n(o(.034,.034,.012,28),e.anodized,F,[0,0,.006]),"z");let H=h(n(o(.026,.026,.016,28),new t.MeshStandardMaterial({color:C,emissive:C,emissiveIntensity:.08,roughness:.35}),F,[0,0,.02]),"z");H.userData.fixed=!0,u(.11,.04,f([R],{bg:"#f3f4f6",fg:"#1f2933",size:.6}),_,[I,U-.062,O+.0012]),d(P,F,new t.Vector3(I,U,O+.03),{click:!0});let B=0;return{at:[I,U,O+.03],set(Q,k,tt){tt&&(B=.25),B=Math.max(0,B-k),H.position.z=.02-.007*Math.min(1,B/.1),H.material.emissiveIntensity=Q?1.5:.08}}}function S(P,R,I){let U=new t.Group;U.position.set(P,R,I),_.add(U),n(o(.03,.034,.012,20),e.anodized,U,[0,.006,0]),n(o(.011,.011,.06,12),e.stainless,U,[0,.04,0]);let O=["#22c55e","#f5b301","#ef4444"].map((F,H)=>n(o(.028,.028,.046,24),new t.MeshStandardMaterial({color:F,emissive:F,emissiveIntensity:.05,roughness:.3,transparent:!0,opacity:.94}),U,[0,.095+H*.05,0]));for(let F of O)F.userData.fixed=!0,F.castShadow=!1;n(o(.029,.029,.01,24),e.anodized,U,[0,.248,0]),p("tower",U,new t.Vector3(P,R+.145,I));let C=[.05,.05,.05];return{set(F,H,B){O.forEach((Q,k)=>{let tt=k===F?k===2?1.6+Math.sin(B*10):1.5:.04;C[k]+=(tt-C[k])*Math.min(1,H*10),Q.material.emissiveIntensity=C[k]})}}}return{heat:y,cabinet:M,screen:v,dial:w,valve:E,button:x,tower:S}}var Jn=.4,On=1.02,Yi={radius:.58,top:1.3},Zi={radius:.27,top:3.05},zu=.55,Jf=.95,Lb={x:1.45,front:.5};function _g(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,box:l,plate:c,label:h,shade:u,control:f,info:d}=s,p=s.root,_=un(s),m=(J,Z,ht=Jf,X=56)=>new t.CylinderGeometry(J,J,Z,X,1,!0,ht,2*Math.PI-2*ht),g=n(13949149,1,.5,{side:t.DoubleSide}),y=n(2961720,.3,.7,{side:t.DoubleSide});i(l(1.5,Jn,1.3,.012),e.paint,p,[0,Jn/2,0]),i(l(1.52,.08,1.32,.006),e.graphite,p,[0,.04,0]),c(.5,.07,h(["CZ-01","CRYSTAL PULLER"],{bg:"#24272c",fg:"#e9edf3",size:.82}),p,[-.35,Jn-.14,.652]),u(3.6,2.2,.55,8e-4,0,.42),i(o(.6,.6,.04,56),e.stainless,p,[0,Jn+.02,0]),i(m(Yi.radius,Yi.top-Jn),g,p,[0,(Yi.top+Jn)/2,0]);let M=i(new t.RingGeometry(Zi.radius,Yi.radius+.02,56,1,1.5*Math.PI+Jf,2*Math.PI-2*Jf),g,p,[0,Yi.top,0]);M.rotation.x=-Math.PI/2,i(m(Zi.radius,Zi.top-Yi.top),g,p,[0,(Zi.top+Yi.top)/2,0]),i(o(.3,.3,.05,40),e.stainless,p,[0,Zi.top+.025,0]),i(l(.3,.22,.26,.01),e.paint,p,[0,Zi.top+.16,0]),c(.16,.04,h(["SEED LIFT"],{bg:"#f3f4f6",fg:"#1f2933",size:.55}),p,[0,Zi.top+.16,.1305]);let v=new t.Group;p.add(v);let w=new t.MeshStandardMaterial({color:6957586,emissive:16734746,emissiveIntensity:.85,roughness:.6,side:t.DoubleSide});i(m(.47,.52,.6),w,v,[0,Jn+.36,0]).userData.fixed=!0,i(m(.52,.56,.6),y,v,[0,Jn+.36,0]),d("heater",v,new t.Vector3(.52*Math.sin(.78),Jn+.4,.52*Math.cos(.78)));let E=new t.Group;p.add(E),i(o(.06,.06,.14,20),e.stainless,E,[0,Jn+.11,0]),i(o(.42,.36,On-.005-(Jn+.18),56),y,E,[0,(On-.005+Jn+.18)/2,0]),i(new t.CylinderGeometry(.42,.42,.07,56,1,!0),y,E,[0,On+.03,0]),r(new t.CylinderGeometry(.408,.408,.068,56,1,!0),n(16054008,0,.35,{side:t.DoubleSide}),E,[0,On+.03,0]);let x=i(o(.406,.406,.01,56),new t.MeshStandardMaterial({color:16751162,emissive:16738834,emissiveIntensity:1.5,roughness:.25}),E,[0,On-.005,0]);x.userData.fixed=!0,x.castShadow=!1;let S=new t.PointLight(16742954,2.2,3.2,1.6);S.position.set(0,On+.25,.2),p.add(S),d("crucible",E,new t.Vector3(.12,On+.001,.3));let P=a(i(new t.TorusGeometry(1,.05,8,48),new t.MeshBasicMaterial({color:16773570}),p,[0,On+.002,0]));P.rotation.x=Math.PI/2,P.visible=!1;let R=new t.Group;R.position.set(.46,Yi.top,.22),p.add(R),i(l(.08,.08,.14,.006),e.anodized,R,[0,.07,0]),r(o(.022,.026,.05,14),e.stainless,R,[-.03,.04,-.06]),i(l(.05,.03,.05,.004),e.satin,R,[0,.015,0]),d("gauge",R,new t.Vector3(.46,Yi.top+.112,.24));let I=new t.Group;I.position.set(0,On+zu,0),p.add(I),i(o(.006,.006,.08,10),e.silicon,I,[0,.04,0]),i(o(.03,.03,.1,20),e.anodized,I,[0,.13,0]),i(o(.09,.09,.3,16),new t.MeshBasicMaterial({transparent:!0,opacity:0,depthWrite:!1}),I,[0,.13,0]).castShadow=!1;let U=i(o(.008,.008,1,10),e.stainless,p,[0,2,0]),O=i(new t.LatheGeometry([new t.Vector2(.006,0),new t.Vector2(.006,-.001)],8),n(10134450,.85,.28,{side:t.DoubleSide}),I);O.visible=!1,f("seed",I,new t.Vector3(0,On+zu+.13,.09),{drag:"lift",travel:-.5,value:J=>J?.controls?.seed??0});let C=Lb;_.cabinet(C.x,C.front,{w:.66});let F=_.screen(C.x,1.31,C.front),H={speed:_.dial("speed",C.x-.16,.99,C.front,{min:0,max:14,major:2,minor:.5,unit:"mm/min",perPixel:.03,wheel:.1,title:"PULL",tick:J=>String(Math.round(J)),readout:J=>J.toFixed(2)}),dopant:_.dial("dopant",C.x+.16,.99,C.front,{min:0,max:10,major:2,minor:.5,unit:"mg",perPixel:.02,wheel:.1,title:"BORON",tick:J=>String(Math.round(J)),readout:J=>`${J.toFixed(1)} mg`})},B=_.button("auto","AUTO DIA",C.x,.7,C.front,2278750),Q=_.tower(C.x+.24,1.5,C.front-.3),k="";function tt(J,Z,ht){let X=On+(1-J.seed)*zu+(J.hanging?J.length/1e3:0);if(I.position.y=X,U.scale.y=Math.max(.01,Zi.top-(X+.18)),U.position.y=(Zi.top+X+.18)/2,s.partAnchor("seed").set(0,X+.13,.09),J.stamp!==k){k=J.stamp;let q=J.hanging&&J.profile.length>1?J.profile.map($=>new t.Vector2($.r/1e3,-$.z/1e3)):null;O.visible=!!q,q&&(q.push(new t.Vector2(5e-4,-J.length/1e3)),O.geometry.dispose(),O.geometry=new t.LatheGeometry(q,40))}P.visible=J.growing,J.growing&&P.scale.set(J.radius/1e3+.004,J.radius/1e3+.004,.12),S.intensity=2+.25*Math.sin(ht*1.7);for(let[q,$]of Object.entries(H))$.set(J.controls[q]);B.set(J.controls.auto,Z,!1),Q.set(J.alarm?2:J.growing?0:1,Z,ht)}return{update:tt,screenCanvas:F.canvas,refreshScreen:F.refresh,views:{home:[[3.4,2.3,6.9],[.55,1.6,0]],melt:[[1.15,1.95,2.3],[0,On+.12,0]],panel:[[C.x+.2,1.1,2.3],[C.x,.95,C.front]],screen:[[C.x,1.33,C.front+.85],[C.x,1.31,C.front]]},layout:{dials:Object.fromEntries(Object.entries(H).map(([J,Z])=>[J,Z.at])),buttons:{auto:B.at},hmi:F.at,melt:On,seedUp:zu}}}var ke=1.3,Kf=1.06,ku=.3,Fn=1.1,Rn=1.2,Cn=2.72,Db={x:.8,front:.54};function xg(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,cube:l,box:c,tube:h,plate:u,label:f,shade:d,control:p,info:_}=s,m=s.root,g=un(s),y=new t.Color;i(c(Fn+.04,.12,Rn+.04,.01),e.graphite,m,[0,.06,0]);for(let W of[-1,1])for(let mt of[-1,1])i(c(.06,Cn-.12,.06,.006),e.paint,m,[W*(Fn/2-.03),(Cn+.12)/2,mt*(Rn/2-.03)]);i(c(Fn-.12,Cn-.12,.02,.004),e.paint,m,[0,(Cn+.12)/2,-Rn/2+.02]),i(c(.02,Cn-.12,Rn-.12,.004),e.paint,m,[-Fn/2+.02,(Cn+.12)/2,0]),a(i(l(.008,Cn-.12,Rn-.12),e.glass,m,[Fn/2-.02,(Cn+.12)/2,0])),i(c(Fn+.04,.08,Rn+.04,.01),e.paint,m,[0,Cn+.04,0]),i(c(Fn,.14,.04,.006),e.paint,m,[0,Cn-.07,Rn/2-.02]),i(c(Fn,.07,.04,.006),e.paint,m,[0,ke+.005,Rn/2-.02]),u(.52,.075,f(["VF-01","VERTICAL FURNACE \xB7 OXIDATION"],{bg:"#24272c",fg:"#e9edf3",size:.82}),m,[-.24,Cn-.07,Rn/2+.001]);let M=new t.Shape;M.moveTo(-Fn/2+.06,-Rn/2+.06),M.lineTo(Fn/2-.06,-Rn/2+.06),M.lineTo(Fn/2-.06,Rn/2-.06),M.lineTo(-Fn/2+.06,Rn/2-.06),M.closePath();let v=new t.Path;v.absarc(0,0,.285,0,Math.PI*2,!0),M.holes.push(v);let w=i(new t.ExtrudeGeometry(M,{depth:.04,bevelEnabled:!1,curveSegments:48}),e.stainless);w.rotation.x=-Math.PI/2,w.position.y=ke-.04,d(Fn+1.5,Rn+.9,.2,8e-4,0,.42);let E=new t.Group;m.add(E),i(new t.CylinderGeometry(.4,.4,1.22,48,1,!0,Math.PI/2,Math.PI),n(15723748,0,.92,{side:t.DoubleSide}),E,[0,ke+.63,0]);for(let W of[-1,1])i(l(.03,1.22,.02),e.stainless,E,[W*.405,ke+.63,0]);i(o(.42,.42,.04),e.stainless,E,[0,ke+1.26,0]);let x=n(5919820,.4,.6,{emissive:16734740,emissiveIntensity:0}),S=new t.InstancedMesh(new t.TorusGeometry(.3,.011,10,72),x,21),P=new t.Matrix4,R=new t.Quaternion().setFromAxisAngle(new t.Vector3(1,0,0),Math.PI/2);for(let W=0;W<21;W++)P.compose(new t.Vector3(0,ke+.12+W*.045,0),R,new t.Vector3(1,1,1)),S.setMatrixAt(W,P);a(S),m.add(S),_("heater",E,new t.Vector3(-.3,ke+.9,.05));let I=n(15331830,0,.08,{transparent:!0,opacity:.2,depthWrite:!1,side:t.DoubleSide});a(i(o(.215,.215,.94,48,!0),I,m,[0,ke+.51,0]));let U=new t.Group;m.add(U),i(new t.SphereGeometry(.215,48,20,0,Math.PI*2,0,Math.PI/2),n(15331830,0,.08,{transparent:!0,opacity:.32,depthWrite:!1}),U,[0,ke+.98,0]).castShadow=!1,r(new t.TorusGeometry(.222,.012,10,64),e.quartz,U,[0,ke+.035,0]).rotation.x=Math.PI/2,r(o(.03,.03,.06,20),e.quartz,U,[0,ke+1.215,0]),_("tube",U,new t.Vector3(0,ke+1.1,.16));let O=a(i(o(.205,.205,.93,40,!0),new t.MeshBasicMaterial({color:16742938,transparent:!0,opacity:0,blending:t.AdditiveBlending,depthWrite:!1,side:t.BackSide}),m,[0,ke+.51,0])),C=new t.PointLight(16747066,0,3.2,1.6);C.position.set(0,ke+.6,.2),m.add(C);let F=new t.Group;F.position.y=ku,m.add(F),i(o(.27,.27,.03,56),e.stainless,F,[0,-.015,0]),r(new t.TorusGeometry(.236,.006,8,56),e.rubber,F,[0,.003,0]).rotation.x=Math.PI/2,i(o(.16,.17,.16,40),e.ceramic,F,[0,.08,0]);for(let W of[.045,.085,.125])r(o(.176,.176,.005,40),e.quartz,F,[0,W,0]);for(let W of[.172,.885])r(o(.168,.168,.012,48),e.quartz,F,[0,W,0]);for(let W of[-90,-155,-25]){let mt=W*Math.PI/180;r(o(.008,.008,.7,12),e.quartz,F,[Math.cos(mt)*.16,.53,Math.sin(mt)*.16])}let H=n(9279398,.55,.28,{emissive:16734740,emissiveIntensity:0}),B=new t.InstancedMesh(o(.15,.15,.0026,64),H,25);for(let W=0;W<25;W++)P.makeTranslation(0,.2+W*.026,0),B.setMatrixAt(W,P);B.castShadow=!0,B.userData.fixed=!0,F.add(B);let Q=i(o(.156,.156,.66,32),new t.MeshBasicMaterial({transparent:!0,opacity:0,depthWrite:!1}),F,[0,.512,0]);Q.castShadow=Q.receiveShadow=!1,Q.userData.fixed=!0,i(c(.09,.05,.46,.006),e.anodized,F,[0,-.055,-.25]),i(c(.18,.13,.07,.008),e.anodized,F,[0,-.055,-.455]),i(c(.12,ke-.16,.07,.006),e.aluminum,m,[0,(ke+.08)/2,-.505]),r(o(.012,.012,ke-.2,12),e.stainless,m,[.1,(ke+.12)/2,-.5]),p("boat",F,new t.Vector3(0,ku+.5,.16),{drag:"lift",travel:Kf,value:W=>W?.boat??0});let k=Db;g.cabinet(k.x,k.front);let tt=g.screen(k.x,1.3,k.front),J=g.dial("setpoint",k.x,1.03,k.front,{min:600,max:1200,major:200,minor:50,unit:"\xB0C",perPixel:1.5,wheel:5}),Z={n2:g.valve("n2","N\u2082",k.x,.8,k.front,e.anodized),o2:g.valve("o2","O\u2082",k.x,.64,k.front,e.blue),h2o:g.valve("h2o","H\u2082O",k.x,.48,k.front,e.red)};h([[k.x-.08,1.5,.2],[k.x-.08,1.6,.2],[.5,1.6,.1],[.3,ke+.07,.03]],.009,e.stainless,m,32).castShadow=!1;let ht=g.tower(-.42,Cn+.08,.45),X=new t.Group;X.position.set(0,Cn+.08,-.22),m.add(X),i(o(.075,.075,.3,32),e.stainless,X,[0,.15,0]),i(o(.095,.095,.016,32),e.satin,X,[0,.3,0]),i(o(.095,.095,.016,32),e.satin,X,[0,.008,0]),_("exhaust",X,new t.Vector3(0,Cn+.3,-.22));let q=new t.Color(9279398),$=new t.Color,lt=0;function Y(W,mt,pt){F.position.y=ku+Kf*W.boat,s.partAnchor("boat").set(0,F.position.y+.5,.16);let St=g.heat(W.tube,y);lt+=(St-lt)*Math.min(1,mt*6),x.emissive.copy(y),x.emissiveIntensity=lt*2.4,O.material.opacity=lt*.28,C.intensity=lt*2.2,St>0&&(O.material.color.copy(y),C.color.copy(y));let Ct=g.heat(W.wafer,y);H.emissive.copy(y),H.emissiveIntensity=Ct*1.6,$.setRGB(W.filmColor[0]/255,W.filmColor[1]/255,W.filmColor[2]/255,t.SRGBColorSpace),H.color.copy(q).lerp($,W.filmStrength),J.set(W.controls.setpoint);for(let[nt,ft]of Object.entries(Z))ft.set(W.controls[nt],mt);ht.set(W.alarm?2:W.growing?0:1,mt,pt)}return{update:Y,screenCanvas:tt.canvas,refreshScreen:tt.refresh,views:{home:[[3,1.95,5],[.22,1.36,.05]],boat:[[1.55,1.05,2.9],[0,.78,0]],tube:[[1.75,2.25,3],[0,1.9,0]],panel:[[1.2,1,2.3],[k.x,.9,k.front]],screen:[[k.x,1.32,k.front+.85],[k.x,1.3,k.front]]},layout:{deck:ke,travel:Kf,flangeDown:ku,boatGrip:[0,.52,.15],dial:J.at,hmi:tt.at,valves:Object.fromEntries(Object.entries(Z).map(([W,mt])=>[W,mt.at]))}}}var yn=.86,jf=yn+.125,Kn={coat:-.98,expose:0,develop:.98},Nb={x:1.98,front:.5};function yg(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,box:l,plate:c,label:h,shade:u,canvasTexture:f,info:d}=s,p=s.root,_=un(s);i(l(2.94,yn-.03,1.04,.012),e.paint,p,[0,(yn-.03)/2,0]),i(l(2.96,.03,1.06,.006),e.stainless,p,[0,yn-.015,0]),i(l(2.96,.08,1.06,.006),e.graphite,p,[0,.04,0]),c(.5,.07,h(["PH-01","COAT \xB7 EXPOSE \xB7 DEVELOP"],{bg:"#24272c",fg:"#e9edf3",size:.82}),p,[-.95,yn-.2,.522]),u(3.9,1.9,.3,8e-4,0,.42);function m($,lt,Y){let W=new t.Group;W.position.set($,yn,0),p.add(W),i(o(.25,.25,.02,48),e.white,W,[0,.01,0]),i(new t.CylinderGeometry(.24,.25,.15,48,1,!0),n(15790057,0,.48,{side:t.DoubleSide}),W,[0,.095,0]),i(o(.035,.035,.09,20),e.stainless,W,[0,.065,0]);let mt=i(o(.09,.09,.012,40),e.anodized,W,[0,.116,0]);i(o(.022,.022,.34,16),e.stainless,W,[-.27,.17,-.22]);let pt=i(l(.3,.03,.03,.006),e.aluminum,W,[-.135,.33,-.11]);return pt.rotation.y=-.69,r(o(.008,.005,.05,10),e.stainless,W,[0,.3,0]),i(o(.04,.04,.12,20),n(Y,0,.3,{transparent:!0,opacity:.85}),W,[-.36,.06,-.3]),d(lt,W,new t.Vector3($+.175,yn+.12,.176)),{g:W,chuck:mt}}m(Kn.coat,"coater",11887901);let g=m(Kn.develop,"developer",10474470),y=a(i(o(.148,.148,.004,48),n(12576501,0,.05,{transparent:!0,opacity:0}),g.g,[0,.131,0])),M=new t.Group;M.position.set(Kn.expose,yn,0),p.add(M),i(l(.62,.07,.62,.008),e.graphite,M,[0,.035,0]);let v=new t.Group;M.add(v),i(l(.44,.03,.44,.006),e.aluminum,v,[0,.085,0]),i(o(.155,.155,.016,48),e.anodized,v,[0,.108,0]);for(let $ of[-1,1])i(l(.09,1.34,.09,.008),e.paint,M,[$*.36,.67,-.38]);i(l(.86,.1,.5,.01),e.paint,M,[0,1.39,-.2]);let w=new t.Group;M.add(w),i(o(.085,.07,.1,40),e.anodized,w,[0,.21,0]),i(o(.11,.085,.16,40),e.stainless,w,[0,.34,0]),i(o(.13,.13,.34,40),e.anodized,w,[0,.59,0]),i(o(.115,.13,.14,40),e.stainless,w,[0,.83,0]),i(o(.1,.1,.1,40),e.anodized,w,[0,.95,0]),c(.12,.04,h(["i-line  NA 0.60"],{bg:"#f3f4f6",fg:"#1f2933",size:.55}),w,[0,.59,.1305]),d("lens",w,new t.Vector3(Kn.expose,yn+.6,.14));let E=new t.Group;M.add(E),i(l(.36,.03,.36,.006),e.aluminum,E,[0,1.06,0]);let x=f(128,($,lt)=>{$.fillStyle="#2a2f38",$.fillRect(0,0,lt,lt),$.fillStyle="#dbe7f2";for(let Y=0;Y<6;Y++)$.fillRect(22+Y*15,20,5,88)});i(l(.17,.012,.17,.002),[e.quartz,e.quartz,n(16777215,.2,.3,{map:x}),e.quartz,e.quartz,e.quartz],E,[0,1.085,0]),d("reticle",E,new t.Vector3(Kn.expose,yn+1.09,.1)),i(l(.3,.2,.3,.01),e.graphite,M,[0,1.25,0]);let S=new t.MeshBasicMaterial({color:9133302,transparent:!0,opacity:0,blending:t.AdditiveBlending,depthWrite:!1}),P=a(i(o(.05,.085,.1,24,!0),S,M,[0,1.145,0])),R=a(i(o(.06,.012,.045,24,!0),S,M,[0,.14,0])),I=_.tower(Kn.expose+.34,yn+1.44,-.02),U=document.createElement("canvas");U.width=U.height=256;let O=new t.CanvasTexture(U);O.colorSpace=t.SRGBColorSpace;let C=new t.Group;C.position.set(Kn.coat,jf,0),p.add(C);let F=i(o(.15,.15,.004,64),[e.silicon,n(16777215,.3,.25,{map:O}),e.silicon],C);F.userData.fixed=!0,i(l(2.5,.03,.05,.006),e.anodized,p,[0,yn+.015,.42]);let H=new t.Group;H.position.set(Kn.coat,yn,.42),p.add(H),i(l(.1,.17,.08,.006),e.aluminum,H,[0,.115,0]),i(l(.05,.012,.3,.003),e.satin,H,[0,.195,-.17]),d("wafer",C,new t.Vector3(Kn.coat,jf+.02,0));let B=Nb;_.cabinet(B.x,B.front,{w:.84});let Q=_.screen(B.x,1.31,B.front),k={spin:_.dial("spin",B.x-.27,.99,B.front,{min:1500,max:6e3,major:1500,minor:500,unit:"rpm",perPixel:15,wheel:50,title:"SPIN"}),dose:_.dial("dose",B.x,.99,B.front,{min:0,max:400,major:100,minor:20,unit:"mJ",perPixel:1,wheel:2,title:"DOSE"}),focus:_.dial("focus",B.x+.27,.99,B.front,{min:-4,max:4,major:2,minor:.5,unit:"\xB5m",perPixel:.02,wheel:.1,title:"FOCUS",format:$=>`${$>0?"+":""}${$.toFixed(1)}`})},tt={coat:_.button("coat","COAT",B.x-.3,.7,B.front,2278750),expose:_.button("expose","EXPOSE",B.x-.1,.7,B.front,9133302),develop:_.button("develop","DEVELOP",B.x+.1,.7,B.front,3718648),strip:_.button("strip","STRIP",B.x+.3,.7,B.front,16096779)},J={bare:"coat",coating:"coat",coated:"coat",exposing:"expose",exposed:"expose",developing:"develop",developed:"develop"},Z={coat:["bare"],expose:["coated"],develop:["exposed"],strip:["coated","exposed","developed"]},ht="";function X($){let lt=`${$.phase}|${$.fields}|${$.filmColor.join(",")}|${Math.round($.coverage*20)}|${$.result?Math.round($.result.opening):""}`;if(lt===ht)return;ht=lt;let Y=U.getContext("2d"),W=U.width,[mt,pt,St]=$.filmColor;Y.fillStyle=`rgb(${mt},${pt},${St})`,Y.fillRect(0,0,W,W),$.coverage>0&&(Y.fillStyle="rgba(176,92,26,.72)",Y.beginPath(),Y.arc(W/2,W/2,W/2*$.coverage,0,7),Y.fill());let Ct=W/10;for(let nt=0;nt<$.fields;nt++){let ft=nt%8,_t=Math.floor(nt/8);Y.fillStyle=$.phase==="developed"?"rgba(255,255,255,.34)":"rgba(139,92,246,.42)",Y.fillRect((ft+1)*Ct+1,(_t+1.2)*Ct+1,Ct-2,Ct-2)}O.needsUpdate=!0}function q($,lt,Y){let W=Kn[J[$.phase]],mt=Math.abs(C.position.x-W);if(C.position.x+=(W-C.position.x)*Math.min(1,lt*3.2),C.position.y=jf+Math.min(.16,mt*.5),H.position.x=C.position.x,$.phase==="exposing"){let pt=$.fields;C.position.x=W+(pt%8-3.5)*.012,C.position.z=(Math.floor(pt/8)-3.5)*.012}else C.position.z*=Math.max(0,1-lt*6);v.position.x=$.phase==="exposing"?C.position.x-W:v.position.x*Math.max(0,1-lt*6),v.position.z=$.phase==="exposing"?C.position.z:v.position.z*Math.max(0,1-lt*6),F.rotation.y+=lt*Math.min(40,$.rpm/60*6.283*.12),S.opacity=$.shutter?.5+.2*Math.sin(Y*30):0,y.material.opacity=$.phase==="developing"?.55:0,s.partAnchor("wafer").set(C.position.x,C.position.y+.02,C.position.z),X($);for(let[pt,St]of Object.entries(k))St.set($.controls[pt]);for(let[pt,St]of Object.entries(tt))St.set(Z[pt].includes($.phase),lt,$.pressed===pt);I.set($.alarm?2:["coating","exposing","developing"].includes($.phase)?0:1,lt,Y)}return{update:q,screenCanvas:Q.canvas,refreshScreen:Q.refresh,views:{home:[[1.2,2.5,5.6],[.45,1,0]],coater:[[-.3,1.75,2.1],[Kn.coat,yn+.15,0]],stepper:[[1.3,1.9,2.6],[Kn.expose,yn+.6,0]],panel:[[B.x+.25,1.15,2.3],[B.x,.98,B.front]],screen:[[B.x,1.33,B.front+.85],[B.x,1.31,B.front]]},layout:{dials:Object.fromEntries(Object.entries(k).map(([$,lt])=>[$,lt.at])),buttons:Object.fromEntries(Object.entries(tt).map(([$,lt])=>[$,lt.at])),hmi:Q.at}}}var Ue=.86,Ai=-.14,ka=.46,Qf=Ue+.166,vg={x:1.16,front:.5};function Mg(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,box:l,tube:c,plate:h,label:u,shade:f,info:d}=s,p=s.root,_=un(s);i(l(1.36,Ue-.03,1.04,.012),e.paint,p,[0,(Ue-.03)/2,0]),i(l(1.38,.03,1.06,.006),e.stainless,p,[0,Ue-.015,0]),i(l(1.38,.08,1.06,.006),e.graphite,p,[0,.04,0]),h(.5,.07,u(["ET-01","REACTIVE ION ETCH"],{bg:"#24272c",fg:"#e9edf3",size:.82}),p,[-.3,Ue-.2,.522]),f(2.6,1.9,.35,8e-4,0,.42);let m=new t.Group;m.position.set(Ai,Ue,0),p.add(m),i(o(.35,.35,.05,56),e.stainless,m,[0,.025,0]),i(o(.2,.23,.1,48),e.aluminum,m,[0,.1,0]),i(o(.165,.165,.012,48),e.anodized,m,[0,.156,0]),i(o(.215,.215,.03,48),e.aluminum,m,[0,.285,0]),i(o(.355,.355,.06,56),e.stainless,m,[0,.34,0]),r(o(.03,.03,.08,20),e.stainless,m,[0,.41,0]),a(i(o(.33,.33,.26,56,!0),n(15331830,0,.06,{transparent:!0,opacity:.16,depthWrite:!1,side:t.DoubleSide}),m,[0,.18,0]));for(let Q=0;Q<6;Q++){let k=Q*Math.PI/3+.5;r(o(.012,.012,.27,10),e.satin,m,[Math.cos(k)*.345,.18,Math.sin(k)*.345])}d("chamber",m,new t.Vector3(Ai,Ue+.34,.33));let g=a(i(o(.19,.19,.092,40),new t.MeshBasicMaterial({color:10980346,transparent:!0,opacity:0,blending:t.AdditiveBlending,depthWrite:!1}),m,[0,.214,0])),y=new t.PointLight(10980346,0,2.4,1.6);y.position.set(Ai,Ue+.22,.25),p.add(y),c([[Ai,Ue+.45,0],[Ai,Ue+.56,0],[.5,Ue+.56,-.2],[vg.x-.1,1.5,.2]],.009,e.stainless,p,36).castShadow=!1;let M=new t.Group;M.position.set(-.53,Ue,.32),p.add(M),i(o(.1,.1,.24,32),e.satin,M,[0,.12,0]),i(o(.115,.115,.02,32),e.stainless,M,[0,.245,0]),c([[0,.2,-.03],[.08,.2,-.12],[.18,.06,-.2]],.035,e.stainless,M,20),d("pump",M,new t.Vector3(-.53,Ue+.16,.42));let v=new t.Group;v.position.set(.46,Ue,-.38),p.add(v),i(l(.26,.26,.18,.008),e.graphite,v,[0,.13,0]),h(.12,.035,u(["13.56 MHz"],{bg:"#f3f4f6",fg:"#1f2933",size:.58}),v,[0,.19,.0905]),c([[-.13,.1,.02],[-.3,.08,.14],[-.42,.05,.26]],.008,e.rubber,v,16).castShadow=!1,d("rf",v,new t.Vector3(.46,Ue+.21,-.29));let w=new t.Group;w.position.set(Ai+.3,Ue,.28),p.add(w),i(l(.07,.06,.07,.006),e.graphite,w,[0,.2,0]),i(o(.012,.012,.12,12),e.stainless,w,[0,.1,0]),c([[.03,.2,0],[.2,.16,.06],[.5,.05,.12]],.004,n(15913499,0,.5),w,20).castShadow=!1,d("oes",w,new t.Vector3(Ai+.3,Ue+.21,.32)),i(o(.17,.17,.03,40),e.anodized,p,[ka,Ue+.015,0]),i(l(.5,.012,.05,.003),e.satin,p,[ka-.2,Ue+.12,0]),i(l(.04,.1,.2,.006),e.stainless,p,[Ai+.345,Ue+.17,0]);let E=document.createElement("canvas");E.width=E.height=256;let x=new t.CanvasTexture(E);x.colorSpace=t.SRGBColorSpace;let S=new t.Group;S.position.set(ka,Qf,0),p.add(S),i(o(.15,.15,.004,64),[e.silicon,n(16777215,.3,.25,{map:x}),e.silicon],S).userData.fixed=!0,d("wafer",S,new t.Vector3(ka,Qf+.02,0));let P=vg;_.cabinet(P.x,P.front,{w:.66});let R=_.screen(P.x,1.31,P.front),I={power:_.dial("power",P.x-.16,.99,P.front,{min:0,max:600,major:200,minor:50,unit:"W",perPixel:2,wheel:10,title:"RF"}),pressure:_.dial("pressure",P.x+.16,.99,P.front,{min:10,max:200,major:50,minor:10,unit:"mT",perPixel:.5,wheel:5,title:"PRESS"})},U={chf3:_.valve("chf3","CHF\u2083",P.x-.13,.72,P.front,e.blue),cf4:_.valve("cf4","CF\u2084",P.x-.13,.56,P.front,e.red)},O=_.button("load","LOAD",P.x+.2,.68,P.front,2278750),C=_.tower(P.x+.24,1.5,P.front-.3),F="";function H(Q){let k=`${Q.filmColor.join(",")}|${Math.round(Q.resist*20)}|${Math.round(Q.open*20)}|${Q.windows}`;if(k===F)return;F=k;let tt=E.getContext("2d"),J=E.width,[Z,ht,X]=Q.filmColor;if(tt.fillStyle=`rgb(${Z},${ht},${X})`,tt.fillRect(0,0,J,J),Q.resist>0&&(tt.fillStyle=`rgba(176,92,26,${.72*Q.resist})`,tt.fillRect(0,0,J,J)),Q.windows){tt.fillStyle=`rgba(150,160,176,${.25+.6*Q.open})`;let q=J/10;for(let $=0;$<64;$++)tt.fillRect(($%8+1)*q+4,(Math.floor($/8)+1)*q+4,q-8,q-8)}x.needsUpdate=!0}function B(Q,k,tt){let J=Q.inside*Q.inside*(3-2*Q.inside);S.position.x=ka+(Ai-ka)*J,s.partAnchor("wafer").set(S.position.x,Qf+.02,0);let Z=Q.plasma?.35+.55*Math.min(1,Q.controls.power/600):0;g.material.opacity+=(Z*(.9+.1*Math.sin(tt*23))-g.material.opacity)*Math.min(1,k*8),y.intensity=g.material.opacity*2.4,H(Q);for(let[ht,X]of Object.entries(I))X.set(Q.controls[ht]);for(let[ht,X]of Object.entries(U))X.set(Q.controls[ht],k);O.set(!Q.plasma,k,!1),C.set(Q.alarm?2:Q.plasma?0:1,k,tt)}return{update:B,screenCanvas:R.canvas,refreshScreen:R.refresh,views:{home:[[1.9,2.05,4.1],[.42,1,.05]],chamber:[[.75,1.5,1.9],[Ai,Ue+.2,0]],panel:[[P.x+.2,1.1,2.2],[P.x,.95,P.front]],screen:[[P.x,1.33,P.front+.85],[P.x,1.31,P.front]]},layout:{dials:Object.fromEntries(Object.entries(I).map(([Q,k])=>[Q,k.at])),valves:Object.fromEntries(Object.entries(U).map(([Q,k])=>[Q,k.at])),buttons:{load:O.at},hmi:R.at}}}var Je=.86,pr=Je+.3,Bn=.18,Ga=.52,ac=1.08,mr=Je+.15,Ub={x:2.14,front:.5},Sg=83*Math.PI/180;function bg(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,box:l,facing:c,plate:h,label:u,shade:f,info:d}=s,p=s.root,_=un(s);i(l(2.78,Je-.03,1.18,.012),e.paint,p,[.02,(Je-.03)/2,-.07]),i(l(2.8,.03,1.2,.006),e.stainless,p,[.02,Je-.015,-.07]),i(l(2.8,.08,1.2,.006),e.graphite,p,[.02,.04,-.07]),h(.5,.07,u(["IM-01","ION IMPLANT \xB7 ANNEAL"],{bg:"#24272c",fg:"#e9edf3",size:.82}),p,[-.85,Je-.2,.522]),f(4.7,2.1,.62,8e-4,-.05,.42);let m=new t.Group;m.position.set(-1.08,Je,-.36),p.add(m),i(l(.44,.6,.4,.012),e.paint,m,[0,.3,0]),h(.2,.06,u(["ION SOURCE","PH\u2083"],{bg:"#f1c40f",fg:"#1f2933",size:.8}),m,[0,.47,.2012]),c(i(o(.08,.08,.14,32),e.stainless,m,[0,.3,.27]),"z"),c(i(o(.1,.1,.02,32),e.satin,m,[0,.3,.21]),"z"),i(o(.045,.045,.32,20),n(10133672,.7,.4),m,[.29,.16,.05]),r(o(.016,.022,.05,12),e.brass,m,[.29,.345,.05]);let g=a(c(i(o(.013,.013,.006,14),new t.MeshStandardMaterial({color:8006172,emissive:16734774,emissiveIntensity:.05,roughness:.4}),m,[-.15,.5,.203]),"z"));d("source",m,new t.Vector3(-1.08,Je+.585,-.155));let y=new t.Group;y.position.set(-1.021,pr,.121),p.add(y),i(o(.22,.22,.2,40),e.blue,y),i(o(.222,.222,.03,40),e.anodized,y);for(let Y of[-.12,.12])i(o(.17,.17,.04,36),e.brass,y,[0,Y,0]);i(o(.1,.1,.02,28),e.anodized,y,[0,.15,0]),h(.13,.04,u(["MASS ANALYZER"],{bg:"#f3f4f6",fg:"#1f2933",size:.5}),y,[0,.1612,0],[-Math.PI/2,0,0]),i(o(.07,.09,.16,20),e.graphite,y,[0,-.22,0]),d("magnet",y,new t.Vector3(-1.021,pr+.142,.261));let M=new t.Group;M.position.set(0,pr,Bn),p.add(M),c(i(o(.04,.04,.12,20),e.stainless,M,[-.76,0,0]),"x"),i(l(.05,.14,.14,.006),e.anodized,M,[-.685,0,0]);for(let Y=0;Y<7;Y++)c(i(o(.125,.125,.012,40),e.satin,M,[-.64+Y*.07,0,0]),"x");for(let Y=0;Y<6;Y++)c(i(o(.095,.095,.058,32),e.ceramic,M,[-.605+Y*.07,0,0]),"x");for(let Y of[-.64,-.22])r(o(.015,.015,.175,10),e.stainless,M,[Y,-.2125,0]);d("column",M,new t.Vector3(-.395,pr+.067,Bn+.067));let v=new t.Group;v.position.set(.02,pr,Bn),p.add(v),c(i(o(.04,.04,.5,20),e.stainless,v),"x"),i(l(.2,.18,.18,.01),e.anodized,v),h(.11,.035,u(["BEAM SCAN"],{bg:"#f3f4f6",fg:"#1f2933",size:.55}),v,[0,.02,.0912]),r(o(.015,.015,.21,10),e.stainless,v,[0,-.195,0]),d("scanner",v,new t.Vector3(.02,pr+.092,Bn+.06));let w=new t.Group;w.position.set(Ga,Je,Bn),p.add(w),i(l(.54,.02,.54,.004),e.stainless,w,[0,.01,0]);for(let Y of[-1,1])for(let W of[-1,1])r(o(.012,.012,.5,10),e.satin,w,[Y*.255,.27,W*.255]);i(l(.56,.03,.56,.006),e.stainless,w,[0,.535,0]),a(i(l(.5,.5,.5,.004),e.glass,w,[0,.27,0])),c(i(o(.06,.06,.03,24),e.stainless,w,[-.262,.3,0]),"x"),i(l(.03,.12,.12,.004),e.graphite,w,[.24,.3,0]),i(l(.024,.04,.36,.004),e.anodized,w,[.262,.15,0]),i(o(.05,.06,.09,24),e.anodized,w,[.03,.065,0]);let E=i(o(.014,.014,1,12),e.stainless,w,[.03,.12,0]),x=new t.Group;x.position.set(0,mr-Je,0),w.add(x),i(o(.162,.162,.012,48),e.anodized,x,[0,-.009,0]),h(.2,.045,u(["END STATION"],{bg:"#f3f4f6",fg:"#1f2933",size:.55}),w,[0,.535,.2812]);let S=new t.MeshBasicMaterial({color:9684477,transparent:!0,opacity:0,blending:t.AdditiveBlending,depthWrite:!1,side:t.DoubleSide});a(c(i(o(.012,.13,.225,24,!0),S,w,[-.135,.3,0]),"x")),d("chamber",w,new t.Vector3(Ga,Je+.552,Bn+.2));let P=new t.Group;P.position.set(ac,Je,Bn),p.add(P),i(o(.22,.23,.11,48),e.stainless,P,[0,.055,0]),i(o(.17,.17,.012,48),e.graphite,P,[0,.116,0]);for(let Y=0;Y<3;Y++)r(o(.005,.005,.03,8),e.ceramic,P,[Math.cos(Y*2.094+.5)*.1,.133,Math.sin(Y*2.094+.5)*.1]);a(i(new t.CylinderGeometry(.2,.2,.15,48,1,!0,1.5*Math.PI+.87,2*Math.PI-1.74),e.glass,P,[0,.185,0])),i(l(.46,.09,.46,.01),e.paint,P,[0,.31,0]),i(l(.07,.3,.05,.006),e.graphite,P,[0,.15,-.245]);let R=new t.MeshStandardMaterial({color:5917244,emissive:16747034,emissiveIntensity:0,roughness:.5});for(let Y=0;Y<5;Y++)a(c(i(o(.011,.011,.38,12),R,P,[-.16+Y*.08,.258,0]),"z"));h(.16,.045,u(["ANNEAL"],{bg:"#f3f4f6",fg:"#1f2933",size:.55}),P,[0,.31,.2312]);let I=new t.PointLight(16747066,0,1.6,1.8);I.position.set(ac,Je+.21,Bn+.12),p.add(I),d("annealer",P,new t.Vector3(ac,Je+.357,Bn+.15));let U=document.createElement("canvas");U.width=U.height=256;let O=new t.CanvasTexture(U);O.colorSpace=t.SRGBColorSpace;let C=new t.Group;C.position.set(Ga,mr,Bn),p.add(C),i(o(.15,.15,.004,64),[e.silicon,n(16777215,.3,.25,{map:O}),e.silicon],C).userData.fixed=!0;let F=new t.MeshBasicMaterial({color:16742938,transparent:!0,opacity:0,blending:t.AdditiveBlending,depthWrite:!1});a(i(o(.151,.151,.002,48),F,C,[0,.0035,0])),d("wafer",C,new t.Vector3(Ga,mr+.02,Bn));let H=Ub;_.cabinet(H.x,H.front,{w:1.08});let B=_.screen(H.x,1.31,H.front),Q=Y=>`${(10**(Y-Math.floor(Y+1e-9))).toFixed(1)}E${Math.floor(Y+1e-9)}`,k={energy:_.dial("energy",H.x-.39,.99,H.front,{min:20,max:200,major:20,minor:5,unit:"keV",perPixel:.5,wheel:5,title:"E"}),dose:_.dial("dose",H.x-.13,.99,H.front,{min:13,max:16,major:1,minor:.1,unit:"cm\u207B\xB2",perPixel:.01,wheel:.1,title:"DOSE",tick:Y=>`1E${Math.round(Y)}`,readout:Q}),temperature:_.dial("temperature",H.x+.13,.99,H.front,{min:800,max:1100,major:100,minor:10,unit:"\xB0C",perPixel:1,wheel:10,title:"TEMP"}),minutes:_.dial("minutes",H.x+.39,.99,H.front,{min:1,max:60,major:10,minor:1,unit:"min",perPixel:.2,wheel:1,title:"TIME"})},tt={implant:_.button("implant","IMPLANT",H.x-.26,.7,H.front,3718648),anneal:_.button("anneal","ANNEAL",H.x+.26,.7,H.front,16096779)},J=_.tower(H.x+.44,1.5,H.front-.3),Z="",ht=0,X=25,q=new t.Color;function $(Y){let W=`${Y.filmColor.join(",")}|${Y.windows}`;if(W===Z)return;Z=W;let mt=U.getContext("2d"),pt=U.width,[St,Ct,nt]=Y.filmColor;if(mt.fillStyle=`rgb(${St},${Ct},${nt})`,mt.fillRect(0,0,pt,pt),Y.windows){mt.fillStyle="rgba(150,160,176,.85)";let ft=pt/10;for(let _t=0;_t<64;_t++)mt.fillRect((_t%8+1)*ft+4,(Math.floor(_t/8)+1)*ft+4,ft-8,ft-8)}O.needsUpdate=!0}function lt(Y,W,mt){let pt=Y.phase==="annealing"||Y.phase==="done";ht+=((Y.phase==="implanting"?1:0)-ht)*Math.min(1,W*3.5);let St=ht*ht*(3-2*ht),Ct=(pr-mr)*St,nt=pt&&ht<.06?ac:Ga;C.position.x+=(nt-C.position.x)*Math.min(1,W*3);let ft=Math.abs(C.position.x-Ga)<.02;x.position.y=mr-Je+Ct,x.rotation.z=Sg*St,C.position.y=mr+(ft?Ct:0),C.rotation.z=ft?Sg*St:0;let _t=mr-Je+Ct-.015;E.scale.y=Math.max(.005,_t-.11),E.position.y=(_t+.11)/2,s.partAnchor("wafer").set(C.position.x,C.position.y+.02,Bn);let Dt=Y.beam&&ht>.8?.26+.07*Math.sin(mt*31):0;S.opacity+=(Dt-S.opacity)*Math.min(1,W*10),g.material.emissiveIntensity=Y.beam?1.6:.05,X+=(Y.hot-X)*Math.min(1,W*1.6);let Mt=_.heat(X,q);R.emissive.copy(q),R.emissiveIntensity=Mt*2.2,I.intensity=Mt*2,F.opacity=Math.abs(C.position.x-ac)<.03?Mt*.7:0,$(Y);for(let[qt,Ft]of Object.entries(k))Ft.set(Y.controls[qt]);tt.implant.set(Y.phase==="ready",W,!1),tt.anneal.set(Y.phase==="implanted"||Y.phase==="done",W,!1),J.set(Y.alarm?2:Y.phase==="implanting"||Y.phase==="annealing"?0:1,W,mt)}return{update:lt,screenCanvas:B.canvas,refreshScreen:B.refresh,views:{home:[[1.5,2.6,6.4],[.62,1,.05]],beamline:[[-.75,2,2.5],[-.62,Je+.28,0]],chamber:[[.95,1.65,2.15],[.8,Je+.25,Bn]],panel:[[H.x+.25,1.15,2.6],[H.x,.98,H.front]],screen:[[H.x,1.33,H.front+.85],[H.x,1.31,H.front]]},layout:{dials:Object.fromEntries(Object.entries(k).map(([Y,W])=>[Y,W.at])),buttons:Object.fromEntries(Object.entries(tt).map(([Y,W])=>[Y,W.at])),hmi:B.at}}}var vn=.86,ye={x:-.14,z:.06},Ob=vn+.27,gr=vn+.8,Eg=gr-(Ob+.048),tp=.3,Fb={x:1.16,front:.5};function Tg(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,box:l,facing:c,tube:h,plate:u,label:f,shade:d,control:p,info:_}=s,m=s.root,g=un(s),y=n(12088115,1,.38);i(l(1.36,vn-.03,1.04,.012),e.paint,m,[0,(vn-.03)/2,0]),i(l(1.38,.03,1.06,.006),e.stainless,m,[0,vn-.015,0]),i(l(1.38,.08,1.06,.006),e.graphite,m,[0,.04,0]),u(.5,.07,f(["EP-01","COPPER ELECTROPLATING"],{bg:"#24272c",fg:"#e9edf3",size:.82}),m,[-.3,vn-.2,.522]),d(2.6,1.9,.35,8e-4,0,.42);let M=new t.Group;M.position.set(ye.x,vn,ye.z),m.add(M),i(o(.33,.345,.08,56),e.stainless,M,[0,.04,0]),a(i(o(.3,.3,.27,56,!0),e.glass,M,[0,.215,0])),r(new t.TorusGeometry(.3,.012,10,56),e.stainless,M,[0,.35,0]).rotation.x=Math.PI/2;for(let Z=0;Z<4;Z++){let ht=Z*Math.PI/2+.6;r(o(.009,.009,.27,8),e.satin,M,[Math.cos(ht)*.315,.215,Math.sin(ht)*.315])}a(i(o(.292,.292,.19,56),n(2064344,0,.08,{transparent:!0,opacity:.5,depthWrite:!1}),M,[0,.175,0])),i(o(.06,.06,.22,24),e.white,M,[-.4,.11,.3]),r(o(.065,.065,.02,24),e.anodized,M,[-.4,.23,.3]),h([[-.4,.05,.24],[-.36,.035,.14],[-.3,.03,.08]],.014,e.white,M,16),_("cell",M,new t.Vector3(ye.x,vn+.045,ye.z+.338));let v=new t.Group;v.position.set(ye.x,vn,ye.z),m.add(v),i(o(.24,.24,.03,48),y,v,[0,.095,0]),_("anode",v,new t.Vector3(ye.x+.12,vn+.111,ye.z+.12));let w=new t.MeshBasicMaterial({color:16777215,transparent:!0,opacity:.75,depthWrite:!1}),E=[];for(let Z=0;Z<14;Z++)E.push(a(i(new t.SphereGeometry(.007,8,6),w,M)));i(l(.13,1.08,.13,.01),e.paint,m,[ye.x,vn+.54,-.42]),i(l(.03,1,.008,.002),e.anodized,m,[ye.x,vn+.55,-.353]);let x=new t.Group;x.position.set(ye.x,gr,ye.z),m.add(x),i(l(.18,.14,.1,.008),e.anodized,x,[0,0,-.4]),i(l(.09,.07,.36,.008),e.aluminum,x,[0,0,-.22]);let S=new t.Group;x.add(S),i(o(.19,.19,.09,48),e.paint,S),i(o(.1,.085,.08,32),e.anodized,S,[0,-.085,0]),i(o(.166,.166,.014,48),e.anodized,S,[0,.05,0]);let P=new t.Group;P.position.y=.059,S.add(P);let R=document.createElement("canvas");R.width=R.height=256;let I=new t.CanvasTexture(R);I.colorSpace=t.SRGBColorSpace,i(o(.15,.15,.004,64),[e.silicon,n(16777215,.75,.3,{map:I}),e.silicon],P).userData.fixed=!0,p("head",x,new t.Vector3(ye.x,gr,ye.z+.19),{drag:"lift",travel:-.55,value:Z=>Z?.head??0}),_("wafer",P,new t.Vector3(ye.x,gr+.062,ye.z));let U=new t.Group;U.position.set(.44,vn,-.3),m.add(U),i(l(.3,.26,.24,.008),e.graphite,U,[0,.13,0]),u(.15,.04,f(["DC RECTIFIER"],{bg:"#f3f4f6",fg:"#1f2933",size:.55}),U,[0,.19,.1205]);for(let[Z,ht]of[[-.07,e.red],[.07,e.rubber]])c(r(o(.014,.014,.02,12),ht,U,[Z,.08,.125]),"z");h([[-.07,.08,.13],[-.12,.03,.22],[-.2,.02,.32],[ye.x-.44+.34,.03,ye.z+.3]],.008,e.red,U,28).castShadow=!1,h([[.07,.08,.13],[.1,.02,.2],[-.2,.015,.02],[ye.x-.44+.07,.05,-.36+.3]],.008,e.rubber,U,28).castShadow=!1,_("rectifier",U,new t.Vector3(.44,vn+.262,-.22));let O=Fb;g.cabinet(O.x,O.front,{w:.66});let C=g.screen(O.x,1.31,O.front),F={current:g.dial("current",O.x-.16,.99,O.front,{min:0,max:40,major:10,minor:2,unit:"A",perPixel:.1,wheel:.5,title:"DC",readout:Z=>`${Z.toFixed(1)} A`}),rotation:g.dial("rotation",O.x+.16,.99,O.front,{min:10,max:120,major:10,minor:5,unit:"rpm",perPixel:.4,wheel:5,title:"SPIN"})},H=g.tower(O.x+.24,1.5,O.front-.3),B="";function Q(Z){let ht=Math.min(1,Z.thickness/300),X=`${Math.round(ht*20)}|${Z.burnt}|${Z.windows}`;if(X===B)return;B=X;let q=R.getContext("2d"),$=R.width,lt=(Y,W)=>Math.round(Y+(W-Y)*ht);if(q.fillStyle=Z.burnt?"#4a3226":`rgb(${lt(138,222)},${lt(92,140)},${lt(64,88)})`,q.fillRect(0,0,$,$),Z.windows&&ht<1){q.fillStyle=`rgba(60,40,30,${.4*(1-ht)})`;let Y=$/10;for(let W=0;W<64;W++)q.fillRect((W%8+1)*Y+4,(Math.floor(W/8)+1)*Y+4,Y-8,Y-8)}if(Z.burnt){q.fillStyle="rgba(20,12,8,.5)";for(let Y=0;Y<500;Y++)q.fillRect(Y*97%$,Y*57%$,2,2)}I.needsUpdate=!0}let k=Z=>Z*Z*(3-2*Z),tt=Z=>Math.min(1,Math.max(0,Z));function J(Z,ht,X){let q=Math.PI*k(tt(Z.head/tp)),$=tt((Z.head-tp)/(1-tp));x.position.y=gr-Eg*$,S.rotation.z=q,P.rotation.y+=ht*Math.min(26,Z.spin/60*6.283*.3);let lt=q>Math.PI/2;s.partAnchor("head").set(ye.x,x.position.y+(lt?.085:0),ye.z+(lt?.1:.19)),s.partAnchor("wafer").set(ye.x-.062*Math.sin(q),x.position.y+.062*Math.cos(q),ye.z),w.opacity=Z.over?.75:0,Z.over&&E.forEach((Y,W)=>{let mt=W*2.4,pt=(X*.35+W*.071)%1;Y.position.set(Math.cos(mt)*(.17+.05*(W*7%3)/2),.2+.07*pt,Math.sin(mt)*(.17+.05*(W*7%3)/2))}),Q(Z);for(let[Y,W]of Object.entries(F))W.set(Z.controls[Y]);H.set(Z.alarm||Z.over?2:Z.plating?0:1,ht,X)}return{update:J,screenCanvas:C.canvas,refreshScreen:C.refresh,views:{home:[[1.9,2.15,4.2],[.4,1.12,.05]],cell:[[.6,1.75,2],[ye.x,vn+.38,ye.z]],panel:[[O.x+.2,1.1,2.2],[O.x,.95,O.front]],screen:[[O.x,1.33,O.front+.85],[O.x,1.31,O.front]]},layout:{dials:Object.fromEntries(Object.entries(F).map(([Z,ht])=>[Z,ht.at])),hmi:C.at,grip:{up:[ye.x,gr,ye.z+.19],down:[ye.x,gr-Eg+.085,ye.z+.1]}}}}var Re=.86,me={x:-.1,z:.07},Gu=Re+.242,wg=.008,Bb={x:1.22,front:.5};function Ag(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,box:l,facing:c,tube:h,plate:u,label:f,shade:d,info:p}=s,_=s.root,m=un(s);i(l(1.36,Re-.03,1.04,.012),e.paint,_,[0,(Re-.03)/2,0]),i(l(1.38,.03,1.06,.006),e.stainless,_,[0,Re-.015,0]),i(l(1.38,.08,1.06,.006),e.graphite,_,[0,.04,0]),u(.5,.07,f(["PB-01","WAFER PROBER"],{bg:"#24272c",fg:"#e9edf3",size:.82}),_,[-.3,Re-.2,.522]),d(2.7,1.9,.38,8e-4,0,.42),i(l(.92,.05,.74,.006),e.graphite,_,[me.x,Re+.025,me.z]);for(let Z of[-.3,.3])r(l(.03,.012,.7,.002),e.satin,_,[me.x+Z,Re+.056,me.z]);let g=new t.Group;g.position.set(me.x,0,me.z),_.add(g),i(l(.7,.035,.44,.006),e.aluminum,g,[0,Re+.08,0]);for(let Z of[-.15,.15])r(l(.66,.012,.03,.002),e.satin,g,[0,Re+.103,Z]);let y=new t.Group;y.position.set(me.x,0,me.z),_.add(y),i(l(.4,.035,.4,.006),e.aluminum,y,[0,Re+.127,0]),i(o(.07,.085,.045,32),e.anodized,y,[0,Re+.167,0]),i(o(.165,.165,.05,56),e.brass,y,[0,Re+.215,0]),p("chuck",y,new t.Vector3(me.x+.117,Re+.215,me.z+.117));let M=document.createElement("canvas");M.width=M.height=512;let v=new t.CanvasTexture(M);v.colorSpace=t.SRGBColorSpace,v.anisotropy=4;let w=new t.Group;w.position.y=Gu,y.add(w),i(o(.15,.15,.004,64),[e.silicon,n(16777215,.3,.3,{map:v}),e.silicon],w).userData.fixed=!0,p("wafer",w,new t.Vector3(me.x+.09,Gu+.003,me.z+.1));let E=new t.Group;E.position.set(me.x,Re,me.z),_.add(E);for(let Z of[-1,1])i(l(.07,.36,.12,.006),e.paint,E,[Z*.515,.18,0]);i(l(1.1,.05,.16,.008),e.paint,E,[0,.385,0]),i(o(.19,.19,.02,48),e.stainless,E,[0,.35,0]),i(o(.17,.17,.008,48),n(2062909,.1,.6),E,[0,.336,0]),i(o(.05,.05,.01,32),e.ceramic,E,[0,.328,0]);for(let Z=0;Z<12;Z++){let ht=Z*Math.PI/6+.26,X=Math.cos(ht),q=Math.sin(ht);a(h([[X*.045,.324,q*.045],[X*.006,Gu+.002+wg-Re,q*.006]],.0013,e.satin,E,3))}u(.16,.035,f(["PROBE CARD"],{bg:"#f3f4f6",fg:"#1f2933",size:.55}),E,[-.3,.385,.0805]),p("card",E,new t.Vector3(me.x-.3,Re+.412,me.z+.05));let x=new t.Group;x.position.set(me.x,Re+.41,me.z),_.add(x),i(l(.08,.1,.08,.006),e.anodized,x,[0,.05,0]),i(o(.022,.026,.04,20),e.stainless,x,[0,.12,0]),h([[.04,.07,0],[.12,.1,-.04],[.26,.03,-.06]],.006,e.rubber,x,14).castShadow=!1,p("camera",x,new t.Vector3(me.x,Re+.512,me.z+.02));let S=new t.Group;S.position.set(-.42,Re,-.42),_.add(S),i(l(.42,.62,.2,.01),e.paint,S,[0,.31,0]),u(.14,.04,f(["TESTER"],{bg:"#24272c",fg:"#e9edf3",size:.6}),S,[-.11,.55,.1005]);let P=new t.MeshStandardMaterial({color:1332013,emissive:2278750,emissiveIntensity:.05,roughness:.4});for(let Z=0;Z<6;Z++)a(i(l(.022,.012,.004,.001),P,S,[.02+Z*.03,.55,.101]));for(let Z=0;Z<5;Z++)r(l(.3,.008,.004,.001),e.graphite,S,[0,.14+Z*.045,.101]);h([[.1,.62,0],[.2,.72,.18],[.3,.62,.4],[.26,.42,.46]],.018,e.rubber,S,30),p("tester",S,new t.Vector3(-.42,Re+.622,-.34));let R=Bb,I=Z=>`${Z>0?"+":""}${Math.round(Z)}`;m.cabinet(R.x,R.front,{w:.84});let U=m.screen(R.x,1.31,R.front),O={x:m.dial("x",R.x-.27,.99,R.front,{min:-60,max:60,major:20,minor:5,unit:"\xB5m",perPixel:.25,wheel:1,title:"X",format:I}),y:m.dial("y",R.x,.99,R.front,{min:-60,max:60,major:20,minor:5,unit:"\xB5m",perPixel:.25,wheel:1,title:"Y",format:I}),z:m.dial("z",R.x+.27,.99,R.front,{min:0,max:100,major:20,minor:5,unit:"\xB5m",perPixel:.25,wheel:5,title:"OD"})},C={contact:m.button("contact","CONTACT",R.x-.13,.7,R.front,3718648),probe:m.button("probe","PROBE",R.x+.13,.7,R.front,2278750)},F=m.tower(R.x+.32,1.5,R.front-.3),H="",B=0,Q=0,k=0;function tt(Z){let ht=`${Z.stamp}|${Z.filmColor.join(",")}`;if(ht===H)return;H=ht;let X=M.getContext("2d"),q=M.width,[$,lt,Y]=Z.filmColor,W=pt=>(pt/150*.5+.5)*q,mt=20/300*q;X.fillStyle=`rgb(${$},${lt},${Y})`,X.fillRect(0,0,q,q),Z.dies.forEach((pt,St)=>{let Ct=W(pt.y),nt=q-W(pt.x),ft=Z.states[St];X.fillStyle="rgba(214,162,63,.55)",X.fillRect(Ct-mt/2+2,nt-mt/2+2,mt-4,mt-4),ft===1&&(X.fillStyle="rgba(47,158,121,.45)",X.fillRect(Ct-mt/2+2,nt-mt/2+2,mt-4,mt-4)),ft===2&&(X.fillStyle="rgba(20,20,24,.9)",X.beginPath(),X.arc(Ct,nt,mt*.24,0,7),X.fill())}),v.needsUpdate=!0}function J(Z,ht,X){let q=Math.min(1,ht*12);B+=(-Z.at.x/1e3-B)*q,Q+=(-Z.at.y/1e3-Q)*q,k+=((Z.down?1:0)-k)*Math.min(1,ht*16),g.position.z=me.z+Q,y.position.set(me.x+B,wg*k,me.z+Q),s.partAnchor("chuck").set(me.x+B+.117,Re+.215,me.z+Q+.117),s.partAnchor("wafer").set(me.x+B+.09,Gu+.003,me.z+Q+.1),P.emissiveIntensity=Z.testing?.9+.7*Math.sin(X*24):.05,tt(Z);for(let[$,lt]of Object.entries(O))lt.set(Z.controls[$]);C.contact.set(Z.phase!=="probing",ht,!1),C.probe.set(Z.phase!=="probing",ht,!1),F.set(Z.alarm?2:Z.testing?0:1,ht,X)}return{update:J,screenCanvas:U.canvas,refreshScreen:U.refresh,views:{home:[[1.95,2.15,4.2],[.42,1.12,.05]],stage:[[.55,1.75,1.9],[me.x,Re+.25,me.z]],needles:[[.22,1.3,.95],[me.x,Re+.28,me.z]],panel:[[R.x+.2,1.1,2.3],[R.x,.95,R.front]],screen:[[R.x,1.33,R.front+.85],[R.x,1.31,R.front]]},layout:{dials:Object.fromEntries(Object.entries(O).map(([Z,ht])=>[Z,ht.at])),buttons:Object.fromEntries(Object.entries(C).map(([Z,ht])=>[Z,ht.at])),hmi:U.at}}}var Ri=.86,ce={x:-.12,z:.12},fi=Ri+.073,ep=.2,vs=[[-1,-1],[1,-1],[1,1],[-1,1]],Va=.06,zb={x:1.22,front:.5};function Rg(s){let{THREE:t,mat:e,std:n,add:i,small:r,ghost:a,cyl:o,box:l,facing:c,tube:h,plate:u,label:f,shade:d,info:p}=s,_=s.root,m=un(s),g=n(13934615,1,.3),y=n(12088115,1,.42),M=n(3818066,.6,.3),v=q=>[vs[q][0]*.024,.0108,vs[q][1]*.024],w=q=>[vs[q][0]*.06,.002,vs[q][1]*.024];i(l(1.36,Ri-.03,1.04,.012),e.paint,_,[0,(Ri-.03)/2,0]),i(l(1.38,.03,1.06,.006),e.stainless,_,[0,Ri-.015,0]),i(l(1.38,.08,1.06,.006),e.graphite,_,[0,.04,0]),u(.5,.07,f(["WB-01","WIRE BONDER"],{bg:"#24272c",fg:"#e9edf3",size:.82}),_,[-.3,Ri-.2,.522]),d(2.7,1.9,.38,8e-4,0,.42);let E=new t.Group;E.position.set(ce.x,Ri,ce.z),_.add(E),i(l(.62,.07,.3,.006),e.anodized,E,[0,.035,0]);for(let q of[-.1,.1])i(l(1.02,.014,.022,.003),e.satin,E,[0,.084,q]);u(.13,.035,f(["HEATER 150\xB0C"],{bg:"#f3f4f6",fg:"#1f2933",size:.5}),E,[-.2,.035,.1505]),p("stage",E,new t.Vector3(ce.x+.02,Ri+.04,ce.z+.151));let x=new t.Group;x.position.set(ce.x,fi,ce.z),_.add(x),i(l(1.04,.003,.17,.001),y,x,[0,-.0015,0]);for(let q=-2;q<=2;q++){let $=new t.Group;$.position.x=q*ep,x.add($),i(l(.07,.008,.07,.001),M,$,[0,.006,0]);for(let lt=0;lt<4;lt++)r(l(.009,.001,.009,3e-4),y,$,[v(lt)[0],.0104,v(lt)[2]]),r(l(.035,.002,.014,5e-4),e.aluminum,$,[vs[lt][0]*.072,.001,vs[lt][1]*.024])}p("chip",x,new t.Vector3(ce.x+ep,fi+.011,ce.z));let S=vs.map((q,$)=>{let[lt,Y,W]=v($),[mt,pt,St]=w($),Ct=vs[$][0],nt=a(h([[lt,Y,W],[lt+Ct*.003,Y+.011,W],[lt+Ct*.02,Y+.012,W],[mt,pt,St]],9e-4,g,_,20));nt.position.set(ce.x,fi,ce.z),nt.visible=!1;let ft=a(i(o(.0035,.0035,.0018,14),g,_,[ce.x+lt,fi+Y,ce.z+W]));return ft.visible=!1,{wire:nt,ball:ft}});i(l(.36,.1,.26,.008),e.paint,_,[ce.x,Ri+.05,ce.z-.36]);let P=new t.Group;P.position.set(ce.x,fi+Va,ce.z),_.add(P),i(o(.006,.0012,.045,12),e.ceramic,P,[0,.0225,0]),c(i(o(.01,.022,.26,20),e.stainless,P,[0,.045,-.13]),"z"),i(l(.16,.16,.14,.01),e.anodized,P,[0,.075,-.33]),r(l(.022,.012,.022,.002),e.satin,P,[0,.085,0]),i(l(.05,.07,.05,.004),e.graphite,P,[.075,.125,-.28]),r(o(.014,.017,.03,14),e.stainless,P,[.075,.075,-.28]),i(l(.02,.1,.02,.003),e.satin,P,[0,.2,-.32]),a(h([[0,.24,-.285],[0,.17,-.1],[0,.092,0],[0,.045,0]],9e-4,g,P,20)),p("head",P,new t.Vector3(ce.x,fi+Va+.1,ce.z-.259));let R=new t.Group;R.position.set(0,.24,-.3),P.add(R),c(i(o(.045,.045,.03,32),g,R),"z"),c(r(o(.05,.05,.004,32),e.aluminum,R,[0,0,.017]),"z"),c(r(o(.05,.05,.004,32),e.aluminum,R,[0,0,-.017]),"z"),p("spool",R,new t.Vector3(ce.x,fi+Va+.24,ce.z-.28));let I=new t.Group;I.position.set(ce.x+.46,Ri,ce.z+.05),_.add(I),i(o(.02,.026,.14,20),e.stainless,I,[0,.07,0]),i(l(.08,.06,.1,.006),e.graphite,I,[0,.17,0]),u(.06,.03,f(["PULL"],{bg:"#f3f4f6",fg:"#1f2933",size:.6}),I,[0,.17,.0505]),p("puller",I,new t.Vector3(ce.x+.46,Ri+.202,ce.z+.07));let U=new t.Group;_.add(U),r(l(.46,.008,.008,.002),e.satin,U,[.235,.03,0]),a(h([[.005,.03,0],[.005,.004,0],[0,0,0],[-.004,.003,0]],8e-4,e.stainless,U,10));let O=[ce.x+.13,fi+.085,ce.z+.05],C=zb;m.cabinet(C.x,C.front,{w:.84});let F=m.screen(C.x,1.31,C.front),H={power:m.dial("power",C.x-.27,.99,C.front,{min:0,max:200,major:50,minor:10,unit:"mW",perPixel:.5,wheel:5,title:"US"}),force:m.dial("force",C.x,.99,C.front,{min:10,max:80,major:10,minor:2,unit:"gf",perPixel:.2,wheel:1,title:"FORCE"}),time:m.dial("time",C.x+.27,.99,C.front,{min:5,max:50,major:5,minor:1,unit:"ms",perPixel:.15,wheel:1,title:"TIME"})},B={bond:m.button("bond","BOND",C.x-.27,.7,C.front,3718648),pull:m.button("pull","PULL",C.x,.7,C.front,16096779),run:m.button("run","RUN",C.x+.27,.7,C.front,2278750)},Q=m.tower(C.x+.32,1.5,C.front-.3),k=q=>q*q*(3-2*q),tt=(q,$,lt)=>q+($-q)*lt,J=new t.Vector3,Z=new t.Vector3;function ht(q,$,lt){let[Y,W,mt]=v(q),[pt,St,Ct]=w(q);if($<.12)return lt.set(Y,tt(Va,W,k($/.12)),mt);if($<.32)return lt.set(Y,W,mt);if($<.62){let nt=k(($-.32)/.3);return lt.set(tt(Y,pt,nt),tt(W,St,nt)+.022*Math.sin(Math.PI*nt),tt(mt,Ct,nt))}return $<.82?lt.set(pt,St,Ct):lt.set(pt,tt(St,Va,k(($-.82)/.18)),Ct)}function X(q,$,lt){q.wire>=0?ht(q.wire,q.progress,Z):Z.set(0,Va,0);let Y=q.wire>=0&&(q.progress>.12&&q.progress<.32||q.progress>.62&&q.progress<.82);if(J.lerp(Z,Math.min(1,$*18)),P.position.set(ce.x+J.x+(Y?6e-4*Math.sin(lt*180):0),fi+J.y,ce.z+J.z),s.partAnchor("head").set(P.position.x,P.position.y+.1,P.position.z-.259),s.partAnchor("spool").set(P.position.x,P.position.y+.24,P.position.z-.28),x.position.x=ce.x-ep*k(q.shift),S.forEach((mt,pt)=>{let St=pt<q.done||pt===q.wire&&q.progress>.62,Ct=St&&!q.pulled.includes(pt)&&q.shift===0;mt.wire.visible=Ct,mt.ball.visible=(Ct||pt===q.wire&&q.progress>.2||St&&q.pulled.includes(pt))&&q.shift===0}),q.pulling>0&&q.hookAt>=0){let[mt,pt,St]=v(q.hookAt),[Ct,,nt]=w(q.hookAt),ft=k(Math.min(1,q.pulling/.4)),_t=Math.max(0,(q.pulling-.4)/.6);U.position.set(tt(O[0],ce.x+(mt+Ct)/2,ft),tt(O[1],fi+pt+.006+.03*_t,ft),tt(O[2],ce.z+(St+nt)/2,ft))}else U.position.set(O[0],O[1],O[2]);for(let[mt,pt]of Object.entries(H))pt.set(q.controls[mt]);let W=q.phase==="setup";B.bond.set(W,$,!1),B.pull.set(W&&q.canPull,$,!1),B.run.set(W,$,!1),Q.set(q.alarm?2:q.phase==="running"||q.phase==="bonding"?0:1,$,lt)}return{update:X,screenCanvas:F.canvas,refreshScreen:F.refresh,views:{home:[[1.95,2.15,4.2],[.42,1.12,.05]],work:[[.42,1.3,1.05],[ce.x+.02,fi+.03,ce.z]],panel:[[C.x+.2,1.1,2.3],[C.x,.95,C.front]],screen:[[C.x,1.33,C.front+.85],[C.x,1.31,C.front]]},layout:{dials:Object.fromEntries(Object.entries(H).map(([q,$])=>[q,$.at])),buttons:Object.fromEntries(Object.entries(B).map(([q,$])=>[q,$.at])),hmi:F.at}}}var Cg={crystal:_g,oxidation:xg,photo:yg,etch:Mg,implant:bg,plating:Tg,prober:Ag,bonder:Rg};function kb({canvas:s,on:t={}}){let e;try{let b=s.getContext("webgl2",{antialias:!0,alpha:!1});if(!b)return null;e=new ic({canvas:s,context:b,antialias:!0})}catch{return null}let n=Math.min(window.devicePixelRatio||1,2),i=0,r=0,a=!0;e.setPixelRatio(n),e.shadowMap.enabled=!0,e.shadowMap.type=ms,e.toneMapping=Ta,e.toneMappingExposure=.9;let o=new zi;o.background=new Lt(14541287),o.fog=new Hs(14541287,11,26);let l=new fr(e),c=new Fu,h=l.fromScene(c,.04);o.environment=h.texture,o.environmentIntensity=.85,c.dispose(),l.dispose(),o.add(new er(16185855,11121346,.42));let u=new ps(16775148,2.25);u.position.set(-3,7.4,4.4),u.target.position.set(.1,1.2,0),u.castShadow=!0,u.shadow.mapSize.set(2048,2048),u.shadow.bias=-4e-4,u.shadow.normalBias=.014,u.shadow.radius=4,Object.assign(u.shadow.camera,{left:-2.6,right:2.6,top:3.2,bottom:-2.2,near:.5,far:18}),o.add(u,u.target);let f=new ps(14477567,.55);f.position.set(4,3,2),o.add(f);let d=new De(34,1.6,.05,80),p=(b,N,z,it)=>new ci({color:b,metalness:N,roughness:z,...it}),_=b=>()=>(b=b*1664525+1013904223>>>0)/4294967296,m=[];function g(b,N,z=!0){let[it,rt]=Array.isArray(b)?b:[b,b],dt=document.createElement("canvas");dt.width=it,dt.height=rt,N(dt.getContext("2d"),it,rt);let yt=new ta(dt);return yt.anisotropy=Math.min(8,e.capabilities.getMaxAnisotropy()),z&&(yt.colorSpace=je),m.push(yt),yt}function y(b,N){let z=g(256,(it,rt)=>{it.fillStyle="#9c9c9c",it.fillRect(0,0,rt,rt);let dt=_(3);for(let yt=0;yt<2600;yt++){let Xt=105+Math.floor(dt()*100);it.fillStyle=`rgba(${Xt},${Xt},${Xt},.35)`,it.fillRect(dt()*rt-40,dt()*rt,40+dt()*160,1)}},!1);return z.wrapS=z.wrapT=Bi,z.repeat.set(b,N),z}let M={paint:new Ks({color:14804200,metalness:0,roughness:.46,clearcoat:.3,clearcoatRoughness:.4}),stainless:p(13949149,1,.52,{roughnessMap:y(3,3)}),satin:p(12568012,1,.44),aluminum:p(14080734,.92,.36),anodized:p(2369324,.65,.42),graphite:p(3883080,.2,.62),rubber:p(1447963,0,.9),white:p(16448250,0,.5),ceramic:p(15723748,0,.92),quartz:p(15988472,0,.3,{transparent:!0,opacity:.55}),glass:p(14674674,0,.06,{transparent:!0,opacity:.2,depthWrite:!1,side:Nn}),silicon:p(9279398,.9,.22),red:p(13183007,.1,.38),yellow:p(15844367,0,.5),blue:p(3112920,0,.4),brass:p(13215066,1,.35)},v=g(128,(b,N)=>{let z=b.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);z.addColorStop(0,"rgba(0,0,0,1)"),z.addColorStop(.6,"rgba(0,0,0,.5)"),z.addColorStop(1,"rgba(0,0,0,0)"),b.fillStyle=z,b.fillRect(0,0,N,N)}),w=null,E={};function x(b,N,z=w,it){let rt=new ue(b,N);return rt.castShadow=!0,rt.receiveShadow=!0,it&&rt.position.set(it[0],it[1],it[2]),z.add(rt),rt}let S=(...b)=>{let N=x(...b);return N.castShadow=!1,N},P=b=>(b.raycast=()=>{},b.castShadow=b.receiveShadow=!1,b.userData.fixed=!0,b),R=b=>(b.raycast=()=>{},b.castShadow=!1,b.userData.fixed=!0,b),I=(b,N,z,it=48,rt=!1)=>new cs(b,N,z,it,1,rt),U=(b,N,z)=>new Tn(b,N,z),O=(b,N,z,it=.008)=>new Bu(b,N,z,3,it),C=(b,N)=>(N==="z"?b.rotation.x=Math.PI/2:N==="x"&&(b.rotation.z=Math.PI/2),b);function F(b,N,z,it=w,rt=40){let dt=new Zs(b.map(yt=>new L(yt[0],yt[1],yt[2])));return x(new Js(dt,rt,N,10),z,it)}function H(b,N,z,it,rt,dt){let yt=R(x(new li(b,N),p(16777215,0,.55,{map:g([Math.round(b*2600),Math.round(N*2600)],z)}),it,rt));return dt&&yt.rotation.set(dt[0],dt[1],dt[2]),yt}let B=(b,{bg:N="#f3f4f6",fg:z="#1f2933",size:it=.5,weight:rt=700,border:dt=null}={})=>(yt,Xt,gt)=>{yt.fillStyle=N,yt.fillRect(0,0,Xt,gt),dt&&(yt.strokeStyle=dt,yt.lineWidth=Math.max(2,gt*.06),yt.strokeRect(yt.lineWidth/2,yt.lineWidth/2,Xt-yt.lineWidth,gt-yt.lineWidth)),yt.fillStyle=z,yt.textAlign="center",yt.textBaseline="middle",b.forEach((Gt,Jt)=>{yt.font=`${Jt?500:rt} ${gt*it/b.length*(Jt?.8:1)}px "Segoe UI", Arial, sans-serif`,yt.fillText(Gt,Xt/2,gt*(Jt+.5)/b.length+gt*.02,Xt*.94)})};function Q(b,N,z,it,rt,dt=.3,yt=w){let Xt=P(x(new li(b,N),new Vn({map:v,transparent:!0,opacity:dt,depthWrite:!1}),yt,[z,it,rt]));return Xt.rotation.x=-Math.PI/2,Xt.renderOrder=1,Xt}function k(b,N,z,it,rt={}){let dt=new Map;z.traverse(yt=>{if(!yt.isMesh||yt.userData.fixed)return;let gt=(Array.isArray(yt.material)?yt.material:[yt.material]).map(Gt=>(dt.has(Gt)||dt.set(Gt,Gt.clone()),dt.get(Gt)));yt.material=Array.isArray(yt.material)?gt:gt[0]}),z.userData.part=N,E[N]={kind:b,group:z,materials:[...dt.values()],anchor:it,glow:0,how:rt}}let tt={THREE:Yf,mat:M,std:p,add:x,small:S,ghost:P,decal:R,cyl:I,cube:U,box:O,facing:C,tube:F,plate:H,label:B,shade:Q,canvasTexture:g,control:(b,N,z,it)=>k("control",b,N,z,it),info:(b,N,z)=>k("info",b,N,z),partAnchor:b=>E[b].anchor,get root(){return w}},J=g(512,(b,N)=>{b.fillStyle="#d0d5db",b.fillRect(0,0,N,N);let z=_(11);for(let it=0;it<2600;it++){let rt=190+Math.floor(z()*30);b.fillStyle=`rgba(${rt},${rt+3},${rt+8},.6)`,b.fillRect(z()*N,z()*N,2,2)}b.fillStyle="rgba(96,106,120,.2)";for(let it=1;it<16;it++)for(let rt=1;rt<16;rt++)b.beginPath(),b.arc(it*32,rt*32,3.2,0,7),b.fill();b.strokeStyle="rgba(70,80,94,.7)",b.lineWidth=5,b.strokeRect(0,0,N,N),b.strokeStyle="rgba(255,255,255,.5)",b.lineWidth=1.5,b.strokeRect(4,4,N-8,N-8)});J.wrapS=J.wrapT=Bi,J.repeat.set(100,100);let Z=new ue(new li(60,60),p(16777215,0,.5,{map:J}));Z.rotation.x=-Math.PI/2,Z.receiveShadow=!0,o.add(Z);let ht=null,X={home:[[3,2,5],[0,1.2,0]]};function q(b){if(!Cg[b])throw new Error(`no equipment for ${b}`);w&&(o.remove(w),w.traverse(N=>{N.geometry?.dispose?.()})),w=new si,o.add(w),E={},pt=null,St=null,Ct=null,ht=Cg[b](tt),X=ht.views,D("home",!0),vt()}let $=new Sa,lt=new ct,Y=new L,W=new L,mt=null,pt=null,St=null,Ct=null,nt=null,ft=!1,_t=0,Dt=b=>{let N=s.getBoundingClientRect();lt.set((b.clientX-N.left)/N.width*2-1,1-(b.clientY-N.top)/N.height*2),$.setFromCamera(lt,d)};function Mt(b){if(!w)return null;Dt(b);let N=$.intersectObjects(w.children,!0).find(z=>{for(let it=z.object;it;it=it.parent)if(!it.visible)return!1;return!0});if(!N)return null;for(let z=N.object;z;z=z.parent)if(z.userData.part)return{name:z.userData.part,kind:E[z.userData.part].kind,point:N.point.clone()};return null}let qt=(b,N)=>t.control?.(b,N),Ft=b=>{let N=E[b].how;return N.value?N.value(mt):mt?.controls?.[b]??0};function ee(b,N){let z=E[b.name].how,it={name:b.name,x:N.clientX,y:N.clientY,moved:!1,start:Ft(b.name)};return z.drag==="lift"&&(d.getWorldDirection(W),W.y=0,W.normalize(),it.plane=new on().setFromNormalAndCoplanarPoint(W,b.point),it.y0=b.point.y),it}function ne(b){let N=St,z=b.clientX-N.x,it=b.clientY-N.y,rt=E[N.name].how;!N.moved&&Math.hypot(z,it)<4||(N.moved||(N.moved=!0,t.drag?.(N.name)),rt.drag==="lift"?(Dt(b),$.ray.intersectPlane(N.plane,Y)&&qt(N.name,N.start+(Y.y-N.y0)/rt.travel)):rt.drag==="slide"&&qt(N.name,N.start+(z-it)*rt.perPixel))}function ae(){let b=St;St=null,Nt.enabled=!0,b&&(!b.moved&&E[b.name].how.click&&qt(b.name,!Ft(b.name)),t.drag?.(null,b.moved?b.name:null))}function V(b){let N=b?.name??null;N!==pt&&(pt=N,s.style.cursor=b?b.kind==="info"?"help":E[N].how.click?"pointer":"grab":"",t.hover?.(N,b?.kind??null))}let Te=b=>{if(b.button!==0)return;let N=Mt(b);if(N){if(N.kind==="info"){Ct={name:N.name,x:b.clientX,y:b.clientY};return}St=ee(N,b),Nt.enabled=!1;try{s.setPointerCapture(b.pointerId)}catch{}}},Qt=b=>{if(St){ne(b);return}b.buttons||(nt={clientX:b.clientX,clientY:b.clientY})},he=b=>{if(Ct&&!St){let N=Ct;Ct=null,Math.hypot(b.clientX-N.x,b.clientY-N.y)<5&&t.press?.(N.name)}Ct=null,ae()},Et=b=>{let N=Mt(b);!N||N.kind!=="control"||!E[N.name].how.wheel||(b.preventDefault(),b.stopImmediatePropagation(),qt(N.name,Ft(N.name)+(b.deltaY<0?1:-1)*E[N.name].how.wheel))},be=()=>{nt=null,St||V(null)};s.addEventListener("pointerdown",Te),s.addEventListener("pointermove",Qt),s.addEventListener("pointerup",he),s.addEventListener("pointercancel",he),s.addEventListener("wheel",Et,{passive:!1}),s.addEventListener("pointerleave",be);let Nt=new Ou(d,s);Nt.enableDamping=!0,Nt.dampingFactor=.12,Nt.rotateSpeed=.7,Nt.zoomSpeed=.8,Nt.panSpeed=.6,Nt.minDistance=.8,Nt.maxDistance=11,Nt.minPolarAngle=.05,Nt.maxPolarAngle=Math.PI*.495;let Wt=null;function D(b="home",N=!1){let z=X[b];z&&(N?(Wt=null,d.position.set(...z[0]),Nt.target.set(...z[1]),Nt.update()):Wt={position:new L(...z[0]),target:new L(...z[1])})}Nt.addEventListener("start",()=>{Wt=null});let T={right:0,bottom:0,x:0,y:0};function K(){let b=s.clientWidth,N=s.clientHeight;if(!b||!N)return;let z=2*T.x,it=2*T.y;d.aspect=(b+z)/(N+it),d.zoom=N/(N+it),d.fov=b/N<1.2?46:34,z>.5||it>.5?d.setViewOffset(b+z,N+it,z,it,b,N):d.clearViewOffset(),d.updateProjectionMatrix()}function xt({right:b=0,bottom:N=0}={}){T.right=Math.max(0,b),T.bottom=Math.max(0,N)}function ut(b){let N=T.right/2,z=T.bottom/2;if(Math.abs(N-T.x)<.5&&Math.abs(z-T.y)<.5)return;let it=Math.min(1,b*8);T.x+=(N-T.x)*it,T.y+=(z-T.y)*it,K()}function vt(){let b=s.clientWidth,N=s.clientHeight;!b||!N||(e.setSize(b,N,!1),K())}let Tt=new ResizeObserver(vt);Tt.observe(s);function at(b){let N=E[b]?.anchor;return N?(W.copy(N).project(d),{x:(W.x+1)/2*s.clientWidth,y:(1-W.y)/2*s.clientHeight,visible:W.z<1&&Math.abs(W.x)<1.05&&Math.abs(W.y)<1.05}):null}function ot(b,N=.016){if(mt=b,_t+=N,i++,N>.034&&r++,i>=90&&(a&&r>60&&n>1&&(n=Math.max(1,n-.25),e.setPixelRatio(n),vt()),i=r=0),nt){let z=nt;nt=null,St||V(Mt(z))}ht?.update(b,N,_t);for(let[z,it]of Object.entries(E)){let rt=St?.name===z?.3:pt===z?it.kind==="control"?.17:.12:0;if(!(Math.abs(rt-it.glow)<.002)){it.glow+=(rt-it.glow)*Math.min(1,N*14);for(let dt of it.materials)dt.emissive?.setHex(4033535),dt.emissiveIntensity=it.glow}}if(ut(N),Wt){let z=Math.min(1,N*5);d.position.lerp(Wt.position,z),Nt.target.lerp(Wt.target,z),d.position.distanceTo(Wt.position)<.004&&(Wt=null)}Nt.update()}function bt(){ft||e.render(o,d)}return{mount:q,update:ot,render:bt,resize:vt,setView:D,setInsets:xt,screenOf:at,lookFrom(b,N){Wt=null,d.position.set(b[0],b[1],b[2]),Nt.target.set(N[0],N[1],N[2]),Nt.update()},holdPixelRatio(b){a=!1,n=b,e.setPixelRatio(b),vt()},get parts(){return Object.fromEntries(Object.entries(E).map(([b,N])=>[b,N.kind]))},pickAt(b,N){return Mt({clientX:b,clientY:N})?.name??null},project(b,N,z){return W.set(b,N,z).project(d),{x:(W.x+1)/2*s.clientWidth,y:(1-W.y)/2*s.clientHeight}},get layout(){return ht?.layout??{}},get views(){return Object.keys(X)},get screenCanvas(){return ht?.screenCanvas??null},refreshScreen(){ht?.refreshScreen?.()},get dragging(){return St?.moved?St.name:null},get hovered(){return pt},dispose(){ft=!0,Tt.disconnect(),Nt.dispose(),s.removeEventListener("pointerdown",Te),s.removeEventListener("pointermove",Qt),s.removeEventListener("pointerup",he),s.removeEventListener("pointercancel",he),s.removeEventListener("wheel",Et),s.removeEventListener("pointerleave",be);for(let b of m)b.dispose();h.dispose(),e.dispose()}}}return zg(Gb);})();
/*! Bundled license information:

three/build/three.core.js:
three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
