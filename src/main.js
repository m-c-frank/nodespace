import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAxes } from './components/CoordinateSystem';
import { createParametricSurface, createGridPlane } from './components/examples';

let scene, camera, renderer, controls;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
const URL_NODES = 'http://localhost:5000/nodes';
let nodes = [];
let selectedNodes = [];
let hoveredNode = null;

let defaultMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
let selectedMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
let hoveredMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
let hoveredSelectedMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });

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
  createAxes(scene, 5, 5, 5);

  // Create default grid planes
  createGridPlane(scene, new THREE.Vector3(0, 0, 1), 10, 10); // XY plane
  createGridPlane(scene, new THREE.Vector3(1, 0, 0), 10, 10); // YZ plane
  createGridPlane(scene, new THREE.Vector3(0, 1, 0), 10, 10); // ZX plane

  // Create a surface
  createParametricSurface(scene);

  // Draw nodes
  drawNodes();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Handle mouse move
  window.addEventListener('mousemove', onMouseMove, false);

  // Handle click
  window.addEventListener('click', onClick, false);
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
    const nodeMaterial = defaultMaterial.clone();
    const nodeGeometry = new THREE.SphereGeometry(0.1, 32, 32);
    const sphere = new THREE.Mesh(nodeGeometry, nodeMaterial);
    sphere.position.set(node.x, node.y, node.z);
    sphere.userData = { originalMaterial: nodeMaterial };
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
      intersectedNode.material = hoveredNode === intersectedNode ? hoveredSelectedMaterial : selectedMaterial;
      selectedNodes.push(intersectedNode); // Add to selected nodes list
    } else {
      intersectedNode.material = intersectedNode.userData.originalMaterial;
      selectedNodes = selectedNodes.filter(node => node !== intersectedNode); // Remove from selected
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
    const intersectedNode = intersects[0].object;
    if (hoveredNode !== intersectedNode) {
      if (hoveredNode && !selectedNodes.includes(hoveredNode)) {
        hoveredNode.material = hoveredNode.userData.originalMaterial;
      } else if (hoveredNode && selectedNodes.includes(hoveredNode)) {
        hoveredNode.material = selectedMaterial;
      }
      hoveredNode = intersectedNode;
      if (!selectedNodes.includes(hoveredNode)) {
        hoveredNode.material = hoveredMaterial;
      } else {
        hoveredNode.material = hoveredSelectedMaterial;
      }
    }
  } else {
    if (hoveredNode) {
      if (!selectedNodes.includes(hoveredNode)) {
        hoveredNode.material = hoveredNode.userData.originalMaterial;
      } else {
        hoveredNode.material = selectedMaterial;
      }
    }
    hoveredNode = null;
  }

  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
