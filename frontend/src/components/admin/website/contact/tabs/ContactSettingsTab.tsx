"use client";

import { useFormContext } from "react-hook-form";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";

interface ContactSettingsTabProps {
  disabled?: boolean;
}

export function ContactSettingsTab({ disabled = false }: ContactSettingsTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();

  const facebookUrl = watch("content.facebook");
  const instagramUrl = watch("content.instagram");

  return (
    <div className="space-y-6">
      {/* Basic Contact Info */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Basic Details</h2>
          <p className="text-xs text-zinc-500">Address, phone, and email information.</p>
        </div>

        <LocalizedTextareaFields
          label="Address"
          name="content.address"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={3}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Phone</label>
            <input
              type="text"
              {...register("content.phone")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Email</label>
            <input
              type="email"
              {...register("content.email")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Opening Hours */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Opening Hours</h2>
          <p className="text-xs text-zinc-500">Specify when the temple is open.</p>
        </div>

        <LocalizedTextFields
          label="Days"
          name="content.opening_days"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Time Range (e.g. 09.00 - 21.00)</label>
          <input
            type="text"
            {...register("content.opening_time")}
            disabled={disabled}
            className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
          />
        </div>

        <LocalizedTextareaFields
          label="Remark / Note"
          name="content.opening_remark"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={2}
        />
      </div>

      {/* Social Media */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">Social Media</h2>
            <p className="text-xs text-zinc-500">Facebook, Instagram, and Messenger links.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_social"
              {...register("content.show_social")}
              disabled={disabled}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
            />
            <label htmlFor="show_social" className="text-xs font-medium text-zinc-700 select-none">
              Show Social section
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700">Facebook URL</label>
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-zinc-600 hover:text-zinc-950 underline font-medium"
                >
                  Test Link ↗
                </a>
              )}
            </div>
            <input
              type="text"
              {...register("content.facebook")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700">Instagram URL</label>
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-zinc-600 hover:text-zinc-950 underline font-medium"
                >
                  Test Link ↗
                </a>
              )}
            </div>
            <input
              type="text"
              {...register("content.instagram")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Messenger Name</label>
            <input
              type="text"
              {...register("content.messenger")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bank Account */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">Bank Account Details</h2>
            <p className="text-xs text-zinc-500">Donation bank transfer details.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="show_bank"
              {...register("content.show_bank")}
              disabled={disabled}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950"
            />
            <label htmlFor="show_bank" className="text-xs font-medium text-zinc-700 select-none">
              Show Bank details
            </label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Bank Name</label>
            <input
              type="text"
              {...register("content.bank_name")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">Account Name</label>
            <input
              type="text"
              {...register("content.bank_account")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">IBAN</label>
            <input
              type="text"
              {...register("content.bank_iban")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700">BIC / SWIFT</label>
            <input
              type="text"
              {...register("content.bank_bic")}
              disabled={disabled}
              className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
