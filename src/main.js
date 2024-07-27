import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

let scene, camera, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let INTERSECTED = null;
const URL_NODES = 'http://localhost:5000/nodes';
let nodes = [];
let selectedNodes = [];

let defaultMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
let selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
let hoveredMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

init();
animate();

function init() {
  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  // Create the camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);

  // Create the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Create the coordinate system
  createAxes();

  // Create default grid planes
  createGridPlane(new THREE.Vector3(0, 0, 1)); // XY plane
  createGridPlane(new THREE.Vector3(1, 0, 0)); // YZ plane
  createGridPlane(new THREE.Vector3(0, 1, 0)); // ZX plane

  // Create a surface
  createSurface();

  // Draw nodes
  drawNodes();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Handle mouse move
  window.addEventListener('mousemove', onMouseMove, false);

  // Handle click
  window.addEventListener('click', onClick, false);
}

function createAxes() {
  // X axis
  const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const xGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-10, 0, 0),
    new THREE.Vector3(10, 0, 0)
  ]);
  const xAxis = new THREE.Line(xGeometry, xMaterial);
  scene.add(xAxis);

  // Y axis
  const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const yGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -10, 0),
    new THREE.Vector3(0, 10, 0)
  ]);
  const yAxis = new THREE.Line(yGeometry, yMaterial);
  scene.add(yAxis);

  // Z axis
  const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const zGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -10),
    new THREE.Vector3(0, 0, 10)
  ]);
  const zAxis = new THREE.Line(zGeometry, zMaterial);
  scene.add(zAxis);
}

function createGridPlane(normal) {
  // Create a plane
  const size = 10;
  const divisions = 10;
  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);

  // Align the plane to the given normal
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  gridHelper.applyQuaternion(quaternion);
}

function createSurface() {
  function parametricFunction(u, v, target) {
    var x = u * 10 - 5; // Range for x: -5 to 5
    var y = v * 10 - 5; // Range for y: -5 to 5
    var z = Math.sin(Math.sqrt(x * x + y * y)); // Example function: z = sin(sqrt(x^2 + y^2))
    target.set(x, y, z);
  }
  // Create the parametric geometry
  var parametricGeometry = new ParametricGeometry(parametricFunction, 100, 100);

  // Create a basic material and mesh
  var material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
  var mesh = new THREE.Mesh(parametricGeometry, material);
  scene.add(mesh);
}

async function getNodes() {
  //fetch from URL_NODES
  let nodes = [];
  await fetch(URL_NODES)
    .then(response => response.json())
    .then(data => {
      nodes = data["nodes"];
    })
    .catch(error => {
      console.error('Error:', error);
    });

  // if no x y z values are provided, use random values
  nodes = nodes.map(node => {
    if (node.x === undefined) {
      node.x = Math.random() * 10 - 5;
    }
    if (node.y === undefined) {
      node.y = Math.random() * 10 - 5;
    }
    if (node.z === undefined) {
      node.z = Math.random() * 10 - 5;
    }
    return node;
  });
  return nodes;
}

async function drawNodes() {
  // nodes are spheres at random positions within the grid
  const fetchedNodes = await getNodes();
  fetchedNodes.forEach(node => {
    const nodeMaterial = defaultMaterial
    const nodeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphere = new THREE.Mesh(nodeGeometry, nodeMaterial);
    sphere.position.set(node.x, node.y, node.z);
    scene.add(sphere);
    nodes.push(sphere); // Store reference to the node
  });
}

function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(nodes);

  if (intersects.length > 0) {
    const intersectedNode = intersects[0].object;
    if (!selectedNodes.includes(intersectedNode)) {
      intersectedNode.material = selectedMaterial
      selectedNodes.push(intersectedNode); // Add to selected nodes list
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(nodes);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        if (!selectedNodes.includes(INTERSECTED)) {
          INTERSECTED.material = defaultMaterial
        }
      }
      INTERSECTED = intersects[0].object;
      if (!selectedNodes.includes(INTERSECTED)) {
        INTERSECTED.material = hoveredMaterial
      }
    }
  } else {
    if (INTERSECTED) {
      if (!selectedNodes.includes(INTERSECTED)) {
        INTERSECTED.material = defaultMaterial
      }
      INTERSECTED = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
