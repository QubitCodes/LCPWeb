import { Button } from "@src/components/ui/button";
import React from "react";

interface Props {
  children: React.ReactNode; // Note: lowercase 'children' is the standard React prop name
  onClick?: () => void;
  className?: string;
}

const AddButton: React.FC<Props> = ({ children, onClick, className }) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={`Button_class ${className}`}>
      {children}
    </Button>
  );
};

export default AddButton;