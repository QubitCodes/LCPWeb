import {
  ZodBoolean,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  ZodString,
  z,
} from "zod";

type ShapeOf<T extends ZodObject<ZodRawShape>> = T["shape"];

export function getEmptyDefaults<T extends ZodObject<ZodRawShape>>(
  schema: T
): z.input<T> {
  const shape: ShapeOf<T> = schema.shape as ShapeOf<T>;

  const result = Object.fromEntries(
    Object.entries(shape).map(([key, field]) => {
      const unwrapped =
        field instanceof ZodOptional ? field._def.innerType : field;

      // Optional fields should default to undefined
      if (field instanceof ZodOptional) {
        return [key, undefined];
      }

      // string fields → ""
      if (unwrapped instanceof ZodString) {
        return [key, ""];
      }

      // number fields → undefined (to allow placeholders to show)
      if (unwrapped instanceof ZodNumber) {
        return [key, undefined];
      }

      // boolean fields → false
      if (unwrapped instanceof ZodBoolean) {
        return [key, false];
      }

      // fallback → null (rare)
      return [key, null];
    })
  );

  return result as z.input<T>;
}

export function formDefaultValue<T extends object>(data: T) {
  return (Object.keys(data) as (keyof T)[]).map((key) => ({
    name: key,
    value: data[key],
  }));
}

// auto default values
