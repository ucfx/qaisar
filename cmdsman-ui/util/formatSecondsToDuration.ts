export function formatSecondsToDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	return [hours, minutes, secs]
		.map(unit => String(unit).padStart(2, '0'))
		.join(':');
}