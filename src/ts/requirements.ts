import "./page-interface-generated";

function check(gl: WebGLRenderingContext): boolean {
  // const vertexUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  // const fragmentUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  // if (vertexUnits < 2 || fragmentUnits < 3) {
  // alert("Your device does not meet the requirements for this simulation.");
  // return false;
  // }

  const mediump = gl.getShaderPrecisionFormat(
    gl.FRAGMENT_SHADER,
    gl.MEDIUM_FLOAT
  );
  if (mediump.precision < 23) {
    Page.Demopage.setErrorMessage(
      "webgl-requirements",
      "Tu dispositivo solo soporta texturas de baja precisión.\n" +
        "La simulación no se puede ejecutar 😢."
    );
    return false;
  }

  return true;
}

let allExtensionsLoaded: boolean = false;

function loadExtensions(gl: WebGLRenderingContext, extensions: string[]) {
  allExtensionsLoaded = true;

  let i = 0;
  for (let ext of extensions) {
    if (!gl.getExtension(ext)) {
      Page.Demopage.setErrorMessage(
        "no-ext" + i,
        "¡Oh! No pudimos cargar la extensión WebGL '" + ext + "'."
      );
      allExtensionsLoaded = false;
    }
    ++i;
  }
}

export { check, loadExtensions, allExtensionsLoaded };
