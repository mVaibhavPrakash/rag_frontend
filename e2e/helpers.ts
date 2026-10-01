/**
 * E2E helpers shared across test files.
 */

import path from "path";
import { Page, expect } from "@playwright/test";

/** Absolute path to the small fixture file used in upload tests. */
export const FIXTURE_TXT = path.resolve(__dirname, "fixtures", "sample.txt");

/** Wait for the document panel to finish saving (button returns to normal label). */
export async function waitForSaveComplete(page: Page) {
    await expect(page.getByRole("button", { name: /save to knowledge base/i })).toBeVisible({
        timeout: 20_000,
    });
}

/** Wait for the chat panel to show an assistant response bubble. */
export async function waitForAssistantReply(page: Page) {
    // The assistant bubble appears after the user bubble and has no "user" class
    await expect(
        page.locator(".rag-message-assistant").last(),
    ).toBeVisible({ timeout: 60_000 });
}
