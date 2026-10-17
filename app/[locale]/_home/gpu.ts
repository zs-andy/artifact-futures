/// <reference types="@webgpu/types" />
import { effect, frame, init, sampler, surface, texture, type Texture } from "vgpu";
import { inkRatio } from "../_lib/tagline";
import { SHADER } from "./shader";

export async function createGPU(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  onLost: () => void,
) {
  if (!navigator.gpu || signal.aborted) return null;
  const gpu = await init();
  if (signal.aborted) {
    gpu.dispose();
    return null;
  }
  try {
    const output = surface(gpu, canvas, {
      autoResize: false,
      dpr: inkRatio(),
      size: [innerWidth, innerHeight],
      alphaMode: "premultiplied",
      clearColor: [0, 0, 0, 0],
    });
    const shader = effect(gpu, SHADER, { label: "Homepage cloth" });
    const textures = new Set<Texture>();
    const allocate = (width: number, height: number) => {
      const result = texture(gpu, {
        kind: "2d",
        size: [width, height],
        format: "rgba8unorm",
        usage: ["texture_binding", "copy_dst", "render_attachment"],
      });
      textures.add(result);
      return result;
    };
    const empty = allocate(1, 1);
    let ink = allocate(1, 1);
    shader.set({
      image: empty,
      inkTexture: ink,
      linearSampler: sampler(gpu, { minFilter: "linear", magFilter: "linear" }),
    });
    await shader.compile({ colors: [output.format] });
    if (signal.aborted) {
      gpu.dispose();
      return null;
    }
    let alive = true;
    gpu.gpu.lost.then((info) => {
      if (alive && info.reason !== "destroyed") onLost();
    });
    const stopErrors = gpu.onError((error) => {
      console.error("Homepage GPU:", error);
      if (alive) onLost();
    });
    return {
      upload(image: HTMLImageElement) {
        const target = allocate(image.naturalWidth, image.naturalHeight);
        gpu.gpu.queue.copyExternalImageToTexture(
          { source: image },
          { texture: target.gpu },
          target.size,
        );
        return target;
      },
      ink(source: HTMLCanvasElement) {
        if (ink.size[0] !== source.width || ink.size[1] !== source.height) {
          const previous = ink;
          ink = allocate(source.width, source.height);
          shader.set({ inkTexture: ink });
          textures.delete(previous);
          previous.dispose();
        }
        gpu.gpu.queue.copyExternalImageToTexture({ source }, { texture: ink.gpu }, ink.size);
      },
      resize: () =>
        output.resize([Math.round(innerWidth * inkRatio()), Math.round(innerHeight * inkRatio())]),
      draw(uniforms: Record<string, number | number[]>, image?: Texture) {
        shader.set({ u: uniforms, image: image ?? empty });
        frame(gpu, (f) => f.pass(output, shader));
      },
      dispose() {
        alive = false;
        stopErrors();
        textures.forEach((item) => item.dispose());
        gpu.dispose();
      },
    };
  } catch (error) {
    gpu.dispose();
    throw error;
  }
}
