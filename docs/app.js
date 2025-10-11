const state = {
	slides: [],
	chartInstances: [],
	chartPalette: ["#60a5fa", "#a855f7", "#34d399", "#f97316", "#facc15"],
	chartDefaultsSet: false,
};

// Embedded demo data (no network request needed!)
const DEMO_DATA = {
	context: {
		first_date: "Mar 10, 2024",
		last_date: "Oct 08, 2025",
		conversation_count: "1,362",
		message_count: "22,287",
		active_days: "484",
		avg_messages_per_active_day: "40.5",
		peak_month_label: "Sep 2025",
		peak_month_value: "2,852",
		busiest_day_label: "2025-07-25",
		busiest_day_value: "390",
		longest_streak_length: "7",
		longest_streak_range: "Sample range",
		longest_gap_length: "3",
		longest_gap_range: "Sample gap",
		assistant_share: "45.8%",
		user_share: "30.7%",
		deep_share: "44.3%",
		short_share: "49.3%",
		one_share: "6.5%",
		tool_share: "15.0%",
		code_share: "25.0%",
		top_conversation_title: "Long conversation",
		top_conversation_messages: "392",
		assistant_peak_label: "Aug 2024",
		assistant_peak_words: "409.1",
		assistant_low_label: "—",
		assistant_low_words: "—",
		latest_word_avg: "250",
		latest_char_avg: "1,250",
		peak_hour_label: "14:00",
		peak_hour_messages: "1,785",
		daypart_split: "Day 65.0% • Night 35.0%",
		night_share: "Late night 15.0% after 10pm",
		peak_weekday_label: "Mon",
		peak_weekday_messages: "3,554",
		low_weekday_label: "Sat",
		low_weekday_messages: "1,578",
		quiet_month_label: "—",
		quiet_month_value: "—",
	},
	chartData: {
		hourlyActivity: {
			type: "bar",
			data: {
				labels: [
					"00:00",
					"01:00",
					"02:00",
					"03:00",
					"04:00",
					"05:00",
					"06:00",
					"07:00",
					"08:00",
					"09:00",
					"10:00",
					"11:00",
					"12:00",
					"13:00",
					"14:00",
					"15:00",
					"16:00",
					"17:00",
					"18:00",
					"19:00",
					"20:00",
					"21:00",
					"22:00",
					"23:00",
				],
				datasets: [
					{
						label: "Messages",
						data: [
							120, 85, 45, 30, 25, 40, 180, 420, 680, 920, 1150, 1380, 1520,
							1785, 1650, 1420, 1280, 1050, 880, 720, 580, 450, 320, 180,
						],
						backgroundColor: [
							"rgba(96, 165, 250, 0.25)",
							"rgba(96, 165, 250, 0.27)",
							"rgba(96, 165, 250, 0.29)",
							"rgba(96, 165, 250, 0.31)",
							"rgba(96, 165, 250, 0.33)",
							"rgba(96, 165, 250, 0.35)",
							"rgba(96, 165, 250, 0.37)",
							"rgba(96, 165, 250, 0.39)",
							"rgba(96, 165, 250, 0.41)",
							"rgba(96, 165, 250, 0.43)",
							"rgba(96, 165, 250, 0.45)",
							"rgba(96, 165, 250, 0.47)",
							"rgba(96, 165, 250, 0.49)",
							"rgba(96, 165, 250, 0.51)",
							"rgba(96, 165, 250, 0.53)",
							"rgba(96, 165, 250, 0.55)",
							"rgba(96, 165, 250, 0.57)",
							"rgba(96, 165, 250, 0.59)",
							"rgba(96, 165, 250, 0.61)",
							"rgba(96, 165, 250, 0.63)",
							"rgba(96, 165, 250, 0.65)",
							"rgba(96, 165, 250, 0.67)",
							"rgba(96, 165, 250, 0.69)",
							"rgba(96, 165, 250, 0.71)",
						],
					},
				],
			},
			options: {
				responsive: true,
				scales: {
					y: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
					},
					x: {
						ticks: { color: "#cbd5f5", maxRotation: 60, minRotation: 60 },
						grid: { display: false },
					},
				},
				plugins: { legend: { display: false } },
			},
		},
		weekdayActivity: {
			type: "bar",
			data: {
				labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
				datasets: [
					{
						label: "Messages",
						data: [3554, 3280, 3120, 2950, 2880, 1578, 2925],
						backgroundColor: "rgba(129, 140, 248, 0.55)",
					},
				],
			},
			options: {
				indexAxis: "y",
				responsive: true,
				scales: {
					x: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
					},
					y: { ticks: { color: "#cbd5f5" }, grid: { display: false } },
				},
				plugins: { legend: { display: false } },
			},
		},
	},
};

const fileInput = document.getElementById("file-input");
const uploadLabel = document.getElementById("upload-label");
const demoTrigger = document.getElementById("demo-trigger");
const tryDemoBtn = document.getElementById("try-demo-btn");
const demoContainer = document.getElementById("demo-container");
const closeDemo = document.getElementById("close-demo");
const storyContainer = document.getElementById("story-container");
const storyRail = document.getElementById("story-rail");
const storyProgress = document.getElementById("story-progress");
const loadingBanner = document.getElementById("loading");
const errorBanner = document.getElementById("error");

if (demoTrigger) {
	demoTrigger.addEventListener("click", (event) => {
		event.preventDefault();
		toggleDemoPreview();
	});
}

if (tryDemoBtn) {
	tryDemoBtn.addEventListener("click", (event) => {
		event.preventDefault();
		loadDemoData();
	});
}

if (closeDemo) {
	closeDemo.addEventListener("click", () => {
		closeDemoPreview();
	});
}

fileInput.addEventListener("change", async (event) => {
	const file = event.target.files?.[0];
	if (!file) return;
	closeDemoPreview();
	resetUI();

	try {
		setLoading(true);
		const text = await file.text();
		const data = JSON.parse(text);
		if (!Array.isArray(data)) {
			throw new Error(
				"File does not look like a conversations export (expected an array)."
			);
		}

		const messages = flattenMessages(data);
		if (!messages.length) {
			throw new Error("No messages found in conversations.");
		}

		const analysis = analyse(messages);
		storyContainer.classList.remove("hidden");
		renderStory(analysis);
		setLoading(false);
	} catch (error) {
		console.error(error);
		setLoading(false);
		showError(
			error instanceof Error
				? error.message
				: "Failed to read conversations file."
		);
	}
});

