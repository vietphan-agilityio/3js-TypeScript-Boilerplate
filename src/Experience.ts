import Resources from './utils/Resources';
import Assets from './utils/Assets';
import Time from './utils/Time';
import {
    ACESFilmicToneMapping,
    AxesHelper,
    BoxGeometry,
    DirectionalLight,
    Material,
    MathUtils,
    Mesh,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    ShadowMaterial,
    Texture,
    TorusKnotGeometry,
    Vector3,
    WebGLRenderer,
    sRGBEncoding,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GroundProjectedEnv } from 'three/examples/jsm/objects/GroundProjectedEnv';
import Stats from 'three/examples/jsm/libs/stats.module';
import * as gui from 'lil-gui';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export default class Experience {
    static instance;

    canvas: HTMLCanvasElement;
    resources: Resources;

    // Sizes
    sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
    } as const;

    private _scene: Scene;
    private _controls: OrbitControls;
    private _camera: PerspectiveCamera;
    private _renderer: WebGLRenderer;
    private _frameId: number;

    time: Time;
    torusMesh: Mesh;
    stats: Stats;

    constructor(canvas: HTMLCanvasElement) {
        if (Experience.instance) {
            return Experience.instance;
        }
        Experience.instance = this;
        this.canvas = canvas;

        const container = canvas.parentElement;

        this.stats = Stats();
        container.appendChild(this.stats.dom);

        this.configRenderer();

        this.time = new Time();
        this.resources = new Resources(Assets);

        this.resources.on('ready', () => {
            this.createScene();
            this.time.on('tick', deltaTime => {
                this.update(deltaTime);
                this.render();
            });
        });
    }

    configRenderer(): void {
        this._renderer = new WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
        });
        this._renderer.toneMapping = ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1.2;
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = PCFSoftShadowMap;
        this._renderer.physicallyCorrectLights = true;
        this._renderer.outputEncoding = sRGBEncoding;
        this._renderer.setSize(this.sizes.width, this.sizes.height);
        this._renderer.setPixelRatio(window.devicePixelRatio);
    }

    createScene(): void {
        this._scene = new Scene();
        const envt = this.resources.items['blouberg_sunrise'] as Texture;
        // this._scene.background = envt;
        this._scene.environment = envt;

        const params = {
            envMap: 'HDR',
            roughness: 0,
            metalness: 0.9,
            envScale: 100,
        };

        const debug = new gui.GUI();

        const env = new GroundProjectedEnv(envt);
        env.scale.setScalar(params.envScale);
        env.height = 10;
        env.radius = 50;
        this._scene.add(env);

        const groundProject = debug.addFolder('GroundProjectedEnv');
        groundProject.add(env, 'height', 10, 50, 5).onChange(h => {
            env.height = h;
        });
        groundProject.add(env, 'radius', 10, 1000).onChange(r => {
            env.radius = r;
        });
        groundProject.add(params, 'envScale', 100, 500).onChange(s => {
            env.scale.setScalar(s);
        });
        groundProject.open();
        this.setupLight();

        // Object
        // const geometry = new TorusKnotGeometry(1, 0.5, 128, 16);
        // const material = new MeshStandardMaterial({
        //     color: 0xffffff,
        //     metalness: params.metalness,
        //     roughness: params.roughness,
        // });

        // this.torusMesh = new Mesh(geometry, material);
        // this.torusMesh.castShadow = true;
        // this.torusMesh.receiveShadow = true;
        // this.torusMesh.position.set(0, 5, 0);

        // const cubeMaterial = new MeshStandardMaterial({
        //     color: 0xffffff,
        //     metalness: 0,
        //     roughness: 0.5,
        // });

        // const cube = new Mesh(new BoxGeometry(), cubeMaterial);
        // cube.castShadow = true;
        // cube.receiveShadow = true;
        // cube.position.set(2, 0.5, 0);
        // cube.scale.set(3, 1, 3);
        // this._scene.add(this.torusMesh);
        // this._scene.add(cube);

        const plane = new PlaneGeometry(100, 100);
        const planeMat = new ShadowMaterial({
            opacity: 0.3,
        });
        const planeMesh = new Mesh(plane, planeMat);
        planeMesh.rotateX(-Math.PI / 2);
        planeMesh.renderOrder = 2;
        planeMesh.receiveShadow = true;
        this._scene.add(planeMesh);

        // gbl
        const gltf = this.resources.items['PorschePanameras4'] as GLTF;
        const materials = {};
        gltf.scene.position.setX(0);
        gltf.scene.position.setZ(-0.5);
        gltf.scene.traverse(child => {
            if (child as Mesh) {
                const m = child as Mesh;
                m.receiveShadow = true;
                m.castShadow = true;
                if (m.material !== undefined && m.material !== null) {
                    materials[m.name] = m.material;
                }
            }
        });

        this._scene.add(gltf.scene);
        // Camera
        this._camera = new PerspectiveCamera(45, this.sizes.width / this.sizes.height);
        this._camera.position.set(0, 2, 5);
        this._camera.lookAt(new Vector3(0, 0, 0));
        this._scene.add(this._camera);

        // controls
        this._controls = new OrbitControls(this._camera, this.canvas);
        this._controls.target.set(0, 0, 0);
        this._controls.maxPolarAngle = MathUtils.degToRad(80);
        this._controls.maxDistance = 40;
        this._controls.minDistance = 2;
        this._controls.enablePan = false;
    }

    setupLight(): void {
        // const hemiLight = new HemisphereLight(0xffeeb1, 0x080820, 4);
        // this._scene.add(hemiLight);

        //Create a DirectionalLight and turn on shadows for the light
        const light = new DirectionalLight(0xeeeeee, 0);
        light.position.set(0, 20, 0); //default; light shining from top
        light.castShadow = true; // default false
        this._scene.add(light);

        //Set up shadow properties for the light
        light.shadow.mapSize.width = 512; // default
        light.shadow.mapSize.height = 512; // default
        light.shadow.camera.near = 0.5; // default
        light.shadow.camera.far = 500; // default
    }

    createHelper() {
        const helper = new AxesHelper(500);
        this._scene.add(helper);
    }

    update(deltaTime: number): void {
        this._controls.update();
        this.stats.update();
        // this.torusMesh.rotation.y += 2 * deltaTime;
    }

    render(): void {
        this._renderer.render(this._scene, this._camera);
    }
}
