const scale = 16;

module.exports = function(scene) {

  let loader = new THREE.TextureLoader();
  let material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.1,
    map: loader.load('./info_player_start.png')
  });

  let geometry = new THREE.PlaneGeometry(32 / scale, 72 / scale);
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -5;
  mesh.position.z = 72 / scale / 2
  mesh.rotation.x = Math.PI / 2;

  scene.add(mesh);
}