import * as THREE from 'three';

export function buildMaterial(color: string, roughness = .82) {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness: .06 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBuild = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vWorldY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorldY = (modelMatrix * vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uBuild;\nvarying float vWorldY;')
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float scanHeight = -1.45 + uBuild * 3.32;
        float reveal = 1.0 - smoothstep(scanHeight - 0.1, scanHeight + 0.12, vWorldY);
        float scan = 1.0 - smoothstep(0.0, 0.12, abs(vWorldY - scanHeight));
        diffuseColor.rgb = mix(vec3(0.12, 0.32, 0.62), diffuseColor.rgb, reveal);
        diffuseColor.rgb += vec3(0.18, 0.5, 1.0) * scan * 1.35;
        diffuseColor.a *= reveal;
      `);
    material.userData.shader = shader;
  };
  material.transparent = true;
  material.depthWrite = false;
  return material;
}

export function setBuild(material: THREE.Material, value: number) {
  const shader = material.userData.shader as { uniforms: { uBuild: { value: number } } } | undefined;
  if (shader) shader.uniforms.uBuild.value = value;
}