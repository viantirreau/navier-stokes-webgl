import * as fs from "fs";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
  title: "Navier-Stokes",
  description: "Stable fluid simulation running on GPU",
  introduction: [
    "This project is a WebGL incompressible fluid simulation running entirely on your GPU. You can interact with the fluid with the left mouse button and visualize both the velocity and the pressure of the fluid.",
    "This is an implementation of the Stable Fluid described by J. Stam.",
  ],
  githubProjectName: "navier-stokes-webgl",
  additionalLinks: [],
  scriptFiles: ["script/main.js"],
  indicators: [
    {
      id: "fps",
      label: "FPS",
    },
  ],
  canvas: {
    width: 512,
    height: 512,
    enableFullscreen: false,
  },
  controlsSections: [
    {
      title: "Simulación",
      controls: [
        {
          type: Demopage.supportedControls.Tabs,
          title: "Resolución",
          id: "resolution",
          unique: true,
          options: [
            {
              value: "256",
              label: "256",
              checked: true,
            },
            {
              value: "512",
              label: "512",
            },
            {
              value: "1024",
              label: "1024",
            },
          ],
        },
        {
          type: Demopage.supportedControls.Checkbox,
          title: "Alta calidad",
          id: "float-texture-checkbox-id",
          checked: true,
        },
        {
          type: Demopage.supportedControls.Range,
          title: "Iteraciones",
          id: "solver-steps-range-id",
          min: 1,
          max: 99,
          value: 5,
          step: 2,
        },
        {
          type: Demopage.supportedControls.Range,
          title: "Delta tiempo",
          id: "timestep-range-id",
          min: 0.01,
          max: 0.05,
          value: 0.015,
          step: 0.0005,
        },
        {
          type: Demopage.supportedControls.Checkbox,
          title: "Habilitar flujo",
          id: "stream-checkbox-id",
          checked: true,
        },
      ],
    },
    {
      title: "Pincel",
      controls: [
        {
          type: Demopage.supportedControls.Range,
          title: "Radio",
          id: "brush-radius-range-id",
          min: 20,
          max: 100,
          value: 40,
          step: 1,
        },
        {
          type: Demopage.supportedControls.Range,
          title: "Fuerza",
          id: "brush-strength-range-id",
          min: 20,
          max: 200,
          value: 100,
          step: 1,
        },
      ],
    },
    {
      title: "Visualizar",
      controls: [
        {
          type: Demopage.supportedControls.Tabs,
          title: "Campos",
          id: "displayed-fields",
          unique: true,
          options: [
            {
              value: "velocity",
              label: "Velocidad",
              checked: true,
            },
            {
              value: "pressure",
              label: "Presión",
            },
          ],
        },
        {
          type: Demopage.supportedControls.Range,
          title: "Intensidad",
          id: "intensity-range-id",
          min: 0.1,
          max: 10,
          value: 1.6,
          step: 0.1,
        },
        {
          type: Demopage.supportedControls.Checkbox,
          title: "Color",
          id: "display-color-checkbox-id",
          checked: true,
        },
        {
          type: Demopage.supportedControls.Checkbox,
          title: "Obstáculos",
          id: "display-obstacles-checkbox-id",
          checked: true,
        },
      ],
    },
    {
      title: "Turbina",
      controls: [
        {
          type: Demopage.supportedControls.Range,
          title: "Radio álabes",
          id: "blade-radius",
          min: 0,
          max: 0.2,
          value: 0.15,
          step: 0.001,
        },
        {
          type: Demopage.supportedControls.Range,
          title: "Espacio central",
          id: "center-offset",
          min: -0.2,
          max: 0.05,
          value: 0.1,
          step: 0.001,
        },
        {
          type: Demopage.supportedControls.Range,
          title: "N° álabes",
          id: "blade-count",
          min: 2,
          max: 7,
          value: 4,
          step: 1,
        },
      ],
    },
  ],
};

const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
  debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration =
  "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.resolve(
  __dirname,
  ".",
  "ts",
  "page-interface-generated.ts"
);
fs.writeFileSync(
  SCRIPT_DECLARATION_FILEPATH,
  buildResult.pageScriptDeclaration
);
