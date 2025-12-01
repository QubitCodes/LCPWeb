import { Button } from "@src/components/ui/button";
import { Separator } from "@src/components/ui/separator";
import { Edit } from "lucide-react";
interface User {
  id: number;
  name: string;
  email: string;
  role_type: number;
}
interface props {
  setProfileModalOpen: (value: boolean) => void;
  user: User;
}

const OverView = ({ setProfileModalOpen, user }: props) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Account Details</h3>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setProfileModalOpen(true)}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4 rounded-md border p-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Name</span>
          <span>{user.name}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Email</span>
          <span>{user.email}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Role</span>
          <span>{user.role_type === 2 ? "Admin" : "Contractor"}</span>
        </div>
      </div>
    </div>
  );
};

export default OverView;
