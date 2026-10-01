import { test, expect } from "@playwright/test";
import path from "path";

/**
 * E2E tests — Document upload flow
 *
 * These tests verify that a user can:
 *   1. See the initial empty state.
 *   2. Stage a file for upload (pending list appears).
 *   3. Adjust the knowledge-base category.
 *   4. Add custom metadata.
 *   5. Save — the file is POSTed to /api/documents and the doc appears in the list.
 *   6. Remove a saved document from the list.
 *
 * The tests mock /api/documents so they run without a live backend.
 */

const FIXTURE = path.resolve(__dirname, "fixtures", "sample.txt");

test.describe("Document panel", () => {
    test.beforeEach(async ({ page }) => {
        // Intercept /api/documents so the test never needs a real backend
        await page.route("**/api/documents", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    documents: [
                        {
                            name: "sample.txt",
                            doc_id: "SAMPLE",
                            namespace: "default",
                            doc_type: "General",
                            metadata: {},
                            chunk_count: 3,
                        },
                    ],
                }),
            });
        });

        await page.goto("/");
    });

    test("shows empty state on first load", async ({ page }) => {
        await expect(page.getByText("No documents yet.")).toBeVisible();
        await expect(page.getByRole("button", { name: /add files/i })).toBeVisible();
    });

    test("staging a file shows the pending list", async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE);

        await expect(page.getByText("sample.txt")).toBeVisible();
        await expect(page.getByRole("button", { name: /save to knowledge base/i })).toBeVisible();
        await expect(page.getByText("Knowledge base is auto-detected")).toBeVisible();
    });

    test("category dropdown pre-fills based on filename", async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE);

        // sample.txt → guessCategory → "General"
        await expect(page.getByText("General")).toBeVisible();
    });

    test("user can add and remove a metadata field", async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE);

        // Add metadata field
        await page.getByRole("button", { name: /add metadata/i }).click();

        const keyInputs = page.getByPlaceholder(/key/i);
        await keyInputs.last().fill("owner");

        const valueInputs = page.getByPlaceholder(/value/i);
        await valueInputs.last().fill("embroidery-team");

        await expect(keyInputs.last()).toHaveValue("owner");
        await expect(valueInputs.last()).toHaveValue("embroidery-team");

        // Remove the metadata field
        const removeMetaBtns = page.getByRole("button", { name: /remove metadata field/i });
        await removeMetaBtns.last().click();
        await expect(keyInputs).toHaveCount(0);
    });

    test("saving a file calls /api/documents and adds it to the document list", async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE);

        // Capture the outgoing request
        const [request] = await Promise.all([
            page.waitForRequest("**/api/documents"),
            page.getByRole("button", { name: /save to knowledge base/i }).click(),
        ]);

        expect(request.method()).toBe("POST");

        // After save, the document appears in the saved list
        await expect(page.locator(".doc-item").filter({ hasText: "sample.txt" })).toBeVisible({
            timeout: 15_000,
        });

        // Pending list should be gone
        await expect(page.getByText("Knowledge base is auto-detected")).not.toBeVisible();
    });

    test("removing a saved document removes it from the list", async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE);
        await page.getByRole("button", { name: /save to knowledge base/i }).click();

        // Wait for document to appear
        const docItem = page.locator(".doc-item").filter({ hasText: "sample.txt" });
        await expect(docItem).toBeVisible({ timeout: 15_000 });

        // Remove it
        await docItem.getByRole("button", { name: /remove sample\.txt/i }).click();
        await expect(docItem).not.toBeVisible();
        await expect(page.getByText("No documents yet.")).toBeVisible();
    });

    test("canceling upload aborts the save", async ({ page }) => {
        // Slow down the mock response so cancel has time to fire
        await page.route("**/api/documents", async (route) => {
            await page.waitForTimeout(3000);
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ documents: [] }) });
        });

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(FIXTURE);
        await page.getByRole("button", { name: /save to knowledge base/i }).click();

        await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
        await page.getByRole("button", { name: /cancel/i }).click();

        await expect(page.getByText("Upload canceled.")).toBeVisible({ timeout: 5_000 });
    });
});