function loadDemoData() {
	closeDemoPreview();
	resetUI();

	try {
		setLoading(true);

		// Use embedded demo data - no network request needed!
		const analysis = DEMO_DATA;
		if (!analysis || !analysis.context) {
			throw new Error("Demo data format is invalid");
		}

		storyContainer.classList.remove("hidden");
		renderStory(analysis, true); // true = demo mode
		setLoading(false);

		// Scroll to story
		setTimeout(() => {
			storyContainer.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 100);
	} catch (error) {
		console.error(error);
		setLoading(false);
		showError(
			error instanceof Error
				? error.message
				: "Failed to load demo. Please try uploading your own data instead."
		);
	}
}

function openDemoPreview() {
	if (!demoContainer) return;
	demoContainer.classList.remove("hidden");
	const demoVideo = demoContainer.querySelector("video");
	if (demoVideo) {
		demoVideo.currentTime = 0;
		demoVideo.play().catch(() => {});
	}
}

function closeDemoPreview() {
	if (!demoContainer) return;
	demoContainer.classList.add("hidden");
	const demoVideo = demoContainer.querySelector("video");
	if (demoVideo) {
		demoVideo.pause();
	}
}

function toggleDemoPreview() {
	if (!demoContainer) return;
	const isHidden = demoContainer.classList.contains("hidden");
	if (isHidden) {
		openDemoPreview();
	} else {
		closeDemoPreview();
	}
}

function resetUI() {
	closeDemoPreview();
	storyContainer.classList.add("hidden");
	storyRail.innerHTML = "";
	storyProgress.innerHTML = "";
	destroyCharts();
	state.slides = [];
	errorBanner.classList.add("hidden");
}

function setLoading(isLoading) {
	loadingBanner.classList.toggle("hidden", !isLoading);
}

function showError(message) {
	errorBanner.textContent = message;
	errorBanner.classList.remove("hidden");
}

function flattenMessages(conversations) {
	const rows = [];

	conversations.forEach((conversation, idx) => {
		const mapping = conversation.mapping || {};
		const convId =
			conversation.id || `conversation_${idx.toString().padStart(4, "0")}`;
		const title = conversation.title || "Untitled";

		Object.values(mapping).forEach((node) => {
			const message = node?.message;
			if (!message) return;

			const content = message.content || {};
			const text = extractText(content);
			const createTime =
				typeof message.create_time === "number"
					? new Date(message.create_time * 1000)
					: null;
			const role = message.author?.role || "unknown";

			rows.push({
				conversationIndex: idx,
				conversationId: convId,
				conversationTitle: title,
				role,
				createTime,
				contentType: content.content_type || "text",
				hasCode: content.content_type === "code",
				isMultimodal: content.content_type === "multimodal_text",
				text,
				wordCount: text
					? text.toLowerCase().match(/[a-z0-9']+/g)?.length || 0
					: 0,
				charCount: text.length,
			});
		});
	});

	return rows;
}

function extractText(content) {
	if (!content) return "";
	const parts = content.parts || [];
	const lines = [];
	const textualTypes = new Set([
		"text",
		"code",
		"reasoning_recap",
		"thoughts",
		"execution_output",
		"tether_browsing_display",
		"system_error",
		"computer_output",
		"sonic_webpage",
		"tether_quote",
	]);

	if (textualTypes.has(content.content_type)) {
		parts.forEach((part) => {
			if (typeof part === "string") lines.push(part);
			else if (part && typeof part === "object") {
				if (typeof part.text === "string") lines.push(part.text);
				else if (typeof part.title === "string") lines.push(part.title);
			}
		});
	} else if (content.content_type === "multimodal_text") {
		parts.forEach((part) => {
			if (typeof part === "string") {
				lines.push(part);
			} else if (part && typeof part === "object") {
				const type = part.content_type;
				if (type === "text" && typeof part.text === "string")
					lines.push(part.text);
				if (
					type === "audio_transcription" &&
					typeof part.transcript === "string"
				)
					lines.push(part.transcript);
			}
		});
	} else if (content.content_type === "user_editable_context") {
		if (content.user_instructions) lines.push(content.user_instructions);
	}

	return lines.filter(Boolean).join("\n");
}

function analyse(messages) {
	const conversationMap = new Map();
	const roleCounts = new Map();
	const dailyCounts = new Map();
	const monthlyCounts = new Map();
	const monthlyRoleCounts = new Map();
	const assistantDaily = new Map();
	const assistantMonthly = new Map();
	const hourCounts = Array(24).fill(0);
	const weekdayCounts = Array(7).fill(0);

	messages.forEach((msg) => {
		roleCounts.set(msg.role, (roleCounts.get(msg.role) || 0) + 1);

		const conv = conversationMap.get(msg.conversationId) || {
			title: msg.conversationTitle,
			messages: 0,
			userMessages: 0,
			assistantMessages: 0,
			toolMessages: 0,
			systemMessages: 0,
			wordsUser: 0,
			wordsAssistant: 0,
			hasTool: false,
			hasCode: false,
			firstTime: null,
			lastTime: null,
		};

		conv.messages += 1;
		if (msg.role === "user") {
			conv.userMessages += 1;
			conv.wordsUser += msg.wordCount;
		} else if (msg.role === "assistant") {
			conv.assistantMessages += 1;
			conv.wordsAssistant += msg.wordCount;
		} else if (msg.role === "tool") {
			conv.toolMessages += 1;
			conv.hasTool = true;
		} else if (msg.role === "system") {
			conv.systemMessages += 1;
		}

		if (msg.hasCode) conv.hasCode = true;

		if (
			msg.createTime instanceof Date &&
			!Number.isNaN(msg.createTime.getTime())
		) {
			if (!conv.firstTime || msg.createTime < conv.firstTime)
				conv.firstTime = msg.createTime;
			if (!conv.lastTime || msg.createTime > conv.lastTime)
				conv.lastTime = msg.createTime;

			const dayKey = dateKey(msg.createTime);
			dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);

			const monthKey = monthKeyFromDate(msg.createTime);
			monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) || 0) + 1);
			const mrKey = `${monthKey}|${msg.role}`;
			monthlyRoleCounts.set(mrKey, (monthlyRoleCounts.get(mrKey) || 0) + 1);

			const hour = msg.createTime.getHours();
			const weekday = msg.createTime.getDay();
			hourCounts[hour] += 1;
			weekdayCounts[weekday] += 1;

			if (msg.role === "assistant") {
				const daily = assistantDaily.get(dayKey) || {
					words: 0,
					chars: 0,
					count: 0,
				};
				daily.words += msg.wordCount;
				daily.chars += msg.charCount;
				daily.count += 1;
				assistantDaily.set(dayKey, daily);

				const monthly = assistantMonthly.get(monthKey) || {
					words: 0,
					chars: 0,
					count: 0,
				};
				monthly.words += msg.wordCount;
				monthly.chars += msg.charCount;
				monthly.count += 1;
				assistantMonthly.set(monthKey, monthly);
			}
		}

		conversationMap.set(msg.conversationId, conv);
	});

	const conversationSummaries = Array.from(conversationMap.values());
	const { context, chartData } = buildContext({
		conversationSummaries,
		messagesByRole: roleCounts,
		dailyCounts,
		monthlyCounts,
		monthlyRoleCounts,
		assistantDaily,
		assistantMonthly,
		hourCounts,
		weekdayCounts,
	});

	return { context, chartData };
}

