const { ipcRenderer, remote } = require('electron');
const Particle = require('./Particle.js');

class Preview {

  constructor(editor) {
    this.editor = editor;
    editor.preview = this;
    
    this.fps = 30;
    this.lastTime = Date.now();
    this.frame = 0;

    this.particles = [];
    this.emitters = [];

    this.previewDom = document.getElementById("preview");

    var viewAngle = 45;
    var nearClipping = 0.1;
    var farClipping = 9999;

    this.scene = new THREE.Scene();

    this.grid = new THREE.GridHelper(10, 10);
    this.grid.rotateX(Math.PI / 2);
    this.scene.add(this.grid);

    this.camera = new THREE.PerspectiveCamera( viewAngle, 1, nearClipping, farClipping );
    this.camera.up.set(0, 0, 1); // Z is up axis in source
    this.camera.position.set( 10, 10, 10 );

    this.renderer = new THREE.WebGLRenderer();
    this.previewDom.appendChild( this.renderer.domElement );
    
    this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
    this.controls.update();

    this.updateSize();
    this.loop();

    let observer = new ResizeObserver(() => this.updateSize());
    observer.observe(this.previewDom);

    ipcRenderer.on("preview-cam-reset", () => {
      this.controls.reset();
      this.camera.position.set(10, 10, 10); // Could have used saveState too. But naaah
      this.controls.update();
    });

    this.updateScene();
  }

  loop() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.loop());

    let now = Date.now();
    let delta = now - this.lastTime;
    this.frame = (this.frame + (delta / 1000) * this.fps) % this.editor.definition.animationLength;
    this.setFrame(this.frame);
    this.lastTime = now;
  }

  updateSize() {
    let rect = this.previewDom.getClientRects()[0];
    this.renderer.setSize(rect.width, rect.height);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  updateScene() {
    let definition = this.editor.definition;

    for (let p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles.length = 0;

    for (let e of this.emitters) {
      this.scene.remove(e);
    }
    this.emitters.length = 0;

    for (let group of definition.groups) {

      // Mesh is used for the emitter range preview
      let ed = group.emitterDimensions;
      let box = new THREE.Box3(new THREE.Vector3(-ed[0] / 2, -ed[1] / 2, -ed[2] / 2), new THREE.Vector3(ed[0] / 2, ed[1] / 2, ed[2] / 2));
      let emitter = new THREE.Box3Helper(box, 0xffffff);
      this.emitters.push(emitter);
      this.scene.add(emitter);

      for (let i = 0; i < group.number; i++) {
        let particle = new Particle(group, i);
        this.scene.add(particle.mesh);
        this.particles.push(particle);
      }
    }
  }

  setFrame(frame) {
    if (this.particles.length == 0) return;
    let index = 0;
    let len = this.editor.definition.animationLength;
    let groups = this.editor.definition.groups;
    for (let g of groups) {
      for (let i = 0; i < g.number; i++) {
        let p = this.particles[index];
        if (!p) return;
        p.setFrame(((i / (g.number - 1)) * len + frame) % len);
        index++;
      }
    }
  }

}

module.exports = Preview;