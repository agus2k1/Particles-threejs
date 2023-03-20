import './main.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import fragment from './shaders/fragment.glsl.js';
import vertex from './shaders/vertex.glsl.js';
import t1 from './images/youtube-logo.png';
import t2 from './images/twitch-logo.png';
import mask from './images/mask.png';
import gsap from 'gsap';
import * as dat from 'dat.gui';

export default class Sketch {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    this.camera.position.z = 1000;
    this.scene = new THREE.Scene();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.point = new THREE.Vector2();

    this.textures = [
      new THREE.TextureLoader().load(t1),
      new THREE.TextureLoader().load(t2),
    ];
    this.mask = new THREE.TextureLoader().load(mask);
    this.move = 0;
    this.time = 0;
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.addMesh();
    this.mouseEffects();
    this.settings();
    this.render();
  }

  addMesh() {
    this.material = new THREE.ShaderMaterial({
      fragmentShader: fragment,
      vertexShader: vertex,
      uniforms: {
        progress: { type: 'f', value: 0 },
        t1: { type: 't', value: this.textures[0] },
        t2: { type: 't', value: this.textures[1] },
        mask: { type: 't', value: this.mask },
        mouse: { type: 'v2', value: null },
        mousePressed: { type: 'v2', value: 0 },
        transition: { type: 'f', value: null },
        move: { type: 'f', value: 0 },
        time: { type: 'f', value: 0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    let number = 512 * 512;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(new Float32Array(number * 3), 3);
    this.coordinates = new THREE.BufferAttribute(
      new Float32Array(number * 3),
      3
    );
    this.speeds = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.offset = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.direction = new THREE.BufferAttribute(new Float32Array(number), 1);
    this.press = new THREE.BufferAttribute(new Float32Array(number), 1);

    const randomNumber = (a, b) => {
      return a + (b - a) * Math.random();
    };

    let index = 0;
    for (let i = 0; i < 512; i++) {
      let posX = i - 256;
      for (let j = 0; j < 512; j++) {
        this.positions.setXYZ(index, posX * 2, (j - 256) * 2, 0);
        this.coordinates.setXYZ(index, i, j, 0);
        this.speeds.setX(index, randomNumber(0.4, 1));
        this.offset.setX(index, randomNumber(-1000, 1000));
        this.direction.setX(index, Math.random() > 0.5 ? 1 : -1);
        this.press.setX(index, randomNumber(0.4, 1));
        index++;
      }
    }

    this.geometry.setAttribute('position', this.positions);
    this.geometry.setAttribute('aCoordinates', this.coordinates);
    this.geometry.setAttribute('aSpeed', this.speeds);
    this.geometry.setAttribute('aOffset', this.offset);
    this.geometry.setAttribute('aDirection', this.direction);
    this.geometry.setAttribute('aPress', this.press);

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  mouseEffects() {
    this.test = new THREE.Mesh(
      new THREE.PlaneGeometry(4500, 4500),
      new THREE.MeshBasicMaterial()
    );

    window.addEventListener('mousewheel', (e) => {
      this.move += e.wheelDeltaY / 4000;
    });

    window.addEventListener(
      'mousemove',
      (e) => {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        let intersects = this.raycaster.intersectObjects([this.test]);
        console.log(intersects[0].point);

        this.point.x = intersects[0].point.x;
        this.point.y = intersects[0].point.y;
      },
      false
    );

    window.addEventListener('mousedown', (e) => {
      gsap.to(this.material.uniforms.mousePressed, {
        duration: 1,
        value: 1,
        ease: 'elastic.out(1, 0.3)',
      });
    });

    window.addEventListener('mouseup', (e) => {
      gsap.to(this.material.uniforms.mousePressed, {
        duration: 1,
        value: 0,
        ease: 'elastic.out(1, 0.3)',
      });
    });
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'progress', 0, 1, 0.01);
  }

  render() {
    this.time++;
    let prev = Math.floor(this.move + 40) % 2;
    let next = (Math.floor(this.move) + 1 + 40) % 2;

    this.material.uniforms.t1.value = this.textures[prev];
    this.material.uniforms.t2.value = this.textures[next];

    this.material.uniforms.move.value = this.move;
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.mouse.value = this.point;
    this.material.uniforms.transition.value = this.settings.progress;
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch();
