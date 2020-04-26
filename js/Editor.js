const ParticleDefinition = require("./ParticleDefinition.js");
const { ipcRenderer, remote } = require('electron');
const fs = require("fs");
const path = require("path");
const Exporter = require('./Exporter.js');

class Editor {

  constructor() {
    this.inputs = {};
    this.preview = null;
    this.exporter = new Exporter(this);

    this.logDiv = document.getElementById("log-view");

    let generalDiv = document.getElementById("general");
    generalDiv.appendChild(this.createInput("text", "Model Name", "model-name"));
    generalDiv.appendChild(this.createInput("number", "Animation Length", "animation-length"));
    generalDiv.appendChild(this.createInput("number", "Animation Resolution", "animation-resolution"));

    generalDiv.appendChild(this.createLabel("Groups"));

    generalDiv.addEventListener("change", () => {
      this.definition.name = this.inputs["model-name"].value;
      this.definition.animationLength = this.inputs["animation-length"].value;
      this.definition.animationResolution = this.inputs["animation-resolution"].value;
      this.preview.updateScene();
    });

    this.groupDiv = document.getElementById("group-div");
    let groupToolsDiv = document.getElementById("group-tools");

    groupToolsDiv.appendChild(this.createLabel("Appearance"));
    let textureButton = document.createElement("button");
    textureButton.innerText = "Pick Texture";
    textureButton.addEventListener("click", () => this.pickTexture());
    groupToolsDiv.appendChild(textureButton);
    groupToolsDiv.appendChild(this.createInput("number", "Particle Number", "number"));
    groupToolsDiv.appendChild(this.createInputVector("Initial Scale", "scale"));

    groupToolsDiv.appendChild(this.createLabel("Position"));
    groupToolsDiv.appendChild(this.createInputVector("Emitter Dimensions", "emitter-dim"));
    groupToolsDiv.appendChild(this.createInputVector("Initial Speed", "speed-init"));
    groupToolsDiv.appendChild(this.createInputVector("Acceleration", "speed-acc"));
    
    groupToolsDiv.appendChild(this.createLabel("Angle (Degree)"));
    groupToolsDiv.appendChild(this.createInputVector("Start Angle", "angle"));
    groupToolsDiv.appendChild(this.createInputVector("Angle Speed", "angle-speed"));
    groupToolsDiv.appendChild(this.createInputVector("Angle Acceleration", "angle-acc"));
    groupToolsDiv.appendChild(this.createInputVector("Random Angle", "angle-random"));

    groupToolsDiv.addEventListener("change", () => {
      // Stupid big block could be replaced by adding event listener on the single inputs at createInput()
      this.selectedGroup.emitterDimensions[0] = this.inputs["emitter-dim-x"].value;
      this.selectedGroup.emitterDimensions[1] = this.inputs["emitter-dim-y"].value;
      this.selectedGroup.emitterDimensions[2] = this.inputs["emitter-dim-z"].value;
      this.selectedGroup.speedInit[0] = this.inputs["speed-init-x"].value;
      this.selectedGroup.speedInit[1] = this.inputs["speed-init-y"].value;
      this.selectedGroup.speedInit[2] = this.inputs["speed-init-z"].value;
      this.selectedGroup.speedAcc[0] = this.inputs["speed-acc-x"].value;
      this.selectedGroup.speedAcc[1] = this.inputs["speed-acc-y"].value;
      this.selectedGroup.speedAcc[2] = this.inputs["speed-acc-z"].value;
      this.selectedGroup.scale[0] = this.inputs["scale-x"].value;
      this.selectedGroup.scale[1] = this.inputs["scale-y"].value;
      this.selectedGroup.scale[2] = this.inputs["scale-z"].value;
      this.selectedGroup.angle[0] = this.inputs["angle-x"].value;
      this.selectedGroup.angle[1] = this.inputs["angle-y"].value;
      this.selectedGroup.angle[2] = this.inputs["angle-z"].value;
      this.selectedGroup.angleSpeed[0] = this.inputs["angle-speed-x"].value;
      this.selectedGroup.angleSpeed[1] = this.inputs["angle-speed-y"].value;
      this.selectedGroup.angleSpeed[2] = this.inputs["angle-speed-z"].value;
      this.selectedGroup.angleAcc[0] = this.inputs["angle-acc-x"].value;
      this.selectedGroup.angleAcc[1] = this.inputs["angle-acc-y"].value;
      this.selectedGroup.angleAcc[2] = this.inputs["angle-acc-z"].value;
      this.selectedGroup.angleRandom[0] = this.inputs["angle-random-x"].value;
      this.selectedGroup.angleRandom[1] = this.inputs["angle-random-y"].value;
      this.selectedGroup.angleRandom[2] = this.inputs["angle-random-z"].value;
      this.preview.updateScene();
    });

    this.selectedGroupIndex = 0;
    this.newDefinition();

    document.getElementById("btn-group-create").addEventListener("click", () => {
      this.definition.createGroup();
      this.updateGroupsDisplay();
    });

    document.getElementById("btn-group-delete").addEventListener("click", () => {
      if (this.definition.groups.length < 1) return; // Should not happen, because the button is disabled before removing the last group possible
      this.selectedGroup.dispose();
      this.definition.groups.splice(this.selectedGroupIndex, 1);
      this.selectGroup(0);
    });

    ipcRenderer.on("new", () => {
      this.newDefinition();
    });

    ipcRenderer.on("save", () => {
      remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
        title: "Save Particle Definition",
        filters: [
          { name: "JSON", extensions: ['p2fp'] }, // Portal 2 Fake Particle
        ],
        defaultPath: this.definition.name
      }, filename => {
        if (!filename) return;
        console.log("Saving at ", filename);
        fs.writeFile(filename, JSON.stringify(this.definition.export()), (err) => {
          if (err) alert("Saving failed."); // Don't give more information. Like valve would do
        });
      });
    });

    ipcRenderer.on("open", () => {
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: "Open Particle Definition",
        filters: [
          { name: "JSON", extensions: ['p2fp'] },
        ]
      }, filename => {
        if (!filename || filename.length == 0) return;
        this.openP2fp(filename[0]);
      });
    });

    ipcRenderer.on("export", () => {
      remote.dialog.showSaveDialog({
        title: "Export to SMD",
        filters: [
          { name: "JSON", extensions: ['smd'] }, // Portal 2 Fake Particle
        ],
        defaultPath: this.definition.name
      }, filename => {
        if (!filename) return;
        console.log("Exporting to ", filename);
        this.exporter.export(this.definition, filename);
      });
    });

    ipcRenderer.on("compile", () => {
      document.getElementById("compile-popup").style.display = "block";
    });

    document.getElementById("gamefolder-path").innerText = localStorage.getItem("gamefolder");

    document.getElementById("compile-cancel").addEventListener("click", () => {
      document.getElementById("compile-popup").style.display = "";
    });

    document.getElementById("compile-start").addEventListener("click", () => {
      document.getElementById("compile-popup").style.display = "";
      this.exporter.exportAndCompile(this.definition, localStorage.getItem("gamefolder"));
    });

    document.getElementById("compile-select").addEventListener("click", () => {
      remote.dialog.showOpenDialog({
        properties: ['openDirectory']
      }).then(value => {
        if (value.canceled || value.filePaths.length < 1) return;
        localStorage.setItem("gamefolder", value.filePaths[0]);
        document.getElementById("gamefolder-path").innerText = localStorage.getItem("gamefolder");
      });
    });

    document.addEventListener("keydown", e => {
      if (e.code == "Escape") {
        this.closeCompileLog();
      }
    });

  }

  newDefinition() {
    this.definition = new ParticleDefinition();
    this.definition.createGroup();
    this.updateGroupsDisplay();
    this.updateGeneralInfo();
    this.selectGroup(0);
  }

  openP2fp(filename) {
    console.log("Opening ", filename);
    fs.readFile(filename, (err, data) => {
      if (err) return alert("Open failed.");
      try {
        let obj = JSON.parse(data);
        this.newDefinition();
        this.definition.import(obj);
        this.updateGroupsDisplay();
        this.updateGeneralInfo();
        this.selectGroup(0);
        this.preview.updateScene();
      } catch (e) {
        alert("File is corrupted.");
      }
    });
  }

  updateGroupsDisplay() {
    this.groupDiv.innerHTML = "";
    let groups = this.definition.getGroups();
    for (let i = 0; i < groups.length; i++) {
      let item = document.createElement("div");
      item.classList.add("group-item");
      item.innerText = "Group" + i;
      this.groupDiv.appendChild(item);
      if (i == this.selectedGroupIndex) {
        item.classList.add("selected");
      }
      item.addEventListener("click", () => {
        this.selectGroup(i);
      });
    }
    document.getElementById("btn-group-delete").disabled = groups.length <= 1; // less than 1 should not be possible to achieve as a user, but let's check it anyway.
  }

  updateGeneralInfo() {
    this.inputs["model-name"].value = this.definition.name;
    this.inputs["animation-length"].value = this.definition.animationLength;
    this.inputs["animation-resolution"].value = this.definition.animationResolution;
  }

  selectGroup(index) {
    this.selectedGroupIndex = index;
    this.selectedGroup = this.definition.getGroups()[index];
    this.updateGroupsDisplay();

    // This mess could be removed by replacing it with an itteration over this.inputs and using the right parameter keys
    this.inputs["emitter-dim-x"].value = this.selectedGroup.emitterDimensions[0];
    this.inputs["emitter-dim-y"].value = this.selectedGroup.emitterDimensions[1];
    this.inputs["emitter-dim-z"].value = this.selectedGroup.emitterDimensions[2];
    this.inputs["speed-init-x"].value = this.selectedGroup.speedInit[0];
    this.inputs["speed-init-y"].value = this.selectedGroup.speedInit[1];
    this.inputs["speed-init-z"].value = this.selectedGroup.speedInit[2];
    this.inputs["speed-acc-x"].value = this.selectedGroup.speedAcc[0];
    this.inputs["speed-acc-y"].value = this.selectedGroup.speedAcc[1];
    this.inputs["speed-acc-z"].value = this.selectedGroup.speedAcc[2];
    this.inputs["scale-x"].value = this.selectedGroup.scale[0];
    this.inputs["scale-y"].value = this.selectedGroup.scale[1];
    this.inputs["scale-z"].value = this.selectedGroup.scale[2];
    this.inputs["angle-x"].value = this.selectedGroup.angle[0];
    this.inputs["angle-y"].value = this.selectedGroup.angle[1];
    this.inputs["angle-z"].value = this.selectedGroup.angle[2];
    this.inputs["angle-acc-x"].value = this.selectedGroup.angleAcc[0];
    this.inputs["angle-acc-y"].value = this.selectedGroup.angleAcc[1];
    this.inputs["angle-acc-z"].value = this.selectedGroup.angleAcc[2];
    this.inputs["angle-speed-x"].value = this.selectedGroup.angleSpeed[0];
    this.inputs["angle-speed-y"].value = this.selectedGroup.angleSpeed[1];
    this.inputs["angle-speed-z"].value = this.selectedGroup.angleSpeed[2];
    this.inputs["angle-random-x"].value = this.selectedGroup.angleRandom[0];
    this.inputs["angle-random-y"].value = this.selectedGroup.angleRandom[1];
    this.inputs["angle-random-z"].value = this.selectedGroup.angleRandom[2];
    this.inputs["number"].value = this.selectedGroup.number;
  }

  createInputVector(label, property) {
    let div = document.createElement("div");
    let labelElement = document.createElement("label");
    labelElement.innerText = label;
    div.appendChild(labelElement);
    let subDiv = document.createElement("div");
    div.appendChild(subDiv);
    subDiv.style.display = "flex";
    for (let axis of ["x", "y", "z"]) {
      let input = document.createElement("input");
      subDiv.appendChild(input);
      input.style.flexGrow = "1";
      input.title = axis.toUpperCase();
      input.style.width = "30px";
      input.name = property + "-" + axis;
      this.inputs[input.name] = input;
    }
    return div;
  }

  createInput(type, label, property) {
    let div = document.createElement("div");
    let labelElement = document.createElement("label");
    labelElement.innerText = label;
    labelElement.setAttribute("for", "in-" + property);
    div.appendChild(labelElement);
    let input = document.createElement("input");
    div.appendChild(input);
    input.title = label;
    input.type = type;
    input.id = "in-" + property;
    input.name = property;
    this.inputs[input.name] = input;

    input.addEventListener("change", () => {
      this.selectedGroup[property] = input.value;
      this.preview.updateScene();
    });

    return div;
  }

  createLabel(text) {
    let label = document.createElement("h3");
    label.innerText = text;
    return label;
  }

  pickTexture() {
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      title: "Open Texture",
      filters: [
        { name: "PNG", extensions: ['png'] },
      ]
    }, filename => {
      if (!filename || filename.length == 0) return;
      this.selectedGroup.texture = filename[0];
      this.preview.updateScene();
    });
  }

  startCompileLog() {
    this.logDiv.style.display = "block";
    this.logDiv.innerHTML = "";
  }

  compileLog(title, text, color = "white") {
    let div1 = document.createElement("div");
    div1.innerText = title;
    div1.classList.add("log-title")
    this.logDiv.appendChild(div1);

    let div2 = document.createElement("div");
    div2.innerText = text;
    div2.style.color = color;
    this.logDiv.appendChild(div2);
    this.logDiv.scrollTo(0, this.logDiv.scrollHeight);
    return div2;
  }

  closeCompileLog() {
    this.logDiv.style.display = "";
  }

}

module.exports = Editor;