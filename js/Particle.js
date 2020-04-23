const ParticleGeometry = new THREE.Geometry();

ParticleGeometry.vertices.push(
  new THREE.Vector3(-0.5, -0.5, 0),
  new THREE.Vector3(0.5, -0.5, 0),
  new THREE.Vector3(-0.5, 0.5, 0),
  new THREE.Vector3(0.5, 0.5, 0),

  new THREE.Vector3(0, -0.5, -0.5),
  new THREE.Vector3(0, -0.5, 0.5),
  new THREE.Vector3(0, 0.5, -0.5),
  new THREE.Vector3(0, 0.5, 0.5),

  new THREE.Vector3(-0.5, 0, -0.5),
  new THREE.Vector3(0.5, 0, -0.5),
  new THREE.Vector3(-0.5, 0, 0.5),
  new THREE.Vector3(0.5, 0, 0.5)
);

ParticleGeometry.faces.push(
  new THREE.Face3(0, 1, 2),
  new THREE.Face3(1, 2, 3),
  new THREE.Face3(4, 5, 6),
  new THREE.Face3(5, 6, 7),
  new THREE.Face3(8, 9, 10),
  new THREE.Face3(9, 10, 11)
);

const ParticleMaterial = new THREE.MeshBasicMaterial({color: "white", side: THREE.DoubleSide});

/**
 * Cheap pseudo random function. Should be enough for this application
 * @returns {Number} 0 < x < 1
 */
function randSeed(seed) {
  let n = seed / 100;
  return (n * (n * n * 789221)) % 1;
}

class Particle {

  constructor(group, index) {
    this.group = group;
    this.index = index;

    this.spawnPoint = [
      -group.emitterDimensions[0] / 2 + group.emitterDimensions[0] * randSeed(index * 11),
      -group.emitterDimensions[1] / 2 + group.emitterDimensions[1] * randSeed(index * 7),
      -group.emitterDimensions[2] / 2 + group.emitterDimensions[2] * randSeed(index * 9),
    ];

    this.mesh = new THREE.Mesh(ParticleGeometry, ParticleMaterial);
  }

  getPositionAtFrame(frame) {
    /**
     * @todo Optimize this with math using a quadratic function
     */
    let pos = [...this.spawnPoint];
    let spd = this.group.speedInit.map(Number);
    for (let i = 0; i < frame; i++) {
      for (let j = 0; j < 3; j++) {
        pos[j] += Number(spd[j]);
        spd[j] += Number(this.group.speedAcc[j]);
      }
    }
    return pos;
  }

  getAngleAtFrame(frame) {
    return [0, 0, 0];
  }

  setFrame(frame) {
    /**
     * @todo Calculate and set angle
     */
    this.mesh.position.set(...this.getPositionAtFrame(frame));
  }

}

module.exports = Particle;