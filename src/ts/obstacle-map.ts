import GLResource from "./gl-utils/gl-resource";
import Shader from "./gl-utils/shader";
import FBO from "./gl-utils/fbo";
import * as ObstacleMapShaders from "./shaders/obstacle-map-shaders";
// import { start } from "repl";

const MAX_ANGULAR_VELOCITY = 1;

interface BladeInfo {
  x: number;
  y: number;
  radius: number;
  faceOffset: number;
  turbineCenterToBladeCenter: number;
}

class ObstacleMap extends GLResource {
  private _width: number;
  private _height: number;

  private _fbo: FBO;
  private _texture: WebGLTexture;
  private _initTexture: WebGLTexture;

  private _drawShader: Shader;
  private _addShader: Shader;

  private _texelData: Uint8Array;
  private _angularVelocity: number;
  private _angularPosition: number;
  private _currentBladeCount: number;
  private _currentBladesInfo: BladeInfo[];

  constructor(gl: WebGLRenderingContext, width: number, height: number) {
    super(gl);

    this._width = width;
    this._height = height;

    this._fbo = new FBO(gl, width, height);

    this._drawShader = ObstacleMapShaders.buildDrawShader(gl);
    this._addShader = ObstacleMapShaders.buildAddShader(gl);

    this.initObstaclesMap();
    this._angularVelocity = 0;
    this._currentBladeCount = 0;
    this._currentBladesInfo = [];
    this._angularPosition = 0;
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

  public draw(): void {
    const gl = super.gl();
    const drawShader = this._drawShader;

    drawShader.u["uObstacles"].value = this._texture;
    drawShader.use();
    drawShader.bindUniformsAndAttributes();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public update(
    dt: number,
    nBlades: number,
    bladeRadius: number,
    centerOffset: number
  ): void {
    // We flush the texture and redraw the obstacle map in the GPU
    this.cleanPreviousFrame();
    const gl = super.gl();
    const addShader = this._addShader;

    // Update the bladesInfo array
    if (this._currentBladesInfo.length != nBlades) {
      this._currentBladesInfo = Array(nBlades);
      this._currentBladeCount = nBlades;
    }

    // Place the blades as obstacles for the fluid shaders
    for (let i = 0; i < nBlades; i++) {
      // The angle between blades is 2 PI / nBlades
      // The offset for this particular blade is `i` times
      // that inter-blade angle. We subtract the angularPosition
      // in order to rotate clockwise with positive positions.
      let angleOffset = (i / nBlades) * 2 * 3.14159 - this._angularPosition;
      // We add 0.5 to center the turbine in the screen. This
      // (relative) coordinate system spans from 0 to 1.
      // r * cos theta + 0.5  == r * cos(2 PI * i/nBlades) + 0.5
      let posX = (bladeRadius + centerOffset) * Math.cos(angleOffset) + 0.5;
      // r * sin theta + 0.5 == r * sin(2 PI * i/nBlades) + 0.5
      let posY = (bladeRadius + centerOffset) * Math.sin(angleOffset) + 0.5;
      // The blade radius
      addShader.u["uSize"].value = [bladeRadius, bladeRadius];
      // The circle center position
      addShader.u["uPos"].value = [posX, posY];
      // The specific offset for this blade
      // This is to ensure that all of the concave sides
      // face the same direction.
      let faceOffset = -angleOffset;
      addShader.u["uFaceOffset"].value = faceOffset;
      this._currentBladesInfo[i] = {
        x: posX,
        y: posY,
        radius: bladeRadius,
        faceOffset,
        turbineCenterToBladeCenter: bladeRadius + centerOffset,
      };

      this._fbo.bind([this._texture]);
      addShader.use();
      addShader.bindUniformsAndAttributes();
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    // theta_1 = theta_0 + omega * dt (mod 2 PI)
    this._angularPosition += (this._angularVelocity * dt) % 6.283185307;
  }

  /**
   * Returns the power generated by the turbine
   * @param pressureSample The Uint8 texture-array returned by fluid.samplePressure()
   * @param shaderWidth The fluid shader width (horizontal resolution)
   * @param shaderHeight The fluid shader height (vertical resolution)
   */
  public computeTurbineTorque(
    pressureSample: Uint8Array,
    shaderWidth: number,
    shaderHeight: number
  ): number {
    // CONVENTION. We assume that a POSITIVE torque rotates the turbine CLOCKWISE
    let totalTorque = 0;
    const samplePoints = 50;
    // We divide the half circumference (Pi rads) into `samplePoints` intervals
    const dTheta = 3.14159265 / samplePoints;
    for (const blade of this._currentBladesInfo) {
      const startAngle = 3.14159265 - blade.faceOffset;
      const stopAngle = 6.283185307 - blade.faceOffset;
      let { x, y, radius, turbineCenterToBladeCenter: tcbc } = blade;
      // Sample the pressure along the inner (0.8 r) and outer face (1.0 r)
      // We allow for a tolerance, just in case the boundary conditions
      // are not precise enough.
      let innerRadius = 0.79 * radius;
      let outerRadius = 1.01 * radius;
      // Sample the pressure `samplePoints` times
      for (let angle = startAngle; angle < stopAngle; angle += dTheta) {
        let sin = Math.sin(angle);
        let cos = Math.cos(angle);
        // Convert the relative positions [0,1]x[0,1] => [0,width]x[0,height]
        let innerXPixel = Math.floor(shaderWidth * (x + innerRadius * cos));
        let innerYPixel = Math.floor(shaderHeight * (y + innerRadius * sin));
        let outerXPixel = Math.floor(shaderWidth * (x + outerRadius * cos));
        let outerYPixel = Math.floor(shaderHeight * (y + outerRadius * sin));
        // A full "row" has `shaderWidth` pixels. Each pixel is actually
        // four numbers, which we need to parse
        let innerArrayIndex = 4 * (shaderWidth * innerYPixel + innerXPixel);
        let outerArrayIndex = 4 * (shaderWidth * outerYPixel + outerXPixel);
        // Compute the inner and outer pressure for this angle
        let innerPressure = this.parsePressure(
          pressureSample.slice(innerArrayIndex, innerArrayIndex + 4)
        );
        let outerPressure = this.parsePressure(
          pressureSample.slice(outerArrayIndex, outerArrayIndex + 4)
        );
        // Compute the lever arm as the distance between the turbine center
        // and the blade center, times the sine of the angle relative to
        // the tip of the blade. For example, the force exerted on the
        // tip of the blade is only axial (the lever arm is zero, as the
        // angle is zero or PI), so the torque is zero. In contrast,
        // the torque is maximal when the angle is PI/2, i.e. the force
        // is applied perpendicular to the line that connects
        // the turbine and blade centers.
        let leverArm = Math.sin(angle - startAngle) * tcbc;
        totalTorque +=
          (innerPressure * innerRadius - outerPressure * outerRadius) *
          leverArm *
          dTheta;
      }
      // Sample the pressure at the center of the blade tip (r = 0.9)
      let tipCenter = 0.9 * radius;
      // Find the coordinates for each tip center
      let nearEdgeX = Math.floor(
        shaderWidth * (x + tipCenter * Math.cos(startAngle))
      );
      let nearEdgeY = Math.floor(
        shaderHeight * (y + tipCenter * Math.sin(startAngle))
      );
      let farEdgeX = Math.floor(
        shaderWidth * (x + tipCenter * Math.cos(stopAngle))
      );
      let farEdgeY = Math.floor(
        shaderHeight * (y + tipCenter * Math.sin(stopAngle))
      );
      // Find the index in the pressure array
      let nearEdgeArrayIndex = 4 * (shaderWidth * nearEdgeY + nearEdgeX);
      let farEdgeArrayIndex = 4 * (shaderWidth * farEdgeY + farEdgeX);
      // Interpret pressure as float
      let nearEdgePressure = this.parsePressure(
        pressureSample.slice(nearEdgeArrayIndex, nearEdgeArrayIndex + 4)
      );
      let farEdgePressure = this.parsePressure(
        pressureSample.slice(farEdgeArrayIndex, farEdgeArrayIndex + 4)
      );
      // Both pressures contribute to a positive torque, but they differ in the lever arm
      let nearLever = tcbc - tipCenter;
      let farLever = tcbc + tipCenter;
      // P * A * r = F * r  = T (the force is perpendicular to the lever arm)
      let nearTorque = nearEdgePressure * nearLever;
      let farTorque = farEdgePressure * farLever;
      totalTorque += (nearTorque + farTorque) * (0.2 * radius);
    }
    // We assume the mass is one
    this._angularVelocity =
      0.995 *
      Math.max(
        Math.min(
          this._angularVelocity + 0.05 * totalTorque,
          MAX_ANGULAR_VELOCITY
        ),
        -MAX_ANGULAR_VELOCITY
      );
    return Math.abs(this._angularVelocity * totalTorque) * 1e3;
  }

  public addObstacle(
    size: Float32Array | number[],
    pos: Float32Array | number[]
  ): void {
    // Legacy function. Used for static obstacles
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

  private parsePressure(channels: Uint8Array): number {
    /**
     * RGBA has four channels between 0 and 255. We use
     * bitwise logic to build a number based on the four
     * given values. Also, we subtract the "ambient pressure"
     * to use relative pressure. This is represented as
     * RGBA [128, 0, 128, 0], which turns out to be 2147516416
     * in the integer representation.
     * The >>> 0 at the end is to interpret the number as
     * unsigned int (32 bits).
     * We also rescale the pressure value by 1/1,000,000 to
     * keep it in a reasonable range. Remember that the
     * "mass" of the turbine will determine the sensibility
     * of the torque to the changing pressure.
     */
    return (
      ((((channels[0] << 24) |
        (channels[1] << 16) |
        (channels[2] << 8) |
        channels[3]) >>>
        0) -
        2147516416) *
      1e-6
    );
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
