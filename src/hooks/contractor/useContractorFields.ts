import { Field } from "@src/components/common_components/ReusableForm";
import { ContractorFormInput } from "@src/schemas/contrctorSchema";
import { useMemo } from "react";

export const useContractorFormFields = () => {
  const fields: Field<ContractorFormInput>[] = useMemo(
    () => [
      {
        name: "name",
        label: "Name",
        type: "text",
        placeholder: "Enter your name",
      },
      {
        name: "email",
        label: "Email",
        type: "text",
        placeholder: "Enter your email",
      },
      {
        name: "password",
        label: "Password",
        type: "text",
        placeholder: "Enter your password",
      },
    ],
    []
  );

  return fields;
};
