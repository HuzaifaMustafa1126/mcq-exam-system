// Browser regression checks use mocked APIs; no production data is written.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node client/test/audit.browser.mjs
import assert from "node:assert/strict";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const errors = [];
const captureConsole = (message) => {
  if (
    ["error", "warning"].includes(message.type()) &&
    !message.text().includes("net::ERR_INTERNET_DISCONNECTED")
  )
    errors.push(message.text());
};
const created = [];
const subjects = [
  { id: 2, name: "English", code: "ENG 07", totalQuestions: 0 },
  { id: 4, name: "Mathematics", code: "MATH", totalQuestions: 0 },
];
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
await context.addInitScript(() => {
  localStorage.setItem("mcq_token", "test");
  localStorage.setItem(
    "mcq_user",
    JSON.stringify({ id: 1, name: "Audit Admin", role: "admin" }),
  );
});
const page = await context.newPage();
page.on("console", captureConsole);
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/api/v1/**", async (route) => {
  const url = new URL(route.request().url());
  const path = url.pathname.replace("/api/v1", "");
  let data = {};
  if (path === "/subjects")
    data = { subjects, pagination: { page: 1, total: 2, totalPages: 1 } };
  else if (/^\/subjects\/\d+$/.test(path))
    data = subjects.find((s) => s.id === Number(path.split("/").at(-1)));
  else if (path === "/questions" && route.request().method() === "POST") {
    data = { id: created.length + 1, ...route.request().postDataJSON() };
    created.push(data);
    subjects.find((s) => s.id === data.subjectId).totalQuestions++;
  } else if (path === "/questions") {
    const filtered = created.filter(
      (q) =>
        !url.searchParams.get("subjectId") ||
        q.subjectId === Number(url.searchParams.get("subjectId")),
    );
    data = {
      questions: filtered,
      pagination: { page: 1, total: filtered.length, totalPages: 1 },
    };
  }
  if (["/teachers", "/students", "/exams", "/results"].includes(path))
    data = {
      teachers: [],
      students: [],
      exams: [],
      results: [],
      summary: { total: 0, passed: 0, failed: 0, averagePercentage: 0 },
      pagination: { page: 1, total: 0, totalPages: 0 },
    };
  await route.fulfill({ json: { success: true, data } });
});
try {
  for (const subject of subjects) {
    await page.goto(
      `http://127.0.0.1:5173/subjects/${subject.id}/questions?add=1`,
    );
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.equal(await dialog.locator('select[name="subjectId"]').count(), 0);
    for (let i = 0; i < 5; i++) {
      await dialog
        .getByLabel("Question text", { exact: true })
        .fill(`${subject.name} question ${i}`);
      for (const letter of ["A", "B", "C", "D"])
        await dialog
          .getByLabel(`Option ${letter}`, { exact: true })
          .fill(`Answer ${letter}`);
      await dialog
        .getByRole("radio", { name: "Mark option A as correct" })
        .check();
      await dialog
        .getByRole("button", { name: "Save & Add Another", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector('textarea[name="questionText"]')?.value === "",
      );
      await page
        .waitForFunction(
          () =>
            document.activeElement ===
            document.querySelector('textarea[name="questionText"]'),
          null,
          { timeout: 4000 },
        )
        .catch(async (error) => {
          console.log(
            await page.evaluate(() => ({
              active: document.activeElement.outerHTML,
              textarea: document.querySelector("textarea")?.outerHTML,
            })),
          );
          throw error;
        });
    }
    assert.equal(await dialog.isVisible(), true);
    for (const size of [
      { width: 1280, height: 800 },
      { width: 768, height: 700 },
      { width: 390, height: 640 },
    ]) {
      await page.setViewportSize(size);
      const geometry = await dialog.evaluate((el) => {
        const body = el.querySelector(".modal-body").getBoundingClientRect(),
          footer = el.querySelector(".modal-footer").getBoundingClientRect(),
          box = el.getBoundingClientRect();
        return {
          bodyBottom: body.bottom,
          footerTop: footer.top,
          bottom: box.bottom,
          right: box.right,
          width: innerWidth,
          height: innerHeight,
        };
      });
      assert.ok(
        geometry.bodyBottom <= geometry.footerTop + 1,
        JSON.stringify(geometry),
      );
      assert.ok(
        geometry.bottom <= geometry.height && geometry.right <= geometry.width,
        JSON.stringify(geometry),
      );
      await page.screenshot({ path: `/tmp/mcq-question-${size.width}.png` });
    }
    await page.keyboard.press("Escape");
    assert.equal(await dialog.count(), 0);
    await page.setViewportSize({ width: 1280, height: 800 });
  }
  for (const [path, label] of [
    ["subjects", "Add subject"],
    ["questions", "Add question"],
    ["teachers", "Add teacher"],
    ["students", "Add student"],
    ["exams", "Create exam"],
  ]) {
    await page.goto(`http://127.0.0.1:5173/admin/${path}`);
    await page
      .getByRole("button", { name: label, exact: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    for (const size of [
      { width: 1280, height: 800 },
      { width: 390, height: 640 },
    ]) {
      await page.setViewportSize(size);
      const geometry = await dialog.evaluate((el) => ({
        body: el.querySelector(".modal-body").getBoundingClientRect().bottom,
        footer: el.querySelector(".modal-footer").getBoundingClientRect().top,
        bottom: el.getBoundingClientRect().bottom,
      }));
      assert.ok(
        geometry.body <= geometry.footer + 1 && geometry.bottom <= size.height,
        `${path}: ${JSON.stringify(geometry)}`,
      );
      await page.mouse.click(2, 2);
      assert.equal(
        await dialog.isVisible(),
        true,
        "Forms must not close on accidental overlay click",
      );
    }
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1280, height: 800 });
  }
  await page.goto("http://127.0.0.1:5173/admin/results");
  await page.getByRole("heading").first().waitFor();
  assert.deepEqual(
    created.map((q) => q.subjectId),
    [2, 2, 2, 2, 2, 4, 4, 4, 4, 4],
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 5 English + 5 Mathematics questions, continuous entry, focus, no subject leak, all management forms, desktop/tablet/mobile footer geometry, overlay safety and Escape.",
  );
} finally {
  await context.close();
}
const student = await browser.newContext({
  viewport: { width: 1280, height: 800 },
});
await student.addInitScript(() => {
  localStorage.setItem("mcq_token", "test");
  localStorage.setItem(
    "mcq_user",
    JSON.stringify({ id: 2, name: "Audit Student", role: "student" }),
  );
});
const exam = await student.newPage();
exam.on("console", captureConsole);
exam.on("pageerror", (e) => errors.push(e.message));
let expiry = Date.now() + 10000,
  submissions = 0,
  saves = 0,
  offline = false;
const answers = {};
await exam.route("**/api/v1/**", async (route) => {
  const url = new URL(route.request().url());
  let data = {};
  if (url.pathname.endsWith("/questions")) {
    const index = Number(url.searchParams.get("page") || 1);
    data = {
      attemptId: 10,
      title: "Audit exam",
      expiresAt: new Date(expiry).toISOString(),
      serverNow: new Date().toISOString(),
      status: Date.now() >= expiry ? "TIME_COMPLETED" : "IN_PROGRESS",
      totalQuestions: 205,
      questionIds: Array.from({ length: 205 }, (_, i) => i + 1),
      answers,
      questions: [
        {
          id: index,
          question: `Question ${index}`,
          marks: 1,
          options: [
            { id: index * 10, text: "First answer" },
            { id: index * 10 + 1, text: "Second answer" },
          ],
        },
      ],
      pagination: { page: index, limit: 1, total: 205, totalPages: 205 },
    };
  }
  if (url.pathname.endsWith("/answer") && offline) {
    await route.abort("internetdisconnected");
    return;
  }
  if (url.pathname.endsWith("/answer")) {
    saves++;
    const payload = route.request().postDataJSON();
    answers[payload.questionId] = payload.optionId;
    data = { saved: true };
  }
  if (url.pathname.endsWith("/submit")) {
    submissions++;
    data = { attemptId: 10, resultId: 20 };
  }
  await route.fulfill({ json: { success: true, data } });
});
try {
  await exam.goto("http://127.0.0.1:5173/exam/1/live");
  await exam.getByRole("button", { name: "A First answer" }).click();
  await exam.waitForFunction(() => document.body.textContent.includes("Saved"));
  await exam.getByRole("button", { name: "Next", exact: true }).click();
  await exam
    .getByRole("heading", { name: "Question 2", exact: true })
    .waitFor();
  offline = true;
  await exam.getByRole("button", { name: "B Second answer" }).click();
  await exam.getByText("Connection lost.", { exact: false }).waitFor();
  offline = false;
  await exam.evaluate(() => window.dispatchEvent(new Event("online")));
  await exam.waitForFunction(() => document.body.textContent.includes("Saved"));
  const navigator = exam.locator("aside .question-palette-scroll");
  assert.equal(await navigator.locator("button").count(), 205);
  assert.ok((await navigator.boundingBox()).height <= 401);
  await exam.reload();
  await exam.getByRole("button", { name: "A First answer" }).waitFor();
  assert.equal(
    await exam
      .getByRole("button", { name: "A First answer" })
      .getAttribute("aria-pressed"),
    "true",
  );
  await exam
    .getByText("Your exam time has ended.", { exact: false })
    .waitFor({ timeout: 15000 });
  assert.equal(submissions, 0);
  assert.equal(
    await exam.getByRole("button", { name: "A First answer" }).isDisabled(),
    true,
  );
  assert.equal(
    await exam.getByRole("button", { name: "Next", exact: true }).isDisabled(),
    true,
  );
  await exam.getByRole("button", { name: "Submit Exam", exact: true }).click();
  await exam
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  assert.equal(
    await exam.getByRole("button", { name: "A First answer" }).isDisabled(),
    true,
  );
  await exam.setViewportSize({ width: 390, height: 740 });
  await exam.getByRole("button", { name: "Questions", exact: true }).click();
  await exam
    .getByRole("dialog")
    .getByRole("button", { name: "Question 205", exact: true })
    .click();
  await exam
    .getByRole("heading", { name: "Question 205", exact: true })
    .waitFor();
  await exam.screenshot({ path: "/tmp/mcq-exam-mobile.png" });
  await exam.getByRole("button", { name: "Submit Exam", exact: true }).click();
  await exam
    .getByRole("dialog")
    .getByRole("button", { name: "Submit Exam", exact: true })
    .click();
  await exam.waitForURL("**/result/10");
  assert.equal(submissions, 1);
  assert.equal(saves, 2);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 205-question grid, server save, offline recovery, refresh, 10-second expiry, no autosubmit, readonly/cancel, mobile drawer, manual submit once, no JS errors.",
  );
} finally {
  await browser.close();
}
