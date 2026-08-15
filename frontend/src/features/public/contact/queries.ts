import { useMutation } from "@tanstack/react-query";
import { submitPublicContact } from "./api";
import type { ContactSubmitInput } from "./types";

export function useSubmitPublicContact() {
  return useMutation({
    mutationFn: (input: ContactSubmitInput) => submitPublicContact(input),
  });
}
