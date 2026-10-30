// Point d'entrée unique : choisit le serveur réel ou le mode démo selon la configuration.
import { BACKEND } from "../config.js";
import * as demo from "./demoBackend.js";
import * as remote from "./remoteBackend.js";

const backend = BACKEND === "demo" ? demo : remote;

export const isDemo = BACKEND === "demo";
export const requestCode = (identifier) => backend.requestCode(identifier);
export const verifyCode = (identifier, code) => backend.verifyCode(identifier, code);
export const fetchSession = (token) => backend.fetchSession(token);
export const redeemCode = (token, code) => backend.redeemCode(token, code);
