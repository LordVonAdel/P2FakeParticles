# Portal 2 Fake Particle Creator

This is a (WIP) tool that bakes particles into models for use in the source engine. It was created for Portal 2 but should work with other games too.
It has limited control over how particles behave (Good for mist, jets and clouds, bad for specific shapes).

## Advantages
* Brings custom particles to Portal 2 workshop maps
* Live particle preview in hammer

## Drawbacks
* Moving particles will not stay at the point they were moved from and don't interact with the world in any other way.
* Limited rendering capabilities

## Usage
### Creating the effect
Change the parameters on the left and see what they do. Load some examples to learn from or use them as template.

### Exporting
`File > Export` can be used to export the model to smd. The exporter will create four `smd` files, one `vmf` for every group and one `qc` for compiling the model with studiomdl. The models compilation needs to be done manually.

### Use in Hammer
After adding the model, materials and textures to the game files, the system can be place into the world with a `prop_dynamic` entity. The model has 4 animations.
`Idle` - not useful
`Start` - Plays the start of the effect.
`Loop` - Loops the effect.
`Stop` - Plays the end of the effect without spawning new particles. 

## Room for improvements (Unimplemented stuff)
This tool is not perfect, but good enough for me. The number of generated faces could be divided by 4 if $nocull is used and quads are replaced by triangles.

Also animated textures could enrich these fake particles as well.

Scaling of particles should be achievable by using multiple nodes per particle or vertex animation.

Feel free to make pull requests.

## License
This software is licensed under the GPL license.

It uses VTFLib (GPL) and VTFCmd (LGPL).
