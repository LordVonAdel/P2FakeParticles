const fs = require('fs');
const path = require('path');
const SMD = require('source-smd');
const Particle = require('./Particle.js');
const { execFile } = require("child_process");
const ScaleFactor = 16; // 1 unit = 16hu

class Exporter {

  constructor(editor) {
    this.editor = editor;
  }

  /**
   * Exports multiple files for compiling the model
   * @param {ParticleDefinition} definition The particle definition
   * @param {String} filename The filename to export to. including the smd extension
   */
  export(definition, filename) {

    this.editor.startCompileLog();

    // Remove the ".smd" from the end
    let baseName = filename.substring(0, filename.length - 4);

    // Run exports
    try {
      this.exportSMD(definition, baseName);
      this.exportQC(definition, baseName);
      this.exportMaterials(definition, baseName);
    } catch (e) {
      this.editor.compileLog("ERROR", e, "red");
    }
  }

  exportSMD(definition, filename) {
    let model = new SMD();
    let root = 0; // Root node

    for (let i = 0; i < definition.groups.length; i++) {
      let group = definition.groups[i];
      let lx = ScaleFactor * group.scale[0] / 2;
      let ly = ScaleFactor * group.scale[1] / 2;
      let lz = ScaleFactor * group.scale[2] / 2;
      let materialName = definition.name + "-mat-" + i;

      for (let j = 0; j < group.number; j++) {
        let node = model.addNode("p" + i + "x" + j, root);
        //let particle = new Particle(group, j);

        // XZ-Plane
        model.addQuad(materialName,
          SMD.createVertex(node, -lx, 0, -lz, 0, -1, 0, 0, 0),
          SMD.createVertex(node, lx, 0, -lz, 0, -1, 0, 1, 0),
          SMD.createVertex(node, lx, 0, lz, 0, -1, 0, 1, 1),
          SMD.createVertex(node, -lx, 0, lz, 0, -1, 0, 0, 1)
        );

        // YZ-Plane
        model.addQuad(materialName,
          SMD.createVertex(node, 0, -ly, -lz, 0, -1, 0, 0, 0),
          SMD.createVertex(node, 0, ly, -lz, 0, -1, 0, 1, 0),
          SMD.createVertex(node, 0, ly, lz, 0, -1, 0, 1, 1),
          SMD.createVertex(node, 0, -ly, lz, 0, -1, 0, 0, 1)
        );

        // XY-Plane
        model.addQuad(materialName,
          SMD.createVertex(node, -lx, -ly, 0, 0, -1, 0, 0, 0),
          SMD.createVertex(node, -lx, ly, 0, 0, -1, 0, 1, 0),
          SMD.createVertex(node, lx, ly, 0, 0, -1, 0, 1, 1),
          SMD.createVertex(node, lx, -ly, 0, 0, -1, 0, 0, 1)
        );

        //model.addSkeleton(0, node, ...particle.getPositionAtFrame(0).map(n => n * ScaleFactor), ...particle.getAngleAtFrame(0));
        model.addSkeleton(0, node, 0, 0, 0, 0, 0, 0);
      }
    }

    fs.writeFile(filename + "-ref.smd", model.export(), err => {
      if (err) throw err;
    });

    let len = definition.animationLength;
    let frames = definition.animationResolution;

    // Bake start animation
    model.skeleton.length = 0; // Clear all frames
    for (let i = 0; i < frames; i++) {
      let p = i / frames;
      let frame = Math.floor(p * len);

      for (let j = 0; j < definition.groups.length; j++) {
        let group = definition.groups[j];
        for (let k = 0; k < group.number; k++) {
          let localFrame = ((k / (group.number - 1)) * len + frame);
          if (localFrame < frame) continue;
          let node = model.getNodeIdByName("p" + j + "x" + k);
          let particle = new Particle(group, k);
          model.addSkeleton(i, node, ...particle.getPositionAtFrame(localFrame).map(n => n * ScaleFactor), ...particle.getAngleAtFrame(localFrame));
        }
      }
    }

    fs.writeFile(filename + "-start.smd", model.export(), err => {
      if (err) throw err;
      this.editor.compileLog("Saving " + filename + "-start.smd", "success", "white");
    });

    // Bake loop animation
    model.skeleton.length = 0; // Clear all frames
    for (let i = 0; i < frames; i++) {
      let p = i / frames;
      let frame = Math.floor(p * len);

      for (let j = 0; j < definition.groups.length; j++) {
        let group = definition.groups[j];
        for (let k = 0; k < group.number; k++) {
          let localFrame = ((k / (group.number - 1)) * len + frame) % len; // Offset all particle animation a bit
          let node = model.getNodeIdByName("p" + j + "x" + k);
          let particle = new Particle(group, k);
          model.addSkeleton(i, node, ...particle.getPositionAtFrame(localFrame).map(n => n * ScaleFactor), ...particle.getAngleAtFrame(localFrame));
        }
      }
    }

    fs.writeFile(filename + "-loop.smd", model.export(), err => {
      if (err) throw err;
      this.editor.compileLog("Saving " + filename + "-loop.smd", "success", "white");
    });

    // Bake stop animation
    model.skeleton.length = 0; // Clear all frames
    for (let i = 0; i < frames; i++) {
      let p = i / frames;
      let frame = Math.floor(p * len);

      for (let j = 0; j < definition.groups.length; j++) {
        let group = definition.groups[j];
        for (let k = 0; k < group.number; k++) {
          let localFrame = ((k / (group.number - 1)) * len + frame);
          let node = model.getNodeIdByName("p" + j + "x" + k);
          let particle = new Particle(group, k);
          model.addSkeleton(i, node, ...particle.getPositionAtFrame(localFrame), ...particle.getAngleAtFrame(localFrame));
        }
      }
    }

    fs.writeFile(filename + "-stop.smd", model.export(), err => {
      if (err) throw err;
      this.editor.compileLog("Saving " + filename + "-stop.smd", "success", "white");
    });
  }

