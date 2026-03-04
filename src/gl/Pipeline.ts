import type { EffectNode } from '../effects/EffectNode.ts';
import { ShaderProgram } from './ShaderProgram.ts';
import { PingPongBuffers } from './Framebuffer.ts';
import { drawFullscreenTriangle } from './fullscreen-quad.ts';
import passthroughVert from '../shaders/passthrough.vert';
import passthroughFrag from '../shaders/passthrough.frag';

export class Pipeline {
  private gl: WebGL2RenderingContext;
  private pingPong: PingPongBuffers;
  private passthrough: ShaderProgram;
  private shaderCache = new Map<string, ShaderProgram>();
  private startTime = performance.now() / 1000;
  private needsAnimation = false;
  private rafId = 0;
  private sourceTexture: WebGLTexture | null = null;
  private nodes: EffectNode[] = [];
  private width = 0;
  private height = 0;
  private renderCallback: (() => void) | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.pingPong = new PingPongBuffers(gl);
    this.passthrough = new ShaderProgram(gl, passthroughVert, passthroughFrag);
  }

  setSource(texture: WebGLTexture, width: number, height: number) {
    this.sourceTexture = texture;
    this.width = width;
    this.height = height;
    this.pingPong.resize(width, height);
    this.render();
  }

  setNodes(nodes: EffectNode[]) {
    this.nodes = nodes;
    // Compile shaders for any new definitions
    for (const node of nodes) {
      if (!this.shaderCache.has(node.definition.id)) {
        const program = new ShaderProgram(
          this.gl, passthroughVert, node.definition.fragSource,
        );
        this.shaderCache.set(node.definition.id, program);
      }
    }
    this.render();
  }

  render() {
    const gl = this.gl;
    if (!this.sourceTexture) return;

    const activeNodes = this.nodes.filter(n => n.isOn);
    this.needsAnimation = false;

    // Check if any effect needs animation (u_time dependent, e.g., noise with speed > 0)
    for (const node of activeNodes) {
      if (node.definition.id === 'noise' && (node.values['u_speed'] as number) > 0) {
        this.needsAnimation = true;
      }
    }

    let inputTexture = this.sourceTexture;
    const time = performance.now() / 1000 - this.startTime;

    if (activeNodes.length === 0) {
      // No effects — just passthrough
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this.passthrough.use();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);
      this.passthrough.set1i('u_input', 0);
      drawFullscreenTriangle(gl);

      this.scheduleAnimation();
      return;
    }

    // Process each active node through ping-pong FBOs
    let totalPasses = 0;
    for (const node of activeNodes) {
      const passes = node.getPasses();
      const shader = this.shaderCache.get(node.definition.id)!;

      for (const pass of passes) {
        const isLastPass =
          node === activeNodes[activeNodes.length - 1] &&
          pass === passes[passes.length - 1];

        if (isLastPass) {
          // Render final pass directly to screen
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        } else {
          this.pingPong.bindForWriting();
        }

        shader.use();

        // Bind input texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        shader.set1i('u_input', 0);

        // Standard uniforms
        shader.set2f('u_resolution', this.width, this.height);
        shader.set1f('u_time', time);
        shader.set1f('u_aspect', this.width / this.height);

        // Effect-specific uniforms from node values
        for (const [key, value] of Object.entries(node.values)) {
          if (typeof value === 'number') {
            shader.set1f(key, value);
          } else if (typeof value === 'boolean') {
            shader.set1i(key, value ? 1 : 0);
          }
        }

        // Pass-specific uniform overrides
        if (pass.uniforms) {
          for (const [key, value] of Object.entries(pass.uniforms)) {
            if (Array.isArray(value)) {
              if (value.length === 2) shader.set2f(key, value[0]!, value[1]!);
              else if (value.length === 3) shader.set3f(key, value[0]!, value[1]!, value[2]!);
            } else {
              shader.set1f(key, value);
            }
          }
        }

        drawFullscreenTriangle(gl);

        if (!isLastPass) {
          inputTexture = this.pingPong.writeTexture;
          this.pingPong.swap();
        }

        totalPasses++;
      }
    }

    this.scheduleAnimation();
  }

  /** Request render on next frame (for parameter changes) */
  requestRender() {
    this.render();
  }

  private scheduleAnimation() {
    cancelAnimationFrame(this.rafId);
    if (this.needsAnimation) {
      this.rafId = requestAnimationFrame(() => this.render());
    }
  }

  /** Get the last written FBO texture for export */
  renderToFBO(): WebGLTexture | null {
    if (!this.sourceTexture) return null;
    const gl = this.gl;
    const activeNodes = this.nodes.filter(n => n.isOn);

    let inputTexture = this.sourceTexture;
    const time = performance.now() / 1000 - this.startTime;

    if (activeNodes.length === 0) {
      return this.sourceTexture;
    }

    for (const node of activeNodes) {
      const passes = node.getPasses();
      const shader = this.shaderCache.get(node.definition.id)!;

      for (const pass of passes) {
        this.pingPong.bindForWriting();
        shader.use();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        shader.set1i('u_input', 0);
        shader.set2f('u_resolution', this.width, this.height);
        shader.set1f('u_time', time);
        shader.set1f('u_aspect', this.width / this.height);

        for (const [key, value] of Object.entries(node.values)) {
          if (typeof value === 'number') shader.set1f(key, value);
          else if (typeof value === 'boolean') shader.set1i(key, value ? 1 : 0);
        }

        if (pass.uniforms) {
          for (const [key, value] of Object.entries(pass.uniforms)) {
            if (Array.isArray(value)) {
              if (value.length === 2) shader.set2f(key, value[0]!, value[1]!);
              else if (value.length === 3) shader.set3f(key, value[0]!, value[1]!, value[2]!);
            } else {
              shader.set1f(key, value);
            }
          }
        }

        drawFullscreenTriangle(gl);
        inputTexture = this.pingPong.writeTexture;
        this.pingPong.swap();
      }
    }

    return this.pingPong.lastWrittenTexture;
  }

  getImageDimensions() {
    return { width: this.width, height: this.height };
  }
}
