import {
  Component,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';

@Component({
  selector: 'app-shader-animation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class ShaderAnimationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private animationId: number | null = null;
  private timeUniform: WebGLUniformLocation | null = null;
  private resolutionUniform: WebGLUniformLocation | null = null;
  private time = 1.0;
  private resizeObserver: ResizeObserver | null = null;

  // ── Vertex shader: full-screen quad passthrough ──────────────────────────
  private readonly VS = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  // ── Fragment shader: ported 1:1 from the 21st.dev shadertoy example ──────
  private readonly FS = `
    precision highp float;
    uniform vec2  resolution;
    uniform float time;

    float random(in float x) {
      return fract(sin(x) * 1e4);
    }

    void main(void) {
      vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

      // pixelate / mosaic effect
      vec2 fMosaicScal = vec2(4.0, 2.0);
      vec2 vScreenSize = vec2(256.0, 256.0);
      uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
      uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

      float t         = time * 0.06 + random(uv.x) * 0.4;
      float lineWidth = 0.0008;

      vec3 color = vec3(0.0);
      for (int j = 0; j < 3; j++) {
        for (int i = 0; i < 5; i++) {
          color[j] += lineWidth * float(i * i)
            / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 1.0 - length(uv));
        }
      }

      gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
    }
  `;

  ngAfterViewInit(): void {
    this.initWebGL();
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    if (this.gl && this.program) this.gl.deleteProgram(this.program);
  }

  // ── WebGL bootstrap ───────────────────────────────────────────────────────
  private initWebGL(): void {
    const canvas = this.canvasRef.nativeElement;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    this.gl = gl;

    const vs = this.compile(gl, this.VS, gl.VERTEX_SHADER);
    const fs = this.compile(gl, this.FS, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Shader link error:', gl.getProgramInfoLog(prog));
      return;
    }
    this.program = prog;
    gl.useProgram(prog);

    // Full-screen triangle strip quad: (-1,-1) (1,-1) (-1,1) (1,1)
    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf  = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    this.timeUniform       = gl.getUniformLocation(prog, 'time');
    this.resolutionUniform = gl.getUniformLocation(prog, 'resolution');

    // Watch container resize
    const container = canvas.parentElement ?? canvas;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    // Render loop
    const tick = () => {
      this.time += 0.012;
      gl.uniform1f(this.timeUniform, this.time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.animationId = requestAnimationFrame(tick);
    };
    tick();
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement;
    if (!parent || !this.gl) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = parent.offsetWidth  * dpr;
    canvas.height = parent.offsetHeight * dpr;
    this.gl.viewport(0, 0, canvas.width, canvas.height);
    if (this.resolutionUniform) {
      this.gl.uniform2f(this.resolutionUniform, canvas.width, canvas.height);
    }
  }

  private compile(
    gl: WebGLRenderingContext,
    src: string,
    type: number
  ): WebGLShader | null {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}
