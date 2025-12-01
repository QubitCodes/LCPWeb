"use client";
import { AlertDialogBox } from "@src/components/common_components/AlertDialogBox";
import PageTitle from "@src/components/common_components/PageTitle";
import ReusableForm from "@src/components/common_components/ReusableForm";
import { DataTable } from "@src/components/output_components/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@src/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@src/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@src/components/ui/tabs";
import { GenerateColumns } from "@src/lib/getColumn";
import { IUser } from "@src/types/user";
import { ColumnDef } from "@tanstack/react-table";
import { User } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import place_holder from "../../../../public/place_holder.png";

import { Card } from "@src/components/ui/card";
import {
  ContractorFormInput,
  ContractorFormOutput,
  contractorSchema,
} from "@src/schemas/contrctorSchema";
import {
  useDeleteContractor,
  useGetAllContractor,
  useGetUserAddress,
  useUpsertContractor,
} from "../../../hooks/contractor/useContractor";
import { useContractorFormFields } from "../../../hooks/contractor/useContractorFields";
import Loading from "../country/loading";

const Admin = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [view, setView] = useState<boolean>(false);
  const [resetData, setResetData] = useState<
    {
      name: keyof ContractorFormInput;
      value: string;
    }[]
  >([]);

  const [alertopen, setAlertOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [addressOpen, setAddressOpen] = useState<boolean>(false);
  const [id, setid] = useState<number>(0);
  const { data: apiData, isLoading, isFetching } = useGetAllContractor(2);
  const { data: address } = useGetUserAddress(id);
  const fields = useContractorFormFields();

  const { mutate: SaveContractor } = useUpsertContractor();
  const { mutate: DeleteContractor } = useDeleteContractor();

  // const handleEdit = useCallback((row: IUser, action: string) => {
  //   console.log(row);
  //   setView(action === "view");
  //   setOpen(true);
  //   const formatted = formDefaultValue<Partial<ContractorFormInput>>({
  //     name: row.name,
  //     email: row.email,
  //   });
  //   setResetData(formatted);
  // }, []);

  const handleFormSubmit = (data: ContractorFormOutput) => {
    console.log("Data Sumitted", data);
    SaveContractor(
      { ...data, role_type: 2 },
      {
        onSuccess: () => {
          setResetData([]);
          setOpen(false);
        },
      }
    );
  };
  const onAddressView = useCallback(({ id }: IUser) => {
    console.log({ id });
    setid(id);
    setAddressOpen(true);
  }, []);
  const handleDelete = useCallback(({ id }: IUser) => {
    console.log({ id });
    setDeleteId(id);
    setAlertOpen(true);
  }, []);
  const confirmDelete = useCallback(() => {
    if (deleteId) DeleteContractor(deleteId);
  }, [deleteId, DeleteContractor]);

  const columns: ColumnDef<IUser>[] = useMemo(
    () =>
      GenerateColumns<IUser>(apiData?.data ?? [], {
        // onEdit: handleEdit,
        onDelete: handleDelete,
        onAddressView: onAddressView,
        excludeColumns: ["id", "addresses"],
      }),
    [apiData, handleDelete, onAddressView]
  );

  // if (isLoading || isFetching) {
  //   return (
  //     <div>
  //       <Loading />
  //     </div>
  //   );
  // }

  return (
    <div>
      <PageTitle title="Admin" description="Manage Your Admins Effectively" />

      <Dialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) {
            setView(false);
            setResetData([]);
          }
        }}>
        <DialogContent className="min-w-max w-full rounded-sm">
          <DialogHeader>
            <DialogTitle>{view ? "View Admin" : "Add New Admin"}</DialogTitle>
            <DialogDescription>View Admin details</DialogDescription>
          </DialogHeader>
          {/* <DialogTitle>{view ? "View Country" : "Add New Country"}</DialogTitle> */}
          <ReusableForm
            view={view}
            fields={fields}
            schema={contractorSchema}
            onSubmit={handleFormSubmit}
            submitButtonText="Save Contractor"
            resetdata={resetData}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={addressOpen}
        onOpenChange={(open) => {
          setAddressOpen(open);
        }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Admin Details</DialogTitle>
            <DialogDescription>View Admin details</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="address" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>
            <TabsContent value="address">
              {address?.data && address.data.length > 0 ? (
                address.data.map(
                  ({
                    id,
                    addressLine1,
                    city,
                    stateName,
                    districtName,
                    pincode,
                    phone,
                  }) => {
                    return (
                      <Card className="p-4 mt-4" key={id}>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-30 w-30">
                            <AvatarImage src={place_holder.src} alt="User" />
                            <AvatarFallback>
                              <User className="h-10 w-10" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid gap-2">
                            <div className="grid grid-cols-[60px_1fr] items-center gap-x-2 gap-y-1 pl-6 text-sm">
                              <span className="text-muted-foreground">
                                Address:
                              </span>
                              <span className="font-medium">
                                {addressLine1}
                              </span>
                              <span className="text-muted-foreground">
                                City:
                              </span>
                              <span className="font-medium">{city}</span>

                              <span className="text-muted-foreground">
                                District:
                              </span>
                              <span className="font-medium">
                                {districtName}
                              </span>
                              <span className="text-muted-foreground">
                                State:
                              </span>
                              <span className="font-medium">{stateName}</span>
                              <span className="text-muted-foreground">
                                Pincode:
                              </span>
                              <span className="font-medium">{pincode}</span>
                              <span className="text-muted-foreground">
                                Phone:
                              </span>
                              <span className="font-medium">{phone}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                )
              ) : (
                <div>
                  <Card>
                    <div className=" w-full flex justify-center">
                      <p>No Address Found</p>
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
            <TabsContent value="skills">
              <Card className="p-4 mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Skills information will be displayed here.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      {isFetching ||
        (isLoading && (
          <div>
            <Loading />
          </div>
        ))}
      {
        <DataTable
          EnableDialog
          isLoading={isLoading}
          paginationData={apiData?.misc}
          ButtonTitle="Add New Admin"
          title="Admin Data"
          columns={columns}
          openDialog={() => {
            setOpen(true);
            setResetData([]);
          }}
          data={apiData?.data ?? []}
        />
      }
      <AlertDialogBox
        onConfirm={confirmDelete}
        alertopen={alertopen}
        setAlertOpen={setAlertOpen}
      />
    </div>
  );
};

export default Admin;
