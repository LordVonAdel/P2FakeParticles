# Portal 2 Fake Particle Creator

This is a (WIP) tool that bakes particles into models for use in the source engine. It was created for Portal 2 but should work with other games too.

## Advantages
* Brings custom particles to Portal 2 workshop maps
* Live particle preview in hammer

## Drawbacks
* Moving particles will not stay at the point they were moved from and don't interact with the world in any other way.
* Limited rendering capabilities
* Limited control over how particles behave

## Room for improvements
This tool is not perfect, but good enough for me. The number of generated faces could be divided by 4 if $nocull is used and quads are replaced by triangles.

Also animated textures could enrich these fake particles as well.

Feel free to make pull requests.