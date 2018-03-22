import { Package } from "./package";
import { join } from "path";

import { IStore } from "../types";
import { app } from "electron";
import { actions } from "../actions";

const packageNames = ["butler"];

export class Manager {
  private pkgs: Package[] = [];
  private prefix: string;

  constructor(store: IStore) {
    this.prefix = join(app.getPath("userData"), "broth");

    store.dispatch(actions.packagesListed({ packageNames }));
    for (const name of packageNames) {
      this.pkgs.push(new Package(store, this.prefix, name));
    }
  }

  async ensure() {
    for (const pkg of this.pkgs) {
      await pkg.ensure();
    }
  }

  async upgrade() {
    for (const pkg of this.pkgs) {
      await pkg.upgrade();
    }
  }
}
