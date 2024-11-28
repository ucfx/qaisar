let i = 0;

setInterval(() => {
	i++;
	console.log("hello x" + i);
	console.log(process.env.CMDSMAN_ID);
}, 1000);
