import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_WORKSPACE_LAYOUT, adjustWorkspaceLayout, layoutReadout, normalizeWorkspaceLayout, workspacePreset } from "../web/js/layout.js";
test("workspace layout normalizes to 100 percent",()=>{const l=normalizeWorkspaceLayout({atlas:40,tower:40,side:40,player:60});assert.equal(Number((l.atlas+l.tower+l.side).toFixed(2)),100);assert.equal(l.player,60)});
test("workspace presets preserve usable columns",()=>{for(const n of ["balanced","map","tower","dashboard","equal"]){const l=workspacePreset(n);assert.ok(l.atlas>=18);assert.ok(l.tower>=24);assert.ok(l.side>=18);assert.equal(Number((l.atlas+l.tower+l.side).toFixed(2)),100)}});
test("atlas Tower drag changes only that pair",()=>{const i=workspacePreset("balanced"),l=adjustWorkspaceLayout(i,"atlas-tower",5);assert.ok(l.atlas>i.atlas);assert.ok(l.tower<i.tower);assert.equal(l.side,i.side);assert.equal(l.preset,"custom")});
test("Tower dashboard drag honors minimum widths",()=>{const l=adjustWorkspaceLayout(workspacePreset("balanced"),"tower-side",-100);assert.ok(l.tower>=24);assert.ok(l.side>=18)});
test("player Chronicle drag clamps vertical split",()=>{const i=workspacePreset("balanced");assert.equal(adjustWorkspaceLayout(i,"player-log",100).player,76);assert.equal(adjustWorkspaceLayout(i,"player-log",-100).player,34)});
test("workspace readout names adjustable regions",()=>{const s=layoutReadout(DEFAULT_WORKSPACE_LAYOUT);for(const x of ["Map","Tower","Dashboard","Player"])assert.match(s,new RegExp(x))});


test("Milestone 8 balanced workspace defaults to 40-30-30", () => {
  const layout = workspacePreset("balanced");
  assert.equal(layout.atlas, 40);
  assert.equal(layout.tower, 30);
  assert.equal(layout.side, 30);
});
