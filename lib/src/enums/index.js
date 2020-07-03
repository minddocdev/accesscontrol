"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.possessions = exports.Possession = exports.actions = exports.Action = void 0;
const Action_1 = require("./Action");
Object.defineProperty(exports, "Action", { enumerable: true, get: function () { return Action_1.Action; } });
const Possession_1 = require("./Possession");
Object.defineProperty(exports, "Possession", { enumerable: true, get: function () { return Possession_1.Possession; } });
const actions = Object.values(Action_1.Action).map((v) => v);
exports.actions = actions;
const possessions = Object.values(Possession_1.Possession).map((v) => v);
exports.possessions = possessions;
//# sourceMappingURL=index.js.map