import express from "express";
import {
  addCommand,
  getCommands,
  getCommand,
  runCommand,
  stopCommand,
  resetCommand,
  getCommandLogs,
  removeCommand,
  getCommandInfo
} from "@/lib/commands";
import AppError from "@/util/AppError";
import { wrapRoute } from "@/util/wrapRouter";
const router = express.Router();

// get all commands
router.get('/', wrapRoute(async (req, res) => {
  const commands = await getCommands();
  res.status(200).json({ success: true, data: commands });
}));

// create command
router.post('/', wrapRoute(async (req, res) => {
  const { command, directory, group } = req.body;
  await addCommand({
    directory,
    command,
    group,
    deleted: false
  }, req.io);
  res.status(201).json({ success: true });
}));

// get a specific command
router.get('/:id', wrapRoute(async (req, res) => {
  const { id } = req.params;
  const command = getCommand(id);

  if (!command) {
    throw new AppError(`Command '${id}' not found`, 404);
  }

  res.status(200).json({ success: true, data: command });
}));


// run a command
router.post('/run/:id', wrapRoute(async (req, res) => {
  const { id } = req.params;
  await runCommand(id, req.io);
  res.status(200).json({ success: true, message: `Command '${id}' running` });
}));


// stop a command
router.post('/stop/:id', wrapRoute(async (req, res) => {
  const { id } = req.params;
  await stopCommand(id);
  res.status(200).json({ success: true, message: `Command '${id}' stopped` });
}));

// reset a command
router.post('/reset/:id', wrapRoute(async (req, res) => {
  const { id } = req.params;
  await resetCommand(id, req.io);
  res.status(200).json({ success: true, message: `Command '${id}' reset` });
}));

// get logs
router.get('/logs/:id', wrapRoute(async (req, res) => {
  const { id } = req.params;
  const logs = await getCommandLogs(id);
  res.status(200).json({ success: true, data: logs });
}));

// delete command
router.delete('/:id', wrapRoute(async (req, res) => {
  const { id } = req.params;
  await removeCommand(id);
  res.status(200).json({ success: true, message: `Command '${id}' deleted` });
}));

// update command 
router.put('/', wrapRoute(async (req, res) => {
  const { id, command, directory, group } = req.body;
  console.log("update command", id, command, directory, group);
  await addCommand({
    directory,
    command,
    group,
    deleted: false
  }, req.io, true, id);

  const cmd = {
    id,
    command,
    directory,
    group,
    info: await getCommandInfo(id)
  }
  res.status(200).json({ success: true, data: cmd });
}));

export default router;