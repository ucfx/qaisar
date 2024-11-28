import { Button } from "@/components/ui/button";
import { FetchOptions, useFetch } from "@/hooks/useFetch";
import { TableCommand } from "@/types";
import { Square, RotateCcw, Play, Logs } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner"

type FetchResponse = {
  success: boolean;
  message: string;
};

export function CommandActions({ command }: { command: TableCommand }) {
  const searchParams = useSearchParams();
  const BASE_URL = 'http://localhost:5000/commands';
  const [urlData, setUrlData] = useState<{ url: string, options?: FetchOptions }>({ url: '', options: {} });
  const { data, loading, error } = useFetch<FetchResponse>(urlData.url, urlData.options);

  const handleStartCommand = (commandId: string) => {
    setUrlData({ url: `${BASE_URL}/run/${commandId}`, options: { method: 'POST' } });
  }

  const handleStopCommand = (commandId: string) => {
    setUrlData({ url: `${BASE_URL}/stop/${commandId}`, options: { method: 'POST' } });
  }

  const handleResetCommand = (commandId: string) => {
    setUrlData({ url: `${BASE_URL}/reset/${commandId}`, options: { method: 'POST' } });
  }

  useEffect(() => {
    if (data) {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error])

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStartCommand(command.id)}
        disabled={loading}
      >
        <Play className="h-4 w-4 text-green-400 " />
        Run
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStopCommand(command.id)}
        disabled={loading}
      >
        <Square className="h-4 w-4 text-red-400" />
        Stop
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResetCommand(command.id)}
        disabled={loading}
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </Button>
      <Button asChild
        variant="outline"
        size="sm"
      >
        <Link href={`/?q=${command.id}&name=${command.command}`} className={`${searchParams.get('q') === command.id ? 'opacity-50 pointer-events-none' : ''}`}>
          <Logs className="h-4 w-4" />
          Logs
        </Link>
      </Button>
    </div>
  );
}
