"use client";
import { socket } from "@/lib/socket";
import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

type LogsProps = {
  searchParams: { q: string | undefined, name: string | undefined };
  initLogs: string[];
}

export default function Logs({ initLogs, searchParams }: LogsProps) {
  const [logs, setLogs] = useState<string[]>(initLogs);
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [emitCount, setEmitCount] = useState(0);
  const MAX_EMITS = 10000;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    console.log('emitCount',emitCount)
    if(emitCount > MAX_EMITS) {
      socket.emit('leave-room', searchParams.q);
      setEmitCount(0);
    }
  }, [emitCount])


  useEffect(() => {
    function onNewLog(log: string) {
      const newLog = log.split(/\r?\n/);
      setLogs(prev => [...prev, ...newLog]);
      setEmitCount(prev => prev + 1);
    }

    function onResetCommand() {
      setLogs([]);
    }

    function onLeft(msg: string) {
      toast.info(msg, {
        action: {
          label: <RotateCcw className="h-4 w-4" />,
          onClick: () => {
            socket.emit('join-room', searchParams.q);
          }
        }
      });
    }
    socket.on('commandLog', onNewLog);
    socket.on('reset-command', onResetCommand)
    socket.on('left-room', onLeft);
    return () => {
      socket.off('commandLog', onNewLog);
      socket.off('reset-command', onResetCommand)
      socket.off('left-room', onLeft);
    };
  }, []);


  useEffect(() => {
    if (searchParams.q) {
      handleFetchLogs();
    }
  }, [searchParams])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [logs, autoScroll]);

  const handleFetchLogs = async () => {
    if (!searchParams.q) return;
    socket.emit('join-room', searchParams.q);
    const res = await fetch("http://localhost:5000/commands/logs/" + searchParams.q);
    const r = await res.json();
    if (r.success) {
      let logs: string[] = [];
      if (r.success && r.data !== '')
        logs = r.data.split(/\r?\n/);
      setLogs(logs);
    }
    setEmitCount(0);
  }

  return (
    <div className="border  rounded-lg p-4 flex flex-col flex-1 h-full">
      <div className="flex justify-between">
        <h2 className="font-semibold mb-4">Logs: ({searchParams.name || searchParams.q})</h2>
        {searchParams.q && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchLogs}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="h-full overflow-auto">
        {/* Logs will be rendered here */}
        <ScrollArea ref={containerRef} className="h-full bg-black rounded-lg p-4 font-mono text-xs text-white" >
          {logs.length === 0 && <span className="text-accent">No Logs</span>}
          {logs.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
          <div ref={scrollRef} /> {/* Add empty div as scroll anchor */}
        </ScrollArea>
      </div>
    </div>
  )
}