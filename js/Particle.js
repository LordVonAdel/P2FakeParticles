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

ParticleGeometry.faceVertexUvs[0] = [
  [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 1)],
  [new THREE.Vector2(1, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)],

  [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 1)],
  [new THREE.Vector2(1, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)],

  [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 1)],
  [new THREE.Vector2(1, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)]
];

ParticleGeometry.uvsNeedUpdate = true;

//const ParticleMaterial = new THREE.MeshBasicMaterial({color: "white", side: THREE.DoubleSide});

/**
 * Cheap pseudo random function. Should be enough for this application
 * @returns {Number} 0 < x < 1
 */
function randSeed(seed) {
  let n = seed / 100;
  return (n * (n * n * 789221)) % 1;
}

function lerp(x, y, alpha) {
  return x*(1-alpha)+y*alpha;
}

class Particle {

  constructor(group, index) {
    this.group = group;
    this.index = index;

    this.spawnPoint = [
      -group.emitterDimensions[0] / 2 + group.emitterDimensions[0] * randSeed(index * 11),
      -group.emitterDimensions[1] / 2 + group.emitterDimensions[1] * randSeed(index * 7),
      -group.emitterDimensions[2] / 2 + group.emitterDimensions[2] * randSeed(index * 9)
    ];

    this.angleMod = [
      lerp(-group.angleRandom[0], group.angleRandom[0], randSeed(index * 13)),
      lerp(-group.angleRandom[1], group.angleRandom[1], randSeed(index * 17)),
      lerp(-group.angleRandom[2], group.angleRandom[2], randSeed(index * 19))
    ];

    this.mesh = new THREE.Mesh(ParticleGeometry, group.material);
    this.mesh.scale.set(...group.scale);
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
    /**
     * @todo Optimize this with math using a quadratic function
     */
    let angle = [...this.group.angle].map(Number);
    let spd = this.group.angleSpeed.map(Number);
    for (let i = 0; i < frame; i++) {
      for (let j = 0; j < 3; j++) {
        angle[j] += Number(spd[j]);
        angle[j] += Number(this.angleMod[j]);
        spd[j] += Number(this.group.angleAcc[j]);
      }
    }

    return angle.map(x => (x / 180) * Math.PI);
  }

  setFrame(frame) {
    this.mesh.position.set(...this.getPositionAtFrame(frame));
    this.mesh.rotation.set(...this.getAngleAtFrame(frame));
  }

}

module.exports = Particle;