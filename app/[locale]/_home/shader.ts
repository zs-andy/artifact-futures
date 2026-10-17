// Same distance fields, Bayer pattern and colour mixing as the original WebGL effect.
// WebGPU fragment positions already use the page's top-left origin.
export const SHADER = /* wgsl */ `
struct Uniforms {
  dpr: f32,
  box: vec4f,
  boxR: f32,
  piece: vec3f,
  shape: vec3f,
  foot: vec2f,
  pull: vec2f,
  color: vec3f,
  textRect: vec4f,
  view: vec2f,
  field: vec3f,
  dither: f32,
  wash: f32,
  invert: f32,
  frameOn: f32,
  frame: vec4f,
  frameR: f32,
  cover: vec4f,
  coverFit: vec4f,
  fit: f32,
};
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var image: texture_2d<f32>;
@group(0) @binding(2) var inkTexture: texture_2d<f32>;
@group(0) @binding(3) var linearSampler: sampler;

fn coverage(d: f32) -> f32 {
  return clamp(0.5 - d / max(fwidth(d), 0.0001), 0.0, 1.0);
}
fn bayer2(p: vec2f) -> f32 {
  let a = floor(p);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}
fn bayer4(a: vec2f) -> f32 { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
fn bayer8(a: vec2f) -> f32 { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
fn band(value: f32) -> f32 { return clamp((value - 0.04) / 0.92, 0.0, 1.0); }
fn picture(p: vec2f) -> vec3f {
  let st = p / u.view;
  let local = (p - (u.frame.xy - u.frame.zw)) / max(u.frame.zw * 2.0, vec2f(1.0));
  let fit = local * u.coverFit.xy + u.coverFit.zw;
  let src = textureSampleLevel(image, linearSampler, mix(st * u.cover.xy + u.cover.zw, fit, u.fit), 0.0).rgb;
  let amount = band(u.dither);
  if (amount <= 0.0) { return src; }
  let cell = floor(p * 0.5);
  let lum = smoothstep(0.08, 0.92, dot(src, vec3f(0.2126, 0.7152, 0.0722)));
  let dotted = select(vec3f(1.0), u.color, lum < bayer8(cell) * (1.0 - band(u.wash)));
  return select(src, dotted, bayer8(cell + vec2f(3.0, 5.0)) < amount);
}
fn sdBox(p: vec2f, b: vec2f, r: f32) -> f32 {
  let q = abs(p) - b + r;
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}
fn smin(a: f32, b: f32, k: f32) -> f32 {
  let h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
@fragment
fn main(@builtin(position) position: vec4f) -> @location(0) vec4f {
  let p = position.xy / u.dpr;
  var q = p;
  let reach = length(u.pull);
  if (reach > 0.001) {
    let axis = u.pull / reach;
    let side = vec2f(-axis.y, axis.x);
    let width = 7.0 * (abs(side.x) + abs(side.y));
    for (var i = 0; i < 3; i++) {
      let rel = q - u.foot;
      let across = max(abs(dot(rel, side)) - width, 0.0);
      let alongAxis = dot(rel, axis) + 7.0;
      let x = sqrt(across * across + 1.0) - 1.0;
      let along = mix(exp(-x / 12.0), exp(-x / 64.0), 0.3);
      let depth = select(exp(alongAxis / 60.0), 1.0, alongAxis >= 0.0);
      q = p - u.pull * along * depth;
    }
  }
  let box = sdBox(q - u.box.xy, u.box.zw, u.boxR);
  var piece = 100000.0;
  if (u.piece.z > 0.0) { piece = sdBox(p - u.piece.xy, u.shape.xy * u.piece.z, u.shape.z * u.piece.z); }
  let fill = coverage(smin(box, piece, 3.0));
  var color = select(u.color, u.field, u.invert > 0.5 && box < piece);
  var alpha = fill;
  var pictureMask = 0.0;
  if (u.frameOn > 0.5) {
    pictureMask = coverage(sdBox(p - u.frame.xy, u.frame.zw, u.frameR));
    color = mix(color, picture(p), pictureMask);
    alpha = max(alpha, pictureMask);
  }
  if (u.invert > 0.5 && u.piece.z > 0.0) {
    let inside = coverage(piece) * coverage(box);
    let flipped = select(vec3f(1.0), u.color, min(color.r, min(color.g, color.b)) > 0.9);
    color = mix(color, flipped, inside * (1.0 - pictureMask));
    color = mix(color, vec3f(1.0), inside * pictureMask);
  }
  var ink = 0.0;
  if (u.textRect.z > 0.0) {
    let uv = (p - u.textRect.xy) / u.textRect.zw;
    if (all(uv >= vec2f(0.0)) && all(uv <= vec2f(1.0))) {
      ink = textureSampleLevel(inkTexture, linearSampler, uv, 0.0).a;
    }
  }
  return vec4f(color * alpha * (1.0 - ink) + vec3f(fill) * ink, alpha + ink * (1.0 - alpha));
}
`;
