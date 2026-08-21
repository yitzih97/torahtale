import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminReviewTab } from "@/components/admin/AdminReviewTab";

/**
 * The staff reviewer's screen. What matters here is as much what is ABSENT as
 * what is present: no price, no customer, no address, no delete. The database
 * enforces the same thing (see the 20260821 staff_role migrations); this pins
 * the surface an employee is actually shown.
 */

const book = (over: Record<string, unknown> = {}) => ({
  id: "b1",
  child_name: "Adina",
  torah_portion: "pesach",
  status: "pending_review",
  order_number: "TT-1001",
  created_at: "2026-08-20T10:00:00Z",
  product_type: "hardcover",
  has_pages: true,
  ...over,
});

const setup = (books: Array<Record<string, unknown>>) => {
  const handlers = {
    onOpenBookEditor: vi.fn(), onGenerate: vi.fn(),
    onDownloadZip: vi.fn(), onApprove: vi.fn(),
  };
  render(
    <AdminReviewTab
      books={books}
      booksLoading={false}
      openingBookId={null}
      downloadingZip={null}
      canGenerate={(b: any) => b.status === "paid"}
      {...handlers}
    />,
  );
  return handlers;
};

describe("staff review queue", () => {
  it("offers review, ZIP and approve on a book that is ready", () => {
    const { onApprove, onOpenBookEditor } = setup([book()]);
    expect(screen.getByText("Adina")).toBeTruthy();
    expect(screen.getByText(/Hardcover/)).toBeTruthy();

    fireEvent.click(screen.getByText("Review"));
    expect(onOpenBookEditor).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Approve & print"));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("cannot approve a book that has no pages yet", () => {
    setup([book({ status: "paid", has_pages: false })]);
    expect(screen.queryByText("Approve & print")).toBeNull();
    expect(screen.getByText("Generate")).toBeTruthy();
  });

  it("shows no money, no customer and no way to delete", () => {
    setup([book({
      // Fields a staff session is not sent - here on purpose: even if one
      // arrived, the screen must not render it.
      paid_at: "2026-08-19T00:00:00Z",
      shipping_data: { address1: "12 Example St", email: "parent@example.com" },
      total: 24.99,
    })]);
    const text = document.body.textContent || "";
    expect(text).not.toMatch(/\$|24\.99|Example St|parent@example\.com/);
    expect(screen.queryByText(/Delete/i)).toBeNull();
    expect(screen.queryByText(/Mark.*paid/i)).toBeNull();
  });
});
