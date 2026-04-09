import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname } from "node:path";

const databaseFile = "C:/Users/kelvi/.codex/tmp/rehoboth-demo.db";

mkdirSync(dirname(databaseFile), { recursive: true });

const handle = openSync(databaseFile, "a");
closeSync(handle);
