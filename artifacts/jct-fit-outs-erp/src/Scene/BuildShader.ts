import * as THREE from 'three';

export function buildMaterial(color: string | THREE.Color, roughness = 0.82, metalness = 0.06) {
  const baseColor = typeof color === 'string' ? new THREE.Color(color) : color;
  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness,
    metalness,
    transparent: true,
    opacity: 1,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBuild = { value: 0 };
    shader.uniforms.uOrigin = { value: new THREE.Vector3(5.0, -1.1, 4.0) }; // Entry door
    shader.uniforms.uMaxDist = { value: 14.0 };

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uBuild;\nuniform vec3 uOrigin;\nuniform float uMaxDist;\nvarying vec3 vWorldPos;'
      )
      .replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        float dist = length(vWorldPos - uOrigin);
        float delay = dist / uMaxDist;
        float localBuild = clamp((uBuild - delay * 0.45) / 0.55, 0.0, 1.0);

        float scanHeight = -1.45 + localBuild * 3.8;
        float reveal = 1.0 - smoothstep(scanHeight - 0.08, scanHeight + 0.1, vWorldPos.y);
        float scan = 1.0 - smoothstep(0.0, 0.1, abs(vWorldPos.y - scanHeight));

        diffuseColor.rgb = mix(vec3(0.08, 0.28, 0.55), diffuseColor.rgb, reveal);
        diffuseColor.rgb += vec3(0.2, 0.6, 1.0) * scan * 1.5;
        diffuseColor.a *= reveal * step(0.001, localBuild);
      `
      );

    material.userData.shader = shader;
  };

  return material;
}

export function setBuild(material: THREE.Material, value: number) {
  const shader = material.userData.shader as
    | { uniforms: { uBuild: { value: number } } }
    | undefined;
  if (shader && shader.uniforms.uBuild) {
    shader.uniforms.uBuild.value = value;
  }
}
