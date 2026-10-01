import { test, expect } from "@playwright/test";
import path from "path";

/**
 * E2E tests — Chat / RAG flow
 *
 * These tests verify that a user can:
 *   1. See the welcome message on first load.
 *   2. Type a question and submit it.
 *   3. The question is POSTed to /api/chat and the answer appears.
 *   4. Cancel an in-flight request.
 *   5. Retry a failed question.
 *   6. Filter by knowledge-base category.
 *   7. The welcome message disappears after the first real question.
 *
 * /api/chat is mocked so these tests run without a live backend.
 */

const FIXTURE = path.resolve(__dirname, "fixtures", "sample.txt");

/** Set up a mock /api/chat that returns a canned answer. */
async function mockChat(page: import("@playwright/test").Page, answer: string) {
    await page.route("**/api/chat", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ answer }),
        });
    });
}

/** Mock /api/documents so upload tests don't need a real backend. */
async function mockDocuments(page: import("@playwright/test").Page) {
    await page.route("**/api/documents", async (route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
                documents: [{ name: "sample.txt", doc_id: "SAMPLE", namespace: "default", doc_type: "General", metadata: {}, chunk_count: 3 }],
            }),
        });
    });
}

test.describe("Chat panel", () => {
    test.beforeEach(async ({ page }) => {
        await mockChat(page, "Use a 75/11 needle for lightweight fabrics.");
        await mockDocuments(page);
        await page.goto("/");
    });

    test("shows welcome message on first load", async ({ page }) => {
        await expect(page.locator(".rag-message-assistant")).toContainText(
            "Add a few documents",
        );
    });

    test("welcome message disappears after the first question", async ({ page }) => {
        await page.locator("textarea").fill("What needle size should I use?");
        await page.getByRole("button", { name: /send/i }).click();

        // Welcome message should be gone; the question should appear instead
        await expect(page.locator(".rag-message-user")).toBeVisible();
        await expect(page.locator(".rag-message-assistant").filter({ hasText: "Add a few documents" })).not.toBeVisible();
    });

    test("sending a question shows user bubble then assistant answer", async ({ page }) => {
        const textarea = page.locator("textarea");
        await textarea.fill("What needle size should I use?");
        await page.getByRole("button", { name: /send/i }).click();

        // User bubble
        await expect(page.locator(".rag-message-user")).toContainText("What needle size should I use?");

        // Assistant answer
        await expect(page.locator(".rag-message-assistant").last()).toContainText(
            "75/11 needle",
            { timeout: 15_000 },
        );
    });

    test("send button is disabled when question is empty", async ({ page }) => {
        const sendBtn = page.getByRole("button", { name: /send/i });
        await expect(sendBtn).toBeDisabled();

        await page.locator("textarea").fill("hello");
        await expect(sendBtn).not.toBeDisabled();

        await page.locator("textarea").fill("");
        await expect(sendBtn).toBeDisabled();
    });

    test("pressing Enter submits the question", async ({ page }) => {
        await page.locator("textarea").fill("What needle do I need?");
        await page.locator("textarea").press("Enter");

        await expect(page.locator(".rag-message-user")).toContainText("What needle do I need?");
        await expect(page.locator(".rag-message-assistant").last()).toBeVisible({ timeout: 15_000 });
    });

    test("pressing Shift+Enter inserts a newline instead of submitting", async ({ page }) => {
        const textarea = page.locator("textarea");
        await textarea.fill("First line");
        await textarea.press("Shift+Enter");
        await textarea.type("Second line");

        // Should not have triggered a submit (no user bubble yet)
        await expect(page.locator(".rag-message-user")).not.toBeVisible();
    });

    test("canceling an in-flight request shows canceled status", async ({ page }) => {
        // Slow down the response so there is time to hit cancel
        await page.route("**/api/chat", async (route) => {
            await page.waitForTimeout(4000);
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer: "late answer" }) });
        });

        await page.locator("textarea").fill("Slow question");
        await page.getByRole("button", { name: /send/i }).click();

        // Wait for stop button to appear, then click it
        const stopBtn = page.getByRole("button", { name: /stop generating/i });
        await expect(stopBtn).toBeVisible({ timeout: 5_000 });
        await stopBtn.click();

        await expect(page.locator(".canceled-response-status")).toBeVisible({ timeout: 5_000 });
    });

    test("error state shows retry button", async ({ page }) => {
        await page.route("**/api/chat", async (route) => {
            await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "Internal error" }) });
        });

        await page.locator("textarea").fill("Failing question");
        await page.getByRole("button", { name: /send/i }).click();

        await expect(page.getByRole("button", { name: /retry last question/i })).toBeVisible({ timeout: 10_000 });
    });

    test("retry button re-sends the failed question", async ({ page }) => {
        let callCount = 0;
        await page.route("**/api/chat", async (route) => {
            callCount++;
            if (callCount === 1) {
                await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "oops" }) });
            } else {
                await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer: "Retry worked!" }) });
            }
        });

        await page.locator("textarea").fill("Will this fail?");
        await page.getByRole("button", { name: /send/i }).click();

        const retryBtn = page.getByRole("button", { name: /retry last question/i });
        await expect(retryBtn).toBeVisible({ timeout: 10_000 });
        await retryBtn.click();

        await expect(page.locator(".rag-message-assistant").last()).toContainText("Retry worked!", { timeout: 10_000 });
    });

    test("selecting a knowledge-base category sends filter in the request body", async ({ page }) => {
        let capturedBody: Record<string, unknown> = {};
        await page.route("**/api/chat", async (route) => {
            capturedBody = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ answer: "filtered answer" }) });
        });

        // Open knowledge-base popover and select "Policy"
        await page.getByRole("button", { name: /knowledge base/i }).click();
        await page.getByRole("button", { name: "Policy" }).click();

        // Ask a question
        await page.locator("textarea").fill("What is the policy?");
        await page.getByRole("button", { name: /send/i }).click();

        await expect(page.locator(".rag-message-assistant").last()).toBeVisible({ timeout: 15_000 });

        // The filter should have been sent
        expect(capturedBody).toHaveProperty("filter");
    });
});

// ---------------------------------------------------------------------------
// Full end-to-end flow test (requires mock for both endpoints)
// ---------------------------------------------------------------------------

test.describe("Full RAG flow (upload → ask)", () => {
    test("upload a document then ask a question and get an answer", async ({ page }) => {
        await mockDocuments(page);
        await mockChat(page, "Replace needles every 8 hours of stitching time.");

        await page.goto("/");

        // 1. Upload the fixture document
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE);
        await page.getByRole("button", { name: /save to knowledge base/i }).click();

        // 2. Wait for it to appear in the saved list
        await expect(page.locator(".doc-item").filter({ hasText: "sample.txt" })).toBeVisible({ timeout: 15_000 });

        // 3. Ask a question in the chat panel
        await page.locator("textarea").fill("How often should I replace needles?");
        await page.getByRole("button", { name: /send/i }).click();

        // 4. Verify the answer is displayed
        await expect(page.locator(".rag-message-assistant").last()).toContainText(
            "Replace needles every 8 hours",
            { timeout: 20_000 },
        );
    });
});
