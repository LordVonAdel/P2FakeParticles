const ParticleGroup = require('./ParticleGroup.js');

class ParticleDefinition {
  
  constructor() {
    this.groups = [];
    this.animationLength = 120;
    this.animationResolution = 20;
    this.name = "UnnamedSystem";
  }

  export() {
    return {
      name: this.name,
      animationLength: this.animationLength,
      animationResolution: this.animationResolution,
      groups: this.groups.map(g => g.export())
    }
  }

  import(data) {
    if ("name" in data) this.name = String(data.name);
    if ("animationLength" in data) this.animationLength = Number(data.animationLength);
    if ("animationResolution" in data) this.animationResolution = Number(data.animationResolution);

    this.groups.length = 0;
    if ("groups" in data) {
      for (let g of data.groups) {
        this.createGroup().import(g);
      }
    }
  }

  createGroup() {
    let group = new ParticleGroup();
    this.groups.push(group);
    return group;
  }

  getGroups() {
    return this.groups;
  }

}

module.exports = ParticleDefinition;