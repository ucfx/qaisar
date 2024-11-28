'use client';

import { useState, useEffect } from "react";
import { DataTable } from "@/components/data-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandDialog } from "@/components/command-dialog";
import { Terminal } from "lucide-react";
import { TableCommand } from "@/types";
import { socket } from "@/lib/socket";
import { toast } from "sonner"
import Logs from "./logs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommands } from "@/hooks/useCommands";
import { useQueryClient } from "react-query";

type HomeContentProps = {
  searchParams: { q: string | undefined, name: string | undefined };
  initCommands: TableCommand[];
  initLogs: string[];
}

export default function HomeContent({ searchParams, initCommands, initLogs }: HomeContentProps) {
  const commands = useCommands(initCommands);
  const queryClient = useQueryClient();

  useEffect(() => {
    function onConnect() {
      toast.success("Server connected");
      if (searchParams.q) {
        socket.emit('join-room', searchParams.q);
      }
    }

    function onDisconnect() {
      toast.error("Opps! Server disconnected");
    }

    function onRoomJoin(msg: string) {
      console.log(msg)
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on('joined', onRoomJoin);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off('joined', onRoomJoin);
    };
  }, []);

  const handleAddCommand = (newCommand: TableCommand, editing: boolean = false) => {
    if (!editing) {
      console.log("new command")
      queryClient.invalidateQueries('commands');

    } else {
      console.log("edit command")
      queryClient.invalidateQueries('commands');
    }
  };

  const handleDeleteCommand = async (id: string) => {
    // await deleteCommand(id);
    const res = await fetch(`http://localhost:5000/commands/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      toast.success("Command deleted successfully");
      console.log("Deleted command with id:", id);
      queryClient.invalidateQueries('commands');
    } else {
      toast.error("Failed to delete command");
    }
  };

  return (
    <div className="w-full h-full py-3">

      <div className="flex gap-4 w-full h-full">
        <ScrollArea className="h-full basis-3/4 pt-10 ml-8 px-8">

          <div className="space-y-4 ">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <Terminal className="h-10 w-10 mr-4" />
                <h1 className="text-4xl font-bold text-center">Commands Manager</h1>
              </div>
              <ThemeToggle />
            </div>

            <div className="flex gap-4 mb-4">
              <CommandDialog onAddCommand={handleAddCommand} />
            </div>


            <DataTable data={commands.data || []} onDelete={handleDeleteCommand} handleAddCommand={handleAddCommand} />

          </div>
        </ScrollArea>

        <Logs initLogs={initLogs} searchParams={searchParams} />
      </div>
    </div>
  );
}
