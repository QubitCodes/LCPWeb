"use client";
import { Button } from "@src/components/ui/button";
import { Separator } from "@src/components/ui/separator";
import { useGetCrntUserAddress } from "@src/hooks/address/useAddress";
import {
  addresSchema,
  AddressFormInput,
  AddressFormOutput,
} from "@src/schemas/addressSchema";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { getEmptyDefaults } from "./../../../lib/commonFns";

interface IAddress {
  id: number;
  addressLine1: string;
  city: string;
  districtName: string;
  stateName: string;
  pincode: string;
  phone: string;
  districtId: number;
  stateId: number;
}

interface AddressProps {
  setAddressModalOpen: (value: boolean) => void;
  setSelectedAddress: (value: boolean) => void;
  form?: UseFormReturn<AddressFormInput, undefined, AddressFormOutput>;
}

const Address = ({
  setAddressModalOpen,
  form,
  setSelectedAddress,
}: AddressProps) => {
  const { data: addressData, isLoading: isAddressLoading } =
    useGetCrntUserAddress();
  const [currentPage, setCurrentPage] = useState(0);
  const addressesPerPage = 2;

  const totalAddresses = addressData?.data?.length || 0;
  const totalPages = Math.ceil(totalAddresses / addressesPerPage);

  // Calculate the addresses to display for the current page
  const displayedAddresses = addressData?.data?.slice(
    currentPage * addressesPerPage,
    (currentPage + 1) * addressesPerPage
  );

  const handleClick = () => {
    setSelectedAddress(false);
    const defaultvalues = getEmptyDefaults(addresSchema);
    form?.reset(defaultvalues);
    setAddressModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Address Details</h3>
        <Button variant="outline" onClick={handleClick}>
          Add Address
        </Button>
      </div>
      <div className="rounded-md border p-4">
        {isAddressLoading && <p>Loading address...</p>}
        {!isAddressLoading &&
        displayedAddresses &&
        displayedAddresses.length > 0
          ? displayedAddresses.map((address: IAddress, index: number) => (
              <div key={address.id}>
                <div className="flex justify-between items-start">
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{address.addressLine1}</p>
                    <p className="text-muted-foreground">
                      {address.city}, {address.districtName},{" "}
                      {address.stateName} - {address.pincode}
                    </p>
                    <p className="text-muted-foreground">
                      Phone: {address.phone}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedAddress(true);
                      form?.reset({
                        id: address.id,
                        address_line_1: address.addressLine1,
                        city: address.city,
                        district_id: address.districtId,
                        state_id: address.stateId,
                        pincode: address.pincode,
                        phone: address.phone,
                      });
                      setAddressModalOpen(true);
                    }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                {index < displayedAddresses.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))
          : !isAddressLoading && (
              <p className="text-sm text-muted-foreground">
                No addresses found.
              </p>
            )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-end items-center space-x-2 mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 0}>
            <span className="sr-only">Previous Page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={currentPage >= totalPages - 1}>
            <span className="sr-only">Next Page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Address;
