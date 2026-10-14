export const CASCADE_VERTEX_SHADER = String.raw`
  uniform float uPsi;       // the slide's centre angle
  uniform float uScale;     // the slide's width scale
  uniform float uR;         // cylinder radius
  uniform float uEdgeScale;
  uniform float uVisible;
  uniform float uBendReach; // a slide is fully bent this far (radians) from the centre
  varying vec2 vUv;
  void main() {
    vUv = uv;
    float t = position.x * uScale;
    float psi = uPsi + t / uR;
    // bent: the vertex sits on the cylinder
    vec3 bent = vec3(uR * sin(psi), 0.0, -uR * cos(psi));
    // planar: the same vertex on the tangent plane at the slide's centre
    // ("flat" is a reserved word in GLSL)
    vec3 planar = vec3(uR * sin(uPsi) + t * cos(uPsi), 0.0, -uR * cos(uPsi) + t * sin(uPsi));
    // the slide at the centre stays flat and bends in as it moves out
    // (Julian, 2026-10-02: no outward bend on the centre slide)
    float bend = smoothstep(0.0, 1.0, abs(uPsi) / uBendReach);
    vec3 p = mix(planar, bent, bend);
    // height from where the vertex ACTUALLY sits (its angle around the axis),
    // not from its slide: neighbouring edges sit at the same angle, so the
    // top and bottom run as one continuous line across every slide, the
    // flat centre slide included (Julian, 2026-10-02)
    float h = 1.0 + uEdgeScale * min(1.0, abs(atan(p.x, -p.z)) / uVisible);
    p.y = position.y * h;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

export const CASCADE_FRAGMENT_SHADER = String.raw`
  uniform sampler2D uMap;
  uniform sampler2D uOverlay;
  uniform float uHasMap;
  uniform float uHasOverlay;
  uniform float uCrossed;
  uniform float uAlpha;
  uniform float uAspect;
  uniform float uRadius;
  uniform vec3 uBrand;
  varying vec2 vUv;

  void main() {
    vec3 col = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : vec3(0.08);

    // left of the centre line: plain black and white (no pixel grid - it
    // broke up badly under the glass). right of it: live colour
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 still = clamp(vec3((l - 0.5) * 1.15 + 0.5), 0.0, 1.0);
    vec3 c = mix(still, col, step(1.0 - uCrossed, vUv.x));

    // title overlay
    if (uHasOverlay > 0.5) {
      vec4 ov = texture2D(uOverlay, vUv);
      c = mix(c, ov.rgb, ov.a);
    }

    // corner mask: full signed box distance (negative inside), so a radius
    // of 0 gives sharp corners at full alpha instead of a 50% inside
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 q = abs(p) - (vec2(uAspect, 1.0) * 0.5 - uRadius);
    float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float a = 1.0 - smoothstep(-0.003, 0.003, sd);

    gl_FragColor = vec4(c, a * uAlpha);
  }
`;

export const CASCADE_POST_VERTEX_SHADER = String.raw`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const CASCADE_POST_FRAGMENT_SHADER = String.raw`
  uniform sampler2D tScene;
  uniform vec2 uRes;
  uniform vec3 uBrand;
  uniform float uGlass; // 1 on desktop, 0 below lg (the laser still draws)
  uniform float uHalfC; // half the height of the slide crossing the centre line
  varying vec2 vUv;

  // smear along the bend, the motion-blur look of thick glass
  vec4 smear(vec2 uv, vec2 dir, float spread) {
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 12; i++) {
      float k = float(i) / 11.0 - 0.5;
      acc += texture2D(tScene, uv + dir * k * spread);
    }
    return acc / 12.0;
  }

  // frosted glass: a wide, round blur - golden-angle spiral of 32 taps out
  // to radiusPx, weighted toward the centre so it reads soft, not grainy
  vec4 frost(vec2 uv, float radiusPx) {
    vec4 acc = texture2D(tScene, uv);
    float wsum = 1.0;
    for (int i = 1; i < 32; i++) {
      float fi = float(i);
      float rr = sqrt(fi / 31.0);
      float a = fi * 2.39996;
      vec2 o = vec2(cos(a), sin(a)) * rr * radiusPx / uRes;
      float w = 1.0 - 0.6 * rr;
      acc += texture2D(tScene, uv + o) * w;
      wsum += w;
    }
    return acc / wsum;
  }

  // a slow, smooth height field: the uneven thickness of real glass
  float glassH(vec2 p) {
    return sin(p.x * 7.0 + sin(p.y * 4.0) * 1.5) * 0.5 + sin(p.y * 9.0 - p.x * 3.0) * 0.5;
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    float side = sign(vUv.x - 0.5);
    float dx = abs(vUv.x - 0.5);
    float vy = abs(vUv.y - 0.5);

    // glass strength: 1 at the viewport edge, feathering to 0 toward the centre
    float dE = (0.5 - dx) * aspect;
    // a ramp that keeps steepening all the way to the edge (no flat shoulder),
    // so the flare is one continuous curve like the reference
    float r = 1.0 - clamp(dE / 0.28, 0.0, 1.0); // glass width from each edge (was 0.42)
    float g = r * uGlass;
    float g2 = r * r * r * uGlass;

    // the breaking, after the reference: toward the edge the image swells -
    // vertically it is magnified more and more, so a slide's top and bottom
    // edges flare outward in a smooth curve - and it frosts into a soft blur
    vec4 col = texture2D(tScene, vUv);
    if (g > 0.001) {
      vec2 uv = vUv;
      uv.x -= side * 0.035 * g2; // the pull toward the edge (was 0.06)
      uv.y = 0.5 + (vUv.y - 0.5) / (1.0 + 0.14 * g2); // the vertical swell (was 0.2)
      // refraction through uneven glass: bend by the slope of the height field
      vec2 q = vUv * vec2(aspect, 1.0);
      float e = 0.002;
      vec2 slope = vec2(glassH(q + vec2(e, 0.0)) - glassH(q - vec2(e, 0.0)), glassH(q + vec2(0.0, e)) - glassH(q - vec2(0.0, e))) / (2.0 * e);
      uv += slope * 0.004 * g;
      // much blurrier toward the edge: a wide frost plus the smear along the bend
      vec4 frosted = 0.7 * frost(uv, 42.0 * g) + 0.3 * smear(uv, vec2(side, 0.0), 0.06 * g2);
      // frosted glass lifts and milks the colour a little, like light caught in it
      frosted.rgb = mix(frosted.rgb, frosted.rgb * 0.88 + 0.07 * frosted.a, 0.6 * g);
      col = mix(col, frosted, smoothstep(0.0, 0.1, g));
    }

    // the centre laser, always on, exactly as tall as the slide it is hitting
    float px = dx * uRes.x;
    float bandC = 1.0 - smoothstep(uHalfC - 0.004, uHalfC, vy);
    float laser = (exp(-pow(px / 1.2, 2.0)) + exp(-pow(px / 14.0, 2.0)) * 0.45) * bandC;
    col.rgb += mix(uBrand, vec3(1.0), exp(-pow(px / 0.8, 2.0)) * 0.5) * laser;
    col.a = max(col.a, laser);

    gl_FragColor = col;
  }
`;
