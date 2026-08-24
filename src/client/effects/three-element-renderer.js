const FAMILY_MODE={fire:0,water:1,air:2,earth:3,radiance:4,veil:5,order:6,life:7,portal:8,rupture:9};

function seeded(index,salt=0){const value=Math.sin((index+1)*12.9898+salt*78.233)*43758.5453;return value-Math.floor(value);}
function ellipse(THREE,rx,ry,count=72,phase=0){return Array.from({length:count},(_,i)=>{const a=i/count*Math.PI*2+phase;return new THREE.Vector3(Math.cos(a)*rx,Math.sin(a)*ry,0);});}
function line(THREE,name,points,color,opacity=.2,loop=false){const geometry=new THREE.BufferGeometry().setFromPoints(points);const material=new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});const object=loop?new THREE.LineLoop(geometry,material):new THREE.LineSegments(geometry,material);object.name=name;return object;}

const VERTEX_SHADER=`
  varying vec2 vUv;
  void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
`;
const FRAGMENT_SHADER=`
  precision highp float;
  varying vec2 vUv;
  uniform float uTime; uniform float uIntensity; uniform float uBurst; uniform float uMode;
  uniform float uDirection; uniform float uSeed; uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorC;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed)*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+17.1;a*=.5;}return v;}
  float band(float d,float w){return smoothstep(w,0.,abs(d));}
  void main(){
    vec2 p=(vUv-.5)*vec2(1.25,2.0);float t=uTime*uDirection;float f=0.;float accent=0.;
    if(uMode<.5){float n=fbm(vec2(p.x*2.7,p.y*1.5-t*.85));float flame=abs(p.x)*.33+p.y*.15+n*.72;f=band(flame-.43,.24)*(smoothstep(-1.,-.1,p.y));accent=band(flame-.34,.055);}
    else if(uMode<1.5){float n=fbm(p*2.2+vec2(t*.18,-t*.12));float wave=sin((length(p*vec2(1.,.62))+n*.18-t*.34)*22.);f=smoothstep(.66,.98,wave)*.45+band(length(p)-(.52+sin(t)*.05),.035);accent=band(length(p)-(.75+uBurst*.32),.018);}
    else if(uMode<2.5){float warp=fbm(p*1.8+vec2(t*.25,0.));float r1=band(p.y-sin(p.x*3.2+t*1.4+warp)*.22,.055);float r2=band(p.y+sin(p.x*2.2-t+warp)*.42,.035);f=r1*.7+r2*.48;accent=band(p.y-p.x*.65+t*.45,.024)*uBurst;}
    else if(uMode<3.5){float terrain=fbm(p*2.8+sin(t*.15));f=band(fract(terrain*7.)-.5,.075)*.58;float a=atan(p.y,p.x);accent=band(length(p)-(.62+.05*sin(a*5.)),.018);}
    else if(uMode<4.5){float r=length(p),a=atan(p.y,p.x);float rays=pow(max(0.,cos(a*12.+t)),18.);f=band(r-.52,.16)+rays*smoothstep(1.1,.18,r);accent=band(r-(.78+uBurst*.26),.025);}
    else if(uMode<5.5){vec2 moon=p-vec2(.12*sin(t*.2),.02);float disk=smoothstep(.58,.52,length(moon))-smoothstep(.48,.42,length(moon-vec2(.17,0.)));f=disk*.8+fbm(p*3.+vec2(t*.08,0.))*.16;accent=band(length(p)-.77,.018);}
    else if(uMode<6.5){vec2 q=abs(p);float grid=max(band(fract((q.x+q.y)*5.)-.5,.045),band(fract((q.x-q.y)*5.)-.5,.045));f=grid*.42;accent=band(max(q.x*.72,q.y)-(.62+uBurst*.12),.02);}
    else if(uMode<7.5){float n=fbm(p*2.+vec2(t*.12,-t*.09));float vine=band(p.x-sin(p.y*3.+t+n)*(.22+.12*n),.055);f=vine+band(p.x+sin(p.y*2.4-t)*.38,.035)*.55;accent=band(length(p)-.7,.025);}
    else if(uMode<8.5){float r=length(p),a=atan(p.y,p.x);f=band(r-.42,.028)+band(r-.68,.022)+band(r-.9,.015);accent=pow(max(0.,cos(a*8.-t*2.)),24.)*smoothstep(1.1,.25,r);}
    else {float n=fbm(vec2(atan(p.y,p.x)*2.,length(p)*5.-t*.2));float crack=band(abs(p.x)-n*.34,.028);f=crack*smoothstep(1.1,.12,length(p));accent=band(length(p)-(.55+uBurst*.32),.024);}
    float edge=smoothstep(1.18,.35,length(p))*smoothstep(.02,.22,f+accent);float alpha=(f*.52+accent*.9)*uIntensity*edge;
    vec3 color=mix(uColorC,uColorB,smoothstep(0.,.65,f));color=mix(color,uColorA,clamp(accent+f*f,0.,1.));
    gl_FragColor=vec4(color,alpha);
  }
`;

