const fs = require('fs');
const path = require('path');
const os = require("os");
const SMD = require('source-smd');
const Particle = require('./Particle.js');
const { execFile, spawn } = require("child_process");
const ScaleFactor = 16; // 1 unit = 16hu

const MATERIAL_DIRECTORY = "fake_particles";
const MODELS_DIRECTORY = "fake_particles";

class Exporter {

  constructor(editor) {
    this.editor = editor;

    this.pathToVTFCmd = "./bin/VTFCmd.exe";
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      this.pathToVTFCmd = path.join(process.env.PORTABLE_EXECUTABLE_DIR, this.pathToVTFCmd);
    }
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
    this.exportSMD(definition, baseName).then(() => {
      return this.exportQC(definition, baseName);
    }).then(() => {
      return this.exportMaterials(definition, baseName);
    }).then(() => {
      this.editor.compileLog("Finishing", "-- PRESS ESC TO CONTINUE --", "lime");
    }).catch(err => {
      this.editor.compileLog("ERROR", err, "red");
      this.editor.compileLog("-- PRESS ESC TO CONTINUE -- <", "");
    });
  }

  exportAndCompile(definition, gameDirectory) {
    this.editor.startCompileLog();

    // Please don't kill me for using a sync function... we may block the ui for a millisecond!
    let exportDirectory = fs.mkdtempSync(os.tmpdir())
    let baseName = path.join(exportDirectory, definition.name);

    this.exportSMD(definition, baseName).then(() => {
      return this.exportQC(definition, baseName);
    }).then(() => {
      let materialDirectory = path.join(gameDirectory, "materials", MATERIAL_DIRECTORY);
      fs.mkdirSync(materialDirectory, { recursive: true} );

      return this.exportMaterials(definition, path.join(materialDirectory, definition.name));
    }).then(() => {
      return this.compile(definition, exportDirectory, gameDirectory);
    }).then(() => {
      this.editor.compileLog("Finishing", "If the model does not appear, check the log above for errors!\n-- PRESS ESC TO CONTINUE --", "lime");
    }).catch(err => {
      this.editor.compileLog("ERROR", err, "red");
      this.editor.compileLog("-- PRESS ESC TO CONTINUE -- <", "");
    }).finally(() => {
      fs.unlinkSync(path.join(exportDirectory, definition.name + ".qc"));
      fs.unlinkSync(path.join(exportDirectory, definition.name + "-start.smd"));
      fs.unlinkSync(path.join(exportDirectory, definition.name + "-loop.smd"));
      fs.unlinkSync(path.join(exportDirectory, definition.name + "-stop.smd"));
      fs.unlinkSync(path.join(exportDirectory, definition.name + "-ref.smd"));
      fs.rmdirSync(exportDirectory);
    });
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

    let promiseRef = new Promise((resolve, reject) => {
      fs.writeFile(filename + "-ref.smd", model.export(), err => {
        if (err) return reject(err);
        this.editor.compileLog("Saving " + filename + "-ref.smd", "success", "white");
        resolve();
      });
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
          let node = model.getNodeIdByName("p" + j + "x" + k);
          let particle = new Particle(group, k);
          model.addSkeleton(i, node, ...particle.getPositionAtFrame(localFrame).map(n => n * ScaleFactor), ...particle.getAngleAtFrame(localFrame));
        }
      }
    }

    let promiseStart = new Promise((resolve, reject) => {
      fs.writeFile(filename + "-start.smd", model.export(), err => {
        if (err) return reject(err);
        this.editor.compileLog("Saving " + filename + "-start.smd", "success", "white");
        resolve();
      });
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

    let promiseLoop = new Promise((resolve, reject) => {
      fs.writeFile(filename + "-loop.smd", model.export(), err => {
        if (err) return reject(err);
        this.editor.compileLog("Saving " + filename + "-loop.smd", "success", "white");
        resolve();
      });
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
          if (localFrame < frame) continue;
          let node = model.getNodeIdByName("p" + j + "x" + k);
          let particle = new Particle(group, k);
          model.addSkeleton(i, node, ...particle.getPositionAtFrame(localFrame), ...particle.getAngleAtFrame(localFrame));
        }
      }
    }

    let promiseStop = new Promise((resolve, reject) => {
      fs.writeFile(filename + "-stop.smd", model.export(), err => {
        if (err) return reject(err);
        this.editor.compileLog("Saving " + filename + "-stop.smd", "success", "white");
        resolve();
      });
    });

    return Promise.all([promiseRef, promiseStart, promiseLoop, promiseStop]);
  }

  exportQC(definition, filename) {
    let fps = 30 * (definition.animationResolution / definition.animationLength);

    let basename = path.basename(filename);
    let out = `$modelname "${MODELS_DIRECTORY}\\${definition.name}.mdl"\n`;
    out += `$body body "${basename}-ref.smd"\n`;
    out += `$cdmaterials "${MATERIAL_DIRECTORY}\\"\n`;
    out += `$sequence idle "${basename}-ref.smd" \n`;
    out += `$sequence start "${basename}-start.smd" {\nfps ${fps}\n}\n`;
    out += `$sequence loop "${basename}-loop.smd" {\nfps ${fps}\nloop\n}\n`;
    out += `$sequence stop "${basename}-stop.smd" {\nfps ${fps}\n}\n`;

    return new Promise((resolve, reject) => {
      fs.writeFile(filename + ".qc", out, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  exportMaterials(definition, filename) {
    let outDirectory = path.dirname(filename);
    let promises = [];

    for (let i = 0; i < definition.groups.length; i++) {
      let group = definition.groups[i];
      if (!group.texture) throw new Error("Group without texture detected! Please give all groups a texture.");
      let materialName = definition.name + "-mat-" + String(i);
      let file = filename + "-mat-" + String(i) + ".vmt";

      let out = `VertexLitGeneric\n{\n$basetexture "${MATERIAL_DIRECTORY}/${materialName}"\n$translucent 1\n}`;

      promises.push(new Promise((resolve, reject) => {
        fs.writeFile(file, out, err => {
          if (err) {
            this.editor.compileLog("Create VMT: " + file, "ERROR", "red");
            reject(err);
            return;
          }
          this.editor.compileLog("Create VMT: " + path.basename(file), "success!");
          resolve();
        });
      }));

      promises.push(new Promise((resolve, reject) => {
        execFile(this.pathToVTFCmd, [
          "-file", group.texture,
          "-output", outDirectory,
          "-alphaformat", "RGBA8888",
          "-resize",
          "-noreflectivity"
        ], (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }

          if (stderr) {
            this.editor.compileLog("VTFCmd.exe - " + group.texture, stderr, "red");
            reject();
            return;
          }

          if (stdout.toLowerCase().includes("error")) {
            this.editor.compileLog("VTFCmd.exe - " + group.texture, stdout, "red");
            reject();
            return;
          }

          this.editor.compileLog("VTFCmd.exe - " + group.texture, stdout);

          let texturePath = path.join(outDirectory, path.basename(group.texture, ".png"));
          let from = texturePath + ".vtf";
          let to = path.join(path.dirname(texturePath), materialName + ".vtf");
          this.moveFile(from, to).then(() => resolve());
        });
      }));
    }
    return Promise.all(promises);
  }

  /**
   * Uses studiomdl to compile the model
   */
  compile(definition, exportDirectory, gameDirectory) {
    let studiomdlPath = path.join(gameDirectory, "..", "bin", "studiomdl.exe");

    return new Promise((resolve, reject) => {

      let qcPath = path.join(exportDirectory, definition.name + ".qc");
      let args = ["-nop4", "-game",  gameDirectory, qcPath];
      let log = this.editor.compileLog(studiomdlPath + ` -nop4 -game "${gameDirectory}" "${qcPath}"`, "");

      new Promise((resolve, reject) => {
        let studio = spawn(studiomdlPath, args);
        studio.stdout.on("data", (msg) => {
          log.innerText += msg;
        });
        studio.on('close', () => {
          resolve();
        });
      }).then(() => {
        resolve();
      }).catch((err) => {
        reject(err);
      });

    });
  }

  moveFile(from, to) {
    return new Promise(resolve => {
      fs.rename(from, to, () => {
        this.editor.compileLog(`Move file "${from}" to "${to}"`, "Callback fired!");
        resolve();
      });
    })
  }

  /**
   * Moves VTF and MFT files in the game directory
   */
  
  moveMaterialsAndTexture(definition, exportDirectory, gameDirectory) {
    let materialDirectory = path.join(gameDirectory, "materials", MATERIAL_DIRECTORY);
    fs.mkdirSync(materialDirectory, { recursive: true} );

    let promises = [];

    for (let i = 0; i < definition.groups.length; i++) {
      let vtfName = definition.name + "-mat-" + String(i) + ".vtf";
      let vmtName = definition.name + "-mat-" + String(i) + ".vmt";
      promises.push(new Promise(resolve => {
        this.moveFile(path.join(exportDirectory, vtfName), path.join(materialDirectory, vtfName)).then(() => {
          return this.moveFile(path.join(exportDirectory, vmtName), path.join(materialDirectory, vmtName));
        }).then(() => {
          resolve();
        });
      }));
    }

    return Promise.all(promises);
  }

}

module.exports = Exporter;