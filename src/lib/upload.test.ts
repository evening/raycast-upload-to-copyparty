import assert from "node:assert/strict";
import test from "node:test";
import { validateFilename, buildDestination, findFinalHttpUrl } from "./upload.js";

test("validateFilename", () => {
  assert.equal(validateFilename("valid.txt"), undefined);
  assert.equal(validateFilename(" valid.txt "), undefined);
  assert.ok(validateFilename(""));
  assert.ok(validateFilename("   "));
  assert.ok(validateFilename("."));
  assert.ok(validateFilename(".."));
  assert.ok(validateFilename("foo/bar"));
  assert.ok(validateFilename("foo\\bar"));
  assert.ok(validateFilename("foo\x00bar"));
});

test("buildDestination", () => {
  assert.equal(buildDestination("https://example.com", "file.txt").toString(), "https://example.com/file.txt");
  assert.equal(buildDestination("https://example.com/", "file.txt").toString(), "https://example.com/file.txt");
  assert.equal(
    buildDestination("https://example.com/up/", "spaced name.txt").toString(),
    "https://example.com/up/spaced%20name.txt",
  );
  assert.equal(
    buildDestination("https://example.com/up/", "\u2603.txt").toString(),
    "https://example.com/up/%E2%98%83.txt",
  );
  assert.equal(
    buildDestination("https://example.com/up/", "a#b?c.txt").toString(),
    "https://example.com/up/a%23b%3Fc.txt",
  );

  assert.throws(() => buildDestination("http://example.com", "file.txt"), /must be https/);
  assert.throws(() => buildDestination("https://example.com?query=1", "file.txt"), /query or hash/);
  assert.throws(() => buildDestination("https://example.com#hash", "file.txt"), /query or hash/);
});

test("findFinalHttpUrl", () => {
  assert.equal(findFinalHttpUrl("OK\nhttps://example.com/file.txt\n"), "https://example.com/file.txt");
  assert.equal(findFinalHttpUrl("https://example.com/1\r\nhttps://example.com/2\r\n"), "https://example.com/2");
  assert.equal(findFinalHttpUrl("No urls here\nJust text"), undefined);
  assert.equal(findFinalHttpUrl(""), undefined);
});
