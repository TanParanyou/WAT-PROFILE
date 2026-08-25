import assert from "node:assert/strict";
import test from "node:test";
import { createDisclosureState } from "./useDisclosure";

test("createDisclosureState starts with default closed state", () => {
  const disclosure = createDisclosureState();
  assert.equal(disclosure.isOpen, false);
  assert.equal(disclosure.data, null);
});

test("createDisclosureState opens, closes, and toggles state correctly", () => {
  const disclosure = createDisclosureState();

  disclosure.open();
  assert.equal(disclosure.isOpen, true);

  disclosure.close();
  assert.equal(disclosure.isOpen, false);

  disclosure.toggle();
  assert.equal(disclosure.isOpen, true);
});

test("createDisclosureState attaches and clears typed payload", () => {
  interface UserItem {
    id: number;
    name: string;
  }

  let openedData: UserItem | undefined;
  let closed = false;

  const disclosure = createDisclosureState<UserItem>({
    onOpen: (d) => {
      openedData = d;
    },
    onClose: () => {
      closed = true;
    },
  });

  const payload: UserItem = { id: 101, name: "Somchai" };

  disclosure.open(payload);
  assert.equal(disclosure.isOpen, true);
  assert.deepEqual(disclosure.data, payload);
  assert.deepEqual(openedData, payload);

  disclosure.close();
  assert.equal(disclosure.isOpen, false);
  assert.equal(disclosure.data, null);
  assert.equal(closed, true);
});
