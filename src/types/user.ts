export interface IAddress {
  id: number;
  addressLine1: string;
  city: string;
  pincode: string;
  phone: string;
  state: string;
  district: string;
}

export interface IUser {
  id: number;
  name: string;
  email: string;
  addresses: IAddress[];
}
export interface Address {
  id: number;
  userId: number;
  addressLine1: string;
  city: string;
  districtId: number;
  stateId: number;
  pincode: string;
  phone: string;
  createdAt: string; // or Date if you want: Date
  updatedAt: string; // or Date if you want: Date
  isActive: boolean;
  createdBy: number | null;
  updatedBy: number | null;
  deletedBy: number | null;
  deletedAt: string | null; // or Date | null
  stateName: string;
  districtName: string;
}
