class ParticleGroup {

  /**
   * @todo Implement materials
   */

  constructor(definition) {
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
    this.randomMove = 0;
    this.randomAngle = 0;
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
      randomAngle: this.randomAngle,
      randomMove: this.randomMove
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
    if ("randomAngle" in data) this.randomAngle = data.randomAngle;
    if ("randomMove" in data) this.randomMove = data.randomMove;
  }

}

module.exports = ParticleGroup;