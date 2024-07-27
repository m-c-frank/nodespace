import * as THREE from 'three';

const createAxes = (scene, xLimit, yLimit, zLimit) => {
  const xMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const xGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-xLimit, 0, 0),
    new THREE.Vector3(xLimit, 0, 0)
  ]);
  const xAxis = new THREE.Line(xGeometry, xMaterial);
  scene.add(xAxis);

  // Y axis
  const yMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const yGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -yLimit, 0),
    new THREE.Vector3(0, yLimit, 0)
  ]);
  const yAxis = new THREE.Line(yGeometry, yMaterial);
  scene.add(yAxis);

  // Z axis
  const zMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  const zGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, -zLimit),
    new THREE.Vector3(0, 0, zLimit)
  ]);
  const zAxis = new THREE.Line(zGeometry, zMaterial);
  scene.add(zAxis);
}


export { createAxes };