"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
export default function Error({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          {error.message}
        </h1>
        <p className="text-lg font-medium text-gray-500">
          {"An error occurred. Please try again later."}
        </p>
        <Button
          variant={"outline"}
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          <RefreshCcw size={25} />
          Reload
        </Button>
      </div>
    </div>
  );
}