function buildGlyph(THREE,profile){
  const family=profile.family??profile.element,[light,main]=profile.palette,parts=[];
  if(['fire','water','radiance','veil','portal'].includes(family)){parts.push(line(THREE,`${family}-glyph`,ellipse(THREE,1.28,2.05),main,family==='fire'?.07:.15,true));parts.push(line(THREE,'',ellipse(THREE,.93,1.48,64,.16),light,family==='fire'?.04:.1,true));}
  else if(['earth','order'].includes(family)){const points=[];const sides=family==='earth'?5:4;for(let i=0;i<sides;i++){const a=-Math.PI/2+i*Math.PI*2/sides,b=-Math.PI/2+(i+1)*Math.PI*2/sides;points.push(new THREE.Vector3(Math.cos(a)*1.15,Math.sin(a)*1.15,0),new THREE.Vector3(Math.cos(b)*1.15,Math.sin(b)*1.15,0));}parts.push(line(THREE,`${family}-glyph`,points,main,.2));}
  else if(family==='life'){const points=[];for(let strand=0;strand<2;strand++)for(let i=0;i<48;i++){const y=-1.75+i/47*3.5,next=-1.75+(i+1)/47*3.5;points.push(new THREE.Vector3(Math.sin(y*2.1+strand*Math.PI)*.72,y,0),new THREE.Vector3(Math.sin(next*2.1+strand*Math.PI)*.72,next,0));}parts.push(line(THREE,'life-glyph',points,main,.12));}
  else {const points=[];for(let i=0;i<8;i++){const y=-1.75+i*.5;points.push(new THREE.Vector3(-1.25,y,0),new THREE.Vector3(1.25,y+(i%2?.3:-.25),0));}parts.push(line(THREE,`${family}-glyph`,points,light,.16));}
  const group=new THREE.Group();group.name=`${family}-geometry`;parts.forEach(part=>group.add(part));return group;
}

