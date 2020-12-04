import GLResource from "./gl-utils/gl-resource";
import Shader from "./gl-utils/shader";
import FBO from "./gl-utils/fbo";
import * as ObstacleMapShaders from "./shaders/obstacle-map-shaders";

class ObstacleMap extends GLResource {
  private _width: number;
  private _height: number;

  private _fbo: FBO;
  private _texture: WebGLTexture;
  private _initTexture: WebGLTexture;

  private _drawShader: Shader;
  private _addShader: Shader;

  private _hasPrinted: number;
  private _texelData: Uint8Array;

  constructor(gl: WebGLRenderingContext, width: number, height: number) {
    super(gl);

    this._width = width;
    this._height = height;

    this._fbo = new FBO(gl, width, height);

    this._drawShader = ObstacleMapShaders.buildDrawShader(gl);
    this._addShader = ObstacleMapShaders.buildAddShader(gl);

    this.initObstaclesMap();
    this._hasPrinted = 0;
  }

  public freeGLResources(): void {
    const gl = super.gl();

    this._fbo.freeGLResources();
    this._fbo = null;

    gl.deleteTexture(this._texture);
    gl.deleteTexture(this._initTexture);

    this._drawShader.freeGLResources();
    this._addShader.freeGLResources();
    this._drawShader = null;
    this._addShader = null;
  }

  public get texture(): WebGLTexture {
    return this._texture;
  }

  public draw(
    dt: number,
    nBlades: number,
    bladeRadius: number,
    centerOffset: number
  ): void {
    const gl = super.gl();
    const drawShader = this._drawShader;
    const addShader = this._addShader;

    // Draw the blades
    drawShader.u["uObstacles"].value = this._texture;
    drawShader.use();
    drawShader.bindUniformsAndAttributes();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.cleanPreviousFrame();
    // Rotate the blades
    for (let i = 0; i < nBlades; i++) {
      // We add 0.5 to center the turbine
      let angleOffset = (i / nBlades) * 2 * 3.14159;
      // r * cos theta + 0.5  == r * cos (2 PI * i/nBlades) + 0.5
      let posX = (bladeRadius + centerOffset) * Math.cos(angleOffset) + 0.5;
      // r * sin theta + 0.5 == r * sin (2 PI * i/nBlades) + 0.5
      let posY = (bladeRadius + centerOffset) * Math.sin(angleOffset) + 0.5;
      addShader.u["uSize"].value = [bladeRadius, bladeRadius];
      addShader.u["uPos"].value = [posX, posY];
      addShader.u["rot"].value += 0.08 * dt;
      addShader.u["offset"].value = (nBlades - 1) * angleOffset;
      this._fbo.bind([this._texture]);
      addShader.use();
      addShader.bindUniformsAndAttributes();
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    // if (this._hasPrinted < 15) {
    //   console.log(addShader.u["rot"].value);
    //   this._hasPrinted++;
    // }
  }

  public addObstacle(
    size: Float32Array | number[],
    pos: Float32Array | number[]
  ): void {
    const gl = super.gl();
    const addShader = this._addShader;
    addShader.u["uSize"].value = size;
    addShader.u["uPos"].value = pos;

    this._fbo.bind([this._texture]);
    addShader.use();
    addShader.bindUniformsAndAttributes();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  private cleanPreviousFrame(): void {
    const gl = super.gl();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this._width,
      this._height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this._texelData
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  private initObstaclesMap(): void {
    const gl = super.gl();
    const width = this._width;
    const height = this._height;

    let texels: number[] = [];
    for (let iY = 0; iY < height; ++iY) {
      for (let iX = 0; iX < width; ++iX) {
        if (iY === 0) {
          texels.push.apply(texels, [127, 255, 0, 255]);
        } else if (iY === height - 1) {
          texels.push.apply(texels, [127, 0, 0, 255]);
        } else if (iX === 0) {
          texels.push.apply(texels, [255, 127, 0, 255]);
        } else if (iX === width - 1) {
          texels.push.apply(texels, [0, 127, 0, 255]);
        } else {
          texels.push.apply(texels, [127, 127, 0, 255]);
        }
      }
    }
    const data = new Uint8Array(texels);
    this._texelData = data;

    const textures: WebGLTexture[] = [];
    for (let i = 0; i < 2; ++i) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      textures.push(tex);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    this._texture = textures[0];
    this._initTexture = textures[1];
  }
}

export default ObstacleMap;
