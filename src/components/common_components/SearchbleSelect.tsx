"use client";

import { cn } from "@src/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type SingleSelectProps = {
  multiple?: false;
  value: number | string | undefined;
  onChange: (value: number | string) => void;
};

type MultiSelectProps = {
  multiple: true;
  value: (number | string)[] | undefined;
  onChange: (value: (number | string)[]) => void;
};

type BaseProps = {
  options: { label: string; value: number | string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

type SearchableSelectProps = BaseProps & (SingleSelectProps | MultiSelectProps);

export function SearchableSelect(props: SearchableSelectProps) {
  const {
    value,
    options,
    onChange,
    placeholder = "Select option",
    className,
    multiple = false,
    disabled = false,
  } = props;

  const [open, setOpen] = React.useState(false);

  // Normalize value to array for easier handling
  const selectedValues = React.useMemo((): (number | string)[] => {
    if (multiple) {
      return Array.isArray(value) ? value : [];
    }
    return value !== undefined && !Array.isArray(value) ? [value] : [];
  }, [value, multiple]);

  // Create selected items with both value and label
  const selectedItems = React.useMemo(() => {
    return selectedValues
      .map((val) => {
        const option = options.find((opt) => opt.value === val);
        return option ? { value: val, label: option.label } : null;
      })
      .filter(
        (item): item is { value: number | string; label: string } =>
          item !== null
      );
  }, [selectedValues, options]);

  const handleSelect = (selectedValue: number | string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter((v) => v !== selectedValue)
        : [...currentValues, selectedValue];
      (onChange as MultiSelectProps["onChange"])(newValues);
    } else {
      (onChange as SingleSelectProps["onChange"])(selectedValue);
      setOpen(false);
    }
  };

  const handleRemove = React.useCallback(
    (
      valueToRemove: number | string,
      e: React.MouseEvent | React.PointerEvent
    ) => {
      e.preventDefault();
      e.stopPropagation();

      if (multiple && Array.isArray(value)) {
        const newValues = value.filter((v) => v !== valueToRemove);
        (onChange as MultiSelectProps["onChange"])(newValues);
      }
    },
    [multiple, value, onChange]
  );

  const handleClear = React.useCallback(() => {
    if (multiple && Array.isArray(value)) {
      (onChange as MultiSelectProps["onChange"])([]);
    }
  }, [multiple, value, onChange]);

  const displayText = React.useMemo(() => {
    if (selectedItems.length === 0) return placeholder;

    if (multiple) {
      return null; // Will render badges instead
    }

    return selectedItems[0]?.label;
  }, [selectedItems, placeholder, multiple]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between border-2 border-sidebar hover:text-black text-left font-normal",
            !selectedItems.length && "text-muted-foreground",
            multiple &&
              selectedItems.length > 0 &&
              "h-auto min-h-[2.5rem] py-2",
            className
          )}>
          <div className="flex flex-wrap gap-1 flex-1">
            {multiple && selectedItems.length > 0 ? (
              <div className="flex  items-center gap-1 max-w-[350px]">
                {selectedItems.slice(0, 4).map((item) => (
                  <Badge
                    key={item.value}
                    variant="secondary"
                    className="bg-primary gap-1 flex items-center pr-1">
                    <span className="truncate">{item.label}</span>
                    <div
                      className="ml-1 cursor-pointer rounded-sm hover:bg-accent"
                      onPointerDown={(e) => handleRemove(item.value, e)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}>
                      <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                    </div>
                  </Badge>
                ))}

                {selectedItems.length > 4 && (
                  <Badge
                    variant="secondary"
                    className="bg-muted text-foreground cursor-default">
                    +{selectedItems.length - 4} more
                  </Badge>
                )}
                <div
                  className="ml-1 rounded-sm cursor-pointer hover:text-primary"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleClear();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}>
                  <X className="h-3 w-3 cursor-pointer" />
                </div>
              </div>
            ) : (
              <span>{displayText}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center justify-between">
                    {option.label}
                    {isSelected && <Check className="h-4 w-4 opacity-70" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
