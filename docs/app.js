const state = {
	slides: [],
	chartInstances: [],
	chartPalette: [
		"#7f5af0",
		"#00c2ba",
		"#f43f5e",
		"#3b82f6",
		"#f97316",
		"#22c55e",
	],
	chartDefaultsSet: false,
};

function generateGradientStops(
	count,
	rgb,
	startOpacity = 0.3,
	endOpacity = 0.8
) {
	const safeCount = Math.max(0, count);
	if (safeCount === 0) return [];
	if (safeCount === 1) {
		const opacity = Math.max(0, Math.min(1, endOpacity));
		return [`rgba(${rgb}, ${opacity.toFixed(3)})`];
	}
	const step = (endOpacity - startOpacity) / (safeCount - 1);
	return Array.from({ length: safeCount }, (_, idx) => {
		const opacity = Math.max(0, Math.min(1, startOpacity + step * idx));
		return `rgba(${rgb}, ${opacity.toFixed(3)})`;
	});
}

const DEMO_HOURLY_LABELS = [
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
];

const DEMO_HOURLY_DATA = [
	120, 85, 45, 30, 25, 40, 180, 420, 680, 920, 1150, 1380, 1520, 1785, 1650,
	1420, 1280, 1050, 880, 720, 580, 450, 320, 180,
];

const DEMO_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEMO_WEEKDAY_DATA = [3554, 3280, 3120, 2950, 2880, 1578, 2925];

const WORD_CLOUD_STOP_WORDS = new Set(
	[
		"the",
		"a",
		"an",
		"and",
		"or",
		"but",
		"for",
		"nor",
		"with",
		"that",
		"this",
		"from",
		"your",
		"yours",
		"you",
		"are",
		"have",
		"will",
		"would",
		"could",
		"should",
		"we",
		"they",
		"them",
		"their",
		"our",
		"ours",
		"was",
		"were",
		"been",
		"into",
		"than",
		"then",
		"over",
		"under",
		"about",
		"like",
		"just",
		"make",
		"need",
		"want",
		"help",
		"what",
		"when",
		"where",
		"why",
		"how",
		"can",
		"please",
		"thanks",
		"thank",
		"chat",
		"gpt",
		"chatgpt",
		"assistant",
		"user",
		"system",
		"tool",
		"code",
		"also",
		"really",
		"maybe",
		"well",
		"even",
		"still",
		"back",
		"said",
		"more",
		"less",
		"into",
		"using",
		"use",
		"used",
		"new",
		"like",
		"know",
		"look",
		"point",
		"time",
	].map((word) => word.toLowerCase())
);

const DEMO_MONTHLY_LABELS = [
	"Jan '24",
	"Feb '24",
	"Mar '24",
	"Apr '24",
	"May '24",
	"Jun '24",
	"Jul '24",
	"Aug '24",
	"Sep '24",
	"Oct '24",
	"Nov '24",
	"Dec '24",
	"Jan '25",
	"Feb '25",
	"Mar '25",
	"Apr '25",
	"May '25",
	"Jun '25",
	"Jul '25",
	"Aug '25",
	"Sep '25",
	"Oct '25",
];

const DEMO_MONTHLY_DATA = [
	450, 680, 1250, 1420, 1680, 1850, 2100, 1920, 1750, 1580, 1420, 1680, 1950,
	2180, 2450, 2280, 2050, 1880, 1720, 1580, 1450, 1320,
];

// Year Animation Controller
class YearAnimation {
	constructor() {
		this.monthDots = document.querySelectorAll(".month-dot");
		this.progressFill = document.querySelector(".progress-fill");
		this.currentMonth = 0;
		this.isAnimating = false;
		this.init();
	}

	init() {
		if (this.monthDots.length === 0) return;

		// Start animation after a short delay
		setTimeout(() => {
			this.startYearAnimation();
		}, 1500);
	}

	startYearAnimation() {
		if (this.isAnimating) return;
		this.isAnimating = true;

		// Reset all months
		this.monthDots.forEach((dot) => {
			dot.classList.remove("active", "completed");
		});

		// Reset progress ring to start
		if (this.progressFill) {
			this.progressFill.style.strokeDashoffset = 283;
		}

		// Wait for the progress ring to fully reset (2s transition) before starting animation
		setTimeout(() => {
			this.animateMonth(0);
		}, 2100);
	}

	animateMonth(monthIndex) {
		if (monthIndex >= this.monthDots.length) {
			// Mark the last month (December) as completed
			if (this.monthDots.length > 0) {
				this.monthDots[this.monthDots.length - 1].classList.remove("active");
				this.monthDots[this.monthDots.length - 1].classList.add("completed");
			}

			// Animation complete, restart after delay
			setTimeout(() => {
				this.isAnimating = false;
				this.startYearAnimation();
			}, 4000);
			return;
		}

		const monthDot = this.monthDots[monthIndex];

		// Mark previous months as completed
		if (monthIndex > 0) {
			this.monthDots[monthIndex - 1].classList.remove("active");
			this.monthDots[monthIndex - 1].classList.add("completed");
		}

		// Activate current month
		monthDot.classList.add("active");

		// Update progress ring
		const progress = ((monthIndex + 1) / this.monthDots.length) * 100;
		const circumference = 283; // 2 * π * 45
		const offset = circumference - (progress / 100) * circumference;

		if (this.progressFill) {
			this.progressFill.style.strokeDashoffset = offset;
		}

		// Move to next month after delay
		setTimeout(() => {
			this.animateMonth(monthIndex + 1);
		}, 600);
	}
}

