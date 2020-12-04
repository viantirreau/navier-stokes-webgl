import Fluid from "./fluid";
import * as Requirements from "./requirements";

import "./page-interface-generated";

class Mouse {
    private _posInPx: number[];
    private _pos: number[];

    private _movementInPx: number[];
    private _movement: number[];

    private _pivotInPx: number[];

    constructor() {
        this._posInPx = [0, 0];
        this._pivotInPx = [0, 0];
        this.setPosInPx([0, 0]);
        this.setMovementInPx([0, 0]);

        Page.Canvas.Observers.mouseMove.push((relX: number, relY: number) => {
            const canvasSize = Page.Canvas.getSize();
            this.setPosInPx([canvasSize[0] * relX, canvasSize[1] * (1 - relY)]);
        });

        Page.Canvas.Observers.mouseDown.push(() => {
            this.setMovementInPx([0, 0]);
            this._pivotInPx = this._posInPx;
        });
    }

    public get posInPx(): number[] {
        return this._posInPx;
    }

    public get pos(): number[] {
        return this._pos;
    }

    public get movementInPx(): number[] {
        return this._movementInPx;
    }

    public get movement(): number[] {
        return this._movement;
    }

    private setPosInPx(pos: number[]): void {
        const toPivot: number[] = [
            this._pivotInPx[0] - pos[0],
            this._pivotInPx[1] - pos[1]
        ];
        const distToPivot = Math.sqrt(toPivot[0] * toPivot[0] + toPivot[1] * toPivot[1]);
        const maxDist = 16;

        if (distToPivot > maxDist) {
            toPivot[0] *= maxDist / distToPivot;
            toPivot[1] *= maxDist / distToPivot;

            this._pivotInPx[0] = pos[0] + toPivot[0];
            this._pivotInPx[1] = pos[1] + toPivot[1];
        }
        const movementInPx = [-toPivot[0] / maxDist, -toPivot[1] / maxDist];
        this.setMovementInPx(movementInPx);
        this._posInPx = pos;
        this._pos = this.setRelative(pos);
    }

    private setMovementInPx(movement: number[]): void {
        this._movementInPx = movement;
        this._movement = this.setRelative(movement);
    }

    private setRelative(pos: number[]): number[] {
        const canvasSize = Page.Canvas.getSize();
        return [
            pos[0] / canvasSize[0],
            pos[1] / canvasSize[1],
        ];
    }
}

let mouse: Mouse = new Mouse();

function bindMouse(): void {
    mouse = new Mouse();
}

interface BrushInfo {
    radius: number,
    strength: number,
}
const brushInfo: BrushInfo = {
    radius: 10,
    strength: 100,
}

interface FluidInfo {
    stream: boolean;
}
const fluidInfo: FluidInfo = {
    stream: true,
}

interface DisplayInfo {
    velocity: boolean,
    pressure: boolean,
    brush: boolean,
    obstacles: boolean,
}
const displayInfo: DisplayInfo = {
    velocity: true,
    pressure: true,
    brush: true,
    obstacles: true,
}

interface BladeInfo {
    radius: number,
    centerOffset: number,
    bladeCount: number,
}

const bladeInfo: BladeInfo = {
    radius: 0.15,
    centerOffset: 0.1,
    bladeCount: 4
}

