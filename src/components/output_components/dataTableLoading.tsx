import { Skeleton } from "@src/components/ui/skeleton";
import { Card, CardContent } from "../ui/card";
import AnimatedDivDown from "../animated_components/AnimatedDivDown";

function DataTableLoading() {
  return (
    <AnimatedDivDown delay={0.3} className="rounded-xl">
      <div className="grid grid-cols-12 gap-4 pt-2">
        <div className="flex col-span-12 gap-4 justify-between w-full">
          <div className="col-span-5 w-full gap-4">
            <Card className="col-span-5 p-2 bg-skeletoncard rounded-3xl border-none shadow-none">
              <Skeleton className="bg-skeleton h-6 w-full rounded-2xl" />
            </Card>
          </div>
          <div className="flex col-span-2 w-full gap-4 justify-end">
            <Card className="w-1/4 p-2 bg-skeletoncard rounded-3xl border-none shadow-none">
              <Skeleton className="bg-skeleton h-6 w-full rounded-2xl" />
            </Card>
            <Card className="w-1/4 p-2 bg-skeletoncard rounded-3xl border-none shadow-none">
              <Skeleton className="bg-skeleton h-6 w-full rounded-2xl" />
            </Card>
          </div>
        </div>
        <div className="grid col-span-12 gap-4">
          <Card className="bg-skeletoncard rounded-2xl pt-4 border-none shadow-none">
            <CardContent className="grid grid-cols-3 pt-2 items-center gap-4">
              <div className="flex col-span-12 gap-4">
                <Skeleton className="bg-skeleton h-6 w-1/4 rounded-2xl" />
              </div>
              <div className="col-span-12 grid gap-y-1">
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
                <Skeleton className="bg-skeleton h-10 w-full rounded-2xl" />
              </div>
              <div className="flex col-span-12 gap-4 justify-between">
                <Skeleton className="bg-skeleton h-6 w-1/6 rounded-2xl" />
                <Skeleton className="bg-skeleton h-6 w-1/6 rounded-2xl" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedDivDown>
  );
}

export default DataTableLoading;
