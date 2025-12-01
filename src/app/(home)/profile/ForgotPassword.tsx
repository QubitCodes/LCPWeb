import { Button } from "@src/components/ui/button";
interface props {
  setPasswordModalOpen: (value: boolean) => void;
}

export const ForgotPassword = ({ setPasswordModalOpen }: props) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Security</h3>
      <div className="rounded-md border p-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Password</span>
          <Button variant="outline" onClick={() => setPasswordModalOpen(true)}>
            Change Password
          </Button>
        </div>
      </div>
    </div>
  );
};
