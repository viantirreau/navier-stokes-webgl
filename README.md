# Savonius turbine simulation in WebGL
This is a fluid mechanics course project, co-authored
by:
- Raúl Álvarez
- Ignacio Peñafiel
- Víctor Tirreau
- Felipe Valenzuela

It consists of a **Stable Fluid** simulation of a Savonius
rotor or turbine that runs on the GPU using 
WebGL.
It's heavily based on Jérémie Piellard's ([@piellardj](https://github.com/piellardj))
[navier-stokes-webgl](https://piellardj.github.io/navier-stokes-webgl). 
Thank you Jérémie for your support and directions.

You can find the live demonstration  [here](https://navierstokes.netlify.app).



# Simulation

This is an implementation of the Stable Fluid described by 
Jos Stam.
The simulation is implemented on GPU with the method 
provided in [GPU Gems](https://developer.download.nvidia.com/books/HTML/gpugems/gpugems_ch38.html).

# Data storage

This simulation can run in two modes for storing the 
velocities:
* velocity stored in float textures: each component (x, y) 
  is stored as a 32bit float.
To do so the following extensions must be available: 
`OES_texture_float`, `WEBGL_color_buffer_float`, 
`OES_texture_float_linear`.
* velocity stored in normal textures with four 8bit 
  channels.
In this mode, each component is stored as a 16bit fixed 
point value, encoded in two 8bit texture channels.
This mode provides less precision for the computing, and 
you can see artifacts if you push the display color 
intensity to the maximum.

# Building the app

Make sure to install all the dependencies with `npm i`, and then 
run `npm run build` for the first time from the project directory.

You can also rebuild the generated `docs` folder with `npm run rebuild`, 
which is usual in the development cycle. If you only
edit the simulation code (and don't change the page layout),
it's faster to just run `npm run webpack`.

# Known limitations

The current implementation does not include the diffusion
term of the Navier-Stokes equation, nor does it consider
the force exerted by the turbine on the fluid as it rotates.

The generated power is calculated by the product of the
torque by the angular speed. The torque is calculated by
integrating the pressure along the blade perimeter. This
is done on the CPU, downloading the pressure texture from 
the GPU. The displayed power is an exponential moving 
average of the instantaneous power, and lacks strict 
physical units.
It's scaled to look appealing, as its main purpose is
to compare the performace of different turbine 
configurations.

Feel free to clone the repo and create a Pull Request to 
extend the project.