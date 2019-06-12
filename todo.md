TODO
====

- [ ] Update README.md
- [ ] Highlight winner or top 3 in player table
- [ ] Show explosion for dying bots
- [ ] Create replay file for every game mode for testing
- [ ] Add option to follow specific player (for 3d mode)
- [ ] Bug: Should stop auto play and reset traced players (probably also reset rotation) when loading a new replay
- [ ] Torus rotation only initially rotates around the expected axes
- [ ] Allow to reset torus rotation
- [ ] Improve color contrast of torus
- [ ] Bug: Sound shall only be initialized after first user interaction, otherwise Chrome etc. might prevent it

- [X] Persist spectator URL across reloads
- [X] Animate transition between 2d and 3d mode
- [X] Add a welcome message when no replay is loaded yet, maybe the image of the flyer
- [X] Update favicon + page title
- [X] Highlight view radius of current turn (to differentiate it from previous turns)
- [X] Add input for start turn of trace
- [X] Show sensible error message when loaded replay file is obviously corrupt
- [X] Switch sprite picker on game mode
- [X] Add nicer lighting for 3d mode
- [X] Implement 3d mode
- [X] Add download button to save current replay as file (makes sense when spectated via websocket)
- [X] Show sensible error message when "Connect" fails
- [X] Adjust turn delay values
- [X] Bug: reset turn index on subsequent spectations
- [X] Enable player trace
- [X] Draw player sprites based on orientation
- [X] Enable view radius and discovered area
- [X] Support map sizes different from 32x32 (hard-coded in gl perspective currently)
- [X] UI theming
- [X] Create or import sprite atlas
- [X] Evaluate vertical orientation
- [X] Show player table
- [X] Jump to beginning, end, enter turn
- [X] Open websocket for spectator mode
- [X] Bug: Map offset by 1
- [X] Autoplay maybe buffering?