function buildAccents(THREE,profile){
  const count=profile.particleCount??0,positions=new Float32Array(count*3),velocity=new Float32Array(count*3),colors=new Float32Array(count*3),palette=profile.palette.map(value=>new THREE.Color(value));
  for(let i=0;i<count;i++){const a=seeded(i,2)*Math.PI*2,r=.55+seeded(i,3)*1.35;positions.set([Math.cos(a)*r,(seeded(i,4)-.5)*3.8,(seeded(i,5)-.5)*.12],i*3);velocity.set([(seeded(i,6)-.5)*.06,.05+seeded(i,7)*.12,(seeded(i,8)-.5)*.015],i*3);const c=palette[i%palette.length];colors.set([c.r,c.g,c.b],i*3);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.PointsMaterial({size:.018,vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
  const points=new THREE.Points(geometry,material);points.name=`${profile.family??profile.element}-accents`;return {points,positions,velocity};
}

export function createThreeElementRenderer({THREE,scene,profile,anchor,anime}){
  const family=profile.family??profile.element,group=new THREE.Group();group.name=`card-effect-${family}`;group.position.set(anchor.x||0,anchor.y||0,(anchor.z||0)+.035);
  const colors=profile.palette.map(value=>new THREE.Color(value));
  const uniforms={uTime:{value:0},uIntensity:{value:.06},uBurst:{value:0},uMode:{value:FAMILY_MODE[family]??0},uDirection:{value:profile.verticalDirection??1},uSeed:{value:(profile.cardSeed??0)*.731},uColorA:{value:colors[0]},uColorB:{value:colors[1]},uColorC:{value:colors[2]}};
  const fieldMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:VERTEX_SHADER,fragmentShader:FRAGMENT_SHADER,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const field=new THREE.Mesh(new THREE.PlaneGeometry(3.9,5.9,1,1),fieldMaterial);field.name=`${family}-field`;field.raycast=()=>{};group.add(field);
  const glyph=buildGlyph(THREE,profile);glyph.position.z=.006;group.add(glyph);
  const accents=buildAccents(THREE,profile);accents.points.position.z=.012;group.add(accents.points);scene.add(group);
  const envelope={intensity:.06,burst:0,scale:.96,glyph:.05,accents:0},glyphScale=family==='fire'?.22:1;let phase='prepared',elapsed=0,disposed=false,animation=null;
  const apply=()=>{uniforms.uIntensity.value=envelope.intensity;uniforms.uBurst.value=envelope.burst;group.scale.setScalar(envelope.scale);glyph.traverse(child=>{if(child.material)child.material.opacity=envelope.glyph*glyphScale;});accents.points.material.opacity=envelope.accents;};
  const run=(next,options)=>{animation?.cancel?.();phase=next;if(typeof anime==='function')animation=anime(envelope,{...options,onUpdate:apply});else{for(const [key,value]of Object.entries(options))if(Array.isArray(value))envelope[key]=value.at(-1);apply();}};
  apply();
  return {
    reveal(){if(!disposed)run('revealing',{intensity:[envelope.intensity,1],burst:[0,1],scale:[.96,1.08],glyph:[.05,.72],accents:[0,.34],duration:980,ease:'outExpo'});},
    settle(){if(!disposed)run('settled',{intensity:[envelope.intensity,.24],burst:[envelope.burst,0],scale:[envelope.scale,1],glyph:[envelope.glyph,.13],accents:[envelope.accents,.07],duration:1350,ease:'outExpo'});},
    update(dt){if(disposed)return;const delta=Math.min(Math.max(dt||0,0),.1);if(profile.quality!=='reduced')elapsed+=delta*(profile.speed??1);uniforms.uTime.value=elapsed;group.position.set(anchor.x||0,anchor.y||0,(anchor.z||0)+.035);const positions=accents.positions,velocity=accents.velocity;for(let i=0;i<(profile.particleCount??0);i++){const o=i*3;positions[o]+=velocity[o]*delta*(profile.flow==='inward'?-1:1);positions[o+1]+=velocity[o+1]*delta*(profile.verticalDirection??1);if(Math.abs(positions[o+1])>2.25)positions[o+1]=-positions[o+1]*.82;}if(accents.points.geometry.attributes.position)accents.points.geometry.attributes.position.needsUpdate=true;glyph.rotation.z+=delta*.025*(profile.flow==='inward'?-1:1);},
    dispose(){if(disposed)return;disposed=true;animation?.cancel?.();scene.remove(group);group.traverse(child=>{child.geometry?.dispose?.();if(Array.isArray(child.material))child.material.forEach(value=>value.dispose());else child.material?.dispose?.();});phase='disposed';},
    getSnapshot(){return {phase,family,particleCount:profile.particleCount??0,disposed,intensity:envelope.intensity,burst:envelope.burst};}
  };
}