function buildContext({
	conversationSummaries,
	messagesByRole,
	dailyCounts,
	monthlyCounts,
	monthlyRoleCounts,
	assistantDaily,
	assistantMonthly,
	hourCounts,
	weekdayCounts,
}) {
	const conversationCount = conversationSummaries.length;
	const messageCountTotal = Array.from(messagesByRole.values()).reduce(
		(sum, val) => sum + val,
		0
	);

	const sortedDaily = Array.from(dailyCounts.entries())
		.map(([key, value]) => ({ key, value, date: new Date(key) }))
		.filter((item) => !Number.isNaN(item.date.getTime()))
		.sort((a, b) => a.date - b.date);

	const activeDays = sortedDaily.length;
	const avgMessages = sortedDaily.length
		? sortedDaily.reduce((sum, item) => sum + item.value, 0) /
		  sortedDaily.length
		: 0;
	const busiestDay = sortedDaily.reduce(
		(best, item) => (item.value > (best?.value || 0) ? item : best),
		null
	);
	const latestDate = sortedDaily.length
		? sortedDaily[sortedDaily.length - 1].date
		: null;

	const streakInfo = computeStreaks(sortedDaily.map((item) => item.date));

	const sortedMonthly = Array.from(monthlyCounts.entries())
		.map(([key, value]) => ({ key, value, date: monthToDate(key) }))
		.filter((item) => !Number.isNaN(item.date.getTime()))
		.sort((a, b) => a.date - b.date);

	const peakMonth = sortedMonthly.reduce(
		(best, item) => (item.value > (best?.value || 0) ? item : best),
		null
	);
	const quietMonth = sortedMonthly.reduce(
		(best, item) => (item.value < (best?.value ?? Infinity) ? item : best),
		null
	);

	const assistantShare = computeShare(messagesByRole, "assistant");
	const userShare = computeShare(messagesByRole, "user");

	const conversationCategories = classifyConversations(conversationSummaries);

	const toolShare = fractionToPercent(
		conversationSummaries.filter((c) => c.hasTool).length,
		conversationCount
	);
	const codeShare = fractionToPercent(
		conversationSummaries.filter((c) => c.hasCode).length,
		conversationCount
	);

	const topConversation = conversationSummaries.reduce(
		(best, item) => (item.messages > (best?.messages || 0) ? item : best),
		null
	);

	const assistantMonthlyStats = Array.from(assistantMonthly.entries())
		.map(([key, value]) => ({
			key,
			date: monthToDate(key),
			meanWord: value.count ? value.words / value.count : 0,
		}))
		.filter((item) => !Number.isNaN(item.date.getTime()))
		.sort((a, b) => a.date - b.date);

	const assistantPeak = assistantMonthlyStats.reduce(
		(best, item) => (item.meanWord > (best?.meanWord || 0) ? item : best),
		null
	);
	const assistantLow = assistantMonthlyStats.reduce(
		(best, item) =>
			item.meanWord < (best?.meanWord ?? Infinity) ? item : best,
		null
	);

	const assistantDailyStats = Array.from(assistantDaily.entries())
		.map(([key, value]) => ({
			key,
			date: new Date(key),
			meanWord: value.count ? value.words / value.count : 0,
			meanChar: value.count ? value.chars / value.count : 0,
		}))
		.filter((item) => !Number.isNaN(item.date.getTime()))
		.sort((a, b) => a.date - b.date);

	const latestRolling = computeRollingAverage(
		assistantDailyStats.map((item) => item.meanWord),
		30
	);
	const latestRollingChars = computeRollingAverage(
		assistantDailyStats.map((item) => item.meanChar),
		30
	);

	const chartData = buildChartData({
		sortedMonthly,
		monthlyRoleCounts,
		messagesByRole,
		sortedDaily,
		assistantDailyStats,
		hourCounts,
		weekdayCounts,
	});

	const context = {
		first_date: streakInfo.firstDate
			? formatDateLabel(streakInfo.firstDate)
			: "—",
		last_date: latestDate ? formatDateLabel(latestDate) : "—",
		conversation_count: formatInteger(conversationCount),
		message_count: formatInteger(messageCountTotal),
		active_days: formatInteger(activeDays),
		avg_messages_per_active_day: formatNumber(avgMessages),
		peak_month_label: peakMonth ? formatMonthLabel(peakMonth.date) : "—",
		peak_month_value: peakMonth ? formatInteger(peakMonth.value) : "—",
		quiet_month_label: quietMonth ? formatMonthLabel(quietMonth.date) : "—",
		quiet_month_value: quietMonth ? formatInteger(quietMonth.value) : "—",
		busiest_day_label: busiestDay ? formatDateLabel(busiestDay.date) : "—",
		busiest_day_value: busiestDay ? formatInteger(busiestDay.value) : "—",
		longest_streak_length: formatInteger(streakInfo.longestStreakLength),
		longest_streak_range: streakInfo.longestStreakLabel,
		longest_gap_length: formatInteger(streakInfo.longestGapLength),
		longest_gap_range: streakInfo.longestGapLabel,
		assistant_share: assistantShare,
		user_share: userShare,
		deep_share: formatPercent(conversationCategories.deep),
		short_share: formatPercent(conversationCategories.short),
		one_share: formatPercent(conversationCategories.one),
		tool_share: toolShare,
		code_share: codeShare,
		top_conversation_title: topConversation?.title || "—",
		top_conversation_messages: topConversation
			? formatInteger(topConversation.messages)
			: "—",
		assistant_peak_label: assistantPeak
			? formatMonthLabel(assistantPeak.date)
			: "—",
		assistant_peak_words: assistantPeak
			? formatNumber(assistantPeak.meanWord)
			: "—",
		assistant_low_label: assistantLow
			? formatMonthLabel(assistantLow.date)
			: "—",
		assistant_low_words: assistantLow
			? formatNumber(assistantLow.meanWord)
			: "—",
		latest_word_avg: latestRolling ? formatNumber(latestRolling) : "—",
		latest_char_avg: latestRollingChars
			? formatInteger(Math.round(latestRollingChars))
			: "—",
		peak_hour_label: computePeakHourLabel(hourCounts),
		peak_hour_messages: formatInteger(getPeakHourMessages(hourCounts)),
		daypart_split: computeDaypartSplit(hourCounts),
		night_share: computeNightShare(hourCounts),
		peak_weekday_label: computePeakWeekdayLabel(weekdayCounts),
		peak_weekday_messages: formatInteger(getPeakWeekdayMessages(weekdayCounts)),
		low_weekday_label: computeLowWeekdayLabel(weekdayCounts),
		low_weekday_messages: formatInteger(getLowWeekdayMessages(weekdayCounts)),
	};

	return { context, chartData };
}

