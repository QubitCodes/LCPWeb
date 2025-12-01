import { Field } from "@src/components/common_components/ReusableForm";
import {
  IDropdown,
  useDivisionDropdown,
} from "@src/hooks/dropDowns/useDropdown";
import { CountryFormInput } from "@src/schemas/countryShema";
import { useMemo } from "react";

export const useCountryFormFields = () => {
  const { data: divisions = [] } = useDivisionDropdown();

  const fields: Field<CountryFormInput>[] = useMemo(
    () => [
      {
        name: "name",
        label: "Name",
        type: "text",
        placeholder: "Enter Name",
      },
      {
        name: "code",
        label: "Code",
        type: "text",
        placeholder: "Enter Code",
      },
      {
        name: "currency",
        label: "Currency",
        type: "text",
        placeholder: "Enter Currency",
      },
      {
        name: "timezone",
        label: "Timezone",
        type: "text",
        placeholder: "Enter Timezone",
      },
      {
        name: "divisionId",
        label: "Division",
        type: "SearchableSelect",
        options: divisions?.map((c: IDropdown) => ({
          label: c.name,
          value: c.id,
        })),
        placeholder: "Select Division",
      },
    ],
    [divisions]
  );

  return fields;
};
