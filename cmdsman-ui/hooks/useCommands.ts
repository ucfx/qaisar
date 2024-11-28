import { CommandWithStatus, TableCommand } from "@/types";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "sonner";

const URL = 'http://localhost:5000';
const OPTIONS: RequestInit = {
	method: 'GET',
	headers: {
		'Content-Type': 'application'
	}
};

export function useCommands(initialData: TableCommand[] = []) {
	return useQuery({
		initialData: initialData,
		queryKey: ['commands'],
		queryFn: async () => {
			const res = await fetch(`${URL}/commands`, OPTIONS);
			if (!res.ok) {
				throw new Error('Failed to fetch commands');
			}
			const data = await res.json();
			return Object.entries(data.data as CommandWithStatus).map(([id, cmd]) => ({
				id,
				...cmd,
				selected: false,
			}));
		},
		refetchInterval: 3000,
	});
}

export function useLogs(commandId: string | undefined) {
	return useQuery({
		queryKey: ['logs', commandId],
		queryFn: async () => {
			if (!commandId) return [];
			const res = await fetch(`${URL}/commands/logs/${commandId}`, OPTIONS);
			if (!res.ok) {
				throw new Error('Failed to fetch logs');
			}
			const data = await res.json();
			return data.data.split(/\r?\n/);
		},
		enabled: !!commandId,
	});
}

export function useAddCommand() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (command: CommandWithStatus) => {
			const res = await fetch(`${URL}/commands`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(command),
			});
			if (!res.ok) {
				throw new Error('Failed to add command');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['commands']);
			toast.success("Command added successfully");
		},
		onError: (error) => {
			toast.error("Failed to add command");
			console.error(error);
		},
	});
}

export function useDeleteCommand() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const res = await fetch(`${URL}/commands/${id}`, {
				method: 'DELETE',
			});
			if (!res.ok) {
				throw new Error('Failed to delete command');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['commands']);
			toast.success("Command deleted successfully");
		},
		onError: (error) => {
			toast.error("Failed to delete command");
			console.error(error);
		},
	});
}

export function useUpdateCommand() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (command: TableCommand) => {
			const res = await fetch(`${URL}/commands`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(command),
			});
			if (!res.ok) {
				throw new Error('Failed to update command');
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(['commands']);
			toast.success("Command updated successfully");
		},
		onError: (error) => {
			toast.error("Failed to update command");
			console.error(error);
		},
	});
}