function buildChartData({
	sortedMonthly,
	monthlyRoleCounts,
	messagesByRole,
	sortedDaily,
	assistantDailyStats,
	hourCounts,
	weekdayCounts,
}) {
	const sampledAssistantTrend = assistantDailyStats.filter((_, idx, arr) => {
		if (arr.length <= 90) return true;
		const step = Math.ceil(arr.length / 90);
		return idx % step === 0;
	});
	const monthLabels = sortedMonthly.map((item) => formatMonthLabel(item.date));
	const roles = Array.from(messagesByRole.keys()).filter((role) =>
		["assistant", "user", "tool", "system"].includes(role)
	);

	const monthlyRoleDatasets = roles.map((role, idx) => {
		const data = monthLabels.map((_, i) => {
			const monthKey = sortedMonthly[i].key;
			const key = `${monthKey}|${role}`;
			return monthlyRoleCounts.get(key) || 0;
		});
		const color = state.chartPalette[idx % state.chartPalette.length];
		return {
			label: role,
			data,
			fill: false,
			borderColor: color,
			backgroundColor: color,
			tension: 0.35,
			borderWidth: 2,
			pointRadius: 2,
		};
	});

	const cumulativeLabels = sortedDaily.map((item) =>
		formatDateLabel(item.date)
	);
	let running = 0;
	const cumulativeData = sortedDaily.map((item) => {
		running += item.value;
		return running;
	});

	const assistantTrendLabels = sampledAssistantTrend.map((item) =>
		formatDateLabel(item.date)
	);
	const assistantTrendData = sampledAssistantTrend.map((item) => item.meanWord);

	const hourLabels = Array.from(
		{ length: 24 },
		(_, h) => `${h.toString().padStart(2, "0")}:00`
	);
	const weekdayOrder = [1, 2, 3, 4, 5, 6, 0];
	const weekdayData = weekdayOrder.map((day) => weekdayCounts[day] || 0);

	return {
		monthlyRole: {
			type: "line",
			data: { labels: monthLabels, datasets: monthlyRoleDatasets },
			options: {
				responsive: true,
				scales: {
					y: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
					},
					x: { ticks: { color: "#cbd5f5" }, grid: { display: false } },
				},
				plugins: {
					legend: { labels: { color: "#e2e8f0" } },
				},
			},
		},
		cumulativeMessages: {
			type: "line",
			data: {
				labels: cumulativeLabels,
				datasets: [
					{
						label: "Messages",
						data: cumulativeData,
						borderColor: "#38bdf8",
						backgroundColor: "rgba(56, 189, 248, 0.3)",
						tension: 0.35,
						borderWidth: 2,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				scales: {
					y: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
					},
					x: {
						ticks: { color: "#cbd5f5", autoSkip: true, maxTicksLimit: 6 },
						grid: { display: false },
					},
				},
				plugins: { legend: { display: false } },
			},
		},
		assistantTrend: {
			type: "line",
			data: {
				labels: assistantTrendLabels,
				datasets: [
					{
						label: "Words per reply",
						data: assistantTrendData,
						borderColor: "#a855f7",
						backgroundColor: "rgba(168, 85, 247, 0.3)",
						tension: 0.3,
						borderWidth: 2,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				scales: {
					y: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
					},
					x: {
						ticks: { color: "#cbd5f5", autoSkip: true, maxTicksLimit: 6 },
						grid: { display: false },
					},
				},
				plugins: { legend: { display: false } },
			},
		},
		hourlyActivity: {
			type: "bar",
			data: {
				labels: hourLabels,
				datasets: [
					{
						label: "Messages",
						data: hourCounts,
						backgroundColor: hourLabels.map(
							(_, idx) => `rgba(96, 165, 250, ${0.25 + (idx / 24) * 0.6})`
						),
					},
				],
			},
			options: {
				responsive: true,
				scales: {
					y: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
					},
					x: {
						ticks: { color: "#cbd5f5", maxRotation: 60, minRotation: 60 },
						grid: { display: false },
					},
				},
				plugins: { legend: { display: false } },
			},
		},
		weekdayActivity: {
			type: "bar",
			data: {
				labels: weekdayOrder.map((day) => weekdayLabel(day)),
				datasets: [
					{
						label: "Messages",
						data: weekdayData,
						backgroundColor: "rgba(129, 140, 248, 0.55)",
					},
				],
			},
			options: {
				indexAxis: "y",
				responsive: true,
				scales: {
					x: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
					},
					y: { ticks: { color: "#cbd5f5" }, grid: { display: false } },
				},
				plugins: { legend: { display: false } },
			},
		},
	};
}

