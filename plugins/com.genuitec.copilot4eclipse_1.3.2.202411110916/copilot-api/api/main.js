"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ca_1 = require("./ca");
// setup certificate authority
(0, ca_1.setupCa)();
// load the copilot language server
const copilotAPI = require("./language-server.js");
