import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Base
 */
// Canvas
const canvas = document.querySelector<HTMLElement>('canvas.webgl');

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

// Scene
const scene = new THREE.Scene();

// Object
const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 5, 5, 5),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
scene.add(mesh);

// Camera
const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 1, 100);
camera.position.z = 2;
camera.lookAt(mesh.position);
scene.add(camera);

// controls
const controls = new OrbitControls(camera, canvas);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas,
});
renderer.setSize(sizes.width, sizes.height);

// Animate
const clock = new THREE.Clock();

// Cursor
const cursor = {
    x: 0,
    y: 0,
};

const cameraAngle = 1;

window.addEventListener('mousemove', event => {
    cursor.x = (event.clientX / sizes.width - 0.5) * cameraAngle;
    cursor.y = -(event.clientY / sizes.height - 0.5) * cameraAngle;
    console.log(Math.sin(cursor.x * Math.PI * 2) * 2, Math.cos(cursor.x * Math.PI * 2) * 2);
});

const animate = () => {
    // Update controls
    controls.update();
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(animate);
};

/* Function call */
animate();