function weekdayLabel(dayIndex) {
	return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex];
}

function classifyConversations(conversations) {
	let deep = 0;
	let short = 0;
	let one = 0;

	conversations.forEach((conv) => {
		if (conv.userMessages === 1 && conv.assistantMessages === 1) {
			one += 1;
		} else if (conv.userMessages <= 3) {
			short += 1;
		} else {
			deep += 1;
		}
	});

	const total = conversations.length || 1;
	return {
		deep: deep / total,
		short: short / total,
		one: one / total,
	};
}

function computeShare(map, role) {
	const total = Array.from(map.values()).reduce((sum, val) => sum + val, 0);
	if (!total) return "—";
	return formatPercent((map.get(role) || 0) / total);
}

function computePeakHourLabel(hourCounts) {
	if (!Array.isArray(hourCounts) || !hourCounts.length) return "—";
	const peak = Math.max(...hourCounts);
	if (!Number.isFinite(peak) || peak <= 0) return "—";
	const hour = hourCounts.indexOf(peak);
	return `${hour.toString().padStart(2, "0")}:00`;
}

function getPeakHourMessages(hourCounts) {
	if (!Array.isArray(hourCounts) || !hourCounts.length) return null;
	const peak = Math.max(...hourCounts);
	return peak > 0 && Number.isFinite(peak) ? peak : null;
}

function computeDaypartSplit(hourCounts) {
	if (!Array.isArray(hourCounts) || !hourCounts.length) return "—";
	const total = hourCounts.reduce((sum, val) => sum + val, 0);
	if (!total) return "—";
	const day = hourCounts.reduce(
		(sum, val, idx) => sum + (idx >= 6 && idx < 18 ? val : 0),
		0
	);
	const night = total - day;
	return `Day ${formatPercent(day / total)} • Night ${formatPercent(
		night / total
	)}`;
}

function computeNightShare(hourCounts) {
	if (!Array.isArray(hourCounts) || !hourCounts.length) return "—";
	const total = hourCounts.reduce((sum, val) => sum + val, 0);
	if (!total) return "—";
	const lateNight = hourCounts.reduce(
		(sum, val, idx) => sum + (idx >= 22 || idx < 5 ? val : 0),
		0
	);
	return `Late night ${formatPercent(lateNight / total)} after 10pm`;
}

function computePeakWeekdayLabel(weekdayCounts) {
	if (!Array.isArray(weekdayCounts) || !weekdayCounts.length) return "—";
	const peak = Math.max(...weekdayCounts);
	if (!Number.isFinite(peak) || peak <= 0) return "—";
	const idx = weekdayCounts.indexOf(peak);
	return weekdayLabel(idx);
}

function getPeakWeekdayMessages(weekdayCounts) {
	if (!Array.isArray(weekdayCounts) || !weekdayCounts.length) return null;
	const peak = Math.max(...weekdayCounts);
	return peak > 0 && Number.isFinite(peak) ? peak : null;
}

function computeLowWeekdayLabel(weekdayCounts) {
	if (!Array.isArray(weekdayCounts) || !weekdayCounts.length) return "—";
	let minVal = Infinity;
	let minIdx = -1;
	weekdayCounts.forEach((val, idx) => {
		if (val > 0 && val < minVal) {
			minVal = val;
			minIdx = idx;
		}
	});
	if (minIdx === -1 || !Number.isFinite(minVal)) return "—";
	return weekdayLabel(minIdx);
}

function getLowWeekdayMessages(weekdayCounts) {
	if (!Array.isArray(weekdayCounts) || !weekdayCounts.length) return null;
	let minVal = Infinity;
	weekdayCounts.forEach((val) => {
		if (val > 0 && val < minVal) {
			minVal = val;
		}
	});
	return minVal !== Infinity && Number.isFinite(minVal) ? minVal : null;
}

function computeRollingAverage(values, window) {
	if (!values.length) return null;
	const slice = values.slice(-window);
	const sum = slice.reduce((acc, val) => acc + val, 0);
	return sum / slice.length;
}

function computeStreaks(dates) {
	if (!dates.length) {
		return {
			longestStreakLength: 0,
			longestStreakLabel: "—",
			longestGapLength: 0,
			longestGapLabel: "—",
			firstDate: null,
		};
	}

	const sorted = [...dates].sort((a, b) => a - b);
	let bestLen = 1;
	let bestStart = sorted[0];
	let bestEnd = sorted[0];
	let currentLen = 1;
	let currentStart = sorted[0];

	sorted.slice(1).forEach((date, idx) => {
		const prev = sorted[idx];
		if (date.getTime() === prev.getTime() + 86400000) {
			currentLen += 1;
		} else {
			if (currentLen > bestLen) {
				bestLen = currentLen;
				bestStart = currentStart;
				bestEnd = prev;
			}
			currentLen = 1;
			currentStart = date;
		}
	});

	if (currentLen > bestLen) {
		bestLen = currentLen;
		bestStart = currentStart;
		bestEnd = sorted[sorted.length - 1];
	}

	let longestGapLength = 0;
	let longestGapStart = null;
	let longestGapEnd = null;

	sorted.slice(1).forEach((date, idx) => {
		const prev = sorted[idx];
		const diff = Math.round((date - prev) / 86400000) - 1;
		if (diff > longestGapLength) {
			longestGapLength = diff;
			longestGapStart = new Date(prev.getTime() + 86400000);
			longestGapEnd = new Date(date.getTime() - 86400000);
		}
	});

	return {
		longestStreakLength: bestLen,
		longestStreakLabel:
			bestLen > 1
				? `${formatDateLabel(bestStart)} — ${formatDateLabel(bestEnd)}`
				: formatDateLabel(bestStart),
		longestGapLength,
		longestGapLabel:
			longestGapLength > 0 && longestGapStart && longestGapEnd
				? `${formatDateLabel(longestGapStart)} — ${formatDateLabel(
						longestGapEnd
				  )}`
				: "—",
		firstDate: sorted[0],
	};
}

