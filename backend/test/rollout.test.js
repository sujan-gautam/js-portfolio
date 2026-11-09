import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { PageVersions, User, VisitorRecord } from "../models/index.js";

test("production defaults, admin rollback, and retry-safe visit tracking", async () => {
  const port = Number(process.env.TEST_MONGODB_PORT ?? 27017);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535);
  process.env.MONGO_URI = `mongodb://127.0.0.1:${port}/rollout_test_${randomBytes(6).toString("hex")}`;
  process.env.NODE_ENV = "production";
  process.env.VERCEL_ENV = "production";
  process.env.JWT_SECRET = "local-rollout-test";
  process.env.ENCRYPTION_KEY = "local-rollout-test";
  process.env.GOOGLE_CLIENT_ID = "local-rollout-test";
  process.env.GOOGLE_CLIENT_SECRET = "local-rollout-test";

  const { default: app } = await import("../server.js");
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const api = `http://127.0.0.1:${server.address().port}/api`;

  async function request(path, { method = "GET", body, token } = {}) {
    const response = await fetch(`${api}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json();
    const data = payload.encryptedData
      ? JSON.parse(CryptoJS.AES.decrypt(payload.encryptedData, process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8))
      : payload;
    return { status: response.status, data };
  }

  try {
    await Promise.all([PageVersions.init(), User.init(), VisitorRecord.init()]);
    const expectedKeys = ["about", "blog", "blogPost", "contact", "feed", "feedPost", "home", "navigation", "portfolio", "story"];
    const initial = await request("/page-versions");
    assert.equal(initial.status, 200);
    assert.deepEqual(Object.keys(initial.data).sort(), expectedKeys);
    assert.ok(Object.values(initial.data).every((version) => version === "v2"));

    const admin = await User.create({ email: "admin@example.test", role: "admin" });
    const member = await User.create({ email: "member@example.test", role: "member" });
    const tokenFor = (user) => jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    const token = tokenFor(admin);
    const update = (body, authToken) => request("/page-versions", { method: "PUT", body, token: authToken });
    assert.equal((await update({ home: "v1" })).status, 403);
    assert.equal((await update({ home: "v1" }, tokenFor(member))).status, 403);
    assert.equal((await update({ home: "unknown" }, token)).status, 400);
    const saves = await Promise.all([update({ home: "v1" }, token), update({ story: "v1" }, token)]);
    assert.ok(saves.every(({ status }) => status === 200));
    assert.deepEqual((await request("/page-versions")).data, { ...initial.data, home: "v1", story: "v1" });

    const timestamp = "2026-01-02T03:04:05.678Z";
    const pageViewID = randomBytes(12).toString("hex");
    const contentId = randomBytes(12).toString("hex");
    const path = `/feed/?story=${contentId}`;
    const view = {
      pageViewID, sessionID: "rollout-test-session", page: "/feed/", pageUrl: path, visitedAt: timestamp,
      location: { city: "Test City" },
      activities: [{ eventID: randomBytes(16).toString("hex"), type: "content_view", contentType: "story", contentId, path, timestamp }],
    };
    const events = await Promise.all([view, view].map((body) => request("/visitors/track", { method: "POST", body })));
    assert.ok(events.every(({ status }) => status === 200));
    const record = await VisitorRecord.findById(pageViewID).lean();
    assert.equal(record.pageUrl, path);
    assert.equal(record.timestamp.toISOString(), timestamp);
    assert.equal(record.activities.length, 1);
    assert.equal(record.activities[0].timestamp.toISOString(), timestamp);
    assert.equal(record.activities[0].contentId, contentId);
    assert.equal((await request("/collection/visitors")).status, 403);
    assert.equal((await request("/collection/visitors", { token })).status, 200);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
