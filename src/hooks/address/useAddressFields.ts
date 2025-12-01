import { Field } from "@src/components/common_components/ReusableForm";
import { IDropdown } from "@src/hooks/dropDowns/useDropdown";
import { AddressFormInput } from "@src/schemas/addressSchema";
import { useMemo } from "react";
import { UseFormWatch } from "react-hook-form";
import { useGetAllDistricts } from "../dropDowns/useDistricts";
import { useStates } from "../dropDowns/useState";

export const useAddressFormFields = (watch: UseFormWatch<AddressFormInput>) => {
  const stateId = watch("state_id");
  console.log({ stateId });

  const { data: States = [] } = useStates();
  const { data: Districts = [] } = useGetAllDistricts(stateId);

  const fields: Field<AddressFormInput>[] = useMemo(
    () => [
      {
        name: "address_line_1",
        label: "Address",
        type: "text",
        placeholder: "Enter Address",
      },
      {
        name: "city",
        label: "City",
        type: "text",
        placeholder: "Enter City",
      },
      {
        name: "state_id",
        label: "State",
        type: "SearchableSelect",
        options: States?.map((c: IDropdown) => ({
          label: c.name,
          value: c.id,
        })),
        placeholder: "Select State Name",
      },
      {
        name: "district_id",
        label: "District",
        type: "SearchableSelect",
        options: Districts?.map((c: IDropdown) => ({
          label: c.name,
          value: c.id,
        })),
        placeholder: "Select District Name",
      },
      {
        name: "pincode",
        label: "Pincode",
        type: "text",
        placeholder: "Enter Pincode",
      },
      {
        name: "phone",
        label: "Phone",
        type: "text",
        placeholder: "Enter Phone Number",
      },
    ],
    [States, Districts]
  );

  return fields;
};