function formatDateLabel(date) {
	return date.toLocaleDateString(undefined, {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});
}

function formatMonthLabel(date) {
	return date.toLocaleDateString(undefined, {
		month: "short",
		year: "numeric",
	});
}

function formatInteger(value) {
	if (Number.isNaN(value) || value === null || value === undefined) return "—";
	return Intl.NumberFormat().format(Math.round(value));
}

function formatNumber(value) {
	if (Number.isNaN(value) || value === null || value === undefined) return "—";
	return Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
		value
	);
}

function formatPercent(value) {
	if (Number.isNaN(value) || value === null || value === undefined) return "—";
	return new Intl.NumberFormat(undefined, {
		style: "percent",
		maximumFractionDigits: 1,
	}).format(value);
}

function fractionToPercent(num, den) {
	if (!den) return "—";
	return formatPercent(num / den);
}

function dateKey(date) {
	return `${date.getFullYear()}-${(date.getMonth() + 1)
		.toString()
		.padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

function monthKeyFromDate(date) {
	return `${date.getFullYear()}-${(date.getMonth() + 1)
		.toString()
		.padStart(2, "0")}`;
}

function monthToDate(key) {
	const [year, month] = key.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, 1));
}

function renderStory({ context, chartData }, isDemo = false) {
	destroyCharts();
	state.slides = [];
	state.isDemo = isDemo;
	storyRail.innerHTML = "";
	storyProgress.innerHTML = "";

	const slides = [
		{
			tag: "Snapshot",
			title: `${context.first_date} → ${context.last_date}`,
			body: "Your ChatGPT habit in one screen.",
			highlights: [
				{
					icon: "💬",
					label: "Messages",
					value: context.message_count,
					detail: `${context.conversation_count} chats total`,
				},
				{
					icon: "📆",
					label: "Active days",
					value: context.active_days,
					detail:
						context.busiest_day_label === "—"
							? "No standout day yet"
							: `Peak ${context.busiest_day_label}`,
				},
				{
					icon: "🔥",
					label: "Longest streak",
					value:
						context.longest_streak_length === "—"
							? "—"
							: `${context.longest_streak_length} days`,
					detail: context.longest_streak_range,
				},
			],
			chart: null,
			footer: "Swipe or tap to keep the vibe",
		},
		{
			tag: "Collab energy",
			title: "Who drives the chat?",
			body: "How you and the assistant share the mic.",
			highlights: [
				{
					icon: "🤖",
					label: "Assistant share",
					value: context.assistant_share,
					detail: `You ${context.user_share}`,
				},
				{
					icon: "🛠️",
					label: "Tool boosts",
					value: context.tool_share,
					detail: `${context.code_share} code moments`,
				},
				{
					icon: "⚡️",
					label: "Deep dives",
					value: context.deep_share,
					detail: `${context.short_share} quick loops`,
				},
			],
			chart: null,
			footer: "Tag who owes the next prompt.",
		},
		{
			tag: "Momentum",
			title: "Streaks & pauses",
			body: "Celebrate the grind and the reset days.",
			highlights: [
				{
					icon: "🚀",
					label: "Longest streak",
					value:
						context.longest_streak_length === "—"
							? "—"
							: `${context.longest_streak_length} days`,
					detail: context.longest_streak_range,
				},
				{
					icon: "🧘",
					label: "Longest pause",
					value:
						context.longest_gap_length === "—"
							? "—"
							: `${context.longest_gap_length} days`,
					detail: context.longest_gap_range,
				},
				{
					icon: "🏆",
					label: "Biggest convo",
					value: context.top_conversation_messages,
					detail: context.top_conversation_title,
				},
			],
			chart: null,
			footer: "Proof you kept building.",
		},
		{
			tag: "Reply craft",
			title: "Length of the assists",
			body: "How long the assistant runs with your ideas.",
			highlights: [
				{
					icon: "✍️",
					label: "Peak reply",
					value:
						context.assistant_peak_words === "—"
							? "—"
							: `${context.assistant_peak_words} words`,
					detail: context.assistant_peak_label,
				},
				{
					icon: "⚡",
					label: "Shortest",
					value:
						context.assistant_low_words === "—"
							? "—"
							: `${context.assistant_low_words} words`,
					detail: context.assistant_low_label,
				},
				{
					icon: "📊",
					label: "Recent avg",
					value:
						context.latest_word_avg === "—"
							? "—"
							: `${context.latest_word_avg} words`,
					detail:
						context.latest_char_avg === "—"
							? "—"
							: `${context.latest_char_avg} chars`,
				},
			],
			chart: null,
			footer: "Keep the bars flowing.",
		},
		{
			tag: "When it happens",
			title: "Your prime hours",
			body: "Top times you're chatting with GPT.",
			highlights: [
				{
					icon: "⏰",
					label: "Most active hour",
					value: context.peak_hour_label,
					detail:
						context.peak_hour_messages === "—"
							? "No activity yet"
							: `${context.peak_hour_messages} messages`,
				},
				{
					icon: "🌗",
					label: "Day split",
					value: context.daypart_split,
					detail: context.night_share,
				},
			],
			chart: chartData.hourlyActivity,
			footer: `Last update: ${context.last_date}`,
		},
		{
			tag: "Monthly trends",
			title: "Your evolution over time",
			body: "How your ChatGPT journey grew month by month.",
			highlights: [
				{
					icon: "💬",
					label: "Total messages",
					value: context.message_count,
					detail: `${context.conversation_count} conversations`,
				},
				{
					icon: "📈",
					label: "Peak month",
					value: context.peak_month_label,
					detail:
						context.peak_month_value === "—"
							? "—"
							: `${context.peak_month_value} messages`,
				},
				{
					icon: "📊",
					label: "Daily average",
					value: context.avg_messages_per_active_day,
					detail: `Across ${context.active_days} active days`,
				},
			],
			chart: null,
			footer: "Watch the momentum build.",
		},
		{
			tag: "Weekly cadence",
			title: "Where the buzz lands",
			body: "Days of the week GPT shows up with you.",
			highlights: [
				{
					icon: "🏅",
					label: "Weekly MVP",
					value: context.peak_weekday_label,
					detail:
						context.peak_weekday_messages === "—"
							? "No activity yet"
							: `${context.peak_weekday_messages} messages`,
				},
				{
					icon: "😴",
					label: "Chill day",
					value: context.low_weekday_label,
					detail:
						context.low_weekday_messages === "—"
							? "—"
							: `${context.low_weekday_messages} messages`,
				},
			],
			chart: chartData.weekdayActivity,
			footer: "Share your grind with the crew.",
		},
	];

	slides.forEach((definition, idx) => {
		const { element, canvas, shareButton } = createSlide(definition, idx);
		storyRail.appendChild(element);
		state.slides.push({
			element,
			canvas,
			chartConfig: definition.chart,
			shareButton,
		});
		if (shareButton) {
			shareButton.addEventListener("click", () => shareSlide(idx));
		}

		const dot = document.createElement("span");
		dot.className = "dot" + (idx === 0 ? " active" : "");
		dot.addEventListener("click", () => scrollToSlide(idx));
		storyProgress.appendChild(dot);

		if (canvas && definition.chart) {
			requestAnimationFrame(() => renderChart(canvas, definition.chart));
		}
	});

	if (!renderStory.initialised) {
		storyRail.addEventListener("scroll", onRailScroll, { passive: true });
		initTouchGestures();
		renderStory.initialised = true;
	}

	storyRail.scrollTop = 0;
	updateDots(0);
}

function initTouchGestures() {
	let touchStartY = 0;
	let touchStartX = 0;
	let touchStartTime = 0;
	let isSwiping = false;
	let hasMoved = false;

	storyRail.addEventListener(
		"touchstart",
		(e) => {
			touchStartY = e.touches[0].clientY;
			touchStartX = e.touches[0].clientX;
			touchStartTime = Date.now();
			isSwiping = false;
			hasMoved = false;
		},
		{ passive: true }
	);

	storyRail.addEventListener(
		"touchmove",
		(e) => {
			const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
			const deltaX = Math.abs(e.touches[0].clientX - touchStartX);

			if (deltaY > 5 || deltaX > 5) {
				hasMoved = true;
			}

			if (!isSwiping) {
				// Only track as swipe if vertical movement is dominant
				if (deltaY > 10 && deltaY > deltaX * 1.5) {
					isSwiping = true;
				}
			}
		},
		{ passive: true }
	);

	storyRail.addEventListener(
		"touchend",
		(e) => {
			const touchEndY = e.changedTouches[0].clientY;
			const touchEndX = e.changedTouches[0].clientX;
			const touchEndTime = Date.now();
			const deltaY = touchStartY - touchEndY;
			const deltaTime = touchEndTime - touchStartTime;
			const velocity = Math.abs(deltaY) / deltaTime;

			// Handle swipe gestures
			if (isSwiping) {
				// Snap to next/previous slide if swipe is significant enough
				if (Math.abs(deltaY) > 50 || velocity > 0.5) {
					const currentIndex = currentSlideIndex();
					let targetIndex = currentIndex;

					if (deltaY > 0 && currentIndex < state.slides.length - 1) {
						// Swipe up -> next slide
						targetIndex = currentIndex + 1;
					} else if (deltaY < 0 && currentIndex > 0) {
						// Swipe down -> previous slide
						targetIndex = currentIndex - 1;
					}

					if (targetIndex !== currentIndex) {
						scrollToSlide(targetIndex);
					}
				}
			} else if (!hasMoved && deltaTime < 300) {
				// Handle tap navigation (like Instagram stories)
				// Only on mobile devices
				if (window.innerWidth <= 540) {
					const currentIndex = currentSlideIndex();
					const railRect = storyRail.getBoundingClientRect();
					const tapX = touchEndX - railRect.left;
					const railWidth = railRect.width;

					// Tap on left third -> previous slide
					// Tap on right third -> next slide
					// Middle third -> no action (for interacting with content)
					if (tapX < railWidth * 0.3 && currentIndex > 0) {
						scrollToSlide(currentIndex - 1);
					} else if (
						tapX > railWidth * 0.7 &&
						currentIndex < state.slides.length - 1
					) {
						scrollToSlide(currentIndex + 1);
					}
				}
			}

			isSwiping = false;
			hasMoved = false;
		},
		{ passive: true }
	);
}

function createSlide(definition, index) {
	const slide = document.createElement("article");
	slide.className = "slide";
	if (index === 1) slide.classList.add("theme-2");
	if (index === 2) slide.classList.add("theme-3");
	if (index === 3) slide.classList.add("theme-4");
	if (index === 4) slide.classList.add("theme-5");
	if (index === 5) slide.classList.add("theme-6");

	const wrapper = document.createElement("div");
	wrapper.className = "content";

	// Add demo indicator badge on first slide
	if (state.isDemo && index === 0) {
		const demoBadge = document.createElement("span");
		demoBadge.className = "demo-badge";
		demoBadge.textContent = "Demo Preview";
		slide.appendChild(demoBadge);
	}

	const tagEl = document.createElement("span");
	tagEl.className = "tag";
	tagEl.textContent = definition.tag;

	const titleEl = document.createElement(index === 0 ? "h1" : "h2");
	titleEl.textContent = definition.title;

	const bodyEl = document.createElement("p");
	bodyEl.textContent = definition.body;

	wrapper.append(tagEl, titleEl, bodyEl);

	if (definition.stats?.length) {
		const statsEl = document.createElement("div");
		statsEl.className = "stats";
		definition.stats.forEach((item) => {
			const stat = document.createElement("div");
			stat.className = "stat";
			const value = document.createElement("span");
			value.className = "value";
			value.textContent = item.value;
			const label = document.createElement("span");
			label.className = "label";
			label.textContent = item.label;
			stat.append(value, label);
			statsEl.appendChild(stat);
		});
		wrapper.appendChild(statsEl);
	}

	let canvas = null;
	let chartSection = null;
	if (definition.chart) {
		chartSection = document.createElement("div");
		chartSection.className = "chart-insights";

		const chartWrap = document.createElement("div");
		chartWrap.className = "visual";
		canvas = document.createElement("canvas");
		chartWrap.appendChild(canvas);
		chartSection.appendChild(chartWrap);
		wrapper.appendChild(chartSection);
		slide.classList.add("chart-slide");
	}

	if (definition.highlights?.length) {
		const highlightsEl = document.createElement("div");
		highlightsEl.className = "highlights";
		definition.highlights.forEach((item) => {
			const card = document.createElement("div");
			card.className = "highlight";
			if (item.icon) {
				const icon = document.createElement("span");
				icon.className = "emoji";
				icon.textContent = item.icon;
				card.appendChild(icon);
			}
			const value = document.createElement("span");
			value.className = "value";
			value.textContent = item.value;
			const label = document.createElement("span");
			label.className = "label";
			label.textContent = item.label;
			card.append(value, label);
			if (item.detail) {
				const detail = document.createElement("span");
				detail.className = "detail";
				detail.textContent = item.detail;
				card.appendChild(detail);
			}
			highlightsEl.appendChild(card);
		});
		(chartSection ?? wrapper).appendChild(highlightsEl);
	}

	const shareButton = document.createElement("button");
	shareButton.type = "button";
	shareButton.className = "action share floating-share";
	shareButton.textContent = "Share";

	wrapper.appendChild(shareButton);

	if (definition.footer) {
		const footer = document.createElement("footer");
		footer.textContent = definition.footer;
		wrapper.appendChild(footer);
	}

	slide.appendChild(wrapper);
	return { element: slide, canvas, shareButton };
}

function renderChart(canvas, config) {
	if (!window.Chart) return;
	const ctx = canvas.getContext("2d");
	const parentWidth = canvas.parentElement.clientWidth || 320;
	canvas.width = parentWidth;
	canvas.height = 260;
	if (!state.chartDefaultsSet) {
		// eslint-disable-next-line no-undef
		Chart.defaults.color = "#e2e8f0";
		// eslint-disable-next-line no-undef
		Chart.defaults.font.family = "Manrope, Helvetica Neue, Arial, sans-serif";
		state.chartDefaultsSet = true;
	}
	// eslint-disable-next-line no-undef
	const chart = new Chart(ctx, config);
	state.chartInstances.push(chart);
}

function destroyCharts() {
	state.chartInstances.forEach((chart) => chart.destroy());
	state.chartInstances = [];
}

function onRailScroll() {
	cancelAnimationFrame(onRailScroll._raf);
	onRailScroll._raf = requestAnimationFrame(() =>
		updateDots(currentSlideIndex())
	);
}

function currentSlideIndex() {
	if (!state.slides.length) return 0;
	const railRect = storyRail.getBoundingClientRect();
	let bestIndex = 0;
	let minDiff = Infinity;
	state.slides.forEach((slide, idx) => {
		const rect = slide.element.getBoundingClientRect();
		const diff = Math.abs(
			rect.top + rect.height / 2 - (railRect.top + railRect.height / 2)
		);
		if (diff < minDiff) {
			minDiff = diff;
			bestIndex = idx;
		}
	});
	return bestIndex;
}

function updateDots(activeIndex) {
	Array.from(storyProgress.children).forEach((dot, idx) => {
		dot.classList.toggle("active", idx === activeIndex);
	});
}

function scrollToSlide(idx) {
	const entry = state.slides[idx];
	if (!entry) return;
	entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
}

function shareSlide(entryIndex = currentSlideIndex()) {
	const entry = state.slides[entryIndex];
	if (!entry) return;

	// Hide share button during capture
	if (entry.shareButton) {
		entry.shareButton.classList.add("hide-capturing");
	}

	// Hide demo badge during capture if it exists
	const demoBadge = entry.element.querySelector(".demo-badge");
	if (demoBadge) {
		demoBadge.classList.add("hide-capturing");
	}

	// Instagram story dimensions: 1080x1920 (9:16 aspect ratio)
	const targetWidth = 1080;
	const targetHeight = 1920;

	// Temporarily set exact dimensions for perfect Instagram capture
	const originalWidth = entry.element.style.width;
	const originalHeight = entry.element.style.height;
	const originalMaxHeight = entry.element.style.maxHeight;
	const originalMinHeight = entry.element.style.minHeight;

	entry.element.style.width = "540px";
	entry.element.style.height = "960px";
	entry.element.style.maxHeight = "960px";
	entry.element.style.minHeight = "960px";

	// Wait for reflow
	setTimeout(() => {
		html2canvas(entry.element, {
			backgroundColor: null,
			scale: 2, // 540 * 2 = 1080, 960 * 2 = 1920
			useCORS: true,
			allowTaint: true,
			logging: false,
			windowWidth: 540,
			windowHeight: 960,
		}).then((canvas) => {
			// Restore original dimensions
			entry.element.style.width = originalWidth;
			entry.element.style.height = originalHeight;
			entry.element.style.maxHeight = originalMaxHeight;
			entry.element.style.minHeight = originalMinHeight;

			// Restore share button
			if (entry.shareButton) {
				entry.shareButton.classList.remove("hide-capturing");
			}

			// Restore demo badge
			if (demoBadge) {
				demoBadge.classList.remove("hide-capturing");
			}

			// Canvas should now be exactly 1080x1920
			canvas.toBlob((blob) => {
				if (!blob) return;
				const index = state.slides.indexOf(entry) + 1;
				const fileName = `chatrecap-story-${index}.png`;
				if (
					navigator.canShare &&
					navigator.canShare({
						files: [new File([blob], fileName, { type: "image/png" })],
					})
				) {
					const file = new File([blob], fileName, { type: "image/png" });
					navigator
						.share({
							files: [file],
							title: "ChatRecap",
							text: "My ChatGPT recap ✨",
						})
						.catch(() => downloadBlob(blob, fileName));
				} else {
					downloadBlob(blob, fileName);
					const isMobile = /iPhone|iPad|iPod|Android/i.test(
						navigator.userAgent
					);
					if (isMobile) {
						alert(
							"Story saved! Optimized for Instagram (1080x1920). Upload to your story from your gallery."
						);
					} else {
						alert(
							"Slide saved as Instagram story format (1080x1920). Share it on your story!"
						);
					}
				}
			}, "image/png");
		});
	}, 100);
}

function downloadBlob(blob, fileName) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1500);
}
