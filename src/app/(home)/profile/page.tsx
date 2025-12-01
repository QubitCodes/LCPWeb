"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Avatar, AvatarFallback, AvatarImage } from "@src/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@src/components/ui/tabs";

import ReusableForm from "@src/components/common_components/ReusableForm";
import { useUpsertAddress } from "@src/hooks/address/useAddress";
import { useAddressFormFields } from "@src/hooks/address/useAddressFields";
import { getEmptyDefaults } from "@src/lib/commonFns";
import {
  addresSchema,
  AddressFormInput,
  AddressFormOutput,
} from "@src/schemas/addressSchema";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import cover_img from "../../../../public/cover_image.jpg";
import Address from "./Address";
import { ForgotPassword } from "./ForgotPassword";
import OverView from "./overView";

interface User {
  id: number;
  name: string;
  email: string;
  role_type: number;
}

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isAddressModalOpen, setAddressModalOpen] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<boolean>(false);
  const { mutate: upsertAddress } = useUpsertAddress();

  // 1. Create the form instance here, in the parent component.
  const form = useForm<AddressFormInput>({
    // The resolver was missing, which is needed for validation.
    resolver: zodResolver(addresSchema),
  });

  console.log(form.formState.errors);

  // 2. Pass the watch function from the created form instance.
  const AddressFormFields = useAddressFormFields(form.watch);

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      setUser(JSON.parse(userString));
    }
  }, []);

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("") || "U";

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Card className="border-none w-full h-full bg-sidebar pb-0 pt-0 overflow-hidden">
        <div className="relative h-32 w-full lg:h-48">
          <Image src={cover_img} alt="Cover" fill className="object-fit" />
          <div className="absolute flex items-end gap-4 bottom-0 left-6 transform translate-y-1/2">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage
                src="https://github.com/shadcn.png"
                alt={user.name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <CardHeader className="pt-12  px-6">
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </CardHeader>
        <CardContent className="border-none px-6 pb-6">
          <Tabs defaultValue="overview" className="w-full ">
            <TabsList className="grid w-full grid-cols-3 ">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-6">
              <OverView user={user} setProfileModalOpen={setProfileModalOpen} />
            </TabsContent>
            <TabsContent value="address" className="pt-6">
              <Address
                form={form}
                setSelectedAddress={setSelectedAddress}
                setAddressModalOpen={setAddressModalOpen}
              />
            </TabsContent>
            <TabsContent value="security" className="pt-6">
              <ForgotPassword setPasswordModalOpen={setPasswordModalOpen} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isProfileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          {/* <ReusableForm fields={profileFormFields} schema={profileSchema} onSubmit={(data) => console.log(data)} /> */}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Address Dialog */}
      <Dialog open={isAddressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className=" min-w-max">
          <DialogHeader>
            <DialogTitle>
              {selectedAddress ? "Edit Address" : "Add Address"}
            </DialogTitle>
          </DialogHeader>
          <ReusableForm
            fields={AddressFormFields}
            schema={addresSchema}
            onSubmit={(data: AddressFormOutput) => {
              upsertAddress(data, {
                onSuccess: () => {
                  setAddressModalOpen(false);
                  form.reset(getEmptyDefaults(addresSchema));
                },
              });
            }}
            // 3. Pass the entire form instance down to the ReusableForm
            formInstance={form}
          />
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          {/* <ReusableForm fields={changePasswordFields} schema={changePasswordSchema} onSubmit={(data) => console.log(data)} /> */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