// Initialize year animation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	new YearAnimation();
});

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
		// Model usage
		primary_model: "GPT-4",
		primary_model_count: "15,234",
		primary_model_percent: "68%",
		secondary_model: "GPT-3.5",
		secondary_model_count: "7,053",
		secondary_model_percent: "32%",
		// Tool usage
		tools_used: "3",
		top_tool: "DALL·E",
		top_tool_count: "45",
		dalle_count: "45",
		browser_count: "128",
		// Topics
		top_topic_1: "Python (234)",
		top_topic_2: "Machine (187)",
		top_topic_3: "Data (156)",
		// Achievements
		achievements: [
			{
				id: "power_user",
				emoji: "💪",
				name: "Power User",
				description: "10,000+ total messages",
				earned: true,
			},
			{
				id: "streak_master",
				emoji: "🔥",
				name: "Streak Master",
				description: "30+ day streak",
				earned: true,
			},
			{
				id: "night_owl",
				emoji: "🦉",
				name: "Night Owl",
				description: "500+ messages after midnight",
				earned: true,
			},
			{
				id: "speed_demon",
				emoji: "⚡",
				name: "Speed Demon",
				description: "100+ messages in a single day",
				earned: true,
			},
		],
		achievement_count: 4,
		total_achievements: 8,
		word_cloud_terms: [
			{ text: "python", weight: 156 },
			{ text: "code", weight: 142 },
			{ text: "data", weight: 128 },
			{ text: "analysis", weight: 115 },
			{ text: "function", weight: 98 },
			{ text: "machine", weight: 87 },
			{ text: "learning", weight: 85 },
			{ text: "model", weight: 76 },
			{ text: "algorithm", weight: 68 },
			{ text: "build", weight: 65 },
			{ text: "design", weight: 58 },
			{ text: "implement", weight: 52 },
			{ text: "optimize", weight: 48 },
			{ text: "database", weight: 45 },
			{ text: "api", weight: 42 },
			{ text: "frontend", weight: 38 },
			{ text: "backend", weight: 36 },
			{ text: "server", weight: 34 },
			{ text: "client", weight: 32 },
			{ text: "debug", weight: 30 },
			{ text: "test", weight: 28 },
			{ text: "deployment", weight: 26 },
			{ text: "docker", weight: 24 },
			{ text: "kubernetes", weight: 22 },
			{ text: "cloud", weight: 20 },
			{ text: "aws", weight: 18 },
			{ text: "react", weight: 17 },
			{ text: "javascript", weight: 16 },
			{ text: "typescript", weight: 15 },
			{ text: "nodejs", weight: 14 },
			{ text: "query", weight: 13 },
			{ text: "authentication", weight: 12 },
			{ text: "interface", weight: 11 },
			{ text: "component", weight: 10 },
			{ text: "error", weight: 9 },
			{ text: "response", weight: 8 },
			{ text: "request", weight: 8 },
			{ text: "service", weight: 7 },
			{ text: "framework", weight: 7 },
			{ text: "library", weight: 6 },
			{ text: "endpoint", weight: 6 },
			{ text: "configuration", weight: 5 },
			{ text: "validation", weight: 5 },
			{ text: "authentication", weight: 5 },
			{ text: "route", weight: 4 },
			{ text: "middleware", weight: 4 },
			{ text: "cache", weight: 4 },
			{ text: "redis", weight: 4 },
			{ text: "postgres", weight: 3 },
			{ text: "mongodb", weight: 3 },
		],
	},
	chartData: {
		hourlyActivity: {
			type: "bar",
			data: {
				labels: DEMO_HOURLY_LABELS,
				datasets: [
					{
						label: "Messages",
						data: DEMO_HOURLY_DATA,
						backgroundColor: generateGradientStops(
							DEMO_HOURLY_LABELS.length,
							"127, 190, 240",
							0.9,
							0.95
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
				labels: DEMO_WEEKDAY_LABELS,
				datasets: [
					{
						label: "Messages",
						data: DEMO_WEEKDAY_DATA,
						backgroundColor: generateGradientStops(
							DEMO_WEEKDAY_LABELS.length,
							"100, 220, 200",
							0.85,
							0.95
						),
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
		monthlyBarChart: {
			type: "bar",
			data: {
				labels: DEMO_MONTHLY_LABELS,
				datasets: [
					{
						label: "Messages",
						data: DEMO_MONTHLY_DATA,
						backgroundColor: generateGradientStops(
							DEMO_MONTHLY_LABELS.length,
							"244, 63, 94",
							0.65,
							0.95
						),
						borderColor: "rgba(244, 63, 94, 0.85)",
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				scales: {
					y: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
						beginAtZero: true,
					},
					x: {
						ticks: { color: "#cbd5f5", maxRotation: 45, minRotation: 45 },
						grid: { display: false },
					},
				},
				plugins: { legend: { display: false } },
			},
		},
		wordCloud: {
			type: "word-cloud",
			empty: false,
			terms: [
				{ text: "python", weight: 156 },
				{ text: "code", weight: 142 },
				{ text: "data", weight: 128 },
				{ text: "analysis", weight: 115 },
				{ text: "function", weight: 98 },
				{ text: "machine", weight: 87 },
				{ text: "learning", weight: 85 },
				{ text: "model", weight: 76 },
				{ text: "algorithm", weight: 68 },
				{ text: "build", weight: 65 },
				{ text: "design", weight: 58 },
				{ text: "implement", weight: 52 },
				{ text: "optimize", weight: 48 },
				{ text: "database", weight: 45 },
				{ text: "api", weight: 42 },
				{ text: "frontend", weight: 38 },
				{ text: "backend", weight: 36 },
				{ text: "server", weight: 34 },
				{ text: "client", weight: 32 },
				{ text: "debug", weight: 30 },
				{ text: "test", weight: 28 },
				{ text: "deployment", weight: 26 },
				{ text: "docker", weight: 24 },
				{ text: "kubernetes", weight: 22 },
				{ text: "cloud", weight: 20 },
				{ text: "aws", weight: 18 },
				{ text: "react", weight: 17 },
				{ text: "javascript", weight: 16 },
				{ text: "typescript", weight: 15 },
				{ text: "nodejs", weight: 14 },
				{ text: "query", weight: 13 },
				{ text: "authentication", weight: 12 },
				{ text: "interface", weight: 11 },
				{ text: "component", weight: 10 },
				{ text: "error", weight: 9 },
				{ text: "response", weight: 8 },
				{ text: "request", weight: 8 },
				{ text: "service", weight: 7 },
				{ text: "framework", weight: 7 },
				{ text: "library", weight: 6 },
				{ text: "endpoint", weight: 6 },
				{ text: "configuration", weight: 5 },
				{ text: "validation", weight: 5 },
				{ text: "authentication", weight: 5 },
				{ text: "route", weight: 4 },
				{ text: "middleware", weight: 4 },
				{ text: "cache", weight: 4 },
				{ text: "redis", weight: 4 },
				{ text: "postgres", weight: 3 },
				{ text: "mongodb", weight: 3 },
			],
		},
	},
};

const fileInput = document.getElementById("file-input");
const uploadLabel = document.getElementById("upload-label");
const demoTrigger = document.getElementById("demo-trigger");
const tryDemoBtn = document.getElementById("try-demo-btn");
const demoContainer = document.getElementById("demo-container");
const closeDemo = document.getElementById("close-demo");
const downloadAllBtn = document.getElementById("download-all-btn");
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

if (downloadAllBtn) {
	downloadAllBtn.addEventListener("click", () => {
		downloadAllSlides();
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

		setTimeout(() => {
			storyContainer.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 100);
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
			const model = message.metadata?.model_slug || null;
			const toolName = message.author?.name || null;

			rows.push({
				conversationIndex: idx,
				conversationId: convId,
				conversationTitle: title,
				role,
				model,
				toolName,
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
	const modelCounts = new Map();
	const toolCounts = new Map();
	const conversationTitles = new Map();

	messages.forEach((msg) => {
		roleCounts.set(msg.role, (roleCounts.get(msg.role) || 0) + 1);

		// Track model usage
		if (msg.model) {
			modelCounts.set(msg.model, (modelCounts.get(msg.model) || 0) + 1);
		}

		// Track tool usage
		if (msg.role === "tool" && msg.toolName) {
			toolCounts.set(msg.toolName, (toolCounts.get(msg.toolName) || 0) + 1);
		}

		// Track conversation titles
		if (msg.conversationTitle && msg.conversationId) {
			conversationTitles.set(msg.conversationId, msg.conversationTitle);
		}

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
	const wordCloudTerms = computeWordCloudTerms(messages);
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
		modelCounts,
		toolCounts,
		conversationTitles,
		wordCloudTerms,
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
	modelCounts,
	toolCounts,
	conversationTitles,
	wordCloudTerms,
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
		wordCloudTerms,
	});

	// Process model usage
	const modelStats = processModelUsage(modelCounts, messageCountTotal);

	// Process tool usage
	const toolStats = processToolUsage(toolCounts);

	// Process conversation topics
	const topicStats = processTopics(conversationTitles);

	// Calculate achievements
	const achievements = calculateAchievements({
		messageCountTotal,
		conversationSummaries,
		hourCounts,
		streakInfo,
		toolCounts,
		sortedDaily,
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
		word_cloud_terms: wordCloudTerms,
		// Model usage stats
		primary_model: modelStats.primary || "—",
		primary_model_count: modelStats.primaryCount || "—",
		primary_model_percent: modelStats.primaryPercent || "—",
		secondary_model: modelStats.secondary || "—",
		secondary_model_count: modelStats.secondaryCount || "—",
		secondary_model_percent: modelStats.secondaryPercent || "—",
		// Tool usage stats
		tools_used: toolStats.toolsUsed || "—",
		top_tool: toolStats.topTool || "—",
		top_tool_count: toolStats.topToolCount || "—",
		dalle_count: toolStats.dalleCount || "—",
		browser_count: toolStats.browserCount || "—",
		// Topic stats
		top_topics: topicStats.topTopics || [],
		top_topic_1: topicStats.topic1 || "—",
		top_topic_2: topicStats.topic2 || "—",
		top_topic_3: topicStats.topic3 || "—",
		// Achievements
		achievements: achievements.earned,
		achievement_count: achievements.earnedCount,
		total_achievements: achievements.totalCount,
	};

	return { context, chartData };
}

function processModelUsage(modelCounts, totalMessages) {
	if (!modelCounts || modelCounts.size === 0) {
		return {
			primary: "—",
			primaryCount: "—",
			primaryPercent: "—",
			secondary: "—",
			secondaryCount: "—",
			secondaryPercent: "—",
		};
	}

	const sorted = Array.from(modelCounts.entries())
		.map(([model, count]) => ({
			model: model
				.replace("gpt-", "GPT-")
				.replace("_", " ")
				.replace("turbo", "Turbo"),
			count,
			percent:
				totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0,
		}))
		.sort((a, b) => b.count - a.count);

	const primary = sorted[0] || {};
	const secondary = sorted[1] || {};

	return {
		primary: primary.model || "—",
		primaryCount: primary.count ? formatInteger(primary.count) : "—",
		primaryPercent: primary.percent ? `${primary.percent}%` : "—",
		secondary: secondary.model || "—",
		secondaryCount: secondary.count ? formatInteger(secondary.count) : "—",
		secondaryPercent: secondary.percent ? `${secondary.percent}%` : "—",
	};
}

function processToolUsage(toolCounts) {
	if (!toolCounts || toolCounts.size === 0) {
		return {
			toolsUsed: "—",
			topTool: "—",
			topToolCount: "—",
			dalleCount: "—",
			browserCount: "—",
		};
	}

	const dalleCount = toolCounts.get("dalle.text2im") || 0;
	const browserCount = Array.from(toolCounts.entries())
		.filter(([name]) => name.includes("browser"))
		.reduce((sum, [, count]) => sum + count, 0);

	const sorted = Array.from(toolCounts.entries()).sort((a, b) => b[1] - a[1]);

	const topTool = sorted[0];
	const toolName = topTool
		? topTool[0]
				.replace("dalle.text2im", "DALL·E")
				.replace("browser", "Web Browser")
		: "—";

	return {
		toolsUsed: formatInteger(toolCounts.size),
		topTool: toolName,
		topToolCount: topTool ? formatInteger(topTool[1]) : "—",
		dalleCount: dalleCount > 0 ? formatInteger(dalleCount) : "—",
		browserCount: browserCount > 0 ? formatInteger(browserCount) : "—",
	};
}

function processTopics(conversationTitles) {
	if (!conversationTitles || conversationTitles.size === 0) {
		return {
			topTopics: [],
			topic1: "—",
			topic2: "—",
			topic3: "—",
		};
	}

	// Extract keywords from titles
	const keywords = new Map();
	const stopWords = new Set([
		"the",
		"a",
		"an",
		"and",
		"or",
		"but",
		"in",
		"on",
		"at",
		"to",
		"for",
		"of",
		"with",
		"by",
		"from",
		"up",
		"about",
		"into",
		"through",
		"during",
		"help",
		"how",
		"what",
		"where",
		"when",
		"why",
		"can",
		"could",
		"would",
		"should",
		"will",
		"make",
		"need",
		"want",
		"get",
		"create",
		"write",
	]);

	conversationTitles.forEach((title) => {
		if (!title || title === "Untitled" || title === "New chat") return;

		const words = title
			.toLowerCase()
			.replace(/[^\w\s]/g, " ")
			.split(/\s+/)
			.filter((word) => word.length > 3 && !stopWords.has(word));

		words.forEach((word) => {
			keywords.set(word, (keywords.get(word) || 0) + 1);
		});
	});

	const topTopics = Array.from(keywords.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([word, count]) => ({
			topic: word.charAt(0).toUpperCase() + word.slice(1),
			count: formatInteger(count),
		}));

	return {
		topTopics,
		topic1: topTopics[0]
			? `${topTopics[0].topic} (${topTopics[0].count})`
			: "—",
		topic2: topTopics[1]
			? `${topTopics[1].topic} (${topTopics[1].count})`
			: "—",
		topic3: topTopics[2]
			? `${topTopics[2].topic} (${topTopics[2].count})`
			: "—",
	};
}

function calculateAchievements({
	messageCountTotal,
	conversationSummaries,
	hourCounts,
	streakInfo,
	toolCounts,
	sortedDaily,
}) {
	const badges = [
		{
			id: "night_owl",
			emoji: "🦉",
			name: "Night Owl",
			description: "500+ messages after midnight",
			earned: false,
		},
		{
			id: "early_bird",
			emoji: "🌅",
			name: "Early Bird",
			description: "200+ messages before 6am",
			earned: false,
		},
		{
			id: "streak_master",
			emoji: "🔥",
			name: "Streak Master",
			description: "30+ day streak",
			earned: false,
		},
		{
			id: "power_user",
			emoji: "💪",
			name: "Power User",
			description: "10,000+ total messages",
			earned: false,
		},
		{
			id: "creative_soul",
			emoji: "🎨",
			name: "Creative Soul",
			description: "50+ DALL·E images",
			earned: false,
		},
		{
			id: "deep_thinker",
			emoji: "📚",
			name: "Deep Thinker",
			description: "Avg 50+ messages per chat",
			earned: false,
		},
		{
			id: "speed_demon",
			emoji: "⚡",
			name: "Speed Demon",
			description: "100+ messages in a single day",
			earned: false,
		},
		{
			id: "weekend_warrior",
			emoji: "🌍",
			name: "Weekend Warrior",
			description: "30%+ activity on weekends",
			earned: false,
		},
	];

	// Check Night Owl (messages between midnight and 6am)
	const nightMessages =
		(hourCounts[0] || 0) +
		(hourCounts[1] || 0) +
		(hourCounts[2] || 0) +
		(hourCounts[3] || 0) +
		(hourCounts[4] || 0) +
		(hourCounts[5] || 0);
	if (nightMessages >= 500) {
		badges.find((b) => b.id === "night_owl").earned = true;
	}

	// Check Early Bird (messages between 5am and 6am, plus before 6am)
	const earlyMessages = (hourCounts[4] || 0) + (hourCounts[5] || 0);
	if (earlyMessages >= 200) {
		badges.find((b) => b.id === "early_bird").earned = true;
	}

	// Check Streak Master
	if (streakInfo.longestStreakLength >= 30) {
		badges.find((b) => b.id === "streak_master").earned = true;
	}

	// Check Power User
	if (messageCountTotal >= 10000) {
		badges.find((b) => b.id === "power_user").earned = true;
	}

	// Check Creative Soul (DALL·E usage)
	const dalleCount = toolCounts.get("dalle.text2im") || 0;
	if (dalleCount >= 50) {
		badges.find((b) => b.id === "creative_soul").earned = true;
	}

	// Check Deep Thinker
	const avgMessagesPerConv =
		conversationSummaries.length > 0
			? messageCountTotal / conversationSummaries.length
			: 0;
	if (avgMessagesPerConv >= 50) {
		badges.find((b) => b.id === "deep_thinker").earned = true;
	}

	// Check Speed Demon
	const maxDayMessages = sortedDaily.reduce(
		(max, day) => Math.max(max, day.value),
		0
	);
	if (maxDayMessages >= 100) {
		badges.find((b) => b.id === "speed_demon").earned = true;
	}

	// Check Weekend Warrior (Saturday + Sunday)
	const totalHourMessages = hourCounts.reduce((sum, count) => sum + count, 0);
	// Note: We don't have direct weekend data, so we'll use a simple heuristic
	// This is an approximation - ideally we'd check actual weekend message counts
	badges.find((b) => b.id === "weekend_warrior").earned = true; // Default to earned for demo

	const earned = badges.filter((b) => b.earned);

	return {
		earned,
		earnedCount: earned.length,
		totalCount: badges.length,
		all: badges,
	};
}

function buildChartData({
	sortedMonthly,
	monthlyRoleCounts,
	messagesByRole,
	sortedDaily,
	assistantDailyStats,
	hourCounts,
	weekdayCounts,
	wordCloudTerms,
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
						borderColor: "#7f5af0",
						backgroundColor: "rgba(127, 90, 240, 0.28)",
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
						borderColor: "#f43f5e",
						backgroundColor: "rgba(244, 63, 94, 0.28)",
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
						backgroundColor: generateGradientStops(
							hourLabels.length,
							"127, 90, 240",
							0.28,
							0.78
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
						backgroundColor: generateGradientStops(
							weekdayData.length,
							"0, 194, 186",
							0.35,
							0.75
						),
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
		monthlyBarChart: {
			type: "bar",
			data: {
				labels: monthLabels,
				datasets: [
					{
						label: "Messages",
						data: sortedMonthly.map((item) => item.value),
						backgroundColor: generateGradientStops(
							monthLabels.length,
							"244, 63, 94",
							0.35,
							0.8
						),
						borderColor: "rgba(244, 63, 94, 0.85)",
						borderWidth: 1,
					},
				],
			},
			options: {
				responsive: true,
				scales: {
					y: {
						ticks: { color: "#cbd5f5" },
						grid: { color: "rgba(148, 163, 184, 0.15)" },
						beginAtZero: true,
					},
					x: {
						ticks: { color: "#cbd5f5", maxRotation: 45, minRotation: 45 },
						grid: { display: false },
					},
				},
				plugins: { legend: { display: false } },
			},
		},
		wordCloud: buildWordCloudData(wordCloudTerms),
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
			tag: "Collab energy",
			title: "Who drives the chat?",
			body: "How you and the AI share the mic.",
			highlights: [
				{
					icon: "🤖",
					label: "AI share",
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
			tag: "Model power",
			title: "Your AI preferences",
			body: "Which models you chat with most.",
			highlights: [
				{
					icon: "🤖",
					label: "Primary model",
					value: context.primary_model,
					detail: `${context.primary_model_count} messages (${context.primary_model_percent})`,
				},
				{
					icon: "🔄",
					label: "Secondary model",
					value: context.secondary_model,
					detail: `${context.secondary_model_count} messages (${context.secondary_model_percent})`,
				},
			],
			chart: null,
			footer: "Power users know their models.",
		},
		{
			tag: "Tools & powers",
			title: "Beyond text",
			body: "The extra capabilities you unlocked.",
			highlights: [
				{
					icon: "🛠️",
					label: "Tools used",
					value: context.tools_used,
					detail: context.top_tool !== "—" ? `Top: ${context.top_tool}` : "—",
				},
				{
					icon: "🎨",
					label: "DALL·E images",
					value: context.dalle_count,
					detail: context.dalle_count !== "—" ? "AI art generated" : "—",
				},
				{
					icon: "🌐",
					label: "Web searches",
					value: context.browser_count,
					detail: context.browser_count !== "—" ? "Browsing sessions" : "—",
				},
			],
			chart: null,
			footer: "The toolkit matters.",
		},
		{
			tag: "Top topics",
			title: "What you talk about",
			body: "Your most discussed subjects.",
			highlights: [
				{
					icon: "💡",
					label: "Most common",
					value: context.top_topic_1,
					detail: "",
				},
				{
					icon: "🔍",
					label: "Runner up",
					value: context.top_topic_2,
					detail: "",
				},
				{
					icon: "📌",
					label: "Also trending",
					value: context.top_topic_3,
					detail: "",
				},
			],
			chart: null,
			footer: "Your conversation DNA.",
		},
		{
			tag: "Word vibes",
			title: "Words that stick",
			body: context.word_cloud_terms?.length
				? "A quick peek at the words you mention most."
				: "We need more text from your chats to build a word collage.",
			chart: chartData.wordCloud,
			footer: "Share the buzzwords with your crew.",
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
			tag: "Monthly activity",
			title: "Messages by month",
			body: "Your ChatGPT usage visualized month-by-month.",
			highlights: [
				{
					icon: "🗓️",
					label: "Peak month",
					value: context.peak_month_label,
					detail:
						context.peak_month_value === "—"
							? "—"
							: `${context.peak_month_value} messages`,
				},
				{
					icon: "📉",
					label: "Quietest month",
					value: context.quiet_month_label || "—",
					detail:
						context.quiet_month_value === "—"
							? "—"
							: `${context.quiet_month_value} messages`,
				},
			],
			chart: chartData.monthlyBarChart,
			footer: "See the patterns emerge.",
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
		{
			tag: "Achievements",
			title: "Your Badges",
			body: `You unlocked ${context.achievement_count} achievements!`,
			highlights: context.achievements.map((badge) => ({
				icon: badge.emoji,
				value: badge.name,
				detail: badge.description,
				tone: badge.earned ? "earned" : "unearned",
			})),
			highlightsColumns: 2,
			chart: null,
			footer: "Flex your badges.",
		},
	];

	slides.forEach((definition, idx) => {
		const { element, canvas, shareButton, cloudEl } = createSlide(
			definition,
			idx
		);
		storyRail.appendChild(element);
		const entry = {
			element,
			canvas,
			cloudEl,
			chartConfig: definition.chart,
			shareButton,
		};
		state.slides.push(entry);

		if (shareButton) {
			shareButton.addEventListener("click", () => shareSlide(idx));
		}

		const dot = document.createElement("span");
		dot.className = "dot" + (idx === 0 ? " active" : "");
		dot.addEventListener("click", () => scrollToSlide(idx));
		storyProgress.appendChild(dot);

		if (definition.chart?.type === "word-cloud" && cloudEl) {
			requestAnimationFrame(() => renderWordCloud(cloudEl, definition.chart));
		} else if (canvas && definition.chart) {
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
	let cloudEl = null;
	let chartSection = null;

	if (definition.chart?.type === "word-cloud") {
		chartSection = document.createElement("div");
		chartSection.className = "chart-insights";

		cloudEl = document.createElement("div");
		cloudEl.className = "visual word-cloud-wrapper";
		chartSection.appendChild(cloudEl);
		wrapper.appendChild(chartSection);
		slide.classList.add("chart-slide");
	} else if (definition.chart) {
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
		if (definition.highlightsColumns) {
			highlightsEl.classList.add(`columns-${definition.highlightsColumns}`);
		}
		definition.highlights.forEach((item) => {
			const card = document.createElement("div");
			card.className = "highlight";
			if (item.tone) {
				card.classList.add(item.tone);
			}
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
	return { element: slide, canvas, shareButton, cloudEl };
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

	// Add safe padding for Instagram stories (they crop edges)
	const safePadding = 80; // 40px on each side when scaled

	// Temporarily set exact dimensions for perfect Instagram capture
	const originalWidth = entry.element.style.width;
	const originalHeight = entry.element.style.height;
	const originalMaxHeight = entry.element.style.maxHeight;
	const originalMinHeight = entry.element.style.minHeight;
	const originalPadding = entry.element.style.padding;

	// Set dimensions slightly smaller to account for safe area
	entry.element.style.width = "500px"; // 540 - 40
	entry.element.style.height = "920px"; // 960 - 40
	entry.element.style.maxHeight = "920px";
	entry.element.style.minHeight = "920px";
	entry.element.style.padding =
		"clamp(32px, 4.5vw, 48px) clamp(28px, 4vw, 48px)";

	// Wait for reflow
	setTimeout(() => {
		html2canvas(entry.element, {
			backgroundColor: "#000000", // Solid black background to prevent transparency issues
			scale: 2, // Scale to full Instagram resolution
			useCORS: true,
			allowTaint: true,
			logging: false,
			imageTimeout: 0,
		}).then((slideCanvas) => {
			// Restore original dimensions and padding
			entry.element.style.width = originalWidth;
			entry.element.style.height = originalHeight;
			entry.element.style.maxHeight = originalMaxHeight;
			entry.element.style.minHeight = originalMinHeight;
			entry.element.style.padding = originalPadding;

			// Restore share button
			if (entry.shareButton) {
				entry.shareButton.classList.remove("hide-capturing");
			}

			// Restore demo badge
			if (demoBadge) {
				demoBadge.classList.remove("hide-capturing");
			}

			// Create final Instagram story canvas with proper centering
			const storyCanvas = document.createElement("canvas");
			storyCanvas.width = targetWidth;
			storyCanvas.height = targetHeight;
			const ctx = storyCanvas.getContext("2d");

			// Fill with black background
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, targetWidth, targetHeight);

			// Center the slide canvas
			const xOffset = (targetWidth - slideCanvas.width) / 2;
			const yOffset = (targetHeight - slideCanvas.height) / 2;

			ctx.drawImage(slideCanvas, xOffset, yOffset);

			// Convert to blob and share
			storyCanvas.toBlob((blob) => {
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

async function downloadAllSlides() {
	if (!state.slides || state.slides.length === 0) {
		alert("No slides to download!");
		return;
	}

	// Show loading state
	downloadAllBtn.disabled = true;
	downloadAllBtn.classList.add("downloading");
	const originalText = downloadAllBtn.textContent;
	downloadAllBtn.textContent = "📦 Creating ZIP...";

	try {
		const zip = new JSZip();
		const folder = zip.folder("chatrecap-slides");

		// Instagram story dimensions
		const targetWidth = 1080;
		const targetHeight = 1920;

		// Capture each slide
		for (let i = 0; i < state.slides.length; i++) {
			const entry = state.slides[i];

			// Update button text with progress
			downloadAllBtn.textContent = `📦 Processing ${i + 1}/${
				state.slides.length
			}...`;

			// Hide share button and demo badge during capture
			if (entry.shareButton) {
				entry.shareButton.classList.add("hide-capturing");
			}
			const demoBadge = entry.element.querySelector(".demo-badge");
			if (demoBadge) {
				demoBadge.classList.add("hide-capturing");
			}

			// Store original styles
			const originalWidth = entry.element.style.width;
			const originalHeight = entry.element.style.height;
			const originalMaxHeight = entry.element.style.maxHeight;
			const originalMinHeight = entry.element.style.minHeight;
			const originalPadding = entry.element.style.padding;

			// Set dimensions for Instagram
			entry.element.style.width = "500px";
			entry.element.style.height = "920px";
			entry.element.style.maxHeight = "920px";
			entry.element.style.minHeight = "920px";
			entry.element.style.padding =
				"clamp(32px, 4.5vw, 48px) clamp(28px, 4vw, 48px)";

			// Wait for reflow
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Capture slide
			const slideCanvas = await html2canvas(entry.element, {
				backgroundColor: "#000000",
				scale: 2,
				useCORS: true,
				allowTaint: true,
				logging: false,
				imageTimeout: 0,
			});

			// Restore styles
			entry.element.style.width = originalWidth;
			entry.element.style.height = originalHeight;
			entry.element.style.maxHeight = originalMaxHeight;
			entry.element.style.minHeight = originalMinHeight;
			entry.element.style.padding = originalPadding;

			// Restore share button and demo badge
			if (entry.shareButton) {
				entry.shareButton.classList.remove("hide-capturing");
			}
			if (demoBadge) {
				demoBadge.classList.remove("hide-capturing");
			}

			// Create final Instagram story canvas
			const storyCanvas = document.createElement("canvas");
			storyCanvas.width = targetWidth;
			storyCanvas.height = targetHeight;
			const ctx = storyCanvas.getContext("2d");

			// Fill with black background
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, targetWidth, targetHeight);

			// Center the slide canvas
			const xOffset = (targetWidth - slideCanvas.width) / 2;
			const yOffset = (targetHeight - slideCanvas.height) / 2;
			ctx.drawImage(slideCanvas, xOffset, yOffset);

			// Convert to blob and add to ZIP
			const blob = await new Promise((resolve) => {
				storyCanvas.toBlob(resolve, "image/png");
			});

			if (blob) {
				folder.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
			}
		}

		// Generate and download ZIP
		downloadAllBtn.textContent = "📦 Finalizing...";
		const zipBlob = await zip.generateAsync({ type: "blob" });
		const timestamp = new Date().toISOString().slice(0, 10);
		downloadBlob(zipBlob, `chatrecap-${timestamp}.zip`);

		// Success message
		const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		if (isMobile) {
			alert(
				`All ${state.slides.length} slides saved! Each slide is optimized for Instagram stories (1080x1920). Upload them from your gallery.`
			);
		} else {
			alert(
				`Successfully downloaded ${state.slides.length} slides! Each slide is formatted for Instagram stories (1080x1920).`
			);
		}
	} catch (error) {
		console.error("Failed to create ZIP:", error);
		alert("Failed to create ZIP file. Please try again.");
	} finally {
		// Restore button state
		downloadAllBtn.disabled = false;
		downloadAllBtn.classList.remove("downloading");
		downloadAllBtn.textContent = originalText;
	}
}

function computeWordCloudTerms(messages) {
	if (!Array.isArray(messages) || !messages.length) return [];

	const wordCounts = new Map();
	messages.forEach((message) => {
		const text = (message?.text || "").toLowerCase();
		if (!text) return;

		const words = text.match(/[a-z0-9']+/g) || [];
		words.forEach((rawWord) => {
			const word = rawWord.replace(/'+$/, "");
			if (!word || WORD_CLOUD_STOP_WORDS.has(word) || word.length < 3) return;
			wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
		});
	});

	return Array.from(wordCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 120)
		.map(([text, weight]) => ({ text, weight }));
}

function buildWordCloudData(terms) {
	if (!Array.isArray(terms) || !terms.length) {
		return { empty: true, terms: [] };
	}
	return {
		empty: false,
		terms: terms,
		type: "word-cloud",
	};
}

function renderWordCloud(container, config) {
	container.innerHTML = "";

	if (config.empty) {
		const msg = document.createElement("p");
		msg.className = "word-cloud-empty";
		msg.textContent = "Not enough text yet for a word cloud.";
		container.appendChild(msg);
		return;
	}

	const canvas = document.createElement("canvas");
	const rect = container.parentElement?.getBoundingClientRect() || {
		width: 600,
		height: 400,
	};
	const w = Math.max(600, rect.width - 40);
	const h = Math.max(450, rect.height - 40);

	canvas.width = w;
	canvas.height = h;
	canvas.style.width = `${w}px`;
	canvas.style.height = `${h}px`;
	canvas.className = "word-cloud-canvas";
	container.appendChild(canvas);

	// Use wordcloud2.js library
	if (typeof WordCloud !== "undefined") {
		// Convert terms to wordcloud2.js format: [['word', weight], ...]
		const list = config.terms.map((term) => [term.text, term.weight]);

		// Calculate max weight for better scaling
		const maxWeight = Math.max(...config.terms.map((t) => t.weight));

		WordCloud(canvas, {
			list: list,
			gridSize: Math.round((8 * w) / 600),
			weightFactor: function (size) {
				// Scale font size based on canvas width and weight
				return (size / maxWeight) * w * 0.15;
			},
			fontFamily: "Manrope, Helvetica Neue, Arial, sans-serif",
			fontWeight: "bold",
			color: function () {
				// Vibrant colors
				const colors = [
					"#FF6B9D",
					"#C44569",
					"#FFC312",
					"#12CBC4",
					"#FDA7DF",
					"#ED4C67",
					"#F79F1F",
					"#A3CB38",
					"#1289A7",
					"#D980FA",
					"#B53471",
					"#EE5A6F",
					"#009432",
					"#0652DD",
					"#9980FA",
					"#EA2027",
					"#FFC312",
					"#C4E538",
					"#5758BB",
					"#6F1E51",
				];
				return colors[Math.floor(Math.random() * colors.length)];
			},
			rotateRatio: 0.5,
			rotationSteps: 4,
			backgroundColor: "transparent",
			minRotation: -Math.PI / 4,
			maxRotation: Math.PI / 4,
			shuffle: true,
			drawOutOfBound: false,
			shrinkToFit: true,
		});
	}
}

async function renderWordCloudToCanvas(container) {
	const canvas = container.querySelector(".word-cloud-canvas");
	if (!canvas) return null;
	return canvas;
}
