import { Command, CommandInfo, CommandWithStatus } from "@/types/command";
import { execa } from "execa";
import fs from "fs/promises";
import path from "path";
import AppError from "@/util/AppError";
import { Server } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import open, {apps} from 'open';


const DATA_DIR = path.join(process.cwd(), "data");
const COMMANDS_FILE = path.join(DATA_DIR, "commands.json");
const commands = new Map<string, Command>();
const resettingCommands = new Set<string>();

// Initialize commands from disk
export async function initializeCommands(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(COMMANDS_FILE, "utf-8");
    const savedCommands = JSON.parse(content);

    // Load commands and reset their states
    for (const [id, command] of Object.entries(savedCommands)) {
      if (!(command as Command).deleted) {
        commands.set(id, command as Command);

        // Reset command state to stopped
        await writeCommandInfo(id, {
          status: "stopped",
          iter: null,
          total: null,
          eta: null,
          started: null,
          pid: null,
        });
      }
    }
  } catch {
    // If file doesn't exist, create it
    await fs.writeFile(COMMANDS_FILE, JSON.stringify({}, null, 2));
  }
}

// Save commands to disk
async function saveCommands(): Promise<void> {
  const commandsObj: Record<string, Command> = {};
  for (const [id, command] of commands.entries()) {
    commandsObj[id] = command;
  }
  await fs.writeFile(COMMANDS_FILE, JSON.stringify(commandsObj, null, 2));
}

// Helper to get commands
export async function getCommands(): Promise<
  Record<string, CommandWithStatus>
> {
  if (commands.size === 0) {
    await initializeCommands();
  }

  const result: Record<string, CommandWithStatus> = {};
  for (const [id, command] of commands) {
    if (!command.deleted) {
      result[id] = {
        ...command,
        info: await getCommandInfo(id),
      };
    }
  }
  return result;
}

// Add new function to manage commands
export async function addCommand(
  command: Command,
  io: Server,
  update: boolean = false,
  id?: string,
): Promise<void> {

  if (!id) {
    id = uuidv4();
  }

  if (commands.has(id) && !update) {
    throw new AppError("Duplicate command ID", 400);
  }

  commands.set(id, command);
  await saveCommands();

  // Initialize command info file with stopped status
  if (!update) {
    await writeCommandInfo(id, {
      status: "stopped",
      iter: null,
      total: null,
      eta: null,
      started: null,
      pid: null,
      results: 0,
    });
    await resetCommandLog(id, io);
  }

  // Initialize empty log file
}

export async function removeCommand(id: string): Promise<void> {
  const command = commands.get(id);
  if (command) {
    commands.set(id, { ...command, deleted: true });
    await saveCommands();
  }
  // // Clean up associated files
  // try {
  //   await fs.unlink(path.join(DATA_DIR, `${id}-info.json`));
  //   await fs.unlink(path.join(DATA_DIR, `${id}-log.txt`));
  // } catch {
  //   // Ignore errors if files don't exist
  // }
}

export function getCommand(id: string): Command | undefined {
  return commands.get(id);
}

