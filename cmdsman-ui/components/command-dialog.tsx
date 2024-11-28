"use client"

import { Button } from "@/components/ui/button"
import type { TableCommand } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from 'sonner'

interface CommandDialogProps {
  onAddCommand: (command: TableCommand, editing?: boolean) => void;
  editing?: boolean;
  commandInfo?: TableCommand;
  setCommandEditing?: (command: TableCommand | undefined) => void;
}

export function CommandDialog({ onAddCommand, editing = false, commandInfo, setCommandEditing }: CommandDialogProps) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setOpen(commandInfo ? true : false)
  }, [commandInfo])

  const handleOpen = (open: boolean) => {
    setOpen(open)
    if (setCommandEditing && commandInfo) {
      setCommandEditing(undefined)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const promise = () => new Promise(async (resolve, reject) => {
      const res = await fetch(`http://localhost:5000/commands`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const r = await res.json()

      if (!r.success) {
        reject(r.message)
      } else {
        if(editing) {
          onAddCommand({
            ...r.data,
            selected: true,
            deleted: false
          }, true)
        } else {
          onAddCommand({
            id: formData.get('id') as string,
            command: formData.get('command') as string,
            directory: formData.get('directory') as string,
            group: formData.get('group') as string,
            info: {
              status: "stopped",
              pid: 0,
              iter: 0,
              results: 0,
              started: 0,
              total: 0
            },
            selected: false,
            deleted: false
          })
        }

        resolve(editing ? "Command updated successfully" : "Command added successfully")
      }
    })

    toast.promise(promise, {
      loading: editing ? "Updating command" : "Adding command",
      success: (data) => {
        handleOpen(false);
        form.reset();
        return `${data}`
      },
      error: (error) => `${error}`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      {!editing && (
        <DialogTrigger asChild>
          <Button variant="default">
            <Plus className="h-4 w-4 " />
            Add Command</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{commandInfo ? "Edit Command" : "Add Command"}</DialogTitle>
            <DialogDescription>
              {commandInfo ? "Edit the command details" : "Add a new command to the list"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="hidden">
              <Label htmlFor="id" className="text-right">
                ID
              </Label>
              <Input
                name="id"
                id="id"
                defaultValue={commandInfo ? commandInfo?.id : ''}
                readOnly={commandInfo ? true : false}
                className="col-span-3"
                placeholder="unique-command-id"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="directory" className="text-right">
                Directory
              </Label>
              <Input
                name="directory"
                id="directory"
                defaultValue={commandInfo ? commandInfo?.directory : ''}
                className="col-span-3"
                placeholder={commandInfo ? commandInfo?.directory : "D:/project/path"}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="command" className="text-right">
                Command
              </Label>
              <Input
                name="command"
                id="command"
                // value={commandInfo ? commandInfo?.command : undefined}
                defaultValue={commandInfo ? commandInfo?.command : ''}
                className="col-span-3"
                placeholder={commandInfo ? commandInfo?.command : 'python script.py'}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">
                Group
              </Label>
              <Input
                name="group"
                id="group"
                // value={commandInfo ? commandInfo?.group : undefined}
                defaultValue={commandInfo ? commandInfo?.group : ''}
                className="col-span-3"
                placeholder={commandInfo ? commandInfo?.group : 'group name'}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{commandInfo ? "Save" : "Add Command"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}