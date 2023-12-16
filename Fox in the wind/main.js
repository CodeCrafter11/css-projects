console.clear();

/* SETUP */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 8, 13);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.x = -1;
camera.position.y = 0.8;
camera.position.z = -4;

const webglRenderer = new THREE.WebGLRenderer({
  antialias: true
});
webglRenderer.shadowMap.enabled = true;
webglRenderer.setSize(window.innerWidth, window.innerHeight);
webglRenderer.setClearColor(0x000000);
webglRenderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild(webglRenderer.domElement);

/* CONTROLS */
const controls = new THREE.OrbitControls(camera, webglRenderer.domElement);

const linesGeom1 = new THREE.BufferGeometry();
const linesGeom2 = new THREE.BufferGeometry();
const linesGeom3 = new THREE.BufferGeometry();
const linesMatWhite = new THREE.LineBasicMaterial({color: 0xffffff});
const linesMatOrange = new THREE.LineBasicMaterial({color: 0xfb8c00});
const linesMatBrown = new THREE.LineBasicMaterial({color: 0x4d3227});
const line1 = new THREE.LineSegments( linesGeom1, linesMatWhite );
scene.add(line1);
const line2 = new THREE.LineSegments( linesGeom2, linesMatOrange );
scene.add(line2);
const line3 = new THREE.LineSegments( linesGeom3, linesMatBrown );
scene.add(line3);

const geometry = new THREE.PlaneGeometry(30, 30);
const material2 = new THREE.ShadowMaterial({ 
  color: 0x111111,
  side: 2
});
const plane = new THREE.Mesh( geometry, material2 );
plane.rotation.x = Math.PI / 2;
plane.position.y = -1.6;
plane.receiveShadow = true;
scene.add( plane );

const light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
light.position.set(0.2, 0.5, -1);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.radius = 8;
scene.add( light );


const pointsWhite = [];
const pointsBrown = [];
const pointsOrange = [];

const loader = new THREE.OBJLoader();
loader.load(
	"https://assets.codepen.io/127738/fox_low_poly.obj",
	function ( obj ) {
    scene.add( obj );
    obj.children[0].material[0].shininess = 0;
    obj.children[0].material[1].shininess = 0;
    obj.children[0].material[2].shininess = 0;
    obj.children[0].castShadow = true;
    const modifier = new THREE.SubdivisionModifier(2, false);
    
    const smooth = modifier.modify(obj.children[0].geometry);
    const lol = new THREE.BufferGeometry();
    lol.fromGeometry(smooth);
    obj.children[0].geometry = lol;
    const colors = [];
    obj.children[0].geometry.groups.forEach((g, index) => {
      for(let i=0;i<g.count;i++) {
        if (index===0) colors.push(1,0,0);
        if (index===1) colors.push(0,1,0);
        if (index===2) colors.push(0,0,1);
      }
    });
    obj.children[0].geometry.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array(colors), 3 ) );

    const sampler = new THREE.MeshSurfaceSampler(obj.children[0])
    .build();
    const p1 = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const color = new THREE.Color();
    for (let i=0;i<50000;i++) {
      sampler.sample(p1, normal, color);
      normal.multiplyScalar(Math.random() * 0.04 + 0.02);
      let _p = p1.clone();
      _p._x = _p.x;
      _p._y = _p.y;
      _p._z = _p.z;
      _p.normal = normal.clone();
      let _p2 = p1.clone().add(normal);
      _p2._x = _p2.x;
      _p2._y = _p2.y;
      _p2._z = _p2.z;
      if (color.r) {
        pointsWhite.push(_p);
        pointsWhite.push(_p2);  
      } else if (color.g) {
        pointsBrown.push(_p);
        pointsBrown.push(_p2);  
      } else if (color.b) {
        pointsOrange.push(_p);
        pointsOrange.push(_p2);
      }
    }
    linesGeom1.setFromPoints( pointsWhite );
    linesGeom2.setFromPoints( pointsBrown );
    linesGeom3.setFromPoints( pointsOrange );
    
    obj.children[0].material.forEach(m => {
      m.color = new THREE.Color(0x000000);
      m.emissive = new THREE.Color(0x000000);
      m.emissiveIntensity = 0.2;
      m.flatShading = 0.2;
    });
    
    requestAnimationFrame(render);
	}
);

/* RENDERING */
function updateCoords (arr, a, geom) {
  for (let i = 0; i < arr.length; i+=2) {
    let p = arr[i];
    let p2 = arr[i + 1];
    
    let angle = noise.simplex3(p2._x*0.4, p2._y*0.4, p2._z*0.4 + a * 0.00013) * 3.14;
    var xv = Math.cos(angle);
    var yv = Math.sin(angle);
    var v = p2.clone();
    v.cross(p.normal);
    var r1 = v.multiplyScalar(1.1 * xv);
    var r2 = v.multiplyScalar(1.1 * yv);
    p2.x = p2._x + r1.x + r2.x;
    p2.y = p2._y + r1.y + r2.y;
    p2.z = p2._z + r1.z + r2.z;
    geom.attributes.position.array[(i+1) * 3] = p2.x;
    geom.attributes.position.array[(i+1) * 3 + 1] = p2.y;
    geom.attributes.position.array[(i+1) * 3 + 2] = p2.z;
  }
  geom.attributes.position.needsUpdate = true;
}

function render(a) {
  requestAnimationFrame(render);
  updateCoords(pointsWhite, a, linesGeom1);
  updateCoords(pointsOrange, a, linesGeom3);
  updateCoords(pointsBrown, a, linesGeom2);
  webglRenderer.render(scene, camera);
}

/* EVENTS */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  webglRenderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize, false);