// Helper to read individual command info
export async function getCommandInfo(commandId: string): Promise<CommandInfo> {
  const filePath = path.join(DATA_DIR, `${commandId}-info.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    // If file doesn't exist, create it with default state
    const defaultInfo: CommandInfo = {
      status: "stopped",
      iter: null,
      total: null,
      eta: null,
      started: null,
      pid: null,
    };

    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultInfo, null, 2));
    return defaultInfo;
  }
}

// Helper to write command info
async function writeCommandInfo(
  commandId: string,
  info: CommandInfo
): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, `${commandId}-info.json`),
    JSON.stringify(info, null, 2)
  );
}

// Helper to reset command log
async function resetCommandLog(commandId: string, io: Server): Promise<void> {
  await fs.writeFile(path.join(DATA_DIR, `${commandId}-log.txt`), "");
  io.to(commandId).emit("reset-command");
}

// Run a command
export async function runCommand(commandId: string, io: Server): Promise<void> {
  const command = commands.get(commandId);

  if (!command) throw new AppError("Command not found", 404);

  const commandInfo = await getCommandInfo(commandId);

  if (commandInfo.status === "running") {
    throw new AppError("Command already running");
  }

  // Parse command string into command and args
  const [cmd, ...args] = command.command.split(" ");

  try {
    const subprocess = execa(cmd, args, {
      env: { CMDSMAN_ID: commandId },
      cwd: command.directory,
      stdio: ["ignore", "pipe", "pipe"],
      reject: false,
    });

    // Handle output
    if (subprocess.pid === undefined) {
      throw new AppError("Failed to start command, make sure the directory / executable exists", 500);
    } else {
      // Update info with PID
      await writeCommandInfo(commandId, {
        status: "running",
        iter: 0,
        total: null,
        eta: null,
        started: Date.now(),
        pid: subprocess.pid ?? null,
      });
    }

    subprocess.stdout?.on("data", (data) => {
      io.to(commandId).emit("commandLog", data.toString());
      fs.appendFile(path.join(DATA_DIR, `${commandId}-log.txt`), data);
    });

    subprocess.stderr?.on("data", (data) => {
      io.to(commandId).emit("commandLog", data.toString());
      fs.appendFile(path.join(DATA_DIR, `${commandId}-log.txt`), data);
    });

    // Handle completion
    subprocess.on("exit", async (code) => {
      const info = await getCommandInfo(commandId);
      // Only set complete/incomplete if not already stopped
      if (info.status !== "stopped") {
        const status = code === 0 ? "complete" : "incomplete";
        await writeCommandInfo(commandId, { ...info, status, pid: null });
      }
    });

    subprocess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
  } catch (err) {
    console.error("Failed to start command:", err);
    throw new AppError(err.message, 500);
  }
}

function isProcessRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true; // Process is running
  } catch (error) {
    return false; // Process is not running
  }
}

export async function stopCommand(commandId: string): Promise<void> {
  const info = await getCommandInfo(commandId);
  if (info.pid) {
    await writeCommandInfo(commandId, { ...info, status: "stopped" });
    await cleanupProcess(commandId);
  }
}

// Add this helper function
async function cleanupProcess(commandId: string): Promise<void> {
  const info = await getCommandInfo(commandId);
  if (info.pid && isProcessRunning(info.pid)) {
    try {
      process.kill(info.pid);
      // Wait for the process to actually terminate
      while (isProcessRunning(info.pid)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      console.error(`Error killing process ${info.pid}:`, err);
    }
  }

  // Ensure the command is marked as stopped
  await writeCommandInfo(commandId, {
    ...info,
    status: "stopped",
    pid: null
  });
}

// Replace the resetCommand function
export async function resetCommand(
  commandId: string,
  io: Server
): Promise<void> {
  if (resettingCommands.has(commandId)) {
    throw new AppError("Reset already in progress", 400);
  }

  if (!commands.has(commandId)) {
    throw new AppError("Command not found", 404);
  }

  resettingCommands.add(commandId);

  try {
    // 1. Stop any running process
    await cleanupProcess(commandId);

    // 2. Clear logs
    await resetCommandLog(commandId, io);

    // 3. Wait a bit to ensure all resources are released
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4. Start the command
    await runCommand(commandId, io);
  } catch (error) {
    // Ensure command is in a clean state if anything fails
    await cleanupProcess(commandId);
    throw new AppError(
      `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  } finally {
    resettingCommands.delete(commandId);
  }
}

// Get command logs
export async function getCommandLogs(
  commandId: string,
  lines: number = 100
): Promise<string> {
  try {
    const content = await fs.readFile(
      path.join(DATA_DIR, `${commandId}-log.txt`),
      "utf-8"
    );
    const allLines = content.split("\n");
    return allLines.slice(-lines).join("\n");
  } catch {
    return "";
  }
}

// open dir
export async function openDir(dir: string) {
  try {
    await fs.access(dir);
    await open(dir);
    return true;
  } catch (err) {
    throw new AppError("Directory not exists", 404);
  }
}
