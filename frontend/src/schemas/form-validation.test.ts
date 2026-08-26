import { test } from "node:test";
import assert from "node:assert/strict";
import { donationCategorySchema, staffDonationSchema } from "./donation.schema";
import { monkSchema } from "./monk.schema";
import { gallerySchema } from "./gallery.schema";

test("donationCategorySchema validates required multilang name and active state", () => {
  const valid = donationCategorySchema.safeParse({
    name: { th: "ค่าน้ำค่าไฟ", en: "Utilities", de: "Nebenkosten" },
    description: { th: "ค่าน้ำค่าไฟวัด", en: "Temple utilities", de: "Tempel Nebenkosten" },
    display_order: 1,
    is_active: true,
  });
  assert.equal(valid.success, true);

  const invalid = donationCategorySchema.safeParse({
    name: { th: "", en: "Utilities", de: "Nebenkosten" },
    display_order: 1,
    is_active: true,
  });
  assert.equal(invalid.success, false);
});

test("staffDonationSchema validates positive amount, decimals and required donor name", () => {
  const valid = staffDonationSchema.safeParse({
    donor_name: "John Doe",
    donor_email: "john@example.com",
    is_anonymous: false,
    amount: "150.50",
    currency: "EUR",
    donation_date: "2026-08-26",
    donation_time: "14:30",
    donation_method: "bank_transfer",
    receipt_requested: false,
  });
  assert.equal(valid.success, true);

  // Fails with more than two decimal places
  const invalidDecimals = staffDonationSchema.safeParse({
    donor_name: "John Doe",
    is_anonymous: false,
    amount: "150.555",
    currency: "EUR",
    donation_date: "2026-08-26",
    donation_time: "14:30",
    donation_method: "cash",
  });
  assert.equal(invalidDecimals.success, false);

  // Fails when not anonymous but donor_name is missing
  const missingName = staffDonationSchema.safeParse({
    donor_name: "",
    is_anonymous: false,
    amount: "50",
    currency: "EUR",
    donation_date: "2026-08-26",
    donation_time: "14:30",
    donation_method: "cash",
  });
  assert.equal(missingName.success, false);

  // Succeeds when anonymous even without donor_name
  const anonymous = staffDonationSchema.safeParse({
    is_anonymous: true,
    amount: "50",
    currency: "EUR",
    donation_date: "2026-08-26",
    donation_time: "14:30",
    donation_method: "cash",
  });
  assert.equal(anonymous.success, true);
});

test("monkSchema validates slug format and multilang name", () => {
  const valid = monkSchema.safeParse({
    name: { th: "หลวงพ่อสุทัศน์", en: "Luang Por Suthas", de: "Luang Por Suthas" },
    slug: "luang-por-suthas",
    display_order: 0,
    is_active: true,
  });
  assert.equal(valid.success, true);

  // Invalid slug with spaces or uppercase
  const invalidSlug = monkSchema.safeParse({
    name: { th: "หลวงพ่อสุทัศน์", en: "Luang Por Suthas", de: "Luang Por Suthas" },
    slug: "Luang Por Suthas",
    display_order: 0,
    is_active: true,
  });
  assert.equal(invalidSlug.success, false);
});

test("gallerySchema validates image_url requirement and multilang caption", () => {
  const valid = gallerySchema.safeParse({
    image_url: "https://r2.watloungporsai.de/gallery/temple-front.jpg",
    caption: { th: "หน้าศาลา", en: "Main Hall", de: "Haupthalle" },
    display_order: 1,
    is_active: true,
  });
  assert.equal(valid.success, true);

  const emptyImage = gallerySchema.safeParse({
    image_url: "",
    display_order: 1,
    is_active: true,
  });
  assert.equal(emptyImage.success, false);
});
