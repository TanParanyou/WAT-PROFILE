import assert from "node:assert/strict";
import test from "node:test";
import { escapeCsvCell, generateCsvContent, type CsvColumn } from "./export-csv";

test("escapeCsvCell properly handles commas, quotes, and newlines", () => {
  assert.equal(escapeCsvCell("simple"), "simple");
  assert.equal(escapeCsvCell("hello, world"), '"hello, world"');
  assert.equal(escapeCsvCell('with "quotes"'), '"with ""quotes"""');
  assert.equal(escapeCsvCell("line1\nline2"), '"line1\nline2"');
  assert.equal(escapeCsvCell("=SUM(A1:A5)"), "'=SUM(A1:A5)");
  assert.equal(escapeCsvCell(null), "");
  assert.equal(escapeCsvCell(undefined), "");
  assert.equal(escapeCsvCell(123.45), "123.45");
  assert.equal(escapeCsvCell(true), "true");
});

test("generateCsvContent generates valid CSV rows with UTF-8 content", () => {
  interface Donor {
    name: string;
    amount: number;
    notes: string;
  }

  const columns: CsvColumn<Donor>[] = [
    { header: "ชื่อผู้บริจาค", accessor: (d) => d.name },
    { header: "จำนวนเงิน (€)", accessor: (d) => d.amount },
    { header: "บันทึก", accessor: (d) => d.notes },
  ];

  const data: Donor[] = [
    { name: "สมชาย ใจดี", amount: 50, notes: "ทำบุญค่าน้ำ, ค่าไฟ" },
    { name: "Müller, Hans", amount: 100, notes: "Spende für Tempel" },
  ];

  const csv = generateCsvContent(columns, data);
  const rows = csv.split("\r\n");

  assert.equal(rows.length, 3);
  assert.equal(rows[0], "ชื่อผู้บริจาค,จำนวนเงิน (€),บันทึก");
  assert.equal(rows[1], 'สมชาย ใจดี,50,"ทำบุญค่าน้ำ, ค่าไฟ"');
  assert.equal(rows[2], '"Müller, Hans",100,Spende für Tempel');
});