function bindControls(fluid: Fluid): void {
    {
        const RESOLUTIONS_CONTROL_ID = "resolution";
        const updateResolution = (values: string[]) => {
            const size: number = +values[0];
            fluid.reset(size, size);
        };
        Page.Tabs.addObserver(RESOLUTIONS_CONTROL_ID, updateResolution);
        updateResolution(Page.Tabs.getValues(RESOLUTIONS_CONTROL_ID));
    }
    {
        const FLOAT_CONTROL_ID = "float-texture-checkbox-id";
        if (!Requirements.allExtensionsLoaded) {
            Page.Controls.setVisibility(FLOAT_CONTROL_ID, false);
            Page.Checkbox.setChecked(FLOAT_CONTROL_ID, false);
        }
        const updateFloat = (use: boolean) => { fluid.useFloatTextures = use; };
        Page.Checkbox.addObserver(FLOAT_CONTROL_ID, updateFloat);
        updateFloat(Page.Checkbox.isChecked(FLOAT_CONTROL_ID));
    }
    {
        const ITERATIONS_CONTROL_ID = "solver-steps-range-id";
        const updateIterations = (iterations: number) => { fluid.minNbIterations = iterations; };
        Page.Range.addObserver(ITERATIONS_CONTROL_ID, updateIterations);
        updateIterations(Page.Range.getValue(ITERATIONS_CONTROL_ID));
    }
    {
        const TIMESTEP_CONTROL_ID = "timestep-range-id";
        const updateTimestep = (timestep: number) => { fluid.timestep = timestep; };
        Page.Range.addObserver(TIMESTEP_CONTROL_ID, updateTimestep);
        updateTimestep(Page.Range.getValue(TIMESTEP_CONTROL_ID));
    }
    {
        const STREAM_CONTROL_ID = "stream-checkbox-id";
        const updateStream = (doStream: boolean) => { fluidInfo.stream = doStream; };
        Page.Checkbox.addObserver(STREAM_CONTROL_ID, updateStream);
        updateStream(Page.Checkbox.isChecked(STREAM_CONTROL_ID));
    }
    {
        const BRUSH_RADIUS_CONTROL_ID = "brush-radius-range-id";
        const updateBrushRadius = (radius: number) => { brushInfo.radius = radius; };
        Page.Range.addObserver(BRUSH_RADIUS_CONTROL_ID, updateBrushRadius);
        updateBrushRadius(Page.Range.getValue(BRUSH_RADIUS_CONTROL_ID));

        Page.Canvas.Observers.mouseWheel.push((delta: number) => {
            Page.Range.setValue(BRUSH_RADIUS_CONTROL_ID, brushInfo.radius + 5 * delta);
            updateBrushRadius(Page.Range.getValue(BRUSH_RADIUS_CONTROL_ID));
        });
    }
    {
        const BRUSH_STRENGTH_CONTROL_ID = "brush-strength-range-id";
        const updateBrushStrength = (strength: number) => { brushInfo.strength = strength; };
        Page.Range.addObserver(BRUSH_STRENGTH_CONTROL_ID, updateBrushStrength);
        updateBrushStrength(Page.Range.getValue(BRUSH_STRENGTH_CONTROL_ID));
    }

    {
        const DISPLAY_MODE_CONTROL_ID = "displayed-fields";
        const updateDisplayMode = (modes: string[]) => {
            displayInfo.velocity = modes[0] === "velocity" || modes[1] === "velocity";
            displayInfo.pressure = modes[0] === "pressure" || modes[1] === "pressure";
        };
        Page.Tabs.addObserver(DISPLAY_MODE_CONTROL_ID, updateDisplayMode);
        updateDisplayMode(Page.Tabs.getValues(DISPLAY_MODE_CONTROL_ID));
    }
    {
        const COLOR_INTENSITY_CONTROL_ID = "intensity-range-id";
        const updateColorIntensity = (intensity: number) => { fluid.colorIntensity = intensity; };
        Page.Range.addObserver(COLOR_INTENSITY_CONTROL_ID, updateColorIntensity);
        updateColorIntensity(Page.Range.getValue(COLOR_INTENSITY_CONTROL_ID));
    }
    {
        const DISPLAY_COLOR_CONTROL_ID = "display-color-checkbox-id";
        const updateColor = (display: boolean) => { fluid.color = display; };
        Page.Checkbox.addObserver(DISPLAY_COLOR_CONTROL_ID, updateColor);
        updateColor(Page.Checkbox.isChecked(DISPLAY_COLOR_CONTROL_ID));
    }
    {
        const DISPLAY_OBSTACLES_CONTROL_ID = "display-obstacles-checkbox-id";
        const updateDisplayObstacles = (display: boolean) => { displayInfo.obstacles = display; };
        Page.Checkbox.addObserver(DISPLAY_OBSTACLES_CONTROL_ID, updateDisplayObstacles);
        updateDisplayObstacles(Page.Checkbox.isChecked(DISPLAY_OBSTACLES_CONTROL_ID));
    }
    {
        const BLADE_RADIUS = "blade-radius";
        const updateBladeRadius = (r: number) => { bladeInfo.radius = r; };
        Page.Range.addObserver(BLADE_RADIUS, updateBladeRadius);
        updateBladeRadius(Page.Range.getValue(BLADE_RADIUS));
    }
    {
        const CENTER_OFFSET = "center-offset";
        const updateCenterOffset = (c: number) => { bladeInfo.centerOffset = c; };
        Page.Range.addObserver(CENTER_OFFSET, updateCenterOffset);
        updateCenterOffset(Page.Range.getValue(CENTER_OFFSET));
    }
    {
        const BLADE_COUNT = "blade-count";
        const updateBladeCount = (c: number) => { bladeInfo.bladeCount = c; };
        Page.Range.addObserver(BLADE_COUNT, updateBladeCount);
        updateBladeCount(Page.Range.getValue(BLADE_COUNT));
    }
}

function bind(fluid: Fluid): void {
    bindControls(fluid);
    bindMouse();
}

export {
    mouse,
    bind,
    brushInfo as brush,
    displayInfo as display,
    fluidInfo as fluid,
    bladeInfo
};