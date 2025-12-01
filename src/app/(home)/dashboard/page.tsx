import { cn } from "@src/lib/utils";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import DashboardTitle from "./DashboardTitle";

// interface DashboardProps {}

function page() {
  const queryClient = new QueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <div className="p-3 h-full pl-0 pb-0">
        <DashboardTitle />
        <div
          className={cn(
            "grid grid-cols-1 gap-4 mt-4"
            // ,"lg:grid-cols-10"
          )}></div>
        Work in progress.....
      </div>
    </HydrationBoundary>
  );
}

export default page;
