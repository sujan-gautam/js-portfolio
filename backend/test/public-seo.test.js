import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import CryptoJS from "crypto-js";
import mongoose from "mongoose";
import { About, BlogPost, Feed, Story } from "../models/index.js";

test("public content is crawlable, canonical, and absent when restricted", async () => {
  process.chdir(fileURLToPath(new URL("../../", import.meta.url)));
  const port = Number(process.env.TEST_MONGODB_PORT ?? 27017);
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535);
  process.env.MONGO_URI = `mongodb://127.0.0.1:${port}/seo_test_${randomBytes(6).toString("hex")}`;
  process.env.NODE_ENV = "production";
  process.env.ENCRYPTION_KEY = "local-seo-test";
  process.env.GOOGLE_CLIENT_ID = "local-seo-test";
  process.env.GOOGLE_CLIENT_SECRET = "local-seo-test";
  const site = "https://www.sujan1919.com.np";
  const { default: app } = await import("../server.js");
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;

  try {
    const photo = "https://media.example.com/photo.jpg?a=1&b=2";
    const anotherPhoto = "https://media.example.com/another.jpg";
    const galleryVideo = "https://res.cloudinary.com/test/video/upload/v1/gallery.mov";
    const galleryMp4 = "https://res.cloudinary.com/test/video/upload/f_mp4/v1/gallery.mp4";
    const [post, hiddenPost, article, story, hiddenStory, inactiveStory] = await Promise.all([
      Feed.create({ caption: "Public test post", content: "Original post body", images: [photo, galleryVideo, anotherPhoto], videoUrl: "https://youtu.be/dQw4w9WgXcQ", published: true }),
      Feed.create({ caption: "Private post title", content: "Private post body", images: [galleryVideo], membersOnly: true, published: true }),
      BlogPost.create({ title: "An article", slug: "an-article", status: "Published", content: `<p>Article text</p><img src="${anotherPhoto}"><script>alert('hidden script')</script>` }),
      Story.create({ title: "Public video story", type: "video", active: true, image: "https://res.cloudinary.com/test/video/upload/v1/story.mp4", createdAt: new Date() }),
      Story.create({ title: "Private story title", type: "image", active: true, isMembersOnly: true, image: "https://media.example.com/private-image.jpg" }),
      Story.create({ title: "Inactive story title", active: false, image: "https://media.example.com/inactive.jpg" }),
      About.create({ name: "Sujan Gautam", title: "Software Engineer", bio: "Public profile biography" }),
    ]);

    const sitemap = await fetch(origin + "/sitemap.xml");
    assert.equal(sitemap.status, 200);
    const xml = await sitemap.text();
    const map = load(xml, { xmlMode: true });
    const locs = map("url > loc").map((_, node) => map(node).text()).get();
    for (const path of [`/post/${post.id}`, `/stories/${story.id}`, "/blog/an-article"]) assert.ok(locs.includes(site + path));
    assert.ok(locs.every((url) => url.startsWith(site + "/")));
    for (const item of [hiddenPost, hiddenStory, inactiveStory]) assert.ok(!xml.includes(item.id));
    assert.ok(xml.includes("photo.jpg?a=1&amp;b=2"));
    assert.ok(xml.includes("<video:player_loc>https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"));
    assert.ok(xml.includes("<video:content_loc>https://res.cloudinary.com/test/video/upload/v1/story.mp4"));
    assert.ok(xml.includes(`<video:content_loc>${galleryMp4}`));
    assert.ok(!xml.includes("gallery.mov"));
    const watchUrls = locs.filter((url) => url.includes("/videos/"));
    assert.equal(watchUrls.length, 3);

    const publicPost = await fetch(origin + `/post/${post.id}`);
    assert.equal(publicPost.status, 200);
    const $ = load(await publicPost.text());
    assert.equal($('link[rel="canonical"]').attr("href"), site + `/post/${post.id}`);
    assert.ok($('script[type="module"]').length);
    assert.match($("#root").text(), /Original post body/);
    assert.deepEqual($("#root img").map((_, image) => $(image).attr("src")).get(), [photo, anotherPhoto]);
    assert.match($("#root iframe").attr("src"), /youtube-nocookie/);
    assert.equal($("#root video").attr("src"), galleryMp4);
    assert.equal($('#root a[href^="/videos/"]').length, 2);

    for (const url of watchUrls) {
      const watch = await fetch(origin + new URL(url).pathname);
      assert.equal(watch.status, 200);
      const page = load(await watch.text());
      assert.equal(page('link[rel="canonical"]').attr("href"), url);
      assert.equal(page("#root video, #root iframe").length, 1);
      assert.equal(page('script[type="module"]').length, 0);
      assert.ok(JSON.parse(page('script[type="application/ld+json"]').first().text())["@graph"].some((item) => item["@type"] === "VideoObject"));
    }
    const galleryWatch = map("url").filter((_, url) => map(url).find("video\\:content_loc").text() === galleryMp4).find("loc").text();
    const privateWatch = galleryWatch.replace(post.id, hiddenPost.id);
    const unavailableWatch = await fetch(origin + new URL(privateWatch).pathname);
    assert.equal(unavailableWatch.status, 404);
    assert.match(unavailableWatch.headers.get("x-robots-tag"), /noindex/);

    const alias = await fetch(origin + `/feed/post/${post.id}`, { redirect: "manual" });
    assert.equal(alias.status, 301);
    assert.equal(alias.headers.get("location"), `/post/${post.id}`);
    const oldArticle = await fetch(origin + `/post/${article.id}`, { redirect: "manual" });
    assert.equal(oldArticle.headers.get("location"), "/blog/an-article");
    const articlePage = await (await fetch(origin + "/blog/an-article")).text();
    assert.match(articlePage, /Article text/);
    assert.doesNotMatch(articlePage, /hidden script/);
    const storyPage = load(await (await fetch(origin + `/stories/${story.id}`)).text());
    assert.ok(storyPage("#root video").length);
    assert.equal(storyPage('script[type="module"]').length, 0);
    assert.equal(storyPage('link[rel="canonical"]').attr("href"), site + `/stories/${story.id}`);

    const feed = await (await fetch(origin + "/feed/")).text();
    assert.ok(feed.includes(`href="/post/${post.id}"`));
    assert.ok(feed.includes(`href="/stories/${story.id}"`));
    const profile = await (await fetch(origin + "/about/")).text();
    assert.match(profile, /Public profile biography/);
    for (const [path, secret] of [[`/post/${hiddenPost.id}`, "Private post body"], [`/story/${hiddenStory.id}`, "Private story title"], [`/feed/?story=${hiddenStory.id}`, "private-image.jpg"]]) {
      const restricted = await fetch(origin + path);
      assert.match(restricted.headers.get("x-robots-tag"), /noindex/);
      assert.ok(!(await restricted.text()).includes(secret));
    }
    const missing = await fetch(origin + "/post/000000000000000000000000");
    assert.equal(missing.status, 404);
    assert.match(missing.headers.get("x-robots-tag"), /noindex/);
    const storiesApi = await fetch(origin + `/api/collection/stories/${hiddenStory.id}`);
    assert.equal(storiesApi.headers.get("x-robots-tag"), "noindex");
    const payload = await storiesApi.json();
    const storyData = JSON.parse(CryptoJS.AES.decrypt(payload.encryptedData, process.env.ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8));
    assert.equal(storyData.isMembersOnly, true);
    assert.equal(storyData.image, undefined);
    assert.equal(storyData.title, undefined);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
