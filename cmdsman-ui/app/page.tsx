import { CommandWithStatus } from "@/types";
import HomeContent from "./page-content";
import { ReactQueryProvider } from "@/providers/react-query";
export default async function Home({ searchParams }: { searchParams: { q: string | undefined, name: string | undefined } }) {
  const URL = 'http://localhost:5000';
  const OPTIONS: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application'
    },
    cache: 'no-store'
  }

  const commandsRes = await fetch(`${URL}/commands`, OPTIONS);
  if (!commandsRes.ok) {
    const err = await commandsRes.json();
    throw new Error(err.message);
  }
  const commands: CommandWithStatus = (await commandsRes.json()).data;
  const initCommands = Object.entries(commands).map(([id, cmd]) => ({
    id,
    ...cmd,
    selected: false,
  }));

  let initLogs: string[] = [];
  if (searchParams.q) {
    const logsRes = await fetch(`${URL}/commands/logs/${searchParams.q}`, OPTIONS);
    if (!logsRes.ok) {
      const err = await logsRes.json();
      throw new Error(err.message);
    }
    initLogs = (await logsRes.json()).data.split(/\r?\n/);
  }

  return (
    <ReactQueryProvider>
      <HomeContent initCommands={initCommands} initLogs={initLogs} searchParams={searchParams} />
    </ReactQueryProvider>
  );
}
