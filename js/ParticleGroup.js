const textureLoader = new THREE.TextureLoader();

class ParticleGroup {

  /**
   * @todo Implement materials
   */

  constructor() {
    this.emitterDimensions = [1, 1, 1];
    this.number = 20; // Number of simultaneously existing particles
    this.material = "";
    this.speedInit = [0, 0, 0];
    this.speedAcc = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.growth = [0, 0, 0];
    this.angle = [0, 0, 0];
    this.angleSpeed = [0, 0, 0];
    this.angleAcc = [0, 0, 0];
    this.angleRandom = [0, 0, 0];
    this._texture = "";
    this.material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1
    });
  }

  set texture(value) {
    this._texture = value;
    let tex = textureLoader.load(value);
    if (this.material.map) this.material.map.dispose();
    this.material.map = tex;
    this.material.needsUpdate = true;
  }

  get texture() {
    return this._texture;
  }

  export() {
    return {
      emitterDimensions: this.emitterDimensions,
      speedInit: this.speedInit,
      speedAcc: this.speedAcc,
      scale: this.scale,
      growth: this.growth,
      number: this.number,
      angle: this.angle,
      angleSpeed: this.angleSpeed,
      angleAcc: this.angleAcc,
      angleRandom: this.angleRandom,
      randomMove: this.randomMove,
      texture: this.texture
    }
  }

  import(data) {
    if ("speedInit" in data) this.speedInit = data.speedInit;
    if ("speedAcc" in data) this.speedAcc = data.speedAcc;
    if ("scale" in data) this.scale = data.scale;
    if ("growth" in data) this.growth = data.growth;
    if ("emitterDimensions" in data) this.emitterDimensions = data.emitterDimensions;
    if ("number" in data) this.number = Number(data.number);
    if ("angle" in data) this.angle = data.angle;
    if ("angleSpeed" in data) this.angleSpeed = data.angleSpeed;
    if ("angleAcc" in data) this.angleAcc = data.angleAcc;
    if ("angleRandom" in data) this.angleRandom = data.angleRandom;
    if ("texture" in data) this.texture = data.texture;
  }

  dispose() {
    this.material.dispose();
  }

}

module.exports = ParticleGroup;