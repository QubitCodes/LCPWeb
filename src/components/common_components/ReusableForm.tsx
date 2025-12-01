"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import {
  DefaultValues,
  FieldPath,
  FieldValues,
  FormProvider,
  PathValue,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { z, ZodObject } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { SearchableSelect } from "./SearchbleSelect";

export interface Field<T extends FieldValues> {
  type: string;
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  options?: { label: string; value: number }[];
  placeholder?: string;
  revalidateOn?: FieldPath<T>[];
  multiple?: boolean;
}

interface ReusableFormProps<S extends ZodObject> {
  schema: S;
  fields: Field<z.input<S>>[];
  onSubmit: (values: z.output<S>) => void;
  formTitle?: string;
  setReset?: (fn: () => void) => void;
  submitButtonText?: string;
  view?: boolean;
  resetdata?: {
    name: FieldPath<z.input<S>>;
    value: PathValue<z.input<S>, FieldPath<z.input<S>>>;
  }[];
  formInstance?: UseFormReturn<z.input<S>, undefined, z.output<S>>;
}

export default function ReusableForm<S extends ZodObject>({
  schema,
  fields,
  view,
  onSubmit,
  resetdata,
  formTitle,
  setReset,
  submitButtonText = "Submit",
  formInstance,
}: ReusableFormProps<S>) {
  type FormInput = z.input<S>;
  type FormOutput = z.output<S>;

  // Use the provided form instance, or create a new one if not provided.
  const internalForm = useForm<FormInput, undefined, FormOutput>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {} as DefaultValues<FormInput>,
  });

  const form = formInstance || internalForm;

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
    reset,
    setValue,
  } = form;

  console.log(errors);

  // ✅ OPTIMIZED: Build dependency map once
  const dependencyMap = useMemo(() => {
    const map = new Map<FieldPath<FormInput>, FieldPath<FormInput>[]>();
    fields.forEach((field) => {
      if (field.revalidateOn && field.revalidateOn.length > 0) {
        field.revalidateOn.forEach((dependency) => {
          if (!map.has(dependency)) {
            map.set(dependency, []);
          }
          map.get(dependency)!.push(field.name);
        });
      }
    });
    return map;
  }, [fields]);

  const dependencyFields = useMemo(
    () => Array.from(dependencyMap.keys()),
    [dependencyMap]
  );

  const allValues = watch();

  useEffect(() => {
    dependencyFields.forEach((depField) => {
      const fieldsToRevalidate = dependencyMap.get(depField) || [];

      fieldsToRevalidate.forEach((fieldName) => {
        const fieldValue = allValues[fieldName];
        // Only trigger if the dependent field has a value
        if (fieldValue !== undefined && fieldValue !== "") {
          trigger(fieldName);
        }
      });
    });
    // ✅ FIX: Only depend on dependency field values, not all values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencyFields.map((field) => allValues[field]).join(","),
    dependencyMap,
    trigger,
  ]);

  useEffect(() => {
    if (resetdata) {
      const values = resetdata.reduce(
        (acc, field) => ({ ...acc, [field.name]: field.value }),
        {} as DefaultValues<FormInput>
      );
      reset(values, {
        keepErrors: false,
        keepDirty: false,
        keepTouched: false,
      });
    }
  }, [resetdata, reset]);

  const emptyValues = fields.reduce(
    (acc, field) => ({ ...acc, [field.name]: "" }),
    {} as DefaultValues<FormInput>
  );

  const resetForm = useCallback(() => {
    reset(emptyValues, {
      keepErrors: false,
      keepDirty: false,
      keepTouched: false,
    });
  }, [emptyValues, reset]);

  useEffect(() => {
    if (setReset) {
      setReset(resetForm);
    }
  }, [setReset, resetForm]);

  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit((values) => {
          onSubmit(values);
        })}
        className="w-full">
        {formTitle && (
          <h2 className="text-page-title font-bold py-4">{formTitle}</h2>
        )}
        <div
          className={`${
            fields.length > 4 ? "grid-cols-2" : "grid-cols-1"
          } w-full grid gap-0`}>
          {fields.map((field) => {
            return (
              <div key={field.name} className="mb-[1rem] relative w-full">
                {field.type !== "checkbox" && (
                  <Label className="p-2 font-semibold" htmlFor={field.name}>
                    {field.label}
                  </Label>
                )}
                {(() => {
                  if (field.type === "select") {
                    return (
                      <Select
                        disabled={view}
                        name={field.name}
                        value={
                          watch(field.name) !== undefined
                            ? String(watch(field.name))
                            : ""
                        }
                        onValueChange={(value) => {
                          // ✅ Convert back to number before storing
                          const numericValue = Number(value);
                          setValue(
                            field.name,
                            numericValue as PathValue<
                              FormInput,
                              typeof field.name
                            >,
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                            }
                          );
                        }}>
                        <SelectTrigger className="w-full border  border-form">
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>

                        <SelectContent>
                          {field.options?.map((option) => (
                            // ✅ Convert to string for Radix Select compatibility
                            <SelectItem
                              key={option.value}
                              value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  }
                  if (field.type === "SearchableSelect") {
                    if (field.multiple) {
                      return (
                        <SearchableSelect
                          disabled={view}
                          multiple
                          value={
                            (watch(field.name) as (string | number)[]) || []
                          }
                          options={
                            (field.options as {
                              label: string;
                              value: string | number;
                            }[]) || []
                          }
                          onChange={(values) =>
                            setValue(
                              field.name,
                              values as PathValue<FormInput, typeof field.name>,
                              { shouldValidate: true, shouldDirty: true }
                            )
                          }
                          placeholder={field.placeholder}
                        />
                      );
                    } else {
                      return (
                        <SearchableSelect
                          disabled={view}
                          value={
                            watch(field.name) as string | number | undefined
                          }
                          options={
                            (field.options as {
                              label: string;
                              value: string | number;
                            }[]) || []
                          }
                          onChange={(v: string | number) =>
                            setValue(
                              field.name,
                              Number(v) as PathValue<
                                FormInput,
                                typeof field.name
                              >,
                              { shouldValidate: true, shouldDirty: true }
                            )
                          }
                          placeholder={field.placeholder}
                        />
                      );
                    }
                  }

                  if (field.type === "textarea") {
                    return (
                      <textarea
                        className="w-full min-w-[350px] border-2 rounded-sm border-form bg-white p-2"
                        readOnly={view}
                        disabled={view}
                        id={field.name}
                        placeholder={field.placeholder}
                        {...register(field.name)}
                      />
                    );
                  }

                  if (field.type === "number") {
                    return (
                      <Input
                        className="w-full min-w-[350px] rounded-sm border border-form bg-white p-2"
                        type="number"
                        readOnly={view}
                        disabled={view}
                        id={field.name}
                        placeholder={field.placeholder}
                        {...register(field.name)}
                      />
                    );
                  }

                  if (field.type === "checkbox") {
                    const currentValue = watch(field.name) as boolean;

                    return (
                      <div
                        style={{ margin: "2px" }}
                        className="flex items-center gap-2">
                        <Switch
                          name={field.name}
                          aria-readonly={view}
                          disabled={view}
                          id={String(field.name)}
                          checked={currentValue || false}
                          onCheckedChange={(checked) => {
                            setValue(
                              field.name,
                              checked as PathValue<
                                FormInput,
                                typeof field.name
                              >,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            );
                          }}
                          className="m-0"
                        />
                        <span>{currentValue ? "Active" : "In-Active"}</span>
                      </div>
                    );
                  }

                  return (
                    <Input
                      className={`${
                        view
                          ? " focus:cursor-not-allowed  rounded-sm focus:outline-none focus:border-none focus:ring-none"
                          : ""
                      } w-full min-w-[350px] rounded-sm border border-form bg-white`}
                      type={field.type || "text"}
                      id={field.name}
                      readOnly={view}
                      disabled={view}
                      placeholder={field.placeholder}
                      {...register(field.name)}
                    />
                  );
                })()}

                {errors[field.name] && (
                  <p className="text-red-400 p-1 absolute px-2">
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="w-full mt-4 flex justify-end items-center">
          {!view && (
            <Button
              className="Button_class rounded-sm"
              variant="outline"
              type="submit">
              {submitButtonText}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