  exportQC(definition, filename) {
    let fps = 30 * (definition.animationResolution / definition.animationLength);

    let basename = path.basename(filename);
    let out = `$modelname "fake_particles\\${definition.name}.mdl"\n`;
    out += `$body body "${basename}-ref.smd"\n`;
    out += `$cdmaterials "fake_particles\\"\n`;
    out += `$sequence idle "${basename}-ref.smd" \n`;
    out += `$sequence start "${basename}-start.smd" fps ${fps}\n`;
    out += `$sequence loop "${basename}-loop.smd" fps ${fps}\n`;
    out += `$sequence stop "${basename}-stop.smd" fps ${fps}\n`;

    fs.writeFile(filename + ".qc", out, err => {
      if (err) throw err;
    });
  }

  exportMaterials(definition, filename) {
    let outDirectory = path.dirname(filename);

    for (let i = 0; i < definition.groups.length; i++) {
      let group = definition.groups[i];
      if (!group.texture) throw new Error("Group without texture detected! Please give all groups a texture.");
      let materialName = definition.name + "-mat-" + String(i);
      let file = filename + "-mat-" + String(i) + ".vmt";

      let out = `VertexLitGeneric\n{\n$basetexture "fake_particles/${materialName}"\n$translucent 1\n}`;

      fs.writeFile(file, out, err => {
        if (err) {
          this.editor.compileLog("Create VMT: " + file, "ERROR", "red");
          throw err;
        }
        this.editor.compileLog("Create VMT: " + path.basename(file), "success!");
      });

      execFile("./bin/VTFCmd.exe", [
        "-file", group.texture,
        "-output", outDirectory,
        "-alphaformat", "RGBA8888",
        "-resize"
      ], (error, stdout, stderr) => {
        if (error) throw error;
        if (stderr) {
          this.editor.compileLog("VTFCmd.exe - " + group.texture, stderr, "red");
        }
        this.editor.compileLog("VTFCmd.exe - " + group.texture, stdout, stdout.toLowerCase().includes("error") ? "red" : "white");

        let texturePath = path.join(outDirectory, path.basename(group.texture, ".png"));
        let from = texturePath + ".vtf";
        let to = path.join(path.dirname(texturePath), materialName + ".vtf");
        fs.rename(from, to, () => {
          this.editor.compileLog(`Move file "${from}" to "${to}"`, "Callback fired!");
        });
      });
    }
  }

}

module.exports = Exporter;