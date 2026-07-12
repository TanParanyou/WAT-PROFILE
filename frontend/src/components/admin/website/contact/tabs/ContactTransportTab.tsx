"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { LocalizedTextFields } from "@/components/forms/LocalizedTextFields";
import { LocalizedTextareaFields } from "@/components/forms/LocalizedTextareaFields";
import { Button } from "@/components/ui/Button";

interface ContactTransportTabProps {
  disabled?: boolean;
}

export function ContactTransportTab({ disabled = false }: ContactTransportTabProps) {
  const { register, control, setValue, watch, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "content.public_transport",
  });

  const mapEmbedUrl = watch("content.map_embed_url");
  const directionsUrl = watch("content.directions_url");

  return (
    <div className="space-y-6">
      {/* Map Embed Settings */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Map Embedding</h2>
          <p className="text-xs text-zinc-500">Google Maps location mapping.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Google Maps Embed URL</label>
          <input
            type="text"
            {...register("content.map_embed_url")}
            disabled={disabled}
            className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            placeholder="https://maps.google.com/maps?q=..."
          />
          {mapEmbedUrl && (
            <div className="mt-2 border border-zinc-200 bg-zinc-50 p-2 rounded">
              <p className="text-[10px] font-mono text-zinc-500 mb-1">Live Map Preview:</p>
              <div className="relative w-full h-48 overflow-hidden rounded border border-zinc-200">
                <iframe
                  src={mapEmbedUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-700">Location Name (e.g. Wat Loung Por Sai)</label>
          <input
            type="text"
            {...register("content.map_location_name")}
            disabled={disabled}
            className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
          />
        </div>
      </div>

      {/* Parking and Directions URL */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">General Transport</h2>
          <p className="text-xs text-zinc-500">Parking details and navigation link.</p>
        </div>

        <LocalizedTextFields
          label="Parking Information"
          name="content.parking"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-zinc-700">GPS Directions URL</label>
            {directionsUrl && (
              <a
                href={directionsUrl}
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
            {...register("content.directions_url")}
            disabled={disabled}
            className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none"
            placeholder="https://www.google.com/maps/search/?api=1&..."
          />
        </div>
      </div>

      {/* Car Directions */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">Car Directions</h2>
          <p className="text-xs text-zinc-500">Guidance for people arriving by car.</p>
        </div>

        <LocalizedTextareaFields
          label="Directions"
          name="content.car_directions"
          register={register as any}
          setValue={setValue as any}
          watch={watch as any}
          errors={errors as any}
          disabled={disabled}
          rows={3}
        />
      </div>

      {/* Public Transport List */}
      <div className="space-y-4 bg-white border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-950">Public Transport Routes</h2>
            <p className="text-xs text-zinc-500">Train, bus, or other public routing options.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={<Plus size={14} />}
            disabled={disabled}
            onClick={() => append({ icon: "train", text: { th: "", en: "", de: "" } })}
          >
            Add Route
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="relative border border-zinc-100 p-4 pt-10 space-y-4 bg-zinc-50/50">
            <div className="absolute right-2 top-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-zinc-200"
                icon={<Trash2 size={14} />}
                disabled={disabled}
                onClick={() => remove(index)}
              >
                Delete Route
              </Button>
            </div>

            <div className="space-y-1.5 w-full sm:w-1/3">
              <label className="text-xs font-medium text-zinc-700 font-mono">Route Icon</label>
              <select
                {...register(`content.public_transport.${index}.icon`)}
                disabled={disabled}
                className="w-full border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-950 focus:outline-none bg-white"
              >
                <option value="train">Train</option>
                <option value="bus">Bus</option>
                <option value="car">Car</option>
              </select>
            </div>

            <LocalizedTextareaFields
              label="Instruction text"
              name={`content.public_transport.${index}.text`}
              register={register as any}
              setValue={setValue as any}
              watch={watch as any}
              errors={errors as any}
              disabled={disabled}
              rows={2}
            />
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-zinc-200">
            No public transport routes configured.
          </div>
        )}
      </div>
    </div>
  );
}
