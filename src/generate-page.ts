import * as fs from "fs";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
  title: "Turbina Savonius en WebGL",
  description: "Simulación de una turbina Savonius en GPU",
  introduction: [
    "Este proyecto es una simulación de un fluido incompresible en WebGL que se ejecuta completamente en tu GPU. Puedes interactuar con el fluido y editar los parámetros de la turbina, además de visualizar el campo de presión o velocidad.",
    "Es una implementación del paper Stable Fluids, descrito por J. Stam en 1999. Gran parte del código base se inspira en el proyecto <b>navier-stokes-webgl</b> de Jérémie Piellard (@piellardj).",
  ],
  githubProjectName: "navier-stokes-webgl",
  additionalLinks: [
    {
      href: "https://github.com/piellardj/navier-stokes-webgl",
      text: "Proyecto original @piellardj",
    },
  ],
  scriptFiles: ["script/main.js"],
  indicators: [
    {
      id: "fps",
      label: "FPS",
    },
    {
      id: "power",
      label: "P",
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
        {
          type: Demopage.supportedControls.Range,
          title: "Alto del flujo",
          id: "source-height-id",
          min: 0.1,
          max: 0.7,
          value: 0.4,
          step: 0.0005,
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
