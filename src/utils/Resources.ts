import * as THREE from 'three';

import { EventEmitter } from 'events';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import {
    CubeTextureLoader,
    EquirectangularReflectionMapping,
    LinearFilter,
    TextureLoader,
} from 'three';

export default class Resources extends EventEmitter {
    assets = [];
    gltfLoader: GLTFLoader;
    dracoLoader: DRACOLoader;
    textureLoader: TextureLoader;
    cubeTextureLoader: CubeTextureLoader;

    videos = {};
    videoTextures = {};

    items = {};
    queue = 0;
    loaded = 0;

    constructor(assets) {
        super();
        this.assets = assets;
        this.items = {};
        this.queue = this.assets.length;
        this.loaded = 0;

        this.setLoader();
        this.startLoading();
    }

    setLoader() {
        this.gltfLoader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('/draco/');
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
        this.textureLoader = new THREE.TextureLoader();
        this.cubeTextureLoader = new THREE.CubeTextureLoader();
    }

    startLoading() {
        for (const asset of this.assets) {
            if (asset.type === 'glbModel' || asset.type === 'gltfModel') {
                this.gltfLoader.load(asset.path, file => {
                    this.singleAssetLoaded(asset, file);
                });
            } else if (asset.type === 'texture') {
                this.textureLoader.load(
                    asset.path,
                    file => {
                        this.singleAssetLoaded(asset, file);
                    },
                    progress => {
                        console.log(progress.loaded);
                    },
                    error => {
                        console.log(error.message);
                    }
                );
            } else if (asset.type === 'cubeTexture') {
                this.cubeTextureLoader.load(asset.path, file => {
                    this.singleAssetLoaded(asset, file);
                });
            } else if (asset.type === 'EXR') {
                new EXRLoader().load(asset.path, (texture, textureData) => {
                    // EXRLoader sets these default settings
                    texture.generateMipmaps = false;
                    texture.minFilter = LinearFilter;
                    texture.mapping = EquirectangularReflectionMapping;
                    texture.magFilter = LinearFilter;
                    this.singleAssetLoaded(asset, texture);
                });
            } else if (asset.type === 'HDR') {
                new RGBELoader().load(asset.path, (texture, textureData) => {
                    // EXRLoader sets these default settings
                    texture.generateMipmaps = false;
                    texture.minFilter = LinearFilter;
                    texture.mapping = EquirectangularReflectionMapping;
                    texture.magFilter = LinearFilter;
                    this.singleAssetLoaded(asset, texture);
                });
            } else if (asset.type === 'videoTexture') {
                this.videos = {};
                this.videoTextures = {};

                this.videos[asset.name] = document.createElement('video');
                this.videos[asset.name].src = asset.path;
                this.videos[asset.name].muted = true;
                this.videos[asset.name].playsInline = true;
                this.videos[asset.name].autoplay = true;
                this.videos[asset.name].loop = true;
                this.videos[asset.name].play();

                this.videoTextures[asset.name] = new THREE.VideoTexture(this.videos[asset.name]);
                // this.videoTextures[asset.name].flipY = false;
                this.videoTextures[asset.name].minFilter = THREE.NearestFilter;
                this.videoTextures[asset.name].magFilter = THREE.NearestFilter;
                this.videoTextures[asset.name].generateMipmaps = false;
                this.videoTextures[asset.name].encoding = THREE.sRGBEncoding;

                this.singleAssetLoaded(asset, this.videoTextures[asset.name]);
            }
        }
    }

    singleAssetLoaded(asset, file) {
        console.log(`Asset loaded: ${asset.name}`);
        this.items[asset.name] = file;
        this.loaded++;

        if (this.loaded === this.queue) {
            this.emit('ready');
        }
    }
}
