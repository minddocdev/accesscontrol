"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Action_1 = require("./Action");
exports.Action = Action_1.Action;
const Possession_1 = require("./Possession");
exports.Possession = Possession_1.Possession;
const actions = Object.values(Action_1.Action).map((v) => v);
exports.actions = actions;
const possessions = Object.values(Possession_1.Possession).map((v) => v);
exports.possessions = possessions;
//# sourceMappingURL=index.js.map