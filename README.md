# MUSTAFA ALI / PORTFOLIO V2

An experimental 3D portfolio with a scroll-triggered terminal chapter. The
fighter-jet exterior leads into the command-driven terminal interface from the
main portfolio, including its home, projects, contact, help, and cat views.

## Run locally

```sh
pnpm install
pnpm dev
```

Run `pnpm build` to type-check and produce the static site in `dist/`.

The experience uses one persistent React Three Fiber canvas. ScrollTrigger
writes a normalized 0–1 progress value, which the camera and simulation
environment read directly each frame. The foreground fighter jet is
assembled from procedural geometry so it can be replaced by a GLTF model
without changing the interface or timeline wiring.

`src/scene/simulation/` contains the background-only visualization: a warped
perspective grid, two deterministic wireframe terrains, partial reference
spheres, elliptical arcs, a sparse connected-node system, drifting particles,
stars, and depth fog. The lower grid and terrain stream forward beneath the
slowly turning jet. Pointer movement produces restrained depth parallax and
reveals local node connections. Drag inspection remains on the foreground
object; the environment counter-rotates slightly. Early scroll deepens the
visualization, then a short system-link cue carries the scene through a black
frame into the terminal. The terminal keeps the flight-computer radar and
wireframe motifs on a black backdrop. Mobile uses fewer samples and layers,
and reduced-motion mode keeps the scene still